import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function MisPedidosPage() {
  const { user } = useAuth();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold text-brand-900">Mis pedidos</h1>
      <p className="mb-6 text-stone-600">
        Pedidos de {user?.email}. Endpoint listo en backend:{" "}
        <code>/api/v1/pedidos/mis-pedidos</code>
      </p>
      <Link to="/menu" className="text-brand-700">
        Volver al menú
      </Link>
    </main>
  );
}
