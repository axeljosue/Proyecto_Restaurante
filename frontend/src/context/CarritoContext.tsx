import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CarritoItem, Producto } from "../types/catalogo";

interface CarritoContextValue {
  items: CarritoItem[];
  total: number;
  cantidadItems: number;
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  eliminarProducto: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  limpiarCarrito: () => void;
}

const CarritoContext = createContext<CarritoContextValue | undefined>(undefined);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CarritoItem[]>([]);

  const agregarProducto = useCallback((producto: Producto, cantidad = 1) => {
    if (!producto.disponible || cantidad <= 0) {
      return;
    }

    setItems((prev) => {
      const existente = prev.find((item) => item.producto.id === producto.id);
      if (!existente) {
        return [
          ...prev,
          {
            producto,
            cantidad,
            subtotal: producto.precio * cantidad,
          },
        ];
      }

      const nuevaCantidad = existente.cantidad + cantidad;
      return prev.map((item) =>
        item.producto.id === producto.id
          ? {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: item.producto.precio * nuevaCantidad,
            }
          : item
      );
    });
  }, []);

  const eliminarProducto = useCallback((productoId: number) => {
    setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
  }, []);

  const actualizarCantidad = useCallback((productoId: number, cantidad: number) => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((item) => item.producto.id !== productoId));
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.producto.id === productoId
          ? {
              ...item,
              cantidad,
              subtotal: item.producto.precio * cantidad,
            }
          : item
      )
    );
  }, []);

  const limpiarCarrito = useCallback(() => {
    setItems([]);
  }, []);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.subtotal, 0),
    [items]
  );

  const cantidadItems = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      total,
      cantidadItems,
      agregarProducto,
      eliminarProducto,
      actualizarCantidad,
      limpiarCarrito,
    }),
    [
      items,
      total,
      cantidadItems,
      agregarProducto,
      eliminarProducto,
      actualizarCantidad,
      limpiarCarrito,
    ]
  );

  return (
    <CarritoContext.Provider value={value}>{children}</CarritoContext.Provider>
  );
}

export function useCarrito(): CarritoContextValue {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error("useCarrito debe usarse dentro de CarritoProvider");
  }
  return context;
}
