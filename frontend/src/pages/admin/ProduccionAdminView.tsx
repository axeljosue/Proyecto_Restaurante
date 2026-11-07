import { FormEvent, useEffect, useState } from "react";
import { fetchProductos } from "../../services/catalogoService";
import {
  fetchMrpCheck,
  fetchPronostico,
  registrarProduccion,
} from "../../services/produccionService";
import type { Producto } from "../../types/catalogo";
import type { MrpCheckResult, PronosticoResult } from "../../types/inventario";

export function ProduccionAdminView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productoId, setProductoId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState("1");
  const [mrp, setMrp] = useState<MrpCheckResult | null>(null);
  const [pronostico, setPronostico] = useState<PronosticoResult | null>(null);
  const [loadingMrp, setLoadingMrp] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([fetchProductos(), fetchPronostico()])
      .then(([prods, pron]) => {
        setProductos(prods);
        setPronostico(pron);
        if (prods.length > 0) setProductoId(prods[0].id);
      })
      .catch(() => setError("No se pudo inicializar producción."));
  }, []);

  useEffect(() => {
    if (productoId === "" || Number(cantidad) <= 0) {
      setMrp(null);
      return;
    }

    let activo = true;
    setLoadingMrp(true);
    setError(null);

    const timer = window.setTimeout(() => {
      void fetchMrpCheck(productoId, Number(cantidad))
        .then((data) => {
          if (activo) setMrp(data);
        })
        .catch(() => {
          if (activo) {
            setMrp(null);
            setError(
              "No se pudo calcular MRP. Verifica que el producto tenga BOM."
            );
          }
        })
        .finally(() => {
          if (activo) setLoadingMrp(false);
        });
    }, 250);

    return () => {
      activo = false;
      window.clearTimeout(timer);
    };
  }, [productoId, cantidad]);

  async function handleProducir(event: FormEvent) {
    event.preventDefault();
    if (productoId === "" || Number(cantidad) <= 0) return;

    setRegistrando(true);
    setError(null);
    setMensaje(null);
    try {
      await registrarProduccion({
        producto_id: productoId,
        porciones: Number(cantidad),
      });
      setMensaje("Lote producido e inventarios actualizados.");
      const [mrpData, pron] = await Promise.all([
        fetchMrpCheck(productoId, Number(cantidad)),
        fetchPronostico(),
      ]);
      setMrp(mrpData);
      setPronostico(pron);
    } catch {
      setError(
        "No se pudo registrar la producción. Revisa stock de insumos."
      );
    } finally {
      setRegistrando(false);
    }
  }

  const maxSugerido =
    pronostico?.sugerencias.reduce(
      (max, s) => Math.max(max, s.sugerido_producir),
      0
    ) ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">
          Producción y simulador MRP
        </h2>
        <p className="text-stone-600">
          Verifica materiales, registra lotes y consulta el pronóstico diario.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h3 className="font-semibold text-stone-900">1. Simulador MRP</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Producto</span>
            <select
              value={productoId}
              onChange={(e) => setProductoId(Number(e.target.value))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            >
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">
              Cantidad a cocinar
            </span>
            <input
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
            />
          </label>
        </div>

        {loadingMrp ? (
          <p className="text-sm text-stone-500">Calculando materiales...</p>
        ) : null}

        {mrp ? (
          <>
            <p
              className={`text-sm font-medium ${
                mrp.viable ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {mrp.viable
                ? "Stock suficiente para producir el lote."
                : "Hay insumos por reponer antes de producir."}
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-stone-200 text-stone-500">
                  <tr>
                    <th className="py-2 pr-3">Insumo</th>
                    <th className="py-2 pr-3">Requerido</th>
                    <th className="py-2 pr-3">Disponible</th>
                    <th className="py-2 pr-3">Déficit</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {mrp.insumos.map((item) => (
                    <tr key={item.materia_prima_id} className="border-b border-stone-100">
                      <td className="py-2 pr-3 font-medium">{item.nombre}</td>
                      <td className="py-2 pr-3">
                        {item.cantidad_total_requerida} {item.unidad_medida}
                      </td>
                      <td className="py-2 pr-3">
                        {item.stock_disponible} {item.unidad_medida}
                      </td>
                      <td className="py-2 pr-3">
                        {item.deficit} {item.unidad_medida}
                      </td>
                      <td className="py-2">
                        {item.suficiente ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            OK
                          </span>
                        ) : (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                            Por reponer
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h3 className="mb-3 font-semibold text-stone-900">
          2. Registrar lote producido
        </h3>
        <form onSubmit={handleProducir}>
          <button
            type="submit"
            disabled={registrando || !mrp?.viable}
            className="rounded-lg bg-brand-700 px-4 py-2.5 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
          >
            {registrando ? "Registrando..." : "Registrar Lote Producido"}
          </button>
        </form>
        {mensaje ? <p className="mt-3 text-sm text-emerald-700">{mensaje}</p> : null}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h3 className="mb-1 font-semibold text-stone-900">
          3. Pronóstico diario
        </h3>
        <p className="mb-4 text-sm text-stone-500">
          Sugerencia para {pronostico?.fecha_objetivo ?? "mañana"}
        </p>
        <div className="space-y-3">
          {(pronostico?.sugerencias ?? []).map((s) => {
            const ancho =
              maxSugerido > 0
                ? Math.max(8, (s.sugerido_producir / maxSugerido) * 100)
                : 8;
            return (
              <div key={s.producto_id}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{s.producto_nombre}</span>
                  <span>{s.sugerido_producir} porciones</span>
                </div>
                <div className="h-3 rounded-full bg-stone-100">
                  <div
                    className="h-3 rounded-full bg-brand-700"
                    style={{ width: `${ancho}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Demanda promedio 7d: {s.demanda_promedio_7d} · Stock
                  terminado: {s.stock_terminado}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
