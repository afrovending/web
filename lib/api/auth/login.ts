import api from "../axios";

export interface LoginPayload {
  email: string;
  password: string;
  device_name?: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function loginUser(data: LoginPayload) {
  const response = await api.post("/login", {
    ...data,
    device_name: navigator.userAgent, // optional metadata
  });
  return response.data;
}
