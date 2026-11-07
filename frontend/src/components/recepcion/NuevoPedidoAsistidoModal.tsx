import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchProductos } from "../../services/catalogoService";
import { crearPedidoAsistido } from "../../services/pedidosService";
import type { Producto } from "../../types/catalogo";
import type { Pedido } from "../../types/pedido";
import { formatCordobas } from "../../utils/format";

interface NuevoPedidoAsistidoModalProps {
  onClose: () => void;
  onCreated: (pedido: Pedido) => void;
}

interface LineaLocal {
  producto: Producto;
  cantidad: number;
}

export function NuevoPedidoAsistidoModal({
  onClose,
  onCreated,
}: NuevoPedidoAsistidoModalProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [lineas, setLineas] = useState<LineaLocal[]>([]);
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [estado, setEstado] = useState<"CONFIRMADO" | "ENTREGADO">("CONFIRMADO");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchProductos()
      .then(setProductos)
      .catch(() => setError("No se pudieron cargar los productos."));
  }, []);

  const total = useMemo(
    () => lineas.reduce((acc, l) => acc + l.producto.precio * l.cantidad, 0),
    [lineas]
  );

  function agregarProducto(producto: Producto) {
    if (!producto.disponible) {
      return;
    }
    setLineas((prev) => {
      const existente = prev.find((l) => l.producto.id === producto.id);
      if (!existente) {
        return [...prev, { producto, cantidad: 1 }];
      }
      return prev.map((l) =>
        l.producto.id === producto.id
          ? { ...l, cantidad: l.cantidad + 1 }
          : l
      );
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!clienteNombre.trim()) {
      setError("Ingresa el nombre del cliente.");
      return;
    }
    if (lineas.length === 0) {
      setError("Selecciona al menos un platillo.");
      return;
    }

    setLoading(true);
    try {
      const pedido = await crearPedidoAsistido({
        cliente_nombre: clienteNombre.trim(),
        cliente_telefono: clienteTelefono.trim() || undefined,
        estado,
        metodo_pago: "EFECTIVO_LOCAL",
        items: lineas.map((l) => ({
          producto_id: l.producto.id,
          cantidad: l.cantidad,
        })),
      });
      onCreated(pedido);
      onClose();
    } catch {
      setError("No se pudo registrar la venta de mostrador.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-brand-900">
              Pedido asistido / mostrador
            </h2>
            <p className="text-sm text-stone-500">Venta presencial directa</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            Cerrar
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="grid flex-1 gap-4 overflow-y-auto p-5 md:grid-cols-2"
        >
          <section className="space-y-3">
            <h3 className="font-medium text-stone-800">Platillos</h3>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {productos.map((producto) => (
                <button
                  key={producto.id}
                  type="button"
                  disabled={!producto.disponible}
                  onClick={() => agregarProducto(producto)}
                  className="flex w-full items-center justify-between rounded-xl border border-stone-200 px-3 py-2 text-left hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    <span className="block font-medium">{producto.nombre}</span>
                    <span className="text-xs text-stone-500">
                      {formatCordobas(producto.precio)}
                    </span>
                  </span>
                  <span className="text-sm text-brand-700">+</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Nombre del cliente
              </span>
              <input
                required
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">Teléfono</span>
              <input
                value={clienteTelefono}
                onChange={(e) => setClienteTelefono(e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Estado inicial
              </span>
              <select
                value={estado}
                onChange={(e) =>
                  setEstado(e.target.value as "CONFIRMADO" | "ENTREGADO")
                }
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
              >
                <option value="CONFIRMADO">Confirmado</option>
                <option value="ENTREGADO">Entregado</option>
              </select>
            </label>

            <div className="rounded-xl border border-stone-200 p-3">
              <h4 className="mb-2 text-sm font-medium">Selección</h4>
              {lineas.length === 0 ? (
                <p className="text-sm text-stone-500">Sin ítems aún.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {lineas.map((linea) => (
                    <li
                      key={linea.producto.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>
                        {linea.cantidad} × {linea.producto.nombre}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setLineas((prev) =>
                            prev.filter(
                              (l) => l.producto.id !== linea.producto.id
                            )
                          )
                        }
                        className="text-xs text-red-600"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 font-semibold">{formatCordobas(total)}</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
            >
              {loading ? "Registrando..." : "Registrar venta"}
            </button>
          </section>
        </form>
      </div>
    </div>
  );
}
