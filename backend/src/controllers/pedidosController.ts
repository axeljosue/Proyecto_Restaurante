import type { Request, Response } from "express";
import type { PoolClient } from "pg";
import { pool } from "../config/db";

type EstadoPedido =
  | "SOLICITADO"
  | "CONFIRMADO"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

interface ItemPedidoBody {
  producto_id?: number;
  cantidad?: number;
}

interface CrearPedidoBody {
  items?: ItemPedidoBody[];
  tipo_entrega?: string;
  metodo_pago?: string;
  referencia_pago?: string;
}

interface ActualizarEstadoBody {
  estado?: string;
  referencia_pago?: string;
  observaciones?: string;
  motivo?: string;
}

interface CrearPedidoAsistidoBody {
  items?: ItemPedidoBody[];
  cliente_nombre?: string;
  cliente_telefono?: string;
  estado?: string;
  metodo_pago?: string;
  notas?: string;
}

interface ProductoDisponible {
  id: number;
  nombre: string;
  precio: string;
  disponible: boolean;
}

interface PedidoRow {
  id: number;
  usuario_id: number | null;
  numero_pedido: string;
  estado: string;
  tipo_entrega: string;
  metodo_pago: string;
  referencia_pago: string | null;
  total: string;
  fecha_creacion: Date;
  notas?: string | null;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;
}

interface DetalleRow {
  id: number;
  pedido_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

const ESTADOS_VALIDOS: EstadoPedido[] = [
  "SOLICITADO",
  "CONFIRMADO",
  "LISTO",
  "ENTREGADO",
  "CANCELADO",
];

const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  SOLICITADO: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["LISTO", "CANCELADO"],
  LISTO: ["ENTREGADO", "CANCELADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

function toPositiveInt(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function isEstadoPedido(value: string): value is EstadoPedido {
  return (ESTADOS_VALIDOS as string[]).includes(value);
}

function mapDetalle(row: DetalleRow) {
  return {
    id: row.id,
    producto_id: row.producto_id,
    producto_nombre: row.producto_nombre,
    cantidad: row.cantidad,
    precio_unitario: Number(row.precio_unitario),
    subtotal: Number(row.subtotal),
  };
}

function mapPedido(row: PedidoRow, detalles: DetalleRow[] = []) {
  return {
    id: row.id,
    usuario_id: row.usuario_id,
    numero_pedido: row.numero_pedido,
    estado: row.estado,
    tipo_entrega: row.tipo_entrega,
    metodo_pago: row.metodo_pago,
    referencia_pago: row.referencia_pago,
    total: Number(row.total),
    fecha_creacion: row.fecha_creacion,
    notas: row.notas ?? null,
    cliente_nombre: row.cliente_nombre ?? null,
    cliente_email: row.cliente_email ?? null,
    cliente_telefono: row.cliente_telefono ?? null,
    detalles: detalles.map(mapDetalle),
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function generarNumeroPedido(client: PoolClient): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PED-${year}-`;

  for (let intento = 0; intento < 8; intento += 1) {
    const secuencia = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const numero = `${prefix}${secuencia}`;
    const exists = await client.query(
      "SELECT 1 FROM pedidos WHERE numero_pedido = $1",
      [numero]
    );
    if ((exists.rowCount ?? 0) === 0) {
      return numero;
    }
  }

  const fallback = await client.query<{ next: string }>(
    `SELECT LPAD((COALESCE(MAX(id), 0) + 1)::text, 4, '0') AS next FROM pedidos`
  );
  return `${prefix}${fallback.rows[0].next}`;
}

async function obtenerDetalles(
  client: PoolClient | typeof pool,
  pedidoIds: number[]
): Promise<Map<number, DetalleRow[]>> {
  const mapa = new Map<number, DetalleRow[]>();
  if (pedidoIds.length === 0) {
    return mapa;
  }

  const result = await client.query<DetalleRow>(
    `SELECT
       d.id,
       d.pedido_id,
       d.producto_id,
       p.nombre AS producto_nombre,
       d.cantidad,
       d.precio_unitario,
       d.subtotal
     FROM detalle_pedidos d
     INNER JOIN productos p ON p.id = d.producto_id
     WHERE d.pedido_id = ANY($1::int[])
     ORDER BY d.id`,
    [pedidoIds]
  );

  for (const row of result.rows) {
    const lista = mapa.get(row.pedido_id) ?? [];
    lista.push(row);
    mapa.set(row.pedido_id, lista);
  }

  return mapa;
}

export async function crearPedido(req: Request, res: Response): Promise<void> {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: "No autenticado",
      });
      return;
    }

    const {
      items,
      tipo_entrega = "RETIRO_LOCAL",
      metodo_pago = "TRANSFERENCIA",
      referencia_pago,
    } = req.body as CrearPedidoBody;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "items debe ser una lista con al menos un producto",
      });
      return;
    }

    const normalizados: Array<{ producto_id: number; cantidad: number }> = [];

    for (const item of items) {
      const productoId = toPositiveInt(item.producto_id);
      const cantidad = toPositiveInt(item.cantidad);

      if (productoId === null || cantidad === null) {
        res.status(400).json({
          success: false,
          data: null,
          message: "Cada item requiere producto_id y cantidad enteros positivos",
        });
        return;
      }

      normalizados.push({ producto_id: productoId, cantidad });
    }

    await client.query("BEGIN");

    const productos = await client.query<ProductoDisponible>(
      `SELECT id, nombre, precio, disponible
       FROM productos
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [normalizados.map((i) => i.producto_id)]
    );

    if ((productos.rowCount ?? 0) !== new Set(normalizados.map((i) => i.producto_id)).size) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: "Uno o más productos no existen",
      });
      return;
    }

