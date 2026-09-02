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
  average_rating?: number | null;
  review_count?: number;
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

export type StayPhase =
  | "upcoming"
  | "check_in_ready"
  | "checked_in"
  | "checkout_ready"
  | "checked_out"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Booking {
  id: string;
  unit_id: string;
  guest_id: string;
  host_id: string | null;
  status: string;
  stay_phase: StayPhase;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  requested_at: string;
  accepted_at: string | null;
  rejected_at: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  reject_reason: string | null;
  cancel_reason: string | null;
}

export interface BookingCancellationPreview {
  booking_id: string;
  cancellable: boolean;
  cancelled_by: "guest" | "host" | "admin";
  total_paid_egp: number;
  refund_amount_egp: number;
  refund_policy_applied: string;
}

export interface StayPropertyInfo {
  unit_id: string;
  title: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  house_rules: string | null;
  cancellation_policy: string | null;
}

export interface StayHostInfo {
  name: string | null;
  phone: string | null;
}

export interface StayArrivalInfo {
  eligible: boolean;
  check_in_instructions: string | null;
  default_check_in_time: string;
  default_check_out_time: string;
}

export interface StayInfo {
  booking: Booking;
  property: StayPropertyInfo;
  host: StayHostInfo;
  arrival: StayArrivalInfo;
  review_eligible: boolean;
}

export interface LocationSuggestion {
  canonical_name_en: string;
  canonical_name_ar: string;
  city: string;
  governorate: string;
  lat: number | null;
  lng: number | null;
}

export interface HostProfile {
  id: string;
  display_name: string | null;
  kyc_status: string | null;
  joined_at: string | null;
  listings: Listing[];
}

export interface User {
  id: string;
  phone: string;
  display_name: string;
  role: string;
  kyc_status: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_role: string;
  content: string;
  status: string;
  automation_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  user_id: string;
  role: string;
  last_read_at: string | null;
}

export interface Conversation {
  id: string;
  booking_id: string | null;
  unit_id: string | null;
  type: string;
  status: string;
  participants: Participant[];
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  key: string;
  name: string;
  variables: string[];
  category: string;
  locale: string;
}

// ============================================================
// Host Operating System types
// ============================================================

export interface HostTodayItem {
  item_type:
    | "check_in_today"
    | "check_out_today"
    | "current_stay"
    | "pending_request"
    | "upcoming_arrival"
    | "upcoming_departure"
    | "unread_message"
    | "incomplete_listing";
  booking_id: string | null;
  unit_id: string | null;
  guest_name: string | null;
  guest_id: string | null;
  check_in: string | null;
  check_out: string | null;
  status: string | null;
  stay_phase: string | null;
  title: string;
  subtitle: string | null;
  action_url: string | null;
  priority: number;
}

export interface HostTodayResponse {
  items: HostTodayItem[];
  summary: Record<string, number>;
}

export interface HostReservationSummary {
  id: string;
  unit_id: string;
  unit_title: string | null;
  guest_id: string;
  guest_name: string | null;
  guest_phone: string | null;
  status: string;
  stay_phase: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  infants: number;
  requested_at: string;
  accepted_at: string | null;
  cancelled_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  cancel_reason: string | null;
}

export interface HostReservationDetail {
  booking: HostReservationSummary;
  property: {
    unit_id: string;
    title: string | null;
    address: string | null;
    city: string | null;
    governorate: string | null;
    property_type: string | null;
    max_guests: number;
  };
  payment: {
    id: string;
    status: string;
    method: string;
    amount_egp: number;
    nights: number;
    reference_number: string;
    proof_uploaded_at: string | null;
    verified_at: string | null;
    refund_amount_egp: number | null;
    instructions: string;
  } | null;
  cancellation_preview: {
    cancellable: boolean;
    cancelled_by: string;
    total_paid_egp: number;
    refund_amount_egp: number;
    refund_policy_applied: string;
  } | null;
}

export interface HostEarningsSummary {
  total_bookings: number;
  confirmed_bookings: number;
  completed_stays: number;
  total_revenue_egp: number;
  pending_verification_egp: number;
  refund_pending_egp: number;
  net_earnings_egp: number;
  per_unit: Array<{
    unit_id: string;
    unit_title: string | null;
    booking_count: number;
    revenue_egp: number;
  }>;
}

