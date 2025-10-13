export enum BusinessStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  TRIAL = "TRIAL",
  EXPIRED = "EXPIRED",
  ARCHIVED = "ARCHIVED",
  BANNED = "BANNED",
  DELETED = "DELETED",
}

export interface IBusiness {
  id: string;
  code: number;
  cnpj: string;
  name: string;
  website: string | null;
  status: BusinessStatus;
  created_at: Date;
}

export interface IBusinessListParams {
  search?: string;
  code?: number;
  status?: BusinessStatus;
  page_number: number;
  page_size: number;
  sort: string;
  order_by: "asc" | "desc";
}

export interface IBusinessListResponse {
  page_number: number;
  page_size: number;
  total: number;
  has_more: boolean;
  next_page: number;
  prev_page: number | null;
  last_page: number;
  sort: string;
  order_by: string;
  data: IBusiness[];
}
