import { FormEvent, useState } from "react";
import { actualizarEstadoPedido } from "../../services/pedidosService";
import type { Pedido } from "../../types/pedido";
import { formatCordobas } from "../../utils/format";

interface ValidarTransferenciaModalProps {
  pedido: Pedido;
  onClose: () => void;
  onUpdated: (pedido: Pedido) => void;
}

export function ValidarTransferenciaModal({
  pedido,
  onClose,
  onUpdated,
}: ValidarTransferenciaModalProps) {
  const [observaciones, setObservaciones] = useState("");
  const [motivo, setMotivo] = useState("");
  const [modoRechazo, setModoRechazo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function aprobar(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, {
        estado: "CONFIRMADO",
        referencia_pago: pedido.referencia_pago ?? undefined,
        observaciones: observaciones.trim() || undefined,
      });
      onUpdated(actualizado);
      onClose();
    } catch {
      setError("No se pudo confirmar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  async function rechazar(event: FormEvent) {
    event.preventDefault();
    if (!motivo.trim()) {
      setError("Indica el motivo del rechazo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const actualizado = await actualizarEstadoPedido(pedido.id, {
        estado: "CANCELADO",
        motivo: motivo.trim(),
      });
      onUpdated(actualizado);
      onClose();
    } catch {
      setError("No se pudo cancelar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-brand-900">
              Validar transferencia
            </h2>
            <p className="text-sm text-stone-500">{pedido.numero_pedido}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-stone-500 hover:bg-stone-100"
          >
            Cerrar
          </button>
        </div>

        <div className="mb-4 space-y-2 rounded-xl bg-stone-50 p-4 text-sm">
          <p>
            <span className="font-medium">Monto a verificar:</span>{" "}
            {formatCordobas(pedido.total)}
          </p>
          <p>
            <span className="font-medium">Referencia del cliente:</span>{" "}
            {pedido.referencia_pago ?? "Sin referencia"}
          </p>
          <p>
            <span className="font-medium">Cliente:</span>{" "}
            {pedido.cliente_nombre ?? "N/D"}
          </p>
        </div>

        {!modoRechazo ? (
          <form onSubmit={aprobar} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Observaciones / Nº comprobante interno
              </span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Ej. Comp. interno #458"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "Procesando..." : "Aprobar y Confirmar Pedido"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoRechazo(true);
                  setError(null);
                }}
                className="rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50"
              >
                Rechazar / Cancelar Pedido
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={rechazar} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">
                Motivo del rechazo
              </span>
              <textarea
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ej. Referencia no encontrada en el banco"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Cancelando..." : "Confirmar rechazo"}
              </button>
              <button
                type="button"
                onClick={() => setModoRechazo(false)}
                className="rounded-lg border border-stone-300 px-4 py-2"
              >
                Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
