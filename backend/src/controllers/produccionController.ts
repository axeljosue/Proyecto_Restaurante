import type { Request, Response } from "express";
import { pool } from "../config/db";

interface ProduccionBody {
  producto_id?: number;
  porciones?: number;
}

interface BomStockRow {
  materia_prima_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_requerida: string;
  stock_actual: string;
}

interface MrpItem {
  materia_prima_id: number;
  nombre: string;
  unidad_medida: string;
  cantidad_requerida_unitaria: number;
  cantidad_total_requerida: number;
  stock_disponible: number;
  deficit: number;
  suficiente: boolean;
}

interface PronosticoRow {
  producto_id: number;
  producto_nombre: string;
  stock_terminado: string;
  demanda_promedio: string | null;
  dias_historial: string;
}

function toPositiveNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

function toPositiveInt(value: unknown): number | null {
  const parsed = toPositiveNumber(value);
  if (parsed === null || !Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function buildMrpItems(rows: BomStockRow[], cantidad: number): MrpItem[] {
  return rows.map((row) => {
    const cantidadUnitaria = Number(row.cantidad_requerida);
    const cantidadTotal = cantidadUnitaria * cantidad;
    const stockDisponible = Number(row.stock_actual);
    const deficit = Math.max(0, cantidadTotal - stockDisponible);

    return {
      materia_prima_id: row.materia_prima_id,
      nombre: row.nombre,
      unidad_medida: row.unidad_medida,
      cantidad_requerida_unitaria: cantidadUnitaria,
      cantidad_total_requerida: cantidadTotal,
      stock_disponible: stockDisponible,
      deficit,
      suficiente: deficit === 0,
    };
  });
}

export async function registrarProduccion(
  req: Request,
  res: Response
): Promise<void> {
  const client = await pool.connect();

  try {
    const { producto_id, porciones } = req.body as ProduccionBody;
    const productoId = toPositiveInt(producto_id);
    const cantidadPorciones = toPositiveNumber(porciones);

    if (productoId === null || cantidadPorciones === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "producto_id y porciones son obligatorios y deben ser positivos",
      });
      return;
    }

    await client.query("BEGIN");

    const producto = await client.query<{
      id: number;
      nombre: string;
      stock_terminado: string;
    }>(
      `SELECT id, nombre, stock_terminado
       FROM productos
       WHERE id = $1
       FOR UPDATE`,
      [productoId]
    );

    if ((producto.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
      return;
    }

    const bom = await client.query<BomStockRow>(
      `SELECT
         rb.materia_prima_id,
         mp.nombre,
         mp.unidad_medida,
         rb.cantidad_requerida,
         mp.stock_actual
       FROM recetas_bom rb
       INNER JOIN materias_primas mp ON mp.id = rb.materia_prima_id
       WHERE rb.producto_id = $1
       FOR UPDATE OF mp`,
      [productoId]
    );

    if ((bom.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: "El producto no tiene receta BOM configurada",
      });
      return;
    }

    const mrp = buildMrpItems(bom.rows, cantidadPorciones);
    const faltantes = mrp.filter((item) => !item.suficiente);

    if (faltantes.length > 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: {
          faltantes,
          insumos: mrp,
        },
        message: `Stock insuficiente de: ${faltantes
          .map((f) => f.nombre)
          .join(", ")}`,
      });
      return;
    }

    for (const item of mrp) {
      await client.query(
        `UPDATE materias_primas
         SET stock_actual = stock_actual - $1
         WHERE id = $2`,
        [item.cantidad_total_requerida, item.materia_prima_id]
      );
    }

    const productoActualizado = await client.query<{
      id: number;
      nombre: string;
      stock_terminado: string;
    }>(
      `UPDATE productos
       SET stock_terminado = stock_terminado + $1
       WHERE id = $2
       RETURNING id, nombre, stock_terminado`,
      [cantidadPorciones, productoId]
    );

    const registro = await client.query<{
      id: number;
      fecha_produccion: Date;
    }>(
      `INSERT INTO registros_produccion (producto_id, porciones, usuario_id)
       VALUES ($1, $2, $3)
       RETURNING id, fecha_produccion`,
      [productoId, cantidadPorciones, req.user?.id ?? null]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: {
        registro_id: registro.rows[0].id,
        producto_id: productoActualizado.rows[0].id,
        producto_nombre: productoActualizado.rows[0].nombre,
        porciones: cantidadPorciones,
        stock_terminado: Number(productoActualizado.rows[0].stock_terminado),
        insumos_consumidos: mrp,
        fecha_produccion: registro.rows[0].fecha_produccion,
      },
      message: "Producción registrada correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al registrar producción", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo registrar la producción",
    });
  } finally {
    client.release();
  }
}

