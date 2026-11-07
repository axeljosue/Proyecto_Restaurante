import type { ApiResponse } from "../types/auth";
import type { MateriaPrima, RecetaItem } from "../types/inventario";
import { api } from "./api";

export async function fetchMateriasPrimas(): Promise<MateriaPrima[]> {
  const { data } = await api.get<ApiResponse<MateriaPrima[]>>("/materias-primas");
  return data.data;
}

export async function crearMateriaPrima(payload: {
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
}): Promise<MateriaPrima> {
  const { data } = await api.post<ApiResponse<MateriaPrima>>(
    "/materias-primas",
    payload
  );
  return data.data;
}

export async function ajustarStockMateriaPrima(
  id: number,
  payload: { cantidad: number; operacion: "sumar" | "restar" }
): Promise<MateriaPrima> {
  const { data } = await api.put<ApiResponse<MateriaPrima>>(
    `/materias-primas/${id}/stock`,
    payload
  );
  return data.data;
}

export async function fetchReceta(productoId: number): Promise<RecetaItem[]> {
  const { data } = await api.get<ApiResponse<RecetaItem[]>>(
    `/recetas/${productoId}`
  );
  return data.data;
}

export async function guardarReceta(payload: {
  producto_id: number;
  ingredientes: Array<{
    materia_prima_id: number;
    cantidad_requerida: number;
  }>;
}): Promise<RecetaItem[]> {
  const { data } = await api.post<ApiResponse<RecetaItem[]>>("/recetas", payload);
  return data.data;
}
