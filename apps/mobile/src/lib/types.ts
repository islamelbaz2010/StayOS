export interface Listing {
  id: string;
  title: string;
  title_ar?: string;
  title_en?: string | null;
  description: string;
  property_type: string;
  city: string;
  governorate: string;
  country: string;
  price: number;
  base_price_egp: number;
  currency: string;
  lat: number;
  lng: number;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  cultural_tags: string[];
  house_rules?: string | null;
  host_kyc_status?: string | null;
  host_display_name?: string | null;
  cover_image?: string | null;
}

export interface ListingDetail extends Listing {
  host_id: string;
  status: string;
  district?: string | null;
  address?: string | null;
  beds: number;
  category: string;
  description_ar?: string;
  description_en?: string | null;
  check_in_instructions?: string | null;
  policies?: string | null;
  cleaning_fee_egp: number;
  cancellation_policy: string;
  weekend_mult: number;
  peak_mult: number;
  min_nights: number;
  max_nights: number;
  host_joined_at?: string | null;
}

export interface SearchResponse {
  data: Listing[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
    total_count: number;
  };
}

export interface Booking {
  id: string;
  unit_id: string;
  guest_id: string;
  host_id: string | null;
  status: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  requested_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
}

export interface LocationSuggestion {
  canonical_name_en: string;
  canonical_name_ar: string;
  city: string;
  governorate: string;
  lat: number | null;
  lng: number | null;
}

export interface User {
  id: string;
  phone: string;
  display_name: string;
  role: string;
  kyc_status: string;
}
