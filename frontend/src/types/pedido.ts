export type EstadoPedido =
  | "SOLICITADO"
  | "CONFIRMADO"
  | "LISTO"
  | "ENTREGADO"
  | "CANCELADO";

export interface DetallePedido {
  id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  usuario_id: number | null;
  numero_pedido: string;
  estado: EstadoPedido;
  tipo_entrega: string;
  metodo_pago: string;
  referencia_pago: string | null;
  total: number;
  fecha_creacion: string;
  notas?: string | null;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  cliente_telefono?: string | null;
  detalles: DetallePedido[];
}

export interface CrearPedidoPayload {
  items: Array<{
    producto_id: number;
    cantidad: number;
  }>;
  tipo_entrega: "RETIRO_LOCAL";
  metodo_pago: "TRANSFERENCIA";
  referencia_pago: string;
}

export interface CrearPedidoAsistidoPayload {
  cliente_nombre: string;
  cliente_telefono?: string;
  estado: "CONFIRMADO" | "ENTREGADO";
  metodo_pago?: string;
  notas?: string;
  items: Array<{
    producto_id: number;
    cantidad: number;
  }>;
}

export interface ActualizarEstadoPayload {
  estado: EstadoPedido;
  referencia_pago?: string;
  observaciones?: string;
  motivo?: string;
}