export async function mrpCheck(req: Request, res: Response): Promise<void> {
  try {
    const productoId = toPositiveInt(req.query.producto_id);
    const cantidad = toPositiveNumber(req.query.cantidad);

    if (productoId === null || cantidad === null) {
      res.status(400).json({
        success: false,
        data: null,
        message:
          "Query params producto_id y cantidad son obligatorios y deben ser positivos",
      });
      return;
    }

    const producto = await pool.query<{ id: number; nombre: string }>(
      "SELECT id, nombre FROM productos WHERE id = $1",
      [productoId]
    );

    if ((producto.rowCount ?? 0) === 0) {
      res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
      return;
    }

    const bom = await pool.query<BomStockRow>(
      `SELECT
         rb.materia_prima_id,
         mp.nombre,
         mp.unidad_medida,
         rb.cantidad_requerida,
         mp.stock_actual
       FROM recetas_bom rb
       INNER JOIN materias_primas mp ON mp.id = rb.materia_prima_id
       WHERE rb.producto_id = $1
       ORDER BY mp.nombre`,
      [productoId]
    );

    if ((bom.rowCount ?? 0) === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "El producto no tiene receta BOM configurada",
      });
      return;
    }

    const insumos = buildMrpItems(bom.rows, cantidad);
    const viable = insumos.every((item) => item.suficiente);

    res.json({
      success: true,
      data: {
        producto_id: producto.rows[0].id,
        producto_nombre: producto.rows[0].nombre,
        cantidad,
        viable,
        insumos,
      },
    });
  } catch (error) {
    console.error("Error en MRP check", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo calcular el check MRP",
    });
  }
}

export async function obtenerPronostico(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query<PronosticoRow>(
      `SELECT
         p.id AS producto_id,
         p.nombre AS producto_nombre,
         p.stock_terminado,
         AVG(d.cantidad_vendida) AS demanda_promedio,
         COUNT(d.id)::text AS dias_historial
       FROM productos p
       LEFT JOIN demanda_diaria d
         ON d.producto_id = p.id
        AND d.fecha >= CURRENT_DATE - INTERVAL '7 days'
        AND d.fecha < CURRENT_DATE
       WHERE p.disponible = true
       GROUP BY p.id, p.nombre, p.stock_terminado
       ORDER BY p.id`
    );

    const sugerencias = result.rows.map((row) => {
      const stockTerminado = Number(row.stock_terminado);
      const demandaPromedio = Number(row.demanda_promedio ?? 0);
      const diasHistorial = Number(row.dias_historial);
      const demandaPronosticada = Math.ceil(demandaPromedio);
      const sugeridoProducir = Math.max(0, demandaPronosticada - stockTerminado);

      return {
        producto_id: row.producto_id,
        producto_nombre: row.producto_nombre,
        stock_terminado: stockTerminado,
        demanda_promedio_7d: Number(demandaPromedio.toFixed(2)),
        dias_historial: diasHistorial,
        demanda_pronosticada: demandaPronosticada,
        sugerido_producir: sugeridoProducir,
      };
    });

    res.json({
      success: true,
      data: {
        fecha_objetivo: new Date(Date.now() + 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        metodo: "promedio_demanda_ultimos_7_dias_menos_stock_terminado",
        sugerencias,
      },
    });
  } catch (error) {
    console.error("Error al obtener pronóstico", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo calcular el pronóstico de producción",
    });
  }
}
