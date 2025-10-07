export interface IProfile {
  id: string;
  code: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  email: string;
  name: string;
  status: string;
  profile_uri: string;
  type: string;
  cpf: string;
  birth_date: string;
  gender: "MALE" | "FEMALE" | "OTHER";
}

export interface IUserPhone {
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
  user_id: string;
}

export interface IUserAddress {
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
  user_id: string;
}
