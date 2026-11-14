import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  roles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  roles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, hasRole, user } = useAuth();
  const location = useLocation();

  console.log("Verificando permisos. Usuario:", user, "Roles requeridos:", roles);

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
