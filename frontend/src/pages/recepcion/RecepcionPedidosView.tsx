import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NuevoPedidoAsistidoModal } from "../../components/recepcion/NuevoPedidoAsistidoModal";
import { ValidarTransferenciaModal } from "../../components/recepcion/ValidarTransferenciaModal";
import { useAuth } from "../../context/AuthContext";
import {
  actualizarEstadoPedido,
  fetchPedidos,
} from "../../services/pedidosService";
import type { EstadoPedido, Pedido } from "../../types/pedido";
import { formatCordobas, formatFecha } from "../../utils/format";
import { ESTADO_FILTROS, estiloEstado } from "../../utils/pedidoStyles";

type FiltroKey = (typeof ESTADO_FILTROS)[number]["key"];

function formatHora(value: string): string {
  return new Date(value).toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecepcionPedidosView() {
  const { user, logout } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<FiltroKey>("TODOS");
  const [ahora, setAhora] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pedidoValidar, setPedidoValidar] = useState<Pedido | null>(null);
  const [mostrarAsistido, setMostrarAsistido] = useState(false);
  const [accionId, setAccionId] = useState<number | null>(null);

  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setLoading(true);
    }
    try {
      const data = await fetchPedidos();
      setPedidos(data);
      setError(null);
    } catch {
      if (!silencioso) {
        setError("No se pudieron cargar los pedidos.");
      }
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void cargarPedidos();
  }, [cargarPedidos]);

  useEffect(() => {
    const clock = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    const poll = window.setInterval(() => {
      void cargarPedidos(true);
    }, 10_000);
    return () => window.clearInterval(poll);
  }, [cargarPedidos]);

  const pedidosFiltrados = useMemo(() => {
    if (filtro === "TODOS") {
      return pedidos.filter((p) => p.estado !== "CANCELADO");
    }
    return pedidos.filter((p) => p.estado === filtro);
  }, [filtro, pedidos]);

  function upsertPedido(pedido: Pedido) {
    setPedidos((prev) => {
      const exists = prev.some((p) => p.id === pedido.id);
      if (!exists) {
        return [pedido, ...prev];
      }
      return prev.map((p) => (p.id === pedido.id ? pedido : p));
    });
  }

  async function avanzarEstado(pedido: Pedido, estado: EstadoPedido) {
    setAccionId(pedido.id);
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, { estado });
      upsertPedido(actualizado);
    } catch {
      setError(`No se pudo actualizar ${pedido.numero_pedido}.`);
    } finally {
      setAccionId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-stone-100">
      <header className="sticky top-0 z-20 border-b border-sky-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-700">
              Recepción
            </p>
            <h1 className="text-2xl font-semibold text-brand-900">
              Portal de pedidos
            </h1>
            <p className="text-sm text-stone-500">
              {user?.nombre} · {user?.rol_nombre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl bg-stone-900 px-4 py-2 font-mono text-lg text-white">
              {ahora.toLocaleTimeString("es-NI", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <button
              type="button"
              onClick={() => setMostrarAsistido(true)}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              Pedido mostrador
            </button>
            {user?.rol_nombre === "Administrador" ? (
              <Link
                to="/admin"
                className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-white"
              >
                Admin
              </Link>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-white"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {ESTADO_FILTROS.map((tab) => {
            const activo = filtro === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFiltro(tab.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  activo
                    ? "bg-sky-700 text-white"
                    : "bg-white text-stone-700 ring-1 ring-stone-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {loading ? <p className="text-stone-500">Cargando pedidos...</p> : null}
        {error ? <p className="mb-4 text-red-600">{error}</p> : null}

        {!loading && pedidosFiltrados.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-stone-500 shadow-sm">
            No hay pedidos en este filtro.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pedidosFiltrados.map((pedido) => {
            const estilo = estiloEstado(pedido.estado);
            return (
              <article
                key={pedido.id}
                className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${estilo.border}`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      {pedido.numero_pedido}
                    </h2>
                    <p className="text-sm text-stone-600">
                      {pedido.cliente_nombre ?? "Cliente"}
                    </p>
                    <p className="text-xs text-stone-500">
                      Tel: {pedido.cliente_telefono ?? "N/D"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilo.badge}`}
                  >
                    {estilo.label}
                  </span>
                </div>

                <p className="mb-3 text-xs text-stone-500">
                  Solicitado: {formatHora(pedido.fecha_creacion)} ·{" "}
                  {formatFecha(pedido.fecha_creacion)}
                </p>

                <ul className="mb-3 space-y-1 border-y border-stone-100 py-3 text-sm text-stone-700">
                  {pedido.detalles.map((detalle) => (
                    <li key={detalle.id} className="flex justify-between gap-2">
                      <span>
                        {detalle.cantidad} × {detalle.producto_nombre}
                      </span>
                      <span>{formatCordobas(detalle.subtotal)}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-3 space-y-1 text-sm">
                  <p className="font-semibold text-brand-900">
                    Total: {formatCordobas(pedido.total)}
                  </p>
                  <p className="text-stone-600">
                    Ref. bancaria: {pedido.referencia_pago ?? "—"}
                  </p>
                  {pedido.notas ? (
                    <p className="text-xs text-stone-500">Notas: {pedido.notas}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {pedido.estado === "SOLICITADO" ? (
                    <button
                      type="button"
                      onClick={() => setPedidoValidar(pedido)}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                      Validar transferencia
                    </button>
                  ) : null}

                  {pedido.estado === "CONFIRMADO" ? (
                    <button
                      type="button"
                      disabled={accionId === pedido.id}
                      onClick={() => void avanzarEstado(pedido, "LISTO")}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      Marcar listo
                    </button>
                  ) : null}

                  {pedido.estado === "LISTO" ? (
                    <button
                      type="button"
                      disabled={accionId === pedido.id}
                      onClick={() => void avanzarEstado(pedido, "ENTREGADO")}
                      className="rounded-lg bg-stone-700 px-3 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
                    >
                      Marcar entregado
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {pedidoValidar ? (
        <ValidarTransferenciaModal
          pedido={pedidoValidar}
          onClose={() => setPedidoValidar(null)}
          onUpdated={upsertPedido}
        />
      ) : null}

      {mostrarAsistido ? (
        <NuevoPedidoAsistidoModal
          onClose={() => setMostrarAsistido(false)}
          onCreated={upsertPedido}
        />
      ) : null}
    </div>
  );
}
