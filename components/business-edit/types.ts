import { BusinessStatus } from "../businesses/types";

export interface IBusinessDetail {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  cnpj: string;
  name: string;
  website: string | null;
  status: BusinessStatus;
}

export interface IBusinessPhone {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "PERSONAL" | "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  country_code: string;
  number: string;
  primary: boolean;
  verified: Date | null;
  business_id: string;
}

export interface IBusinessAddress {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  type: "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
  cep: string;
  city: string;
  state: string;
  district: string;
  street: string;
  number: string;
  complement?: string;
  primary: boolean;
  latitude?: number;
  longitude?: number;
  business_id: string;
}

export interface IBusinessEmail {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  name: string;
  email: string;
  primary: boolean;
  verified: Date | null;
  business_id: string;
}

export type BusinessPhoneType = "PERSONAL" | "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
export type BusinessAddressType = "RESIDENTIAL" | "COMMERCIAL" | "OTHER";
export type BusinessEmailType = "GENERAL" | "SALES" | "SUPPORT" | "BILLING" | "OTHER";
