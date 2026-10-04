# StayOS Web Route Catalog

Every page lives under `apps/web/app/[locale]/` with `locale ∈ {en, ar}`.
All content routes are bilingual; `dir=rtl` applies automatically under
`/ar`. `ProtectedRoute` gates authentication; role lists are enforced
client-side for UX while the backend remains authoritative.

| Route | Access | Layout | Data hooks | API calls |
|---|---|---|---|---|
| `/about` | public | GuestLayout | - | - |
| `/account-settings/activity` | authenticated | GuestLayout | - | - |
| `/account-settings/language` | authenticated | GuestLayout | - | - |
| `/account-settings/notifications` | authenticated | GuestLayout | - | - |
| `/account-settings` | authenticated | GuestLayout | useMarkAllNotifications | - |
| `/account-settings/payments` | authenticated | GuestLayout | - | - |
| `/account-settings/personal` | authenticated | GuestLayout | - | - |
| `/account-settings/privacy` | authenticated | GuestLayout | api.get | `/auth/me`, `/auth/me/export` |
| `/account-settings/security` | authenticated | GuestLayout | - | - |
| `/admin/bookings` | roles: admin, staff | AdminLayout | useHostBookings | - |
| `/admin/content/{pageId}` | roles: admin, staff | AdminLayout | api.get | - |
| `/admin/content` | roles: admin, staff | AdminLayout | - | - |
| `/admin/discovery` | roles: admin, staff | AdminLayout | - | - |
| `/admin/disputes` | roles: admin, staff | AdminLayout | - | - |
| `/admin/earnings` | roles: admin, staff | AdminLayout | - | - |
| `/admin/import` | roles: admin, staff | HostLayout | - | - |
| `/admin/kyc` | roles: admin, staff | AdminLayout | - | - |
| `/admin/listings` | roles: admin, staff | AdminLayout | useAdminListings | - |
| `/admin` | roles: admin, staff | AdminLayout | - | - |
| `/admin/payments/{paymentId}` | roles: admin, staff | AdminLayout | - | - |
| `/admin/payments` | roles: admin, staff | AdminLayout | - | - |
| `/admin/pending` | roles: admin, staff | AdminLayout | usePendingListings | - |
| `/admin/reports/{reportKey}` | roles: admin, staff | AdminLayout | - | - |
| `/admin/reports/management` | roles: admin, staff | AdminLayout | - | - |
| `/admin/reports` | roles: admin, staff | AdminLayout | - | - |
| `/admin/staff` | roles: admin | AdminLayout | - | - |
| `/admin/support` | roles: admin, staff | AdminLayout | useSetSupport | - |
| `/admin/users` | roles: admin | AdminLayout | - | - |
| `/auth/forgot-password` | public | GuestLayout | api.post | `/auth/password/forgot`, `/auth/password/reset` |
| `/auth/login` | public | GuestLayout | api.post | `/auth/dev-token`, `/auth/login` |
| `/auth/register` | public | GuestLayout | api.post | `/auth/register` |
| `/become-a-host` | public | GuestLayout | useHostListings | - |
| `/bookings/{bookingId}` | authenticated | GuestLayout | - | `/host/bookings` |
| `/bookings` | authenticated | GuestLayout | useGuestBookings | - |
| `/checkout/{bookingId}` | authenticated | GuestLayout | - | - |
| `/faq` | public | GuestLayout | - | - |
| `/favorites` | public | GuestLayout | - | - |
| `/for-guests` | public | GuestLayout | - | - |
| `/for-hosts` | public | GuestLayout | - | - |
| `/help/article/{slug}` | public | GuestLayout | - | - |
| `/help` | public | GuestLayout | - | - |
| `/host/availability/{unitId}` | roles: admin, host | HostLayout | - | - |
| `/host/bookings` | roles: admin, host | HostLayout | useHostBookings, useHostListings | - |
| `/host/calendar` | roles: admin, host | HostLayout | useHostListings | - |
| `/host/earnings` | roles: admin, host | HostLayout | - | - |
| `/host/guide/{topic}` | roles: admin, host | HostLayout | - | - |
| `/host/guide` | roles: admin, host | HostLayout | useHostBookings, useHostListings | - |
| `/host/kyc` | authenticated | HostLayout | - | - |
| `/host/listings/{unitId}/availability` | roles: admin, host | HostLayout | - | - |
| `/host/listings/{unitId}/co-hosts` | roles: admin, host | HostLayout | - | - |
| `/host/listings/{unitId}/edit` | roles: admin, host | HostLayout | - | - |
| `/host/listings/{unitId}/photos` | roles: admin, host | HostLayout | - | - |
| `/host/listings/new` | roles: admin, host | HostLayout | - | - |
| `/host/listings` | roles: admin, host | HostLayout | useHostListings | - |
| `/host` | roles: admin, host | HostLayout | - | - |
| `/host/profile` | roles: admin, host | HostLayout | - | - |
| `/host-standards` | public | GuestLayout | - | - |
| `/hosts/{hostId}` | public | GuestLayout | - | - |
| `/how-it-works` | public | GuestLayout | - | - |
| `/kyc` | authenticated | GuestLayout | - | - |
| `/listings/{unitId}` | public | GuestLayout | - | - |
| `/messages/{conversationId}` | authenticated | GuestLayout | - | - |
| `/messages` | authenticated | GuestLayout | - | - |
| `/notifications` | authenticated | GuestLayout | useMarkAllNotifications | - |
| `/p/{slug}` | public | GuestLayout | - | - |
| `/.` | public | GuestLayout | - | - |
| `/payments` | authenticated | GuestLayout | - | - |
| `/profile` | authenticated | GuestLayout | - | - |
| `/search` | public | GuestLayout | useSearchListings | - |
| `/support` | public | GuestLayout | - | - |

## Notes

- `/p/{slug}` renders CMS-driven marketing pages.
- `/help` is the role-aware Help Center; `/faq` is preserved separately.
- `/support` is the authenticated support chat; `/admin/support` is the
  operations queue (`operations` staff permission, server-enforced).
- Status/segment params persist via URL search params so filtered views
  are shareable (e.g. host bookings governorate→area→listing cascade).