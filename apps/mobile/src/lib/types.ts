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
  beds?: number;
  bathrooms: number;
  amenities: string[];
  cultural_tags: string[];
  house_rules?: string | null;
  host_kyc_status?: string | null;
  host_display_name?: string | null;
  cover_image?: string | null;
  average_rating?: number | null;
  review_count?: number;
  available_for_dates?: boolean | null;
  instant_book?: boolean;
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
  allows_pets?: boolean;
  self_check_in?: boolean;
  self_check_in_methods?: string[];
  accessibility_features?: string[];
  accessibility_photo_features?: string[];
  host_languages?: string[];
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
  | "rejected"
  | "no_show";

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
  unit_title?: string | null;
  unit_cover_image?: string | null;
}

export interface BookingCancellationPreview {
  booking_id: string;
  cancellable: boolean;
  cancelled_by: "guest" | "host" | "admin";
  total_paid_egp: number;
  refund_amount_egp: number;
  refund_policy_applied: string;
  cancellation_policy: string | null;
  service_fee_retained_egp: number;
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
  kyc_status?: string | null;
  languages?: string[];
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

export type PaymentStatus =
  | "pending"
  | "proof_uploaded"
  | "verified"
  | "rejected"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export interface Payment {
  id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  unit_id: string;
  status: PaymentStatus;
  method: string;
  checkout_url: string | null;
  amount_egp: number;
  accommodation_amount_egp: number | null;
  guest_service_fee_egp: number | null;
  nights: number;
  reference_number: string;
  payment_deadline_at: string | null;
  proof_rejection_count: number;
  proof_s3_key: string | null;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  reject_reason: string | null;
  cancelled_at: string | null;
  instructions: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentListItem {
  id: string;
  booking_id: string;
  guest_id: string;
  host_id: string;
  unit_id: string;
  status: PaymentStatus;
  method: string;
  amount_egp: number;
  reference_number: string;
  payment_deadline_at: string | null;
  proof_rejection_count: number;
  proof_url: string | null;
  proof_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentProofPresignResponse {
  upload_url: string;
  proof_key: string;
}

export interface KycUploadUrls {
  front: string;
  back: string;
  selfie: string;
}

export interface KycInitiateResponse {
  document_id: string;
  upload_urls: KycUploadUrls;
  expires_at: string;
}

export interface KycDocument {
  id: string;
  user_id: string;
  account_id: string | null;
  document_type: string;
  document_number: string | null;
  status: string;
  legal_name: string | null;
  provider: string | null;
  provider_applicant_id: string | null;
  front_image_key: string | null;
  back_image_key: string | null;
  selfie_image_key: string | null;
  verified_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycStatusResponse {
  user_id: string;
  kyc_status: string;
  documents: KycDocument[];
  verification_mode: string;
  automated_available: boolean;
  required_sides: Record<string, string[]>;
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
  // Backend sends phone_number; `phone` kept optional for legacy callers.
  phone?: string | null;
  phone_number: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
  kyc_status: string;
  is_active: boolean;
  staff_permissions: string[];
  has_password: boolean;
  locale: string;
  bio: string | null;
  location: string | null;
  languages: string[];
  interests: string[] | null;
  avatar_url: string | null;
}

export interface SessionItem {
  id: string;
  created_at: string | null;
  expires_at: string;
}

export interface PrivacySettings {
  profile_public: boolean;
  read_receipts: boolean;
}

export interface NotificationPreferences {
  preferences: Record<string, boolean>;
}

export interface AccountData {
  id: string;
  user_id: string;
  legal_name: string | null;
  national_id: string | null;
  date_of_birth: string | null;
  tax_id: string | null;
  address: Record<string, unknown> | null;
  mailing_address: Record<string, unknown> | null;
  emergency_contact: Record<string, unknown> | null;
  payout_method: string | null;
  payout_bank_name: string | null;
  payout_account_number: string | null;
  payout_wallet_msisdn: string | null;
  payout_holder_name: string | null;
}

export interface InAppNotification {
  id: string;
  event_type: string;
  category: string;
  subject: string | null;
  body: string;
  locale: string;
  read_at: string | null;
  created_at: string;
  booking_id?: string | null;
}

export interface NotificationList {
  items: InAppNotification[];
  unread_count: number;
}

export interface Dispute {
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  reporter_role: string | null;
  booking_id: string;
  category: string;
  description: string;
  status: string;
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisputeList {
  data: Dispute[];
  total: number;
}

export interface BookingOffer {
  id: string;
  conversation_id: string;
  unit_id: string;
  host_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  total_price_egp: number;
  status: string;
  booking_id: string | null;
  expires_at: string;
  created_at: string;
}

export interface HostBooking {
  id: string;
  unit_id: string;
  guest_id: string;
  host_id: string | null;
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
  cancel_reason: string | null;
  unit_title: string | null;
  unit_cover_image: string | null;
}

export interface PaginatedBookings {
  items: HostBooking[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HostPerformance {
  period_days: number;
  total_bookings: number;
  accepted_bookings: number;
  completed_stays: number;
  cancelled_bookings: number;
  cancellation_rate_pct: number;
  booked_nights: number;
  occupancy_pct: number;
  gross_revenue_egp: number;
  avg_nightly_egp: number;
  inquiries: number;
  per_unit: Array<{ unit_id: string; unit_title: string | null; bookings: number; revenue_egp: number }>;
}

// ============================================================
// Staff / Admin operations types
// ============================================================

export interface OpsDashboard {
  pending_tasks: number;
  in_progress_tasks: number;
  completed_tasks_today: number;
  overdue_tasks: number;
  open_maintenance_requests: number;
  not_ready_units: number;
  active_field_staff: number;
}

export interface OpsTask {
  id: string;
  unit_id: string;
  reservation_id: string | null;
  task_type: string;
  status: string;
  priority: string;
  field_staff_id: string | null;
  due_by: string;
  notes: string | null;
  checklist: unknown;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  reporter_id: string | null;
  issue_type: string;
  description: string | null;
  status: string;
  related_task_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyReadiness {
  id: string;
  unit_id: string;
  reservation_id: string | null;
  status: string;
  blocked_until: string | null;
  reason: string | null;
  updated_at: string;
}

export interface AdminOverview {
  users_total: number;
  users_guests: number;
  users_hosts: number;
  hosts_kyc_verified: number;
  listings_total: number;
  listings_listed: number;
  listings_pending_verification: number;
  listings_pending_changes: number;
  listings_rejected: number;
  listings_by_governorate: Record<string, number>;
  bookings_total: number;
  bookings_requested: number;
  bookings_accepted: number;
  bookings_confirmed: number;
  bookings_completed: number;
  bookings_cancelled: number;
  bookings_rejected: number;
  upcoming_checkins_7d: number;
  payments_pending: number;
  payments_proof_uploaded: number;
  payments_verified: number;
  payments_verified_amount_egp: number;
  payments_refund_pending_amount_egp: number | null;
  payments_refunded_amount_egp: number;
  payouts_pending: number;
  payouts_pending_amount_egp: number;
  payouts_paid_amount_egp: number | null;
  escrows_held: number;
  escrows_held_amount_egp: number | null;
  host_funds_held_egp: number | null;
  host_payable_egp: number | null;
  platform_revenue_egp: number | null;
  vat_egp: number | null;
  kyc_pending_documents: number;
  disputes_open: number;
  disputes_in_review: number;
  maintenance_open: number;
  tasks_pending: number;
  tasks_overdue: number;
}

export interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  phone_number: string | null;
  role: string;
  kyc_status: string;
  is_active: boolean;
  created_at: string;
}

export interface AdminListing {
  id: string;
  title: string;
  host_id: string;
  status: string;
  governorate: string;
  city: string;
  has_pending_changes: boolean;
  created_at: string;
}

export interface PendingListingPhoto {
  id: string;
  url: string;
  moderation_state: string;
  is_cover: boolean;
}

export interface PendingChangeSet {
  unit?: Record<string, unknown>;
  listing?: Record<string, unknown>;
  lat?: number | null;
  lng?: number | null;
  submitted_by?: string;
  submitted_at?: string;
}

/** /listings/admin/pending returns full ListingResponse objects plus
    edit-moderation context. */
export interface PendingListing {
  id: string;
  host_id: string;
  title: string;
  title_ar: string;
  title_en: string | null;
  status: string;
  governorate: string;
  city: string;
  country: string;
  district: string | null;
  cover_image: string | null;
  base_price_egp: number;
  price: number;
  currency: string;
  has_pending_changes: boolean;
  pending_changes: PendingChangeSet | null;
  pending_photos: PendingListingPhoto[];
  rejection_reason: string | null;
  created_at: string | null;
  [key: string]: unknown;
}

export interface AdminPaymentItem extends PaymentListItem {
  unit_title: string | null;
  check_in: string | null;
  check_out: string | null;
  booking_status: string | null;
  reject_reason: string | null;
  refunded_at: string | null;
}

export interface KycPendingList {
  data: KycDocument[];
  total: number;
  inflight: KycDocument[];
}

export interface KycImageDownload {
  front_url: string | null;
  back_url: string | null;
  selfie_url: string | null;
}

export interface StaffMember {
  id: string;
  phone_number: string | null;
  email: string | null;
  display_name: string | null;
  role: string;
  is_active: boolean;
  permissions: string[];
  has_password: boolean;
  created_at: string;
}

export interface DiscoveryCandidate {
  id: string;
  source: string;
  source_url: string;
  discovered_at: string;
  candidate_type: string | null;
  raw_title: string | null;
  title: string | null;
  description: string | null;
  city: string | null;
  zone: string | null;
  governorate: string | null;
  property_type: string | null;
  nightly_price: number | null;
  contact_status: string;
  contact_type: string | null;
  contact_value: string | null;
  duplicate_status: string;
  status: string;
  notes: string | null;
  imported_unit_id: string | null;
  qualification_score: number;
}

export interface DiscoveryCandidateList {
  data: DiscoveryCandidate[];
  pagination: { total: number; limit: number; offset: number };
}

export interface DiscoveryStats {
  total_candidates: number;
  unique_candidates: number;
  qualified_candidates: number;
  imported: number;
  duplicate_rate: number;
  contactable_candidates: number;
}

export interface ReviewReport {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export interface ReviewReportList {
  data: ReviewReport[];
  total: number;
}

export interface Adjustment {
  id: string;
  booking_id: string | null;
  user_id: string | null;
  listing_id: string | null;
  adjustment_type: string;
  category: string;
  amount_egp: number;
  reason: string;
  internal_note: string | null;
  customer_note: string | null;
  status: string;
  created_at: string;
}

export interface ReportCatalogEntry {
  key: string;
  category: string;
  /** Stable i18n keys — labels come from REPORT_COLUMNS, same as web. */
  columns: string[];
  date_basis: string;
  filters: string[];
  sortable: string[];
  money_columns: string[];
  implemented: boolean;
  unavailable_reason: string | null;
  note: string | null;
  total_labels?: Record<string, string>;
}

export interface ReportResult {
  key: string;
  category: string;
  date_basis: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total: number;
  page: number;
  page_size: number;
  totals: Record<string, number>;
  total_labels?: Record<string, string>;
  generated_at: string;
  note: string | null;
}

export interface BookingTimelineEvent {
  id: string;
  event_type: string;
  occurred_at: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_role: string | null;
  aggregate_type: string | null;
  detail: Record<string, unknown> | string | null;
}

export interface BookingTimeline {
  booking_id: string;
  events: BookingTimelineEvent[];
}

export interface BookingFinancialContext {
  booking_id: string;
  booking_status: string;
  check_in: string;
  check_out: string;
  guest_name: string | null;
  guest_phone: string | null;
  host_name: string | null;
  host_phone: string | null;
  unit_title: string | null;
  unit_city: string | null;
  unit_governorate: string | null;
  payment_id: string | null;
  payment_status: string | null;
  payment_method: string | null;
  payment_amount_egp: number | null;
  reference_number: string | null;
  refund_amount_egp: number | null;
  refunded_at: string | null;
  reject_reason: string | null;
  escrow: Record<string, unknown> | null;
  financials: Record<string, unknown> | null;
  payout: Record<string, unknown> | null;
  transactions: Array<Record<string, unknown>>;
  disputes: Array<Record<string, unknown>>;
  adjustments: Array<Record<string, unknown>>;
}

export interface EscrowRecord {
  id: string;
  reservation_id: string;
  host_id: string;
  amount_egp: number;
  status: string;
  hold_until: string | null;
  released_at: string | null;
  refunded_at: string | null;
  host_amount_egp: number | null;
  platform_share_egp: number | null;
  vat_egp: number | null;
  unit_title: string | null;
  booking_status: string | null;
  payment_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface PayoutRecord {
  id: string;
  wallet_id: string;
  host_id: string;
  amount_egp: number;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerRecord {
  id: string;
  transaction_id: string;
  wallet_id: string | null;
  escrow_id: string | null;
  ledger_account: string;
  account_type: string;
  entry_type: string;
  amount_egp: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  reservation_id: string | null;
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

export interface ConversationListItem {
  id: string;
  booking_id: string | null;
  unit_id: string | null;
  type: string;
  status: string;
  subject: string | null;
  support_status: string | null;
  context_booking_id: string | null;
  unread_count: number;
  counterparty_name: string | null;
  unit_title: string | null;
  last_message: Message | null;
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
    cancellation_policy: string | null;
    service_fee_retained_egp: number;
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
  listing_discount_pct?: number;
  weekly_discount_pct?: number;
  monthly_discount_pct?: number;
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
  listing_discount_pct?: number;
  weekly_discount_pct?: number;
  monthly_discount_pct?: number;
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
  listing_discount_pct?: number;
  weekly_discount_pct?: number;
  monthly_discount_pct?: number;
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
