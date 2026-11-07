import type {
  ApiResponse,
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
} from "../types/auth";
import { api } from "./api";

export async function loginRequest(
  payload: LoginPayload
): Promise<AuthResponseData> {
  const { data } = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/login",
    payload
  );
  return data.data;
}

export async function registerRequest(
  payload: RegisterPayload
): Promise<AuthResponseData> {
  const { data } = await api.post<ApiResponse<AuthResponseData>>(
    "/auth/register",
    payload
  );
  return data.data;
}
