import { FormEvent, useEffect, useMemo, useState } from "react";
import { fetchProductos } from "../../services/catalogoService";
import {
  fetchMateriasPrimas,
  fetchReceta,
  guardarReceta,
} from "../../services/inventarioService";
import type { Producto } from "../../types/catalogo";
import type { MateriaPrima, RecetaItem } from "../../types/inventario";

export function RecetasBOMAdminView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [productoId, setProductoId] = useState<number | "">("");
  const [receta, setReceta] = useState<RecetaItem[]>([]);
  const [materiaId, setMateriaId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    async function load() {
      try {
        const [prods, mats] = await Promise.all([
          fetchProductos(),
          fetchMateriasPrimas(),
        ]);
        if (!activo) return;
        setProductos(prods);
        setMaterias(mats);
        if (prods.length > 0) {
          setProductoId(prods[0].id);
        }
      } catch {
        if (activo) setError("No se pudo cargar productos o insumos.");
      } finally {
        if (activo) setLoading(false);
      }
    }
    void load();
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (productoId === "") return;
    let activo = true;
    setMensaje(null);
    void fetchReceta(productoId)
      .then((data) => {
        if (activo) setReceta(data);
      })
      .catch(() => {
        if (activo) setError("No se pudo cargar la receta.");
      });
    return () => {
      activo = false;
    };
  }, [productoId]);

  const materiasDisponibles = useMemo(
    () =>
      materias.filter(
        (m) => !receta.some((r) => r.materia_prima_id === m.id)
      ),
    [materias, receta]
  );

  async function persistir(
    ingredientes: Array<{ materia_prima_id: number; cantidad_requerida: number }>
  ) {
    if (productoId === "") return;
    setSaving(true);
    setError(null);
    setMensaje(null);
    try {
      const guardada = await guardarReceta({
        producto_id: productoId,
        ingredientes,
      });
      setReceta(guardada);
      setMensaje("Receta actualizada.");
    } catch {
      setError("No se pudo guardar la receta.");
    } finally {
      setSaving(false);
    }
  }

  async function agregarIngrediente(event: FormEvent) {
    event.preventDefault();
    if (materiaId === "" || Number(cantidad) <= 0) {
      setError("Selecciona un insumo y una cantidad válida.");
      return;
    }

    const ingredientes = [
      ...receta.map((r) => ({
        materia_prima_id: r.materia_prima_id,
        cantidad_requerida: r.cantidad_requerida,
      })),
      {
        materia_prima_id: materiaId,
        cantidad_requerida: Number(cantidad),
      },
    ];

    await persistir(ingredientes);
    setMateriaId("");
    setCantidad("1");
  }

  async function removerIngrediente(materiaPrimaId: number) {
    const ingredientes = receta
      .filter((r) => r.materia_prima_id !== materiaPrimaId)
      .map((r) => ({
        materia_prima_id: r.materia_prima_id,
        cantidad_requerida: r.cantidad_requerida,
      }));

    if (ingredientes.length === 0) {
      setError("La receta debe conservar al menos un ingrediente.");
      return;
    }

    await persistir(ingredientes);
  }

  if (loading) {
    return <p className="text-stone-500">Cargando recetas...</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">Recetas BOM</h2>
        <p className="text-stone-600">
          Define la cantidad de cada insumo requerida por porción.
        </p>
      </div>

      <label className="block max-w-md">
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

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
        <h3 className="mb-3 font-semibold text-stone-900">
          Insumos por porción
        </h3>
        {receta.length === 0 ? (
          <p className="text-sm text-stone-500">
            Este producto aún no tiene BOM configurada.
          </p>
        ) : (
          <ul className="space-y-2">
            {receta.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 px-3 py-2"
              >
                <span>
                  <span className="font-medium">{item.nombre}</span>
                  <span className="ml-2 text-sm text-stone-500">
                    {item.cantidad_requerida} {item.unidad_medida}
                  </span>
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removerIngrediente(item.materia_prima_id)}
                  className="text-sm text-red-600 hover:underline disabled:opacity-50"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form
        onSubmit={agregarIngrediente}
        className="grid gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 md:grid-cols-[1fr_140px_auto]"
      >
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Materia prima</span>
          <select
            required
            value={materiaId}
            onChange={(e) => setMateriaId(Number(e.target.value))}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          >
            <option value="">Seleccionar...</option>
            {materiasDisponibles.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.unidad_medida})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Cantidad</span>
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving || materiasDisponibles.length === 0}
            className="w-full rounded-lg bg-brand-700 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {mensaje ? <p className="text-sm text-emerald-700">{mensaje}</p> : null}
    </div>
  );
}
