import type { ApiResponse } from "../types/auth";
import type { CrearPedidoPayload, Pedido } from "../types/pedido";
import { api } from "./api";

export async function crearPedido(
  payload: CrearPedidoPayload
): Promise<Pedido> {
  const { data } = await api.post<ApiResponse<Pedido>>("/pedidos", payload);
  return data.data;
}

export async function fetchMisPedidos(): Promise<Pedido[]> {
  const { data } = await api.get<ApiResponse<Pedido[]>>("/pedidos/mis-pedidos");
  return data.data;
}
