import type { ApiResponse } from "../types/auth";
import type { Categoria, Producto } from "../types/catalogo";
import { api } from "./api";

export async function fetchCategorias(): Promise<Categoria[]> {
  const { data } = await api.get<ApiResponse<Categoria[]>>("/categorias");
  return data.data;
}

export async function fetchProductos(): Promise<Producto[]> {
  const { data } = await api.get<ApiResponse<Producto[]>>("/productos");
  return data.data;
}
