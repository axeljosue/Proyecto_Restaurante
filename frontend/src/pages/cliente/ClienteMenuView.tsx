import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CarritoModal } from "../../components/cliente/CarritoModal";
import { useAuth } from "../../context/AuthContext";
import { useCarrito } from "../../context/CarritoContext";
import { fetchCategorias, fetchProductos } from "../../services/catalogoService";
import type { Categoria, Producto } from "../../types/catalogo";
import { formatCordobas } from "../../utils/format";

const FILTRO_TODOS = "Todos";

export function ClienteMenuView() {
  const { user, logout } = useAuth();
  const { agregarProducto, cantidadItems } = useCarrito();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filtro, setFiltro] = useState(FILTRO_TODOS);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cats, prods] = await Promise.all([
          fetchCategorias(),
          fetchProductos(),
        ]);
        if (!activo) {
          return;
        }
        setCategorias(cats);
        setProductos(prods);
      } catch {
        if (activo) {
          setError("No se pudo cargar el menú.");
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

  const filtros = useMemo(
    () => [FILTRO_TODOS, ...categorias.map((c) => c.nombre)],
    [categorias]
  );

  const productosFiltrados = useMemo(() => {
    if (filtro === FILTRO_TODOS) {
      return productos;
    }
    return productos.filter((p) => p.categoria?.nombre === filtro);
  }, [filtro, productos]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-stone-100 pb-24">
      <header className="sticky top-0 z-30 border-b border-orange-100/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
              El Buen Sabor
            </p>
            <h1 className="text-xl font-semibold text-brand-900">Menú</h1>
            <p className="text-sm text-stone-500">Hola, {user?.nombre}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/mis-pedidos"
              className="rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100"
            >
              Mis pedidos
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-white"
            >
              Salir
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-4">
          {filtros.map((nombre) => {
            const activo = filtro === nombre;
            return (
              <button
                key={nombre}
                type="button"
                onClick={() => setFiltro(nombre)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activo
                    ? "bg-brand-700 text-white"
                    : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
                }`}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {loading ? (
          <p className="text-stone-500">Cargando menú...</p>
        ) : null}
        {error ? <p className="text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((producto) => (
              <article
                key={producto.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-200"
              >
                <div className="relative h-40 bg-stone-100">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-sm text-brand-700">
                      Sin imagen
                    </div>
                  )}

                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      producto.disponible
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {producto.disponible ? "Disponible" : "AGOTADO"}
                  </span>
                </div>

                <div className="space-y-3 p-4">
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">
                      {producto.nombre}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                      {producto.descripcion ?? "Sin descripción"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-brand-900">
                      {formatCordobas(producto.precio)}
                    </p>
                    <button
                      type="button"
                      disabled={!producto.disponible}
                      onClick={() => agregarProducto(producto)}
                      className="rounded-lg bg-brand-700 px-3 py-2 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:bg-stone-300"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {!loading && !error && productosFiltrados.length === 0 ? (
          <p className="text-stone-500">No hay productos en esta categoría.</p>
        ) : null}
      </main>

      <button
        type="button"
        onClick={() => setCarritoAbierto(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 font-medium text-white shadow-lg hover:bg-brand-900"
      >
        Carrito
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-brand-900">
          {cantidadItems}
        </span>
      </button>

      <CarritoModal
        open={carritoAbierto}
        onClose={() => setCarritoAbierto(false)}
      />
    </div>
  );
}
