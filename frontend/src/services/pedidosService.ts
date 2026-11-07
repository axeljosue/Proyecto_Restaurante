import type { ApiResponse } from "../types/auth";
import type {
  ActualizarEstadoPayload,
  CrearPedidoAsistidoPayload,
  CrearPedidoPayload,
  EstadoPedido,
  Pedido,
} from "../types/pedido";
import { api } from "./api";

export async function crearPedido(
  payload: CrearPedidoPayload
): Promise<Pedido> {
  const { data } = await api.post<ApiResponse<Pedido>>("/pedidos", payload);
  return data.data;
}

export async function crearPedidoAsistido(
  payload: CrearPedidoAsistidoPayload
): Promise<Pedido> {
  const { data } = await api.post<ApiResponse<Pedido>>(
    "/pedidos/asistido",
    payload
  );
  return data.data;
}

export async function fetchMisPedidos(): Promise<Pedido[]> {
  const { data } = await api.get<ApiResponse<Pedido[]>>("/pedidos/mis-pedidos");
  return data.data;
}

export async function fetchPedidos(estado?: EstadoPedido): Promise<Pedido[]> {
  const { data } = await api.get<ApiResponse<Pedido[]>>("/pedidos", {
    params: estado ? { estado } : undefined,
  });
  return data.data;
}

export async function actualizarEstadoPedido(
  id: number,
  payload: ActualizarEstadoPayload
): Promise<Pedido> {
  const { data } = await api.put<ApiResponse<Pedido>>(
    `/pedidos/${id}/estado`,
    payload
  );
  return data.data;
}
