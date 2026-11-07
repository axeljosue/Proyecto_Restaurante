import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { homePathForRole } from "../utils/navigation";

export function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-700">
        Restaurante
      </p>
      <h1 className="mt-3 text-5xl font-semibold text-brand-900">El Buen Sabor</h1>
      <p className="mt-4 max-w-xl text-lg text-stone-600">
        Pedidos, producción y cocina en un solo sistema.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {isAuthenticated ? (
          <Link
            to={homePathForRole(user)}
            className="rounded-lg bg-brand-700 px-5 py-2.5 font-medium text-white"
          >
            Continuar
          </Link>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-lg bg-brand-700 px-5 py-2.5 font-medium text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-stone-300 bg-white px-5 py-2.5 font-medium"
            >
              Registrarse
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