    const porId = new Map(productos.rows.map((p) => [p.id, p]));
    const noDisponibles = productos.rows.filter((p) => !p.disponible);

    if (noDisponibles.length > 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: {
          productos_no_disponibles: noDisponibles.map((p) => ({
            id: p.id,
            nombre: p.nombre,
          })),
        },
        message: `Productos no disponibles: ${noDisponibles
          .map((p) => p.nombre)
          .join(", ")}`,
      });
      return;
    }

    let total = 0;
    const lineas = normalizados.map((item) => {
      const producto = porId.get(item.producto_id);
      if (!producto) {
        throw new Error(`Producto ${item.producto_id} no encontrado`);
      }
      const precioUnitario = Number(producto.precio);
      const subtotal = precioUnitario * item.cantidad;
      total += subtotal;
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      };
    });

    const numeroPedido = await generarNumeroPedido(client);
    const referencia =
      typeof referencia_pago === "string" && referencia_pago.trim().length > 0
        ? referencia_pago.trim()
        : null;

    const pedidoInsert = await client.query<PedidoRow>(
      `INSERT INTO pedidos (
         usuario_id,
         numero_pedido,
         estado,
         tipo_entrega,
         metodo_pago,
         referencia_pago,
         total
       )
       VALUES ($1, $2, 'SOLICITADO', $3, $4, $5, $6)
       RETURNING
         id,
         usuario_id,
         numero_pedido,
         estado,
         tipo_entrega,
         metodo_pago,
         referencia_pago,
         total,
         fecha_creacion`,
      [
        req.user.id,
        numeroPedido,
        tipo_entrega,
        metodo_pago,
        referencia,
        total,
      ]
    );

    const pedido = pedidoInsert.rows[0];

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO detalle_pedidos (
           pedido_id,
           producto_id,
           cantidad,
           precio_unitario,
           subtotal
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          pedido.id,
          linea.producto_id,
          linea.cantidad,
          linea.precio_unitario,
          linea.subtotal,
        ]
      );
    }

    const detalles = await obtenerDetalles(client, [pedido.id]);
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: mapPedido(pedido, detalles.get(pedido.id) ?? []),
      message: "Pedido creado correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear pedido", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo crear el pedido",
    });
  } finally {
    client.release();
  }
}

