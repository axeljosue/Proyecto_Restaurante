import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PedidoStepper } from "../../components/cliente/PedidoStepper";
import { fetchMisPedidos } from "../../services/pedidosService";
import type { Pedido } from "../../types/pedido";
import { formatCordobas, formatFecha } from "../../utils/format";

export function MisPedidosView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMisPedidos();
        if (activo) {
          setPedidos(data);
        }
      } catch {
        if (activo) {
          setError("No se pudieron cargar tus pedidos.");
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-stone-100">
      <header className="border-b border-orange-100 bg-white/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
              Seguimiento
            </p>
            <h1 className="text-xl font-semibold text-brand-900">Mis pedidos</h1>
          </div>
          <Link
            to="/menu"
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-white"
          >
            Volver al menú
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 px-4 py-6">
        {loading ? <p className="text-stone-500">Cargando pedidos...</p> : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {!loading && !error && pedidos.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-stone-600 shadow-sm ring-1 ring-stone-200">
            Todavía no tienes pedidos.{" "}
            <Link to="/menu" className="font-medium text-brand-700">
              Ir al menú
            </Link>
          </div>
        ) : null}

        {pedidos.map((pedido) => (
          <article
            key={pedido.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200"
          >
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  {pedido.numero_pedido}
                </h2>
                <p className="text-sm text-stone-500">
                  {formatFecha(pedido.fecha_creacion)}
                </p>
              </div>
              <p className="text-base font-semibold text-brand-900">
                {formatCordobas(pedido.total)}
              </p>
            </div>

            <PedidoStepper estado={pedido.estado} />

            <ul className="mt-4 space-y-1 border-t border-stone-100 pt-4 text-sm text-stone-600">
              {pedido.detalles.map((detalle) => (
                <li key={detalle.id} className="flex justify-between gap-3">
                  <span>
                    {detalle.cantidad} × {detalle.producto_nombre}
                  </span>
                  <span>{formatCordobas(detalle.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-3 text-xs text-stone-500">
              <p>Entrega: Retiro presencial en local</p>
              <p>Pago: Transferencia bancaria</p>
              {pedido.referencia_pago ? (
                <p>Ref: {pedido.referencia_pago}</p>
              ) : null}
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}
