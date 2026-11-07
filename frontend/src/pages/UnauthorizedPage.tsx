import { Link } from "react-router-dom";

export function UnauthorizedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 text-center">
      <h1 className="text-3xl font-semibold text-brand-900">Sin permiso</h1>
      <p className="mt-3 text-stone-600">
        Tu rol no tiene acceso a esta sección.
      </p>
      <Link to="/menu" className="mt-6 text-brand-700">
        Ir al menú
      </Link>
    </main>
  );
}
