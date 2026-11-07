export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  disponible: boolean;
  imagen_url: string | null;
  categoria: {
    id: number;
    nombre: string;
  } | null;
}

export interface CarritoItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
