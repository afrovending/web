import { Shop } from "@/interfaces/shop";
import api from "./axios";

export interface ShopsResponse {
  data: Shop[];
  total: number;
  limit: number;
  offset: number;
}

export async function listShops(
  limit: number,
  offset: number,
  type: string
): Promise<ShopsResponse> {
  const response = await api.get("/shops", {
    params: { limit, offset, type },
  });
  return response.data as ShopsResponse;
} 

export async function listShopItems(
  slug: string,
  options?: {
    offset?: number;
    limit?: number;
    search?: string;
  }
) {
  const { offset = 0, limit = 20, search = "" } = options || {};
  const response = await api.get(`/shop/items/${slug}`, {
    params: {
      offset,
      limit,
      search,
    },
  });

  return response.data;
}
