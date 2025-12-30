import Address from "@/interfaces/address";
import api from "../axios";
 

export async function updateAddress(payload: Address): Promise<Address> {
  const response = await api.post(`/address/upsert`, payload);
  return response.data.data;
}

export async function getAddress(): Promise<Address> {
  const response = await api.get(`/addresses`); 
  return response.data.data;
}
