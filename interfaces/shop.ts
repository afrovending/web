import Category from "./category";

export interface Shop {
  id: number;
  name: string;
  slug: string;
  address: string;
  type: string;
  logo: string | null;
  logo_public_id: string;
  banner: string | null;
  banner_public_id: string;
  description: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  vendor_id: number;
  category_id: number;
  category: Category;
  status: string;
  stripe_connect_id?: string;
  stripe_onboarding_completed?: boolean;

  created_at: string;
  updated_at: string;
}
