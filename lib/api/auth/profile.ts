import { User } from "@/interfaces/user";
import api from "../axios";

export async function updateUserProfile(payload: {
  name: string;
  last_name: string;
  phone: string;
}): Promise<User> {
  const response = await api.put(`/profile/update`, payload);
  return response.data.data;
}

export async function deleteUserAccount() {
  const response = await api.delete(`/profile/delete`);
  return response.data;
}

export async function getUserProfile(): Promise<User> {
  const response = await api.get(`/profile`);
  return response.data.data;
}

export async function logoutProfile() {
  const response = await api.post(`/profile/logout`);
  return response.data;
}