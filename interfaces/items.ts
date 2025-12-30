import { Shop } from "./shop";

export default interface Item {
  id: number;
  title: string;
  slug: string;
  description: string;
  sales_price: string;
  regular_price: string;
  quantity: number;
  notify_user: boolean;
  images: string[];
  image_public_ids: string[];
  status: string;
  type: string;
  shop_id: number;
  category_id: number;
  views: number;
  created_at: string;
  updated_at: string;
  category: Category;
  shop: Shop;
  sku: string;
  reviews: [];
  average_rating: number;
  variations: Variation[];
  available_days?: [];
  available_from?: string;
  available_to?: string;
  estimated_delivery_time?: string;
  delivery_method?: string;
  pricing_model?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
}
 
interface Color {
  id: number;
  name: string;
  hexcode: string;
}

interface Size {
  id: number;
  name: string;
}
 
export interface Variation {
  id?: number;
  name?: string;
  price?: string;
  [key: string]: unknown;
  quantity: number;
  color?: Color;
  size?: Size;
}
