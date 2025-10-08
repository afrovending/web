import { ShippingRatePayload } from "@/interfaces/shippingRate";
import api from "./axios";

export const getShippingRate = async (payload: ShippingRatePayload) => {
  const res = await api.get("/shipping/rates", { params: payload });
  return res.data;
};
 