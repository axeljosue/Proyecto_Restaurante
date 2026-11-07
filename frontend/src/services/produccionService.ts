import type { ApiResponse } from "../types/auth";
import type { MrpCheckResult, PronosticoResult } from "../types/inventario";
import { api } from "./api";

export async function fetchMrpCheck(
  productoId: number,
  cantidad: number
): Promise<MrpCheckResult> {
  const { data } = await api.get<ApiResponse<MrpCheckResult>>(
    "/produccion/mrp-check",
    {
      params: { producto_id: productoId, cantidad },
    }
  );
  return data.data;
}

export async function registrarProduccion(payload: {
  producto_id: number;
  porciones: number;
}): Promise<unknown> {
  const { data } = await api.post<ApiResponse<unknown>>("/produccion", payload);
  return data.data;
}

export async function fetchPronostico(): Promise<PronosticoResult> {
  const { data } = await api.get<ApiResponse<PronosticoResult>>(
    "/produccion/pronostico"
  );
  return data.data;
}