export async function crearPedidoAsistido(
  req: Request,
  res: Response
): Promise<void> {
  const client = await pool.connect();

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: "No autenticado",
      });
      return;
    }

    const {
      items,
      cliente_nombre,
      cliente_telefono,
      estado = "CONFIRMADO",
      metodo_pago = "EFECTIVO_LOCAL",
      notas,
    } = req.body as CrearPedidoAsistidoBody;

    if (!isNonEmptyString(cliente_nombre)) {
      res.status(400).json({
        success: false,
        data: null,
        message: "cliente_nombre es obligatorio",
      });
      return;
    }

    if (estado !== "CONFIRMADO" && estado !== "ENTREGADO") {
      res.status(400).json({
        success: false,
        data: null,
        message: "El pedido asistido solo puede iniciar en CONFIRMADO o ENTREGADO",
      });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "items debe ser una lista con al menos un producto",
      });
      return;
    }

    const normalizados: Array<{ producto_id: number; cantidad: number }> = [];

    for (const item of items) {
      const productoId = toPositiveInt(item.producto_id);
      const cantidad = toPositiveInt(item.cantidad);

      if (productoId === null || cantidad === null) {
        res.status(400).json({
          success: false,
          data: null,
          message: "Cada item requiere producto_id y cantidad enteros positivos",
        });
        return;
      }

      normalizados.push({ producto_id: productoId, cantidad });
    }

    await client.query("BEGIN");

    const productos = await client.query<ProductoDisponible>(
      `SELECT id, nombre, precio, disponible
       FROM productos
       WHERE id = ANY($1::int[])
       FOR UPDATE`,
      [normalizados.map((i) => i.producto_id)]
    );

    if (
      (productos.rowCount ?? 0) !==
      new Set(normalizados.map((i) => i.producto_id)).size
    ) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: "Uno o más productos no existen",
      });
      return;
    }

    const porId = new Map(productos.rows.map((p) => [p.id, p]));
    const noDisponibles = productos.rows.filter((p) => !p.disponible);

    if (noDisponibles.length > 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: `Productos no disponibles: ${noDisponibles
          .map((p) => p.nombre)
          .join(", ")}`,
      });
      return;
    }

    let total = 0;
    const lineas = normalizados.map((item) => {
      const producto = porId.get(item.producto_id)!;
      const precioUnitario = Number(producto.precio);
      const subtotal = precioUnitario * item.cantidad;
      total += subtotal;
      return {
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario,
        subtotal,
      };
    });

    const numeroPedido = await generarNumeroPedido(client);
    const telefono =
      typeof cliente_telefono === "string" && cliente_telefono.trim().length > 0
        ? cliente_telefono.trim()
        : null;
    const notasPedido =
      typeof notas === "string" && notas.trim().length > 0 ? notas.trim() : null;

    const pedidoInsert = await client.query<PedidoRow>(
      `INSERT INTO pedidos (
         usuario_id,
         numero_pedido,
         estado,
         tipo_entrega,
         metodo_pago,
         referencia_pago,
         total,
         cliente_mostrador_nombre,
         cliente_mostrador_telefono,
         notas
       )
       VALUES ($1, $2, $3, 'RETIRO_LOCAL', $4, NULL, $5, $6, $7, $8)
       RETURNING
         id,
         usuario_id,
         numero_pedido,
         estado,
         tipo_entrega,
         metodo_pago,
         referencia_pago,
         total,
         fecha_creacion,
         notas`,
      [
        req.user.id,
        numeroPedido,
        estado,
        metodo_pago,
        total,
        cliente_nombre.trim(),
        telefono,
        notasPedido,
      ]
    );

    const pedido = pedidoInsert.rows[0];

    for (const linea of lineas) {
      await client.query(
        `INSERT INTO detalle_pedidos (
           pedido_id,
           producto_id,
           cantidad,
           precio_unitario,
           subtotal
         )
         VALUES ($1, $2, $3, $4, $5)`,
        [
          pedido.id,
          linea.producto_id,
          linea.cantidad,
          linea.precio_unitario,
          linea.subtotal,
        ]
      );
    }

    const detalles = await obtenerDetalles(client, [pedido.id]);
    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: mapPedido(
        {
          ...pedido,
          cliente_nombre: cliente_nombre.trim(),
          cliente_telefono: telefono,
          cliente_email: null,
        },
        detalles.get(pedido.id) ?? []
      ),
      message: "Pedido asistido registrado correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al crear pedido asistido", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo registrar el pedido asistido",
    });
  } finally {
    client.release();
  }
}

export async function listarMisPedidos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        data: null,
        message: "No autenticado",
      });
      return;
    }

    const pedidos = await pool.query<PedidoRow>(
      `SELECT
         id,
         usuario_id,
         numero_pedido,
         estado,
         tipo_entrega,
         metodo_pago,
         referencia_pago,
         total,
         fecha_creacion
       FROM pedidos
       WHERE usuario_id = $1
       ORDER BY fecha_creacion DESC`,
      [req.user.id]
    );

    const detalles = await obtenerDetalles(
      pool,
      pedidos.rows.map((p) => p.id)
    );

    res.json({
      success: true,
      data: pedidos.rows.map((p) => mapPedido(p, detalles.get(p.id) ?? [])),
    });
  } catch (error) {
    console.error("Error al listar mis pedidos", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudieron obtener los pedidos",
    });
  }
}

