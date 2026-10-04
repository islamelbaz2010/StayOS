# StayOS API Route Catalog

Generated from the live FastAPI OpenAPI schema (`apps/web/lib/openapi.json`,
exported by `scripts/export_openapi.py`). All routes are served under the
FastAPI app root; business routes carry the `/api/v1` prefix.

Authentication uses an RS256 JWT bearer token (`Authorization: Bearer …`)
unless a route is documented as public or webhook-authenticated. Role and
permission enforcement is server-side in each router/service.

| Group | Operations |
|---|---|
| `root` | 1 |
| `admin` | 39 |
| `auth` | 31 |
| `availability` | 2 |
| `bookings` | 19 |
| `content` | 2 |
| `discovery` | 10 |
| `disputes` | 5 |
| `favorites` | 2 |
| `finance` | 13 |
| `guests` | 1 |
| `host` | 16 |
| `import` | 2 |
| `kyc` | 10 |
| `listings` | 33 |
| `locations` | 3 |
| `messages` | 14 |
| `notifications` | 3 |
| `operations` | 19 |
| `payments` | 14 |
| `reservations` | 8 |
| `reviews` | 4 |
| `health` | 4 |
| `metrics` | 1 |
| `version` | 1 |

## `root`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/` | JWT | - | RootResponse | Root |

## `admin`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/admin/adjustments` | JWT | `status` (query), `adjustment_type` (query), `booking_id` (query), `user_id` (query), `limit` (query), `offset` (query) | AdjustmentResponse[] | List Adjustments Endpoint (errors: 422) |
| POST | `/api/v1/admin/adjustments` | JWT | AdjustmentCreateRequest | AdjustmentResponse | Create Adjustment Endpoint (errors: 422) |
| POST | `/api/v1/admin/adjustments/{adjustment_id}/apply` | JWT | `adjustment_id` (path) | AdjustmentResponse | Apply Adjustment Endpoint (errors: 422) |
| POST | `/api/v1/admin/adjustments/{adjustment_id}/cancel` | JWT | `adjustment_id` (path) | AdjustmentResponse | Cancel Adjustment Endpoint (errors: 422) |
| POST | `/api/v1/admin/adjustments/{adjustment_id}/decide` | JWT | `adjustment_id` (path), AdjustmentDecisionRequest | AdjustmentResponse | Decide Adjustment Endpoint (errors: 422) |
| GET | `/api/v1/admin/bookings/{booking_id}/financial` | JWT | `booking_id` (path) | BookingFinancialContextResponse | Get Booking Financial (errors: 422) |
| PATCH | `/api/v1/admin/cms/blocks/{block_id}` | JWT | `block_id` (path), BlockUpdateRequest | BlockResponse | Update Block (errors: 422) |
| DELETE | `/api/v1/admin/cms/blocks/{block_id}` | JWT | `block_id` (path) | - | Delete Block (errors: 422) |
| GET | `/api/v1/admin/cms/media` | JWT | - | MediaResponse[] | List Media |
| POST | `/api/v1/admin/cms/media` | JWT | MediaCreateRequest | MediaResponse | Register Media (errors: 422) |
| POST | `/api/v1/admin/cms/media/presign` | JWT | MediaPresignRequest | MediaPresignResponse | Presign Media (errors: 422) |
| GET | `/api/v1/admin/cms/pages` | JWT | - | PageListItem[] | List Pages |
| POST | `/api/v1/admin/cms/pages` | JWT | PageCreateRequest | PageDetailResponse | Create Page (errors: 422) |
| GET | `/api/v1/admin/cms/pages/{page_id}` | JWT | `page_id` (path) | PageDetailResponse | Get Page (errors: 422) |
| PATCH | `/api/v1/admin/cms/pages/{page_id}` | JWT | `page_id` (path), PageUpdateRequest | PageDetailResponse | Update Page (errors: 422) |
| DELETE | `/api/v1/admin/cms/pages/{page_id}` | JWT | `page_id` (path) | - | Delete Page (errors: 422) |
| POST | `/api/v1/admin/cms/pages/{page_id}/blocks` | JWT | `page_id` (path), BlockCreateRequest | BlockResponse | Create Block (errors: 422) |
| GET | `/api/v1/admin/cms/pages/{page_id}/preview` | JWT | `page_id` (path), `lang` (query) | PublicPageResponse | Preview Page (errors: 422) |
| POST | `/api/v1/admin/cms/pages/{page_id}/publish` | JWT | `page_id` (path), PublishRequest | PageDetailResponse | Publish Page (errors: 422) |
| GET | `/api/v1/admin/cms/pages/{page_id}/revisions` | JWT | `page_id` (path) | RevisionResponse[] | List Revisions (errors: 422) |
| POST | `/api/v1/admin/cms/pages/{page_id}/revisions/{version}/restore` | JWT | `page_id` (path), `version` (path) | PageDetailResponse | Restore Revision (errors: 422) |
| POST | `/api/v1/admin/cms/pages/{page_id}/unpublish` | JWT | `page_id` (path) | PageDetailResponse | Unpublish Page (errors: 422) |
| GET | `/api/v1/admin/disputes/{dispute_id}/context` | JWT | `dispute_id` (path) | DisputeContextResponse | Get Dispute Context Endpoint (errors: 422) |
| GET | `/api/v1/admin/listings` | JWT | `status` (query), `governorate` (query) | AdminListingListItem[] | Get Listings (errors: 422) |
| GET | `/api/v1/admin/overview` | JWT | - | AdminOverviewResponse | Get Overview |
| GET | `/api/v1/admin/reports/catalog` | JWT | - | ReportCatalogResponse | Get Catalog |
| GET | `/api/v1/admin/reports/management` | JWT | `date_from` (query), `date_to` (query), `status` (query), `governorate` (query), `city` (query) | object | Get Management Report — Executive management report — composed from the same canonical (errors: 422) |
| GET | `/api/v1/admin/reports/{report_key}` | JWT | `report_key` (path), `date_from` (query), `date_to` (query), `status` (query), `payment_status` (query), `payout_status` (query), `kyc_status` (query), `role` (query), `governorate` (query), `city` (query), `property_type` (query), `host_id` (query), `guest_id` (query), `unit_id` (query), `payment_method` (query), `cancel_reason` (query), `entry_type` (query), `stay_phase` (query), `stay_in_range` (query), `min_amount` (query), `max_amount` (query), `page` (query), `page_size` (query), `sort` (query), `order` (query) | ReportResult | Get Report (errors: 422) |
| GET | `/api/v1/admin/reports/{report_key}/export` | JWT | `report_key` (path), `format` (query), `date_from` (query), `date_to` (query), `status` (query), `payment_status` (query), `payout_status` (query), `kyc_status` (query), `role` (query), `governorate` (query), `city` (query), `property_type` (query), `host_id` (query), `guest_id` (query), `unit_id` (query), `payment_method` (query), `cancel_reason` (query), `entry_type` (query), `stay_phase` (query), `stay_in_range` (query), `min_amount` (query), `max_amount` (query), `sort` (query), `order` (query) | - | Export Report (errors: 422) |
| GET | `/api/v1/admin/staff` | JWT | - | StaffResponse[] | List Staff Endpoint |
| POST | `/api/v1/admin/staff` | JWT | StaffCreateRequest | StaffResponse | Create Staff Endpoint (errors: 422) |
| GET | `/api/v1/admin/staff/role-groups` | JWT | - | RoleGroupResponse[] | List Role Groups Endpoint — FD-18: Job Role / Role Group → Permission Set templates. Applying a |
| PATCH | `/api/v1/admin/staff/{user_id}` | JWT | `user_id` (path), StaffUpdateRequest | StaffResponse | Update Staff Endpoint (errors: 422) |
| PUT | `/api/v1/admin/staff/{user_id}/permissions` | JWT | `user_id` (path), StaffPermissionsUpdate | StaffResponse | Set Permissions Endpoint (errors: 422) |
| GET | `/api/v1/admin/users` | JWT | `role` (query), `kyc_status` (query) | AdminUserListItem[] | Get Users (errors: 422) |
| POST | `/api/v1/admin/users/{user_id}/deactivate-hosting` | JWT | `user_id` (path), AdminUserActionRequest | null | AdminUserListItem | Deactivate Hosting Endpoint (errors: 422) |
| POST | `/api/v1/admin/users/{user_id}/reactivate` | JWT | `user_id` (path), AdminUserActionRequest | null | AdminUserListItem | Reactivate User Endpoint (errors: 422) |
| POST | `/api/v1/admin/users/{user_id}/restore-hosting` | JWT | `user_id` (path), AdminUserActionRequest | null | AdminUserListItem | Restore Hosting Endpoint (errors: 422) |
| POST | `/api/v1/admin/users/{user_id}/suspend` | JWT | `user_id` (path), AdminUserActionRequest | null | AdminUserListItem | Suspend User Endpoint (errors: 422) |

