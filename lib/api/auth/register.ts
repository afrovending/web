import api from "../axios";

export interface RegisterPayload {
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  street: string;
  city: string;
  state: string;
  device_name?: string;
}

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

export async function registerUser(data: RegisterPayload) {
  const res = await api.post("/register", {
    ...data,
    device_name: navigator.userAgent, // optional metadata
  });
  return res.data;
}
