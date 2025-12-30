import Address from "./address";
import { Product } from "./products";
import { User } from "./user";

 
export interface OrderItem {
    id: number;
    quantity: number;
    price: string;
    type: string; // e.g., "checkout"
    subtotal: string;
    created_at: string;
    updated_at: string;
    user_id: number;
    order_id: number;
    product_id: number;
    product: Product; // Nested product details
}

// --- Shipping Address Interface ---
export interface ShippingAddress {
    id: number;
    customer_id: number;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string; // e.g., "KE"
    address_label: string; // e.g., "default"
    phone: string;
    created_at: string;
    updated_at: string;
}
 
// --- Main Order Interface (The item inside the 'data' array) ---
export interface Order {
  id: number;
  vendor_id: number[]; // Array of vendor IDs
  total: string;
  payment_method: string; // e.g., "card"
  shipping_status: string; // e.g., "processing"
  shipping_method: string; // e.g., "UPS"
  shipping_fee: string;
  tracking_number: string | null;
  payment_link: string | null;
  tracking_url: string | null;
  shipping_date: string | null;
  delivery_date: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  payment_status: string; // e.g., "pending"
  vendor_payment_settlement_status: string; // e.g., "unpaid"
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  customer_id: number;
  address_id: number;
  shipping_service_code: string | null;

  // Nested Relationships
  order_items: OrderItem[];
  address: ShippingAddress;
  customer: User;
}

// --- Final Response Interface for the List Endpoint ---
export type OrderListResponse = {
    status: "success" | "error"; // Added 'error' for robustness
    message: string; // Added 'message' field
    total: number;
    offset: number;
    limit: number;
    // The 'data' field is an array of Order objects
    data: Order[];
};
 

export type GraphPoint = {
  day: string;  
  total: number; 
};

export type OrderStatsType = {
  total_processing: number;
  total_ongoing: number;
  total_completed: number;
  total_cancelled: number;
};

 

export interface CustomerOrdersResponse {
  status: string;
  message: string;
  data: CustomerOrder[];
  total: number;
  offset: number;
  limit: number;
}

export interface CustomerOrder {
  id: number;
  vendor_id: number | null;
  total: string;
  payment_method: string;
  shipping_status: string;
  shipping_method: string | null;
  shipping_fee: string | null;
  tracking_number: string | null;
  payment_link: string | null;
  tracking_url: string | null;
  shipping_date: string | null;
  delivery_date: string | null;
  payment_date: string | null;
  payment_reference: string | null;
  payment_status: string;
  vendor_payment_settlement_status: string;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  customer_id: number;
  address_id: number;
  shipping_service_code: string | null;
  yet_to_review: boolean

  order_items: CustomerOrderItem[];
}

export interface CustomerOrderItem {
  id: number;
  quantity: number;
  price: string;
  type: string;
  subtotal: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  order_id: number;
  product_id: number;

  product: CustomerOrderProduct;
}

export interface CustomerOrderProduct {
  id: number;
  title: string;
  slug: string;
  images: string[]; 
  reviews: any[]; // adjust if you define Review[]
  average_rating: number;
  variations: any[]; // adjust if you define Variation[]
}
