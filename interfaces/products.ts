import { Shop } from "./shop";

export interface ProductResponse {
  status: string;
  data: Product[];
  total: number;
  limit: number | string;
  offset: number;
  stats: [
    {
      total_items: number;
      total_active: number;
      total_inactive: number;
      total_service: number;
      total_product: number;
    }
  ];

}
export interface Stats {
    total_items: number;
    total_active: number;
    total_inactive: number;
    total_service: number;
    total_product: number;
}

export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string;
  sales_price: string;
  regular_price: string;
  quantity: number;
  notify_user: number;
  images: string[];
  image_public_ids: string[];
  status: "active" | "inactive";
  type: string;
  shop_id: number;
  shop?: Shop;
  category_id: number;
  available_from: string;
  available_to: string;
  available_days: string[];
  estimated_delivery_time: string;
  delivery_method: string;
  pricing_model: string;
  views: number;
  created_at: string;
  updated_at: string;
  sku: string;
  category: {
    id: number;
    name: string;
  };
  vendor: {
    id: number;
    name: string;
  };
  average_rating: number;
  variations?: any;
}

