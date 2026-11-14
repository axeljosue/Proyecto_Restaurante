import type { Request, Response } from "express";
import {
  categoriaExists,
  createProducto,
  deleteProducto,
  findAllProductos,
  findProductoById,
  updateProducto,
  type ProductoInput,
  type ProductoRow,
} from "../services/productoService";

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
  stock_terminado: number;
  categoria: {
    id: number;
    nombre: string;
  } | null;
}

interface ProductoBody {
  categoria_id?: number | null;
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  disponible?: boolean;
  imagen_url?: string | null;
}

function mapProducto(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    disponible: row.disponible,
    imagen_url: row.imagen_url,
    stock_terminado: Number(row.stock_terminado),
    categoria:
      row.categoria_id === null || row.categoria_nombre === null
        ? null
        : { id: row.categoria_id, nombre: row.categoria_nombre },
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toPositiveInt(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function toNonNegativeNumber(value: unknown): number | null {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

async function parseProductoInput(
  body: ProductoBody
): Promise<{ ok: true; data: ProductoInput } | { ok: false; message: string }> {
  if (!isNonEmptyString(body.nombre)) {
    return { ok: false, message: "nombre es obligatorio" };
  }

  const precio = toNonNegativeNumber(body.precio);
  if (precio === null) {
    return { ok: false, message: "precio debe ser un número válido >= 0" };
  }

  let categoriaId: number | null = null;
  if (body.categoria_id !== undefined && body.categoria_id !== null) {
    const parsed = toPositiveInt(body.categoria_id);
    if (parsed === null) {
      return { ok: false, message: "categoria_id inválido" };
    }
    if (!(await categoriaExists(parsed))) {
      return { ok: false, message: "La categoría no existe" };
    }
    categoriaId = parsed;
  }

  const descripcion =
    typeof body.descripcion === "string" && body.descripcion.trim().length > 0
      ? body.descripcion.trim()
      : null;

  const imagenUrl =
    typeof body.imagen_url === "string" && body.imagen_url.trim().length > 0
      ? body.imagen_url.trim()
      : null;

  return {
    ok: true,
    data: {
      categoria_id: categoriaId,
      nombre: body.nombre.trim(),
      descripcion,
      precio,
      disponible: body.disponible !== false,
      imagen_url: imagenUrl,
    },
  };
}

export async function listarProductos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const rows = await findAllProductos();
    res.json({
      success: true,
      data: rows.map(mapProducto),
    });
  } catch (error) {
    console.error("Error al listar productos", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudieron obtener los productos",
    });
  }
}

export async function obtenerProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = toPositiveInt(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "id de producto inválido",
      });
      return;
    }

    const row = await findProductoById(id);
    if (!row) {
      res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
      return;
    }

    res.json({
      success: true,
      data: mapProducto(row),
    });
  } catch (error) {
    console.error("Error al obtener producto", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo obtener el producto",
    });
  }
}

export async function crearProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const parsed = await parseProductoInput(req.body as ProductoBody);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.message,
      });
      return;
    }

    const row = await createProducto(parsed.data);
    res.status(201).json({
      success: true,
      data: mapProducto(row),
      message: "Producto creado correctamente",
    });
  } catch (error) {
    console.error("Error al crear producto", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo crear el producto",
    });
  }
}

export async function actualizarProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = toPositiveInt(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "id de producto inválido",
      });
      return;
    }

    const parsed = await parseProductoInput(req.body as ProductoBody);
    if (!parsed.ok) {
      res.status(400).json({
        success: false,
        data: null,
        message: parsed.message,
      });
      return;
    }

    const row = await updateProducto(id, parsed.data);
    if (!row) {
      res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
      return;
    }

    res.json({
      success: true,
      data: mapProducto(row),
      message: "Producto actualizado correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar producto", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo actualizar el producto",
    });
  }
}

export async function eliminarProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = toPositiveInt(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "id de producto inválido",
      });
      return;
    }

    const deleted = await deleteProducto(id);
    if (!deleted) {
      res.status(404).json({
        success: false,
        data: null,
        message: "Producto no encontrado",
      });
      return;
    }

    res.json({
      success: true,
      data: null,
      message: "Producto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar producto", error);
    res.status(500).json({
      success: false,
      data: null,
      message:
        "No se pudo eliminar el producto. Puede estar referenciado en pedidos o recetas.",
    });
  }
}