## `auth`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/auth/.well-known/jwks.json` | JWT | - | object | Public Key |
| POST | `/api/v1/auth/dev-token` | JWT | DevTokenRequest | TokenPair | Dev Token — Issue a JWT token pair for a given user ID — development only. (errors: 422) |
| POST | `/api/v1/auth/device-token` | JWT | DeviceTokenRegisterRequest | DeviceTokenResponse | Register Device Token (errors: 422) |
| POST | `/api/v1/auth/firebase` | JWT | FirebaseAuthRequest | TokenPair | Firebase Auth (errors: 422) |
| POST | `/api/v1/auth/login` | JWT | EmailLoginRequest | TokenPair | Login Email — Email+password login. Uniform "invalid credentials" failure for (errors: 422) |
| POST | `/api/v1/auth/logout` | JWT | TokenRefreshRequest | object | Logout (errors: 422) |
| GET | `/api/v1/auth/me` | JWT | - | UserResponse | Get Me |
| DELETE | `/api/v1/auth/me` | JWT | - | UserDeleteResponse | Delete My Account |
| PATCH | `/api/v1/auth/me` | JWT | UserProfileUpdate | UserResponse | Update Me (errors: 422) |
| GET | `/api/v1/auth/me/account` | JWT | - | AccountResponse | Get Account |
| PATCH | `/api/v1/auth/me/account` | JWT | AccountUpdate | AccountResponse | Update Account (errors: 422) |
| POST | `/api/v1/auth/me/avatar` | JWT | AvatarConfirmRequest | UserResponse | Confirm Avatar — Persist the uploaded profile photo after a successful S3 PUT. (errors: 422) |
| POST | `/api/v1/auth/me/avatar/presign` | JWT | AvatarPresignRequest | AvatarPresignResponse | Presign Avatar — Issue a presigned upload URL for the user's profile photo. Fails (errors: 422) |
| GET | `/api/v1/auth/me/export` | JWT | - | UserExportResponse | Export My Data |
| POST | `/api/v1/auth/me/hosting/deactivate` | JWT | - | RoleUpgradeResponse | Deactivate Hosting Endpoint — Host → Guest. Blocked while host-side obligations (listed units, |
| POST | `/api/v1/auth/me/logout-all` | JWT | - | object | Logout All Sessions — Revoke every refresh token — all devices, including this one. |
| GET | `/api/v1/auth/me/notification-preferences` | JWT | - | NotificationPreferencesResponse | Get Notification Preferences |
| PUT | `/api/v1/auth/me/notification-preferences` | JWT | NotificationPreferencesUpdate | NotificationPreferencesResponse | Update Notification Preferences (errors: 422) |
| PUT | `/api/v1/auth/me/preferences` | JWT | GuestPreferencesUpdate | UserResponse | Update Preferences — Set the guest's Local Fit stay preferences (rule keys only — (errors: 422) |
| GET | `/api/v1/auth/me/privacy` | JWT | - | PrivacySettingsResponse | Get Privacy Settings |
| PATCH | `/api/v1/auth/me/privacy` | JWT | PrivacySettingsUpdate | PrivacySettingsResponse | Update Privacy Settings (errors: 422) |
| PATCH | `/api/v1/auth/me/role` | JWT | RoleUpgradeRequest | RoleUpgradeResponse | Upgrade Role (errors: 422) |
| GET | `/api/v1/auth/me/sessions` | JWT | - | SessionListResponse | List Sessions |
| GET | `/api/v1/auth/otp/challenge` | JWT | - | OtpChallengeResponse | Get Otp Challenge — Proxies Akedly's V1.2 challenge so the mobile client can solve PoW (and |
| POST | `/api/v1/auth/otp/send` | JWT | OtpSendRequest | OtpSendResponse | Send Otp (errors: 422) |
| POST | `/api/v1/auth/otp/verify` | JWT | OtpVerifyRequest | TokenPair | Verify Otp (errors: 422) |
| POST | `/api/v1/auth/password` | JWT | PasswordSetRequest | - | Set Password — Set or change the account password while authenticated. Accounts that (errors: 422) |
| POST | `/api/v1/auth/password/forgot` | JWT | PasswordForgotRequest | - | Forgot Password — Send an OTP recovery code to the account's phone on file. Always (errors: 422) |
| POST | `/api/v1/auth/password/reset` | JWT | PasswordResetRequest | - | Reset Password — Set a new password after a successful OTP recovery challenge. (errors: 422) |
| POST | `/api/v1/auth/refresh` | JWT | TokenRefreshRequest | TokenPair | Refresh Token (errors: 422) |
| POST | `/api/v1/auth/register` | JWT | EmailRegisterRequest | TokenPair | Register Email — Email+password registration — creates a guest account and returns a (errors: 422) |

## `availability`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/availability/{unit_id}` | JWT | `unit_id` (path), `check_in` (query), `check_out` (query) | app__availability__schemas__AvailabilityResponse | Get Unit Availability (errors: 422) |
| PATCH | `/api/v1/availability/{unit_id}` | JWT | `unit_id` (path), AvailabilityUpdateRequest | AvailabilityUpdateResponse | Patch Unit Availability (errors: 422) |

## `bookings`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| POST | `/api/v1/bookings` | JWT | BookingCreate | BookingResponse | Post Booking (errors: 422) |
| GET | `/api/v1/bookings` | JWT | `status` (query), `limit` (query), `offset` (query) | BookingResponse[] | Get Host Bookings (errors: 422) |
| GET | `/api/v1/bookings/admin/{booking_id}/timeline` | JWT | `booking_id` (path) | BookingTimelineResponse | Get Booking Timeline Endpoint — Admin/staff operational timeline — every recorded lifecycle, (errors: 422) |
| GET | `/api/v1/bookings/guest` | JWT | `status` (query), `limit` (query), `offset` (query) | BookingResponse[] | Get Guest Bookings (errors: 422) |
| POST | `/api/v1/bookings/offers` | JWT | `conversation_id` (query), BookingOfferCreate | BookingOfferResponse | Post Booking Offer — Host sends a custom-priced stay offer inside a conversation. (errors: 422) |
| GET | `/api/v1/bookings/offers` | JWT | `conversation_id` (query) | BookingOfferResponse[] | Get Conversation Offers (errors: 422) |
| POST | `/api/v1/bookings/offers/{offer_id}/accept` | JWT | `offer_id` (path) | BookingResponse | Post Accept Offer (errors: 422) |
| POST | `/api/v1/bookings/offers/{offer_id}/decline` | JWT | `offer_id` (path) | BookingOfferResponse | Post Decline Offer (errors: 422) |
| GET | `/api/v1/bookings/{booking_id}` | JWT | `booking_id` (path) | BookingResponse | Get Booking Detail (errors: 422) |
| PATCH | `/api/v1/bookings/{booking_id}` | JWT | `booking_id` (path), BookingUpdate | BookingResponse | Patch Booking (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/cancel` | JWT | `booking_id` (path), BookingCancelRequest | BookingResponse | Post Cancel Booking (errors: 422) |
| GET | `/api/v1/bookings/{booking_id}/cancellation-preview` | JWT | `booking_id` (path) | BookingCancellationPreview | Get Cancellation Preview (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/check-in` | JWT | `booking_id` (path) | BookingResponse | Post Check In (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/check-out` | JWT | `booking_id` (path) | BookingResponse | Post Check Out (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/complete` | JWT | `booking_id` (path) | BookingResponse | Complete Booking Endpoint (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/host-reviews` | JWT | `booking_id` (path), ReviewCreate | HostReviewResponse | Post Host Review (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/no-show` | JWT | `booking_id` (path) | BookingResponse | Post No Show (errors: 422) |
| POST | `/api/v1/bookings/{booking_id}/reviews` | JWT | `booking_id` (path), ReviewCreate | ReviewResponse | Post Booking Review (errors: 422) |
| GET | `/api/v1/bookings/{booking_id}/stay` | JWT | `booking_id` (path) | StayInfoResponse | Get Stay Info Endpoint (errors: 422) |

## `content`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/content/pages` | JWT | `lang` (query) | PublicPageListItem[] | List Public Pages (errors: 422) |
| GET | `/api/v1/content/pages/{slug}` | JWT | `slug` (path), `lang` (query) | PublicPageResponse | Get Public Page (errors: 422) |

## `discovery`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/discovery/candidates` | JWT | `source` (query), `city` (query), `zone` (query), `governorate` (query), `property_type` (query), `status` (query), `candidate_type` (query), `duplicate_status` (query), `contact_status` (query), `min_score` (query), `max_score` (query), `limit` (query), `offset` (query), `sort_by` (query) | CandidateListResponse | List Candidates (errors: 422) |
| GET | `/api/v1/discovery/candidates/{candidate_id}` | JWT | `candidate_id` (path) | DiscoveryCandidateResponse | Get Candidate (errors: 422) |
| POST | `/api/v1/discovery/candidates/{candidate_id}/import` | JWT | `candidate_id` (path), CandidateImportRequest | object | Import Candidate (errors: 422) |
| PATCH | `/api/v1/discovery/candidates/{candidate_id}/status` | JWT | `candidate_id` (path), CandidateStatusUpdate | DiscoveryCandidateResponse | Update Candidate Status (errors: 422) |
| GET | `/api/v1/discovery/configs` | JWT | - | DiscoveryConfigResponse[] | List Configs |
| POST | `/api/v1/discovery/configs` | JWT | DiscoveryConfigCreate | DiscoveryConfigResponse | Create Config (errors: 422) |
| POST | `/api/v1/discovery/runs` | JWT | DiscoveryRunTriggerRequest | DiscoveryRunResponse | Trigger Run (errors: 422) |
| GET | `/api/v1/discovery/runs` | JWT | `limit` (query) | DiscoveryRunResponse[] | List Runs (errors: 422) |
| GET | `/api/v1/discovery/sources` | JWT | - | object[] | List Sources |
| GET | `/api/v1/discovery/stats` | JWT | - | DiscoveryStatsResponse | Get Discovery Stats |

## `disputes`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/disputes` | JWT | - | DisputeListResponse | Get My Disputes |
| POST | `/api/v1/disputes` | JWT | DisputeCreate | DisputeResponse | Post Dispute (errors: 422) |
| GET | `/api/v1/disputes/admin/all` | JWT | `status` (query), `limit` (query), `offset` (query) | DisputeListResponse | Get Admin Disputes (errors: 422) |
| PATCH | `/api/v1/disputes/admin/{dispute_id}` | JWT | `dispute_id` (path), DisputeAdminUpdate | DisputeResponse | Patch Dispute Admin (errors: 422) |
| GET | `/api/v1/disputes/{dispute_id}` | JWT | `dispute_id` (path) | DisputeResponse | Get Dispute (errors: 422) |

## `favorites`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/favorites` | JWT | - | FavoriteListResponse | List Favorites |
| POST | `/api/v1/favorites/{unit_id}` | JWT | `unit_id` (path) | FavoriteToggleResponse | Toggle Favorite Endpoint (errors: 422) |

## `finance`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/finance/escrow` | JWT | `host_id` (query), `status` (query), `limit` (query), `offset` (query) | EscrowListResponse | List Escrows (errors: 422) |
| GET | `/api/v1/finance/escrow/{escrow_id}` | JWT | `escrow_id` (path) | - | Get Escrow (errors: 422) |
| POST | `/api/v1/finance/escrow/{escrow_id}/hold` | JWT | `escrow_id` (path), `hold_hours` (query) | - | Hold Escrow Endpoint (errors: 422) |
| POST | `/api/v1/finance/escrow/{escrow_id}/release` | JWT | `escrow_id` (path) | - | Release Escrow Endpoint (errors: 422) |
| GET | `/api/v1/finance/ledger` | JWT | `ledger_account` (query), `limit` (query), `offset` (query) | LedgerListResponse | List Platform Ledger (errors: 422) |
| POST | `/api/v1/finance/payment-intents/{intent_id}/refund` | JWT | `intent_id` (path), PaymentIntentRefundRequest | PaymentIntentRefundResponse | Refund Payment Intent Endpoint — Issue/reconcile the provider refund for a refund-pending card intent. (errors: 422) |
| POST | `/api/v1/finance/payouts` | JWT | PayoutRequestCreate | PayoutRequestResponse | Create Payout Request (errors: 422) |
| GET | `/api/v1/finance/payouts` | JWT | `status` (query), `limit` (query), `offset` (query) | PayoutListResponse | List Payouts (errors: 422) |
| POST | `/api/v1/finance/payouts/{payout_id}/process` | JWT | `payout_id` (path), PayoutProcessRequest | PayoutRequestResponse | Process Payout Endpoint (errors: 422) |
| GET | `/api/v1/finance/wallets/me` | JWT | - | WalletResponse | Get My Wallet |
| GET | `/api/v1/finance/wallets/{wallet_id}/ledger` | JWT | `wallet_id` (path), `limit` (query), `offset` (query) | LedgerListResponse | List Wallet Ledger (errors: 422) |
| POST | `/api/v1/finance/webhooks/paymob` | HMAC | - | WebhookResponse | Paymob Webhook |
| POST | `/api/v1/finance/webhooks/stripe` | HMAC | - | WebhookResponse | Stripe Webhook |

## `guests`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/guests/{guest_id}/reviews` | JWT | `guest_id` (path), `limit` (query), `offset` (query) | GuestReviewListResponse | Get Guest Review History (errors: 422) |

## `host`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/host/bookings` | JWT | `status` (query), `unit_id` (query), `search` (query), `area` (query), `governorate` (query), `limit` (query), `offset` (query) | PaginatedResponse_BookingResponse_ | List Host Bookings Paginated (errors: 422) |
| GET | `/api/v1/host/calendar` | JWT | `check_in` (query), `check_out` (query), `unit_id` (query) | HostCalendarResponse | Get Host Calendar Endpoint (errors: 422) |
| GET | `/api/v1/host/earnings` | JWT | - | HostEarningsSummary | Get Host Earnings Endpoint |
| POST | `/api/v1/host/earnings/simulate` | JWT | EarningsSimulateRequest | EarningsSimulateResponse | Simulate Earnings Endpoint — Host earnings simulator (FD-21) — canonical pricing engine, (errors: 422) |
| GET | `/api/v1/host/listings/{unit_id}` | JWT | `unit_id` (path) | HostListingDetail | Get Host Listing Detail Endpoint (errors: 422) |
| POST | `/api/v1/host/listings/{unit_id}/co-hosts` | JWT | `unit_id` (path), CoHostInvite | CoHostResponse | Invite Co Host Endpoint (errors: 422) |
| GET | `/api/v1/host/listings/{unit_id}/co-hosts` | JWT | `unit_id` (path) | CoHostResponse[] | List Co Hosts Endpoint (errors: 422) |
| PATCH | `/api/v1/host/listings/{unit_id}/co-hosts/{co_host_id}` | JWT | `unit_id` (path), `co_host_id` (path), CoHostUpdate | CoHostResponse | Update Co Host Endpoint (errors: 422) |
| DELETE | `/api/v1/host/listings/{unit_id}/co-hosts/{co_host_id}` | JWT | `unit_id` (path), `co_host_id` (path) | - | Remove Co Host Endpoint (errors: 422) |
| GET | `/api/v1/host/listings/{unit_id}/readiness` | JWT | `unit_id` (path) | ListingReadinessResponse | Get Listing Readiness Endpoint (errors: 422) |
| GET | `/api/v1/host/performance` | JWT | `days` (query) | HostPerformanceResponse | Get Host Performance Endpoint — Host Performance Center (FD-23) — canonical aggregates. (errors: 422) |
| GET | `/api/v1/host/profile` | JWT | - | app__host__schemas__HostProfileResponse | Get Host Profile Endpoint |
| PATCH | `/api/v1/host/profile` | JWT | HostProfileUpdate | app__host__schemas__HostProfileResponse | Update Host Profile Endpoint (errors: 422) |
| GET | `/api/v1/host/reservations` | JWT | `status` (query), `limit` (query), `offset` (query) | HostReservationSummary[] | List Host Reservations Endpoint (errors: 422) |
| GET | `/api/v1/host/reservations/{booking_id}` | JWT | `booking_id` (path) | HostReservationDetail | Get Host Reservation Detail Endpoint (errors: 422) |
| GET | `/api/v1/host/today` | JWT | - | HostTodayResponse | Get Host Today Endpoint |

## `import`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| POST | `/api/v1/import/confirm` | JWT | ImportConfirmRequest | ImportSummaryResponse | Confirm Import (errors: 422) |
| POST | `/api/v1/import/preview` | JWT | Body_preview_import_api_v1_import_preview_post | ImportPreviewResponse | Preview Import (errors: 422) |

## `kyc`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| POST | `/api/v1/kyc/documents/{document_id}/approve` | JWT | `document_id` (path), KycApproveRequest | KycDocumentResponse | Approve Kyc (errors: 422) |
| GET | `/api/v1/kyc/documents/{document_id}/images` | JWT | `document_id` (path) | KycImageDownloadResponse | Download Kyc Images (errors: 422) |
| POST | `/api/v1/kyc/documents/{document_id}/process` | JWT | `document_id` (path) | KycDocumentResponse | Process Kyc (errors: 422) |
| POST | `/api/v1/kyc/documents/{document_id}/reject` | JWT | `document_id` (path), KycRejectRequest | KycDocumentResponse | Reject Kyc (errors: 422) |
| POST | `/api/v1/kyc/documents/{document_id}/submit` | JWT | `document_id` (path) | KycSubmitResponse | Submit Kyc (errors: 422) |
| POST | `/api/v1/kyc/initiate` | JWT | KycInitiateRequest | KycInitiateResponse | Initiate Kyc (errors: 422) |
| GET | `/api/v1/kyc/pending` | JWT | `limit` (query), `offset` (query) | KycPendingListResponse | List Pending Kyc — Manual review queue plus read-only provider activity. (errors: 422) |
| GET | `/api/v1/kyc/status` | JWT | - | KycStatusResponse | Kyc Status |
| POST | `/api/v1/kyc/verification/session` | JWT | - | KycVerificationSessionResponse | Verification Session — Mint a provider SDK session, or report the manual fallback mode. |
| POST | `/api/v1/kyc/webhooks/sumsub` | HMAC | - | KycWebhookResponse | Sumsub Webhook — Sumsub verification webhook — server-authoritative result channel. |

## `listings`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/listings` | JWT | `q` (query), `city` (query), `governorate` (query), `host_id` (query), `sw_lat` (query), `sw_lng` (query), `ne_lat` (query), `ne_lng` (query), `lat` (query), `lng` (query), `radius_km` (query), `check_in` (query), `check_out` (query), `min_price` (query), `max_price` (query), `bedrooms` (query), `beds` (query), `bathrooms` (query), `property_type` (query), `category` (query), `cultural_tags` (query), `amenities` (query), `free_cancellation` (query), `instant_book` (query), `pets` (query), `self_check_in` (query), `accessibility` (query), `host_language` (query), `guests` (query), `sort` (query), `cursor` (query), `offset` (query), `limit` (query) | ListingSearchResponse | List Listings (errors: 422) |
| POST | `/api/v1/listings` | JWT | ListingCreate | ListingResponse | Post Listing (errors: 422) |
| GET | `/api/v1/listings/admin/pending` | JWT | - | ListingResponse[] | Get Admin Pending Endpoint |
| POST | `/api/v1/listings/admin/{unit_id}/approve` | JWT | `unit_id` (path) | ListingResponse | Post Approve Listing (errors: 422) |
| GET | `/api/v1/listings/admin/{unit_id}/change-history` | JWT | `unit_id` (path) | ListingChangeEvent[] | Get Listing Change History Endpoint (errors: 422) |
| POST | `/api/v1/listings/admin/{unit_id}/reject` | JWT | `unit_id` (path), ListingRejectRequest | null | ListingResponse | Post Reject Listing (errors: 422) |
| GET | `/api/v1/listings/host/dashboard` | JWT | - | HostDashboardStats | Get Host Dashboard Endpoint |
| GET | `/api/v1/listings/host/listings` | JWT | - | ListingResponse[] | Get Host Listings Endpoint |
| GET | `/api/v1/listings/host/reservations` | JWT | `check_in` (query), `check_out` (query), `unit_id` (query) | HostReservationCalendarResponse | Get Host Reservations Endpoint (errors: 422) |
| GET | `/api/v1/listings/host/{unit_id}` | JWT | `unit_id` (path) | ListingResponse | Get Host Listing Endpoint (errors: 422) |
| GET | `/api/v1/listings/price-distribution` | JWT | `q` (query), `city` (query), `governorate` (query), `host_id` (query), `sw_lat` (query), `sw_lng` (query), `ne_lat` (query), `ne_lng` (query), `lat` (query), `lng` (query), `radius_km` (query), `check_in` (query), `check_out` (query), `min_price` (query), `max_price` (query), `bedrooms` (query), `beds` (query), `bathrooms` (query), `property_type` (query), `category` (query), `cultural_tags` (query), `amenities` (query), `free_cancellation` (query), `instant_book` (query), `pets` (query), `self_check_in` (query), `accessibility` (query), `host_language` (query), `guests` (query), `sort` (query), `cursor` (query), `offset` (query), `limit` (query) | PriceDistributionResponse | Get Price Distribution Endpoint (errors: 422) |
| GET | `/api/v1/listings/profiles/host/{host_id}` | JWT | `host_id` (path) | app__listings__schemas__HostProfileResponse | Get Host Profile Endpoint (errors: 422) |
| GET | `/api/v1/listings/{unit_id}` | JWT | `unit_id` (path) | ListingResponse | Get Listing (errors: 422) |
| PATCH | `/api/v1/listings/{unit_id}` | JWT | `unit_id` (path), ListingUpdate | ListingResponse | Patch Listing (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/archive` | JWT | `unit_id` (path) | ListingResponse | Post Archive Listing (errors: 422) |
| GET | `/api/v1/listings/{unit_id}/availability` | JWT | `unit_id` (path), `check_in` (query), `check_out` (query) | app__listings__schemas__AvailabilityResponse | Get Listing Availability (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/calendar` | JWT | `unit_id` (path), CalendarRuleCreate | app__listings__schemas__CalendarRuleResponse | Post Host Calendar Rule (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/calendar/bulk-availability` | JWT | `unit_id` (path), BulkAvailabilityRequest | app__listings__schemas__CalendarRuleResponse[] | Post Bulk Availability (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/calendar/bulk-pricing` | JWT | `unit_id` (path), BulkPricingRequest | app__listings__schemas__CalendarRuleResponse[] | Post Bulk Pricing (errors: 422) |
| PATCH | `/api/v1/listings/{unit_id}/calendar/{rule_id}` | JWT | `unit_id` (path), `rule_id` (path), CalendarRuleUpdate | app__listings__schemas__CalendarRuleResponse | Patch Host Calendar Rule (errors: 422) |
| DELETE | `/api/v1/listings/{unit_id}/calendar/{rule_id}` | JWT | `unit_id` (path), `rule_id` (path) | - | Delete Host Calendar Rule Endpoint (errors: 422) |
| GET | `/api/v1/listings/{unit_id}/fit` | JWT | `unit_id` (path) | ListingFitResponse | Get Listing Fit Endpoint — StayOS Local Fit — explainable rule-based match between the guest's (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/photos` | JWT | `unit_id` (path), PhotoCreate | PhotoResponse | Post Photo (errors: 422) |
| GET | `/api/v1/listings/{unit_id}/photos` | JWT | `unit_id` (path) | PhotoResponse[] | Get Photos (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/photos/presign` | JWT | `unit_id` (path), PhotoPresignRequest | PhotoPresignResponse | Presign Photo Upload (errors: 422) |
| PATCH | `/api/v1/listings/{unit_id}/photos/reorder` | JWT | `unit_id` (path), PhotoReorderRequest | PhotoResponse[] | Reorder Photos Endpoint (errors: 422) |
| DELETE | `/api/v1/listings/{unit_id}/photos/{photo_id}` | JWT | `unit_id` (path), `photo_id` (path) | - | Delete Photo Endpoint (errors: 422) |
| PATCH | `/api/v1/listings/{unit_id}/photos/{photo_id}/cover` | JWT | `unit_id` (path), `photo_id` (path) | PhotoResponse | Patch Cover Photo (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/publish` | JWT | `unit_id` (path) | ListingResponse | Post Publish Listing (errors: 422) |
| GET | `/api/v1/listings/{unit_id}/reviews` | JWT | `unit_id` (path), `limit` (query), `offset` (query), `q` (query) | ReviewListResponse | Get Unit Reviews (errors: 422) |
| GET | `/api/v1/listings/{unit_id}/similar` | JWT | `unit_id` (path), `limit` (query) | object[] | Get Similar Listings Endpoint (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/submit` | JWT | `unit_id` (path) | ListingResponse | Post Submit For Review (errors: 422) |
| POST | `/api/v1/listings/{unit_id}/unpublish` | JWT | `unit_id` (path) | ListingResponse | Post Unpublish Listing (errors: 422) |

## `locations`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/locations/autocomplete` | JWT | `q` (query), `limit` (query) | LocationAutocompleteResponse | Location Autocomplete Endpoint (errors: 422) |
| GET | `/api/v1/locations/popular` | JWT | `limit` (query) | LocationAutocompleteResponse | Location Popular Endpoint (errors: 422) |
| GET | `/api/v1/locations/tree` | JWT | - | LocationTreeResponse | Location Tree Endpoint — Structured governorate → city → area data for dependent location |

## `messages`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| POST | `/api/v1/messages/admin/conversations` | JWT | AdminContactCreate | ConversationResponse | Admin Contact Endpoint — Admin/staff starts a support conversation with the guest or the (errors: 422) |
| GET | `/api/v1/messages/bookings/{booking_id}/conversation` | JWT | `booking_id` (path) | ConversationResponse | Get Conversation For Booking (errors: 422) |
| GET | `/api/v1/messages/conversations` | JWT | `limit` (query), `offset` (query) | ConversationListItem[] | Get Conversations (errors: 422) |
| GET | `/api/v1/messages/conversations/unread` | JWT | - | UnreadCountResponse | Get Unread Count |
| GET | `/api/v1/messages/conversations/{conversation_id}` | JWT | `conversation_id` (path) | ConversationDetailResponse | Get Conversation Detail (errors: 422) |
| POST | `/api/v1/messages/conversations/{conversation_id}/automated` | JWT | `conversation_id` (path), AutomatedMessageSend | MessageResponse | null | Post Automated Message (errors: 422) |
| GET | `/api/v1/messages/conversations/{conversation_id}/messages` | JWT | `conversation_id` (path), `limit` (query), `offset` (query) | MessageResponse[] | Get Messages (errors: 422) |
| POST | `/api/v1/messages/conversations/{conversation_id}/messages` | JWT | `conversation_id` (path), MessageCreate | MessageResponse | Post Message (errors: 422) |
| POST | `/api/v1/messages/conversations/{conversation_id}/read` | JWT | `conversation_id` (path), MarkReadRequest | object | Post Mark Read (errors: 422) |
| POST | `/api/v1/messages/inquiries` | JWT | InquiryCreate | ConversationResponse | Create Inquiry (errors: 422) |
| POST | `/api/v1/messages/support` | JWT | SupportConversationCreate | ConversationResponse | Start Support Conversation — User starts a StayOS Support thread from the Support page. (errors: 422) |
| GET | `/api/v1/messages/support/queue` | JWT | `support_status` (query), `limit` (query), `offset` (query) | ConversationListItem[] | Get Support Queue — Staff triage list of every SUPPORT conversation. (errors: 422) |
| POST | `/api/v1/messages/support/{conversation_id}/status` | JWT | `conversation_id` (path), SupportStatusUpdate | ConversationResponse | Update Support Status (errors: 422) |
| GET | `/api/v1/messages/templates` | JWT | `locale` (query) | MessageTemplateResponse[] | Get Message Templates (errors: 422) |

## `notifications`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/notifications` | JWT | `limit` (query) | InAppNotificationList | List Notifications (errors: 422) |
| POST | `/api/v1/notifications/read-all` | JWT | - | MarkAllReadResponse | Mark All Notifications Read |
| POST | `/api/v1/notifications/{notification_id}/read` | JWT | `notification_id` (path) | InAppNotificationItem | Mark Notification Read (errors: 422) |

## `operations`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/operations/dashboard` | JWT | - | OperationsDashboardResponse | Get Dashboard |
| GET | `/api/v1/operations/maintenance` | JWT | - | MaintenanceRequestResponse[] | List Maintenance Requests |
| POST | `/api/v1/operations/maintenance` | JWT | MaintenanceRequestCreate | MaintenanceRequestResponse | Post Maintenance Request (errors: 422) |
| GET | `/api/v1/operations/maintenance/{request_id}` | JWT | `request_id` (path) | MaintenanceRequestResponse | Get Maintenance Request Endpoint (errors: 422) |
| PATCH | `/api/v1/operations/maintenance/{request_id}` | JWT | `request_id` (path), MaintenanceRequestUpdate | MaintenanceRequestResponse | Patch Maintenance Request (errors: 422) |
| GET | `/api/v1/operations/readiness/{unit_id}` | JWT | `unit_id` (path), `reservation_id` (query) | PropertyReadinessResponse | Get Readiness (errors: 422) |
| PATCH | `/api/v1/operations/readiness/{unit_id}` | JWT | `unit_id` (path), `reservation_id` (query), PropertyReadinessUpdate | PropertyReadinessResponse | Patch Readiness (errors: 422) |
| POST | `/api/v1/operations/recurring-maintenance` | JWT | RecurringMaintenanceCreate | RecurringMaintenanceResponse | Post Recurring Maintenance (errors: 422) |
| GET | `/api/v1/operations/staff` | JWT | - | FieldStaffResponse[] | Get Field Staff |
| POST | `/api/v1/operations/staff` | JWT | FieldStaffCreate | FieldStaffResponse | Post Field Staff (errors: 422) |
| POST | `/api/v1/operations/tasks` | JWT | TaskCreate | TaskResponse | Post Task (errors: 422) |
| GET | `/api/v1/operations/tasks/{task_id}` | JWT | `task_id` (path) | TaskResponse | Get Task Endpoint (errors: 422) |
| PATCH | `/api/v1/operations/tasks/{task_id}` | JWT | `task_id` (path), TaskUpdate | TaskResponse | Patch Task (errors: 422) |
| POST | `/api/v1/operations/tasks/{task_id}/assign` | JWT | `task_id` (path), TaskAssignRequest | TaskResponse | Post Assign Task (errors: 422) |
| POST | `/api/v1/operations/tasks/{task_id}/attachments` | JWT | `task_id` (path), TaskAttachmentRequest | TaskResponse | Post Task Attachment (errors: 422) |
| POST | `/api/v1/operations/tasks/{task_id}/complete` | JWT | `task_id` (path), TaskCompleteRequest | TaskResponse | Post Complete Task (errors: 422) |
| POST | `/api/v1/operations/tasks/{task_id}/notes` | JWT | `task_id` (path), TaskNoteRequest | TaskResponse | Post Task Note (errors: 422) |
| POST | `/api/v1/operations/tasks/{task_id}/start` | JWT | `task_id` (path) | TaskResponse | Post Start Task (errors: 422) |
| GET | `/api/v1/operations/tasks/{task_id}/timeline` | JWT | `task_id` (path) | object[] | Get Task Timeline Endpoint (errors: 422) |

## `payments`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/payments` | JWT | `limit` (query), `offset` (query) | PaymentListItem[] | List My Payments (errors: 422) |
| GET | `/api/v1/payments/admin/queue` | JWT | `status` (query), `limit` (query), `offset` (query) | PaymentListItem[] | Payment Queue (errors: 422) |
| GET | `/api/v1/payments/booking/{booking_id}` | JWT | `booking_id` (path) | PaymentResponse | Get Payment For Booking (errors: 422) |
| GET | `/api/v1/payments/host` | JWT | `status` (query), `limit` (query), `offset` (query) | PaymentListItem[] | List Host Payment Activity (errors: 422) |
| GET | `/api/v1/payments/quote` | JWT | `unit_id` (query), `check_in` (query), `check_out` (query) | BookingQuote | Get Quote — Public guest price quote — the same computation used to price the (errors: 422) |
| GET | `/api/v1/payments/return-status` | JWT | `booking_id` (query), `t` (query) | PaymentReturnStatusResponse | Get Payment Return Status Endpoint — Public, read-only payment status for a guest returning from hosted (errors: 422) |
| GET | `/api/v1/payments/{payment_id}` | JWT | `payment_id` (path) | PaymentResponse | Get Payment Detail (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/checkout-session` | JWT | `payment_id` (path) | PaymentResponse | Create Checkout Session — Canonical card path: issue a Paymob hosted-checkout session. (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/proof` | JWT | `payment_id` (path), PaymentProofUpload | PaymentResponse | Submit Proof (errors: 422) |
| GET | `/api/v1/payments/{payment_id}/proof/download` | JWT | `payment_id` (path) | PaymentProofDownloadResponse | Download Proof (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/proof/presign` | JWT | `payment_id` (path), PaymentProofPresignRequest | PaymentProofPresignResponse | Presign Proof (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/refund` | JWT | `payment_id` (path) | PaymentResponse | Refund Payment Endpoint (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/reject` | JWT | `payment_id` (path), PaymentVerifyRequest | PaymentResponse | Reject Payment Endpoint (errors: 422) |
| POST | `/api/v1/payments/{payment_id}/verify` | JWT | `payment_id` (path) | PaymentResponse | Verify Payment Endpoint (errors: 422) |

## `reservations`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| POST | `/api/v1/reservations` | JWT | ReservationCreate | ReservationResponse | Post Reservation (errors: 422) |
| GET | `/api/v1/reservations` | JWT | `status` (query), `cursor` (query), `limit` (query) | ReservationListResponse | Get Reservations (errors: 422) |
| GET | `/api/v1/reservations/{reservation_id}` | JWT | `reservation_id` (path) | ReservationResponse | Get Reservation Detail (errors: 422) |
| POST | `/api/v1/reservations/{reservation_id}/cancel` | JWT | `reservation_id` (path), ReservationCancelRequest | ReservationResponse | Post Cancel Reservation (errors: 422) |
| POST | `/api/v1/reservations/{reservation_id}/check-in` | JWT | `reservation_id` (path) | ReservationResponse | Post Check In (errors: 422) |
| POST | `/api/v1/reservations/{reservation_id}/check-out` | JWT | `reservation_id` (path) | ReservationResponse | Post Check Out (errors: 422) |
| POST | `/api/v1/reservations/{reservation_id}/confirm` | JWT | `reservation_id` (path), PaymentConfirmationRequest | ReservationResponse | Post Confirm Reservation (errors: 422) |
| POST | `/api/v1/reservations/{reservation_id}/promo` | JWT | `reservation_id` (path), PromoApplyRequest | ReservationResponse | Post Apply Promo (errors: 422) |

## `reviews`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/api/v1/reviews/admin/reports` | JWT | `status` (query), `limit` (query), `offset` (query) | ReviewReportListResponse | Get Review Reports Admin (errors: 422) |
| PATCH | `/api/v1/reviews/admin/reports/{report_id}` | JWT | `report_id` (path), ReviewReportAdminUpdate | ReviewReportResponse | Patch Review Report Admin (errors: 422) |
| POST | `/api/v1/reviews/{review_id}/host-response` | JWT | `review_id` (path), HostResponseCreate | ReviewResponse | Post Host Response — Host writes a public response to a guest review (Airbnb behavior). (errors: 422) |
| POST | `/api/v1/reviews/{review_id}/report` | JWT | `review_id` (path), ReviewReportCreate | ReviewReportResponse | Post Review Report — FD-04: flag a review → admin moderation queue (no AI moderation). (errors: 422) |

## `health`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/health` | public | - | HealthResponse | Health Check |
| GET | `/health/deep` | public | - | HealthResponse | Deep Health Check |
| GET | `/health/live` | public | - | HealthResponse | Liveness Check |
| GET | `/health/ready` | public | - | HealthResponse | Readiness Check |

## `metrics`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/metrics` | JWT | - | string | Metrics |

## `version`

| Method | Path | Auth | Request | Response | Behavior / side effects |
|---|---|---|---|---|---|
| GET | `/version` | JWT | - | VersionResponse | Version |

## Notes

- Idempotency: payment capture, escrow recognition and webhook handlers are
  idempotent by design (see `src/app/finance`, `src/app/payments`).
- Webhooks authenticate via HMAC signature, not JWT.
- `/auth/dev-token` is gated by `ENVIRONMENT` and 404s outside
  development/staging.
- Guest-facing responses never expose internal fee splits (Commercial
  Model B economics stay server-side).
