import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrito } from "../../context/CarritoContext";
import { crearPedido } from "../../services/pedidosService";
import { formatCordobas } from "../../utils/format";

interface CarritoModalProps {
  open: boolean;
  onClose: () => void;
}

export function CarritoModal({ open, onClose }: CarritoModalProps) {
  const navigate = useNavigate();
  const {
    items,
    total,
    eliminarProducto,
    actualizarCantidad,
    limpiarCarrito,
  } = useCarrito();
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!referencia.trim()) {
      setError("La referencia de transferencia es obligatoria.");
      return;
    }

    if (items.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    setLoading(true);
    try {
      await crearPedido({
        items: items.map((item) => ({
          producto_id: item.producto.id,
          cantidad: item.cantidad,
        })),
        tipo_entrega: "RETIRO_LOCAL",
        metodo_pago: "TRANSFERENCIA",
        referencia_pago: referencia.trim(),
      });
      limpiarCarrito();
      setReferencia("");
      onClose();
      navigate("/mis-pedidos");
    } catch {
      setError("No se pudo confirmar el pedido. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-900/40">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-brand-900">Tu carrito</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            Cerrar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="text-sm text-stone-500">Aún no agregaste productos.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li
                  key={item.producto.id}
                  className="rounded-xl border border-stone-200 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-stone-900">
                        {item.producto.nombre}
                      </p>
                      <p className="text-sm text-stone-500">
                        {formatCordobas(item.producto.precio)} c/u
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => eliminarProducto(item.producto.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          actualizarCantidad(
                            item.producto.id,
                            item.cantidad - 1
                          )
                        }
                        className="h-8 w-8 rounded-lg border border-stone-300"
                      >
                        −
                      </button>
                      <span className="min-w-6 text-center text-sm font-medium">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          actualizarCantidad(
                            item.producto.id,
                            item.cantidad + 1
                          )
                        }
                        className="h-8 w-8 rounded-lg border border-stone-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm font-semibold">
                      {formatCordobas(item.subtotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 border-t border-stone-200 px-5 py-4"
        >
          <div className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
            <p>
              <span className="font-medium">Tipo de entrega:</span> Retiro
              presencial en local
            </p>
            <p className="mt-1">
              <span className="font-medium">Método de pago:</span> Transferencia
              bancaria
            </p>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Número de referencia de transferencia bancaria
            </span>
            <input
              required
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej. TRX-123456"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
            />
          </label>

          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatCordobas(total)}</span>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={loading || items.length === 0}
            className="w-full rounded-lg bg-brand-700 px-4 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {loading ? "Confirmando..." : "Confirmar Pedido"}
          </button>
        </form>
      </aside>
    </div>
  );
}
