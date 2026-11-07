import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function PublicOnlyRoute() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    if (user?.rol_nombre === "Administrador" || user?.rol_nombre === "Recepcionista") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/menu" replace />;
  }

  return <Outlet />;
}
