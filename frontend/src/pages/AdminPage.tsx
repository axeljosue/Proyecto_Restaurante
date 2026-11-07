import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-900">Panel interno</h1>
          <p className="text-stone-600">
            Acceso para {user?.rol_nombre}: {user?.nombre}
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-white"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/recepcion"
          className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-500"
        >
          <h2 className="font-medium">Recepción de pedidos</h2>
          <p className="mt-2 text-sm text-stone-600">
            Validar transferencias, mostrador y avance de estados.
          </p>
        </Link>
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-stone-200">
          <h2 className="font-medium">Producción / MRP</h2>
          <p className="mt-2 text-sm text-stone-600">
            Solo Administrador en las APIs de producción.
          </p>
        </section>
      </div>
    </main>
  );
}
