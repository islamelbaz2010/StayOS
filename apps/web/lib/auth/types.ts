export type UserRole = "guest" | "host" | "field_staff" | "admin";

export interface User {
  id: string;
  phone_number: string | null;
  email: string | null;
  firebase_uid: string | null;
  display_name: string | null;
  locale: string;
  role: UserRole;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
