import type { Request, Response } from "express";
import { pool } from "../config/db";

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export async function listarCategorias(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query<Categoria>(
      "SELECT id, nombre, descripcion FROM categorias ORDER BY id"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error al listar categorías", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudieron obtener las categorías",
    });
  }
}
