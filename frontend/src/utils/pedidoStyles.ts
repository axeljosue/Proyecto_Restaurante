import type { EstadoPedido } from "../types/pedido";

export const ESTADO_FILTROS = [
  { key: "TODOS", label: "Todos" },
  { key: "SOLICITADO", label: "Solicitados" },
  { key: "CONFIRMADO", label: "Confirmados" },
  { key: "LISTO", label: "Listos" },
  { key: "ENTREGADO", label: "Entregados" },
] as const;

export function estiloEstado(estado: EstadoPedido): {
  border: string;
  badge: string;
  label: string;
} {
  switch (estado) {
    case "SOLICITADO":
      return {
        border: "border-amber-400",
        badge: "bg-amber-100 text-amber-800",
        label: "Solicitado",
      };
    case "CONFIRMADO":
      return {
        border: "border-sky-500",
        badge: "bg-sky-100 text-sky-800",
        label: "Confirmado",
      };
    case "LISTO":
      return {
        border: "border-emerald-500",
        badge: "bg-emerald-100 text-emerald-800",
        label: "Listo",
      };
    case "ENTREGADO":
      return {
        border: "border-stone-400",
        badge: "bg-stone-200 text-stone-700",
        label: "Entregado",
      };
    case "CANCELADO":
      return {
        border: "border-red-400",
        badge: "bg-red-100 text-red-700",
        label: "Cancelado",
      };
  }
}
