import api from "../axios";

export interface CheckoutPayload {
  email: string;
  products: CheckoutProduct[];
  shipping_fee: number;
  shipping_carrier: string;
  estimated_delivery: string | null;
  shipping_service_code: any; 

}

interface CheckoutProduct {
  id: number;
  quantity: number;
}

export const checkoutStripe = async (payload: CheckoutPayload) => {
  const res = await api.post("/session/checkout", {
    ...payload,
    device_name: navigator.userAgent,
  });
  return res.data;
};

export const verifyStripeSession = async (sessionId: string) => {
  const res = await api.get(`/stripe/verify-session?session_id=${sessionId}`);
  return res.data;
};
