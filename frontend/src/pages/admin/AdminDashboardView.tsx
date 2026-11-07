import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProductos } from "../../services/catalogoService";
import { fetchMateriasPrimas } from "../../services/inventarioService";
import { fetchPedidos } from "../../services/pedidosService";
import { fetchPronostico } from "../../services/produccionService";
import type { Producto } from "../../types/catalogo";
import type { MateriaPrima, PronosticoResult } from "../../types/inventario";
import type { Pedido } from "../../types/pedido";
import { formatCordobas } from "../../utils/format";

function esHoy(fechaIso: string): boolean {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
}

export function AdminDashboardView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [materias, setMaterias] = useState<MateriaPrima[]>([]);
  const [pronostico, setPronostico] = useState<PronosticoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [p, prod, mats, pron] = await Promise.all([
          fetchPedidos(),
          fetchProductos(),
          fetchMateriasPrimas(),
          fetchPronostico(),
        ]);
        if (!activo) return;
        setPedidos(p);
        setProductos(prod);
        setMaterias(mats);
        setPronostico(pron);
      } catch {
        if (activo) setError("No se pudieron cargar los KPIs del dashboard.");
      } finally {
        if (activo) setLoading(false);
      }
    }

    void load();
    return () => {
      activo = false;
    };
  }, []);

  const pedidosHoy = useMemo(
    () => pedidos.filter((p) => esHoy(p.fecha_creacion) && p.estado !== "CANCELADO"),
    [pedidos]
  );

  const totalDia = useMemo(
    () => pedidosHoy.reduce((acc, p) => acc + p.total, 0),
    [pedidosHoy]
  );

  const porcionesDisponibles = useMemo(
    () => productos.reduce((acc, p) => acc + (p.stock_terminado ?? 0), 0),
    [productos]
  );

  const alertasStock = useMemo(
    () => materias.filter((m) => m.alerta_stock_bajo).length,
    [materias]
  );

  const topPronostico = useMemo(() => {
    if (!pronostico) return [];
    return [...pronostico.sugerencias]
      .sort((a, b) => b.sugerido_producir - a.sugerido_producir)
      .slice(0, 3);
  }, [pronostico]);

  if (loading) {
    return <p className="text-stone-500">Cargando dashboard...</p>;
  }

  if (error) {
    return <p className="text-red-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-brand-900">Dashboard</h2>
        <p className="text-stone-600">
          Resumen operativo de pedidos, inventario y producción.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm text-stone-500">Pedidos del Día</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {pedidosHoy.length}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Total procesado: {formatCordobas(totalDia)}
          </p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm text-stone-500">Porciones Disponibles</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {porcionesDisponibles}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Stock terminado listo para venta
          </p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm text-stone-500">Alertas de Materias Primas</p>
          <p
            className={`mt-2 text-3xl font-semibold ${
              alertasStock > 0 ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {alertasStock}
          </p>
          <p className="mt-1 text-sm text-stone-600">
            Insumos con stock_actual ≤ stock_minimo
          </p>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <p className="text-sm text-stone-500">Pronóstico para Mañana</p>
          <p className="mt-2 text-sm font-medium text-stone-900">
            {pronostico?.fecha_objetivo ?? "—"}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-stone-600">
            {topPronostico.length === 0 ? (
              <li>Sin sugerencias</li>
            ) : (
              topPronostico.map((s) => (
                <li key={s.producto_id}>
                  {s.producto_nombre}: {s.sugerido_producir} porciones
                </li>
              ))
            )}
          </ul>
        </article>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          to="/admin/materias-primas"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-500"
        >
          <h3 className="font-semibold text-stone-900">Inventario de Insumos</h3>
          <p className="mt-2 text-sm text-stone-600">
            Alta de materias primas y ajustes de stock.
          </p>
        </Link>
        <Link
          to="/admin/recetas"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-500"
        >
          <h3 className="font-semibold text-stone-900">Recetas BOM</h3>
          <p className="mt-2 text-sm text-stone-600">
            Composición de ingredientes por platillo.
          </p>
        </Link>
        <Link
          to="/admin/produccion"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-500"
        >
          <h3 className="font-semibold text-stone-900">Producción / MRP</h3>
          <p className="mt-2 text-sm text-stone-600">
            Simulación de materiales y registro de lotes.
          </p>
        </Link>
      </div>
    </div>
  );
}
