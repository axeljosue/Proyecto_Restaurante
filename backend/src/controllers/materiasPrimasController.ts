import type { Request, Response } from "express";
import { pool } from "../config/db";

interface MateriaPrimaRow {
  id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: string;
  stock_minimo: string;
  alerta_stock_bajo: boolean;
}

interface CrearMateriaPrimaBody {
  nombre?: string;
  unidad_medida?: string;
  stock_actual?: number;
  stock_minimo?: number;
}

interface ActualizarStockBody {
  cantidad?: number;
  operacion?: "sumar" | "restar";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mapMateriaPrima(row: MateriaPrimaRow) {
  return {
    id: row.id,
    nombre: row.nombre,
    unidad_medida: row.unidad_medida,
    stock_actual: Number(row.stock_actual),
    stock_minimo: Number(row.stock_minimo),
    alerta_stock_bajo: row.alerta_stock_bajo,
  };
}

export async function listarMateriasPrimas(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const result = await pool.query<MateriaPrimaRow>(
      `SELECT
         id,
         nombre,
         unidad_medida,
         stock_actual,
         stock_minimo,
         (stock_actual <= stock_minimo) AS alerta_stock_bajo
       FROM materias_primas
       ORDER BY id`
    );

    res.json({
      success: true,
      data: result.rows.map(mapMateriaPrima),
    });
  } catch (error) {
    console.error("Error al listar materias primas", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudieron obtener las materias primas",
    });
  }
}

export async function crearMateriaPrima(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { nombre, unidad_medida, stock_actual, stock_minimo } =
      req.body as CrearMateriaPrimaBody;

    if (!isNonEmptyString(nombre) || !isNonEmptyString(unidad_medida)) {
      res.status(400).json({
        success: false,
        data: null,
        message: "nombre y unidad_medida son obligatorios",
      });
      return;
    }

    const stockActual = toNumber(stock_actual ?? 0);
    const stockMinimo = toNumber(stock_minimo ?? 0);

    if (stockActual === null || stockMinimo === null) {
      res.status(400).json({
        success: false,
        data: null,
        message: "stock_actual y stock_minimo deben ser números válidos",
      });
      return;
    }

    if (stockActual < 0 || stockMinimo < 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "Los valores de stock no pueden ser negativos",
      });
      return;
    }

    const result = await pool.query<MateriaPrimaRow>(
      `INSERT INTO materias_primas (nombre, unidad_medida, stock_actual, stock_minimo)
       VALUES ($1, $2, $3, $4)
       RETURNING
         id,
         nombre,
         unidad_medida,
         stock_actual,
         stock_minimo,
         (stock_actual <= stock_minimo) AS alerta_stock_bajo`,
      [nombre.trim(), unidad_medida.trim(), stockActual, stockMinimo]
    );

    res.status(201).json({
      success: true,
      data: mapMateriaPrima(result.rows[0]),
      message: "Materia prima creada correctamente",
    });
  } catch (error) {
    console.error("Error al crear materia prima", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo crear la materia prima",
    });
  }
}

export async function actualizarStock(
  req: Request,
  res: Response
): Promise<void> {
  const client = await pool.connect();

  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "id de materia prima inválido",
      });
      return;
    }

    const { cantidad, operacion } = req.body as ActualizarStockBody;
    const cantidadNumerica = toNumber(cantidad);

    if (cantidadNumerica === null || cantidadNumerica === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: "cantidad debe ser un número distinto de cero",
      });
      return;
    }

    let delta = cantidadNumerica;

    if (operacion === "sumar") {
      delta = Math.abs(cantidadNumerica);
    } else if (operacion === "restar") {
      delta = -Math.abs(cantidadNumerica);
    } else if (operacion !== undefined) {
      res.status(400).json({
        success: false,
        data: null,
        message: "operacion debe ser 'sumar' o 'restar'",
      });
      return;
    }

    await client.query("BEGIN");

    const actual = await client.query<{ stock_actual: string }>(
      `SELECT stock_actual
       FROM materias_primas
       WHERE id = $1
       FOR UPDATE`,
      [id]
    );

    if ((actual.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        data: null,
        message: "Materia prima no encontrada",
      });
      return;
    }

    const stockActual = Number(actual.rows[0].stock_actual);
    const nuevoStock = stockActual + delta;

    if (nuevoStock < 0) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        data: null,
        message: "El stock no puede quedar negativo",
      });
      return;
    }

    const result = await client.query<MateriaPrimaRow>(
      `UPDATE materias_primas
       SET stock_actual = $1
       WHERE id = $2
       RETURNING
         id,
         nombre,
         unidad_medida,
         stock_actual,
         stock_minimo,
         (stock_actual <= stock_minimo) AS alerta_stock_bajo`,
      [nuevoStock, id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      data: mapMateriaPrima(result.rows[0]),
      message: "Stock actualizado correctamente",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al actualizar stock", error);
    res.status(500).json({
      success: false,
      data: null,
      message: "No se pudo actualizar el stock",
    });
  } finally {
    client.release();
  }
}
