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
  usuario_id: number;
  numero_pedido: string;
  estado: EstadoPedido;
  tipo_entrega: string;
  metodo_pago: string;
  referencia_pago: string | null;
  total: number;
  fecha_creacion: string;
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
