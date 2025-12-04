import { User } from "@/interfaces/user";
import api from "../axios";

export type GoogleCredentialResponse = {
  clientId: string;
  credential: string;
  select_by: string;
};

export async function ContinueWithGoogle(payload: {
  id_token: string;
  device_name: string;
}): Promise<{ token: string; user: User }> {
  const response = await api.post("/continue-with-google", payload);
  return response.data;
}

export async function loginUser(payload: {
  email: string;
  password: string;
  device_name: string;
}) {
  const response = await api.post("/login", payload);
  return response.data;
}
export async function registerUser(payload: {
  name: string;
  last_name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  device_name: string;
}) {
  const response = await api.post("/register", payload);
  return response.data;
}

export async function forgetPassword(payload: { email: string }) {
  const response = await api.post("/forget-password", payload);
  return response.data;
}

export async function confirmResetCode(payload: {
  email: string;
  otp: string;
}) {
  const response = await api.post("/verify-email", payload);
  return response.data;
}
export async function confirmEmail(payload: {
  email: string;
  otp: string;
}) {
  const response = await api.post("/verify-email", payload);
  return response.data;
}

export async function resetPassword(payload: {
  email: string;
  new_password: string;
  device_name: string;
}) {
  const response = await api.post("/reset-password", payload);
  return response.data;
}
