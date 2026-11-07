import { FormEvent, useEffect, useState } from "react";
import {
  ajustarStockMateriaPrima,
  crearMateriaPrima,
  fetchMateriasPrimas,
} from "../../services/inventarioService";
import type { MateriaPrima } from "../../types/inventario";

export function MateriasPrimasAdminView() {
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [ajuste, setAjuste] = useState<MateriaPrima | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      setMaterias(await fetchMateriasPrimas());
    } catch {
      setError("No se pudo cargar el inventario.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-brand-900">
            Inventario de materias primas
          </h2>
          <p className="text-stone-600">Control de stock y alertas mínimas.</p>
        </div>
        <button
          type="button"
          onClick={() => setCrearOpen(true)}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Nueva materia prima
        </button>
      </div>

      {loading ? <p className="text-stone-500">Cargando...</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Unidad</th>
                <th className="px-4 py-3 font-medium">Stock actual</th>
                <th className="px-4 py-3 font-medium">Stock mínimo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.map((m) => (
                <tr key={m.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {m.nombre}
                  </td>
                  <td className="px-4 py-3">{m.unidad_medida}</td>
                  <td className="px-4 py-3">{m.stock_actual}</td>
                  <td className="px-4 py-3">{m.stock_minimo}</td>
                  <td className="px-4 py-3">
                    {m.alerta_stock_bajo ? (
                      <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                        Stock bajo
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        OK
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setAjuste(m)}
                      className="text-sm font-medium text-brand-700 hover:underline"
                    >
                      Ajustar stock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {crearOpen ? (
        <CrearMateriaModal
          onClose={() => setCrearOpen(false)}
          onCreated={(m) => {
            setMaterias((prev) => [...prev, m]);
            setCrearOpen(false);
          }}
        />
      ) : null}

      {ajuste ? (
        <AjusteStockModal
          materia={ajuste}
          onClose={() => setAjuste(null)}
          onUpdated={(m) => {
            setMaterias((prev) => prev.map((x) => (x.id === m.id ? m : x)));
            setAjuste(null);
          }}
        />
      ) : null}
    </div>
  );
}

function CrearMateriaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (m: MateriaPrima) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("kg");
  const [stockActual, setStockActual] = useState("0");
  const [stockMinimo, setStockMinimo] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const creada = await crearMateriaPrima({
        nombre: nombre.trim(),
        unidad_medida: unidad.trim(),
        stock_actual: Number(stockActual),
        stock_minimo: Number(stockMinimo),
      });
      onCreated(creada);
    } catch {
      setError("No se pudo crear la materia prima.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-brand-900">
          Nueva materia prima
        </h3>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <input
          required
          value={unidad}
          onChange={(e) => setUnidad(e.target.value)}
          placeholder="Unidad (kg, g, ml...)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={stockActual}
          onChange={(e) => setStockActual(e.target.value)}
          placeholder="Stock actual"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          placeholder="Stock mínimo"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-700 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Crear"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function AjusteStockModal({
  materia,
  onClose,
  onUpdated,
}: {
  materia: MateriaPrima;
  onClose: () => void;
  onUpdated: (m: MateriaPrima) => void;
}) {
  const [cantidad, setCantidad] = useState("1");
  const [operacion, setOperacion] = useState<"sumar" | "restar">("sumar");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const actualizada = await ajustarStockMateriaPrima(materia.id, {
        cantidad: Number(cantidad),
        operacion,
      });
      onUpdated(actualizada);
    } catch {
      setError("No se pudo ajustar el stock.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-3 rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-brand-900">
          Ajuste de stock · {materia.nombre}
        </h3>
        <p className="text-sm text-stone-500">
          Actual: {materia.stock_actual} {materia.unidad_medida}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setOperacion("sumar")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              operacion === "sumar"
                ? "bg-emerald-600 text-white"
                : "border border-stone-300"
            }`}
          >
            + Entrada por compra
          </button>
          <button
            type="button"
            onClick={() => setOperacion("restar")}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
              operacion === "restar"
                ? "bg-amber-600 text-white"
                : "border border-stone-300"
            }`}
          >
            − Salida por merma
          </button>
        </div>
        <input
          required
          type="number"
          min={0.01}
          step="0.01"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-700 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Aplicando..." : "Aplicar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
