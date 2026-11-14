import { pool } from "../config/db";

export interface ProductoRow {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  disponible: boolean;
  imagen_url: string | null;
  stock_terminado: string;
  categoria_id: number | null;
  categoria_nombre: string | null;
}

export interface ProductoInput {
  categoria_id: number | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
}

const SELECT_PRODUCTO = `
  SELECT
    p.id,
    p.nombre,
    p.descripcion,
    p.precio,
    p.disponible,
    p.imagen_url,
    COALESCE(p.stock_terminado, 0) AS stock_terminado,
    c.id AS categoria_id,
    c.nombre AS categoria_nombre
  FROM productos p
  LEFT JOIN categorias c ON c.id = p.categoria_id
`;

export async function findAllProductos(): Promise<ProductoRow[]> {
  const result = await pool.query<ProductoRow>(
    `${SELECT_PRODUCTO} ORDER BY p.id`
  );
  return result.rows;
}

export async function findProductoById(id: number): Promise<ProductoRow | null> {
  const result = await pool.query<ProductoRow>(
    `${SELECT_PRODUCTO} WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createProducto(
  input: ProductoInput
): Promise<ProductoRow> {
  const inserted = await pool.query<{ id: number }>(
    `INSERT INTO productos (
       categoria_id,
       nombre,
       descripcion,
       precio,
       disponible,
       imagen_url
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.categoria_id,
      input.nombre,
      input.descripcion,
      input.precio,
      input.disponible,
      input.imagen_url,
    ]
  );

  const producto = await findProductoById(inserted.rows[0].id);
  if (!producto) {
    throw new Error("No se pudo recuperar el producto creado");
  }
  return producto;
}

export async function updateProducto(
  id: number,
  input: ProductoInput
): Promise<ProductoRow | null> {
  const result = await pool.query(
    `UPDATE productos
     SET categoria_id = $1,
         nombre = $2,
         descripcion = $3,
         precio = $4,
         disponible = $5,
         imagen_url = $6
     WHERE id = $7
     RETURNING id`,
    [
      input.categoria_id,
      input.nombre,
      input.descripcion,
      input.precio,
      input.disponible,
      input.imagen_url,
      id,
    ]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return findProductoById(id);
}

export async function deleteProducto(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM productos WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function categoriaExists(id: number): Promise<boolean> {
  const result = await pool.query("SELECT id FROM categorias WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
