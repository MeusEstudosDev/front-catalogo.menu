export interface IPlan {
  id: string;
  code: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  name: string;
  description: string | null;
  price_monthly: string;
  price_yearly: string | null;
  currency: string;
  trial_days: number;
  is_active: boolean;
  features: any | null;
  max_users: number | null;
  max_branches: number | null;
  max_products: number | null;
  max_orders: number | null;
}

export interface IPlanListParams {
  page_number: number;
  page_size: number;
}

export interface IPlanListResponse {
  page_number: number;
  page_size: number;
  total: number;
  has_more: boolean;
  prev_page: number | null;
  next_page: number | null;
  last_page: number;
  data: IPlan[];
}

export interface ICreatePlanData {
  name: string;
  description?: string;
  price_monthly: string;
  price_yearly?: string;
  currency: string;
  trial_days: number;
  is_active: boolean;
  max_users?: number;
  max_branches?: number;
  max_products?: number;
  max_orders?: number;
}

export interface IUpdatePlanData {
  name?: string;
  description?: string;
  price_monthly?: string;
  price_yearly?: string;
  currency?: string;
  trial_days?: number;
  is_active?: boolean;
  max_users?: number;
  max_branches?: number;
  max_products?: number;
  max_orders?: number;
}