export async function listarPedidos(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const estado = typeof req.query.estado === "string" ? req.query.estado : null;

    if (estado && !isEstadoPedido(estado)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}`,
      });
      return;
    }

    const pedidos = await pool.query<PedidoRow>(
      `SELECT
         p.id,
         p.usuario_id,
         p.numero_pedido,
         p.estado,
         p.tipo_entrega,
         p.metodo_pago,
         p.referencia_pago,
         p.total,
         p.fecha_creacion,
         p.notas,
         COALESCE(p.cliente_mostrador_nombre, u.nombre) AS cliente_nombre,
         u.email AS cliente_email,
         COALESCE(p.cliente_mostrador_telefono, u.telefono) AS cliente_telefono
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE ($1::text IS NULL OR p.estado = $1)
       ORDER BY p.fecha_creacion DESC`,
      [estado]
    );

    const detalles = await obtenerDetalles(
      pool,
      pedidos.rows.map((p) => p.id)
    );

    res.json({
      success: true,
      data: pedidos.rows.map((p) => mapPedido(p, detalles.get(p.id) ?? [])),
    });
  } catch (error) {
    console.error("Error al listar pedidos", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudieron obtener los pedidos",
    });
  }
}

export async function actualizarEstadoPedido(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const pedidoId = toPositiveInt(req.params.id);
    if (pedidoId === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "id de pedido inválido",
      });
      return;
    }

    const { estado, referencia_pago, observaciones, motivo } =
      req.body as ActualizarEstadoBody;

    if (!estado || !isEstadoPedido(estado)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `estado inválido. Valores permitidos: ${ESTADOS_VALIDOS.join(", ")}`,
      });
      return;
    }

    if (estado === "CANCELADO" && !isNonEmptyString(motivo)) {
      res.status(400).json({
        success: false,
        data: null,
        message: "Debes indicar el motivo de cancelación",
      });
      return;
    }

    const actual = await pool.query<PedidoRow>(
      `SELECT
         p.id,
         p.usuario_id,
         p.numero_pedido,
         p.estado,
         p.tipo_entrega,
         p.metodo_pago,
         p.referencia_pago,
         p.total,
         p.fecha_creacion,
         p.notas,
         COALESCE(p.cliente_mostrador_nombre, u.nombre) AS cliente_nombre,
         u.email AS cliente_email,
         COALESCE(p.cliente_mostrador_telefono, u.telefono) AS cliente_telefono
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.usuario_id
       WHERE p.id = $1`,
      [pedidoId]
    );

    if ((actual.rowCount ?? 0) === 0) {
      res.status(404).json({
        success: false,
        data: null,
        message: "Pedido no encontrado",
      });
      return;
    }

    const pedido = actual.rows[0];
    const estadoActual = pedido.estado as EstadoPedido;

    if (!isEstadoPedido(estadoActual)) {
      res.status(500).json({
        success: false,
        data: null,
        message: "Estado actual del pedido es inválido",
      });
      return;
    }

    if (!TRANSICIONES[estadoActual].includes(estado)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `No se puede pasar de ${estadoActual} a ${estado}`,
      });
      return;
    }

    const referencia =
      typeof referencia_pago === "string" && referencia_pago.trim().length > 0
        ? referencia_pago.trim()
        : pedido.referencia_pago;

    let notas = pedido.notas ?? null;
    if (estado === "CANCELADO" && isNonEmptyString(motivo)) {
      notas = `CANCELADO: ${motivo.trim()}`;
    } else if (isNonEmptyString(observaciones)) {
      notas = observaciones.trim();
    }

    const actualizado = await pool.query<PedidoRow>(
      `UPDATE pedidos p
       SET estado = $1,
           referencia_pago = $2,
           notas = $3
       WHERE p.id = $4
       RETURNING
         p.id,
         p.usuario_id,
         p.numero_pedido,
         p.estado,
         p.tipo_entrega,
         p.metodo_pago,
         p.referencia_pago,
         p.total,
         p.fecha_creacion,
         p.notas`,
      [estado, referencia, notas, pedidoId]
    );

    const detalles = await obtenerDetalles(pool, [pedidoId]);

    res.json({
      success: true,
      data: mapPedido(
        {
          ...actualizado.rows[0],
          cliente_nombre: pedido.cliente_nombre,
          cliente_email: pedido.cliente_email,
          cliente_telefono: pedido.cliente_telefono,
        },
        detalles.get(pedidoId) ?? []
      ),
      message: "Estado del pedido actualizado",
    });
  } catch (error) {
    console.error("Error al actualizar estado del pedido", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo actualizar el estado del pedido",
    });
  }
}
