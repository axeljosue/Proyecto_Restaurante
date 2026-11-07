import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function MenuPage() {
  const { user, logout } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-brand-900">Menú</h1>
          <p className="text-stone-600">
            Hola, {user?.nombre}. Aquí verás el catálogo público.
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

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-stone-700">
          La estructura de autenticación ya está lista. El listado de productos
          se conectará en el siguiente paso.
        </p>
        <Link to="/mis-pedidos" className="mt-4 inline-block text-brand-700">
          Ver mis pedidos
        </Link>
      </div>
    </main>
  );
}
