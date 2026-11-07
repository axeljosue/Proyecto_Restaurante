import type { Request, Response } from "express";
import { pool } from "../config/db";

interface RecetaRow {
  id: number;
  producto_id: number;
  materia_prima_id: number;
  materia_prima_nombre: string;
  unidad_medida: string;
  cantidad_requerida: string;
}

interface IngredienteBody {
  materia_prima_id?: number;
  cantidad_requerida?: number;
}

interface GuardarRecetaBody {
  producto_id?: number;
  ingredientes?: IngredienteBody[];
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

function mapReceta(row: RecetaRow) {
  return {
    id: row.id,
    producto_id: row.producto_id,
    materia_prima_id: row.materia_prima_id,
    nombre: row.materia_prima_nombre,
    unidad_medida: row.unidad_medida,
    cantidad_requerida: Number(row.cantidad_requerida),
  };
}

export async function obtenerRecetaPorProducto(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const productoId = toPositiveInt(req.params.producto_id);

    if (productoId === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "producto_id inválido",
      });
      return;
    }

    const producto = await pool.query(
      "SELECT id FROM productos WHERE id = $1",
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

    const result = await pool.query<RecetaRow>(
      `SELECT
         rb.id,
         rb.producto_id,
         rb.materia_prima_id,
         mp.nombre AS materia_prima_nombre,
         mp.unidad_medida,
         rb.cantidad_requerida
       FROM recetas_bom rb
       INNER JOIN materias_primas mp ON mp.id = rb.materia_prima_id
       WHERE rb.producto_id = $1
       ORDER BY rb.id`,
      [productoId]
    );

    res.json({
      success: true,
      data: result.rows.map(mapReceta),
    });
  } catch (error) {
    console.error("Error al obtener receta", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo obtener la receta del producto",
    });
  }
}

export async function guardarReceta(
  req: Request,
  res: Response
): Promise<void> {
  const client = await pool.connect();

  try {
    const { producto_id, ingredientes } = req.body as GuardarRecetaBody;
    const productoId = toPositiveInt(producto_id);

    if (productoId === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "producto_id es obligatorio y debe ser un entero positivo",
      });
      return;
    }

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "ingredientes debe ser una lista con al menos un elemento",
      });
      return;
    }

    const normalizados: Array<{
      materia_prima_id: number;
      cantidad_requerida: number;
    }> = [];

    for (const item of ingredientes) {
      const materiaPrimaId = toPositiveInt(item.materia_prima_id);
      const cantidadRequerida = toPositiveNumber(item.cantidad_requerida);

      if (materiaPrimaId === null || cantidadRequerida === null) {
        res.status(400).json({
          success: false,
          data: null,
          message:
            "Cada ingrediente requiere materia_prima_id y cantidad_requerida válidos",
        });
        return;
      }

      normalizados.push({
        materia_prima_id: materiaPrimaId,
        cantidad_requerida: cantidadRequerida,
      });
    }

    const idsUnicos = new Set(normalizados.map((i) => i.materia_prima_id));
    if (idsUnicos.size !== normalizados.length) {
      res.status(400).json({
        success: false,
        data: null,
        message: "No se permiten materias primas duplicadas en la misma receta",
      });
      return;
    }

    await client.query("BEGIN");

    const producto = await client.query(
      "SELECT id FROM productos WHERE id = $1",
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

    const materias = await client.query<{ id: number }>(
      `SELECT id
       FROM materias_primas
       WHERE id = ANY($1::int[])`,
      [normalizados.map((i) => i.materia_prima_id)]
    );

    if ((materias.rowCount ?? 0) !== normalizados.length) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: "Una o más materias primas no existen",
      });
      return;
    }

    await client.query("DELETE FROM recetas_bom WHERE producto_id = $1", [
      productoId,
    ]);

    for (const item of normalizados) {
      await client.query(
        `INSERT INTO recetas_bom (producto_id, materia_prima_id, cantidad_requerida)
         VALUES ($1, $2, $3)`,
        [productoId, item.materia_prima_id, item.cantidad_requerida]
      );
    }

    const result = await client.query<RecetaRow>(
      `SELECT
         rb.id,
         rb.producto_id,
         rb.materia_prima_id,
         mp.nombre AS materia_prima_nombre,
         mp.unidad_medida,
         rb.cantidad_requerida
       FROM recetas_bom rb
       INNER JOIN materias_primas mp ON mp.id = rb.materia_prima_id
       WHERE rb.producto_id = $1
       ORDER BY rb.id`,
      [productoId]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      data: result.rows.map(mapReceta),
      message: "Receta BOM guardada correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al guardar receta", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo guardar la receta",
    });
  } finally {
    client.release();
  }
}
