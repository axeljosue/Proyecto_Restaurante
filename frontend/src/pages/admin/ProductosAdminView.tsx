import { FormEvent, useEffect, useState } from "react";
import { fetchCategorias } from "../../services/catalogoService";
import {
  actualizarProducto,
  crearProducto,
  eliminarProducto,
  fetchProductosAdmin,
} from "../../services/productosService";
import type { Categoria, Producto } from "../../types/catalogo";
import { formatCordobas } from "../../utils/format";

export function ProductosAdminView() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crearOpen, setCrearOpen] = useState(false);
  const [editar, setEditar] = useState<Producto | null>(null);

  async function cargar() {
    setLoading(true);
    setError(null);
    try {
      const [prods, cats] = await Promise.all([
        fetchProductosAdmin(),
        fetchCategorias(),
      ]);
      setProductos(prods);
      setCategorias(cats);
    } catch {
      setError("No se pudo cargar el catálogo de productos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function handleEliminar(producto: Producto) {
    if (!window.confirm(`¿Eliminar "${producto.nombre}"?`)) {
      return;
    }
    try {
      await eliminarProducto(producto.id);
      setProductos((prev) => prev.filter((p) => p.id !== producto.id));
    } catch {
      setError("No se pudo eliminar el producto.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-brand-900">
            Gestión de productos
          </h2>
          <p className="text-stone-600">
            Catálogo del menú, precios y disponibilidad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCrearOpen(true)}
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Nuevo producto
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
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Disponibilidad</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {p.nombre}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-stone-600">
                    {p.descripcion ?? "—"}
                  </td>
                  <td className="px-4 py-3">{formatCordobas(p.precio)}</td>
                  <td className="px-4 py-3">
                    {p.categoria?.nombre ?? "Sin categoría"}
                  </td>
                  <td className="px-4 py-3">
                    {p.disponible ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                        Disponible
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                        AGOTADO
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setEditar(p)}
                        className="text-sm font-medium text-brand-700 hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleEliminar(p)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {crearOpen ? (
        <ProductoFormModal
          titulo="Nuevo producto"
          categorias={categorias}
          onClose={() => setCrearOpen(false)}
          onSubmit={async (payload) => {
            const creado = await crearProducto(payload);
            setProductos((prev) => [...prev, creado]);
            setCrearOpen(false);
          }}
        />
      ) : null}

      {editar ? (
        <ProductoFormModal
          titulo={`Editar · ${editar.nombre}`}
          categorias={categorias}
          inicial={editar}
          onClose={() => setEditar(null)}
          onSubmit={async (payload) => {
            const actualizado = await actualizarProducto(editar.id, payload);
            setProductos((prev) =>
              prev.map((x) => (x.id === actualizado.id ? actualizado : x))
            );
            setEditar(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ProductoFormModal({
  titulo,
  categorias,
  inicial,
  onClose,
  onSubmit,
}: {
  titulo: string;
  categorias: Categoria[];
  inicial?: Producto;
  onClose: () => void;
  onSubmit: (payload: {
    nombre: string;
    descripcion: string | null;
    precio: number;
    categoria_id: number | null;
    disponible: boolean;
    imagen_url: string | null;
  }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? "");
  const [precio, setPrecio] = useState(
    inicial ? String(inicial.precio) : "0"
  );
  const [categoriaId, setCategoriaId] = useState(
    inicial?.categoria?.id ? String(inicial.categoria.id) : ""
  );
  const [disponible, setDisponible] = useState(inicial?.disponible ?? true);
  const [imagenUrl, setImagenUrl] = useState(inicial?.imagen_url ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        precio: Number(precio),
        categoria_id: categoriaId ? Number(categoriaId) : null,
        disponible,
        imagen_url: imagenUrl.trim() || null,
      });
    } catch {
      setError("No se pudo guardar el producto.");
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
        <h3 className="text-lg font-semibold text-brand-900">{titulo}</h3>
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Descripción"
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="Precio"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <select
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        >
          <option value="">Sin categoría</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        <input
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
          placeholder="URL de imagen (opcional)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
          />
          Disponible para la venta
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-700 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar"}
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
