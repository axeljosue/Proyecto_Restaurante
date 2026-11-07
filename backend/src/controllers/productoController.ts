import type { Request, Response } from "express";
import { pool } from "../config/db";

interface ProductoRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  imagen_url: string | null;
  categoria_id: number | null;
  categoria_nombre: string | null;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
}

function mapProducto(row: ProductoRow): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    disponible: row.disponible,
    imagen_url: row.imagen_url,
    categoria:
      row.categoria_id === null || row.categoria_nombre === null
        ? null
        : { id: row.categoria_id, nombre: row.categoria_nombre },
  };
}

export async function listarProductos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query<ProductoRow>(
      `SELECT
         p.id,
         p.nombre,
         p.descripcion,
         p.precio,
         p.disponible,
         p.imagen_url,
         c.id AS categoria_id,
         c.nombre AS categoria_nombre
       FROM productos p
       LEFT JOIN categorias c ON c.id = p.categoria_id
       ORDER BY p.id`
    );

    res.json({
      success: true,
      data: result.rows.map(mapProducto),
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
