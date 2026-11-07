import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        nombre,
        email,
        password,
        telefono: telefono || undefined,
      });
      navigate("/menu", { replace: true });
    } catch {
      setError("No se pudo registrar. El email podría estar en uso.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-2 text-3xl font-semibold text-brand-900">Crear cuenta</h1>
      <p className="mb-8 text-stone-600">Registro de cliente en El Buen Sabor</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Nombre</span>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Teléfono</span>
          <input
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-700 px-4 py-2 font-medium text-white hover:bg-brand-900 disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarme"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <Link to="/login" className="font-medium text-brand-700">
          Inicia sesión
        </Link>
      </p>
    </main>
  );
}