export interface HostCalendarDay {
  date: string;
  status: string;
  block_type: string | null;
  price_egp: number;
  reservation_id: string | null;
  reservation_status: string | null;
  guest_name: string | null;
}

export interface HostCalendarResponse {
  unit_id: string | null;
  check_in: string;
  check_out: string;
  days: HostCalendarDay[];
}

export interface ListingReadiness {
  unit_id: string;
  status: "ready" | "action_required";
  missing_items: string[];
  computed_at: string;
  missing_item_labels: Record<string, string>;
}

export interface CoHost {
  id: string;
  unit_id: string;
  co_host_user_id: string;
  co_host_display_name: string | null;
  co_host_phone: string | null;
  permission_scope: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostOwnProfile {
  id: string;
  display_name: string | null;
  phone_number: string | null;
  email: string | null;
  kyc_status: string;
  locale: string;
  is_active: boolean;
  total_listings: number;
  listed_listings: number;
  co_host_units: number;
  created_at: string;
}

// ============================================================
// Host Listing Management types
// ============================================================

export interface HostListingPhoto {
  id: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  caption: string | null;
}

export interface HostListingDetail {
  id: string;
  host_id: string;
  property_type: string;
  status: string;
  lat: number;
  lng: number;
  governorate: string;
  city: string;
  country: string;
  district: string | null;
  address: string | null;
  max_guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  category: string;
  title_ar: string;
  title_en: string | null;
  description_ar: string;
  description_en: string | null;
  amenities: string[];
  cultural_tags: string[];
  house_rules: string | null;
  check_in_instructions: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  pre_arrival_info_release_hours: number | null;
  policies: string | null;
  base_price_egp: number;
  cleaning_fee_egp: number;
  cancellation_policy: string;
  currency: string;
  weekend_mult: number;
  peak_mult: number;
  min_nights: number;
  max_nights: number;
  cover_image: string | null;
  photos: HostListingPhoto[];
  readiness: ListingReadiness | null;
  permission_scope: string;
}

export interface ListingCreatePayload {
  property_type: string;
  lat: number;
  lng: number;
  governorate: string;
  city: string;
  district?: string | null;
  google_place_id?: string | null;
  address?: string | null;
  max_guests: number;
  bedrooms: number;
  beds?: number;
  bathrooms: number;
  category?: string;
  title_ar: string;
  title_en?: string | null;
  description_ar: string;
  description_en?: string | null;
  amenities?: string[];
  cultural_tags?: string[];
  base_price_egp: number;
  cleaning_fee_egp?: number;
  cancellation_policy?: string;
  weekend_mult?: number;
  peak_mult?: number;
  min_nights?: number;
  max_nights?: number;
  house_rules?: string | null;
  check_in_instructions?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  pre_arrival_info_release_hours?: number | null;
  policies?: string | null;
  country?: string;
  currency?: string;
  is_draft?: boolean;
}

export interface ListingUpdatePayload {
  title_ar?: string;
  title_en?: string | null;
  description_ar?: string;
  description_en?: string | null;
  amenities?: string[];
  cultural_tags?: string[];
  base_price_egp?: number;
  cleaning_fee_egp?: number;
  cancellation_policy?: string;
  category?: string;
  address?: string | null;
  beds?: number;
  weekend_mult?: number;
  peak_mult?: number;
  min_nights?: number;
  max_nights?: number;
  house_rules?: string | null;
  check_in_instructions?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  pre_arrival_info_release_hours?: number | null;
  policies?: string | null;
  country?: string;
  currency?: string;
  cover_photo_id?: string | null;
}

export interface PhotoPresignResponse {
  upload_url: string;
  photo_key: string;
}

export interface PhotoCreatePayload {
  s3_key: string;
  url: string;
  caption?: string | null;
  is_cover?: boolean;
  display_order?: number;
}

export interface PhotoResponse {
  id: string;
  unit_id: string;
  s3_key: string;
  url: string;
  display_order: number;
  is_cover: boolean;
  caption: string | null;
}

export interface CalendarRuleCreatePayload {
  date_from: string;
  date_to: string;
  status: string;
  block_type?: string | null;
  price_override?: number | null;
}

export interface CalendarRuleResponse {
  id: string;
  unit_id: string;
  date_from: string;
  date_to: string;
  status: string;
  block_type: string | null;
  price_override: number | null;
}
