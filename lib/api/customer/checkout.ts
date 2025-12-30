import api from "../axios";

export interface CheckoutPayload {
  email: string;
  products: CheckoutProduct[];
  shipping_fee: number;
  shipping_carrier: string;
  estimated_delivery: string | null;
  discount_code?: string;
  discount_amount?: number;
  shipping_service_code: {
    vendor_id: number;
    total: number;
    service_code: string;
    carrier: string;
    currency: string;
    delivery_days: number;
    estimated_delivery: string;
    shipment_id: string;
    rate_id: number;
  }[];
}

interface CheckoutProduct {
  id: number;
  quantity: number;
}

export const checkoutStripe = async (payload: CheckoutPayload) => {
  const res = await api.post("stripe/checkout", {
    ...payload,
    device_name: navigator.userAgent,
  });
  return res.data;
};

export const verifyStripeSession = async (sessionId: string) => {
  const res = await api.get(`/stripe/checkout/verify?session_id=${sessionId}`);
  return res.data;
};

export const verifyOnboardingStripeSession = async (sessionId: string) => {
  const res = await api.get(
    `/stripe/verify-onboarding-session?session_id=${sessionId}`
  );
  return res.data;
};
