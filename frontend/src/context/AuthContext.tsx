import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authStorage } from "../services/api";
import { loginRequest, registerRequest } from "../services/authService";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";

const USER_KEY = "ebs_user";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  const persistSession = useCallback((nextToken: string, nextUser: AuthUser) => {
    authStorage.setToken(nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    authStorage.clearToken();
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const data = await loginRequest(payload);
      persistSession(data.token, data.usuario);
      return data.usuario;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await registerRequest(payload);
      persistSession(data.token, data.usuario);
      return data.usuario;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const hasRole = useCallback(
    (...roles: string[]) => {
      if (!user) {
        return false;
      }
      return roles.includes(user.rol_nombre);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      hasRole,
    }),
    [user, token, login, register, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
