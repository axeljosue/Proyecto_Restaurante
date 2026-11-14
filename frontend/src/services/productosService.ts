import type { ApiResponse } from "../types/auth";
import type { Producto } from "../types/catalogo";
import { api } from "./api";

export interface ProductoPayload {
  nombre: string;
  descripcion?: string | null;
  precio: number;
  categoria_id?: number | null;
  disponible?: boolean;
  imagen_url?: string | null;
}

export async function fetchProductosAdmin(): Promise<Producto[]> {
  const { data } = await api.get<ApiResponse<Producto[]>>("/productos");
  return data.data;
}

export async function crearProducto(
  payload: ProductoPayload
): Promise<Producto> {
  const { data } = await api.post<ApiResponse<Producto>>("/productos", payload);
  return data.data;
}

export async function actualizarProducto(
  id: number,
  payload: ProductoPayload
): Promise<Producto> {
  const { data } = await api.put<ApiResponse<Producto>>(
    `/productos/${id}`,
    payload
  );
  return data.data;
}

export async function eliminarProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`);
}
