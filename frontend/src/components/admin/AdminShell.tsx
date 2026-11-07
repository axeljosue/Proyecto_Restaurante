import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const links = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/materias-primas", label: "Inventario", end: false },
  { to: "/admin/recetas", label: "Recetas BOM", end: false },
  { to: "/admin/produccion", label: "Producción / MRP", end: false },
];

export function AdminShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 to-orange-50">
      <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">
              Administración
            </p>
            <h1 className="text-xl font-semibold text-brand-900">
              El Buen Sabor
            </h1>
            <p className="text-sm text-stone-500">
              {user?.nombre} · {user?.rol_nombre}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/recepcion"
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50"
            >
              Recepción
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm hover:bg-stone-50"
            >
              Salir
            </button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "bg-white text-stone-700 ring-1 ring-stone-200"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
