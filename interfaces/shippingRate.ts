export interface ProductItem {
  id: number;
  quantity: number;
}

export interface ShippingRatePayload {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  country: string;
  ip: string;
  products: ProductItem[];
  note?: string;
  preferred_date?: string;
  type?: string;
}

export interface VendorRate {
  service_code: string;
  carrier: string;
  total: number;
  currency: string;
  delivery_days: number;
  estimated_delivery: string;
  rate_id: number;
  shipment_id: string;
}

export interface RateOption {
  total: number;
  vendors: Record<string, VendorRate>;
}
 

export interface ShippingRateResponse {
  cheapest: RateOption;
  fastest: RateOption;
}
export interface VendorRate {
  service_code: string;
  carrier: string;
  total: number;
  currency: string;
  delivery_days: number;
  estimated_delivery: string;
}

export interface RateOption {
  total: number;
  vendors: Record<string, VendorRate>; 
}
 