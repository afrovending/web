import api from "./axios";

export default async function verifyCoupon(code: string) {
  const { data } = await api.get(`coupon/${code}/verify`);
  return data;
}
