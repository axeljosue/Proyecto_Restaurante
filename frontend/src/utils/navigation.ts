import type { AuthUser } from "../types/auth";

export function homePathForRole(user: AuthUser | null | undefined): string {
  if (!user) {
    return "/login";
  }
  if (user.rol_nombre === "Recepcionista") {
    return "/recepcion";
  }
  if (user.rol_nombre === "Administrador") {
    return "/admin";
  }
  return "/menu";
}
