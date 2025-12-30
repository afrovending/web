import Coupon from "@/interfaces/coupon";
import api from "../axios";

export async function listCoupons(
  limit: number = 10,
  offset: number = 0,
  search: string = ""
) {
  const response = await api.get("/vendor/discounts", {
    params: {
      limit,
      offset,
      search,
    },
  });
  return response.data;
}
 
export async function upsertCoupon(data: any){
    const response = await api.post("/vendor/discounts/upsert", data);
    return response.data;
}