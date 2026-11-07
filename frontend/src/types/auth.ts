export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol_id: number;
  rol_nombre: string;
}

export interface AuthResponseData {
  token: string;
  usuario: AuthUser;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
}
