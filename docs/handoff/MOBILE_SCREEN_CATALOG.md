# StayOS Mobile Screen Catalog

Expo / React Native app under `apps/mobile/` (scheme `stayos`, bundle
`com.stayos.mobile`). Screens live in `src/screens/`; data access goes
through the axios client (`src/lib/api.ts`, SecureStore JWT) and the
React Query hooks in `src/lib/hooks.ts`. Locale persists via
`src/lib/LocaleContext.tsx` (AsyncStorage) with EN/AR + RTL support.

| Screen | Audience | Data hooks | i18n | API calls |
|---|---|---|---|---|
| `AccountScreen.tsx` | auth/shared | useMe, useUpgradeRole | yes | `/auth/logout`, `/auth/me`, `/auth/me/role` |
| `BookingScreen.tsx` | guest | useBookingQuote, useCreateBooking | yes | `/bookings`, `/payments/quote` |
| `FavoritesScreen.tsx` | guest | useFavorites, useToggleFavorite | yes | `/favorites`, `/favorites/$` |
| `HomeScreen.tsx` | guest | usePopularLocations | yes | `/locations/popular` |
| `HostProfileScreen.tsx` | host | useHostProfile | yes | `/listings/profiles/host/$` |
| `InboxScreen.tsx` | guest | useConversations | yes | `/messages/conversations` |
| `KycScreen.tsx` | auth/shared | useInitiateKyc, useKycStatus, useMe, useSubmitKyc, useUpgradeRole | yes | `/auth/me`, `/auth/me/role`, `/kyc/documents/$`, `/kyc/initiate`, `/kyc/status` |
| `ListingDetailScreen.tsx` | guest | useFavorites, useListingDetail, useListingPhotos, useListingReviews, useSimilarListings, useToggleFavorite | yes | `/favorites`, `/favorites/$`, `/listings/$` |
| `LoginScreen.tsx` | auth/shared | - | yes | `/auth/otp/send`, `/auth/otp/verify` |
| `MessageScreen.tsx` | guest | useConversationForBooking, useMarkRead, useMe, useMessages, useSendMessage | yes | `/auth/me`, `/messages/bookings/$`, `/messages/conversations/$` |
| `PaymentScreen.tsx` | guest | useCheckoutSession, usePaymentByBooking, usePresignProof, useStayInfo, useUploadProof | yes | `/bookings/$`, `/payments/$`, `/payments/booking/$` |
| `PaymentsScreen.tsx` | guest | usePayments | yes | `/payments` |
| `SearchScreen.tsx` | guest | useFavorites, useLocationAutocomplete, useSearchListings, useToggleFavorite | yes | `/favorites`, `/favorites/$`, `/listings`, `/locations/autocomplete` |
| `SupportScreen.tsx` | auth/shared | - | yes | - |
| `TripDetailScreen.tsx` | guest | useCheckIn, useCheckOut, useStayInfo | yes | `/bookings/$` |
| `TripsScreen.tsx` | guest | useGuestBookings | yes | `/bookings/guest` |
| `host/HostCalendarScreen.tsx` | host | useHostCalendar, useHostListings | yes | `/host/calendar`, `/listings/host/listings` |
| `host/HostCreateListingScreen.tsx` | host | useCreateListing | yes | `/listings` |
| `host/HostEarningsScreen.tsx` | host | useHostEarnings | yes | `/host/earnings` |
| `host/HostListingAvailabilityScreen.tsx` | host | useCreateCalendarRule, useDeleteCalendarRule, useHostCalendar, useHostListingDetail | yes | `/host/calendar`, `/host/listings/$`, `/listings/$` |
| `host/HostListingCoHostsScreen.tsx` | host | useCoHosts, useHostListingDetail, useInviteCoHost, useRemoveCoHost, useUpdateCoHost | yes | `/host/listings/$` |
| `host/HostListingDetailScreen.tsx` | host | useArchiveListing, useHostListingDetail, usePublishListing, useSubmitForReview, useUnpublishListing | yes | `/host/listings/$`, `/listings/$` |
| `host/HostListingEditorScreen.tsx` | host | useHostListingDetail, useUpdateListing | yes | `/host/listings/$`, `/listings/$` |
| `host/HostListingPhotosScreen.tsx` | host | useCreatePhoto, useDeletePhoto, useHostListingDetail, usePresignPhoto, useSetCoverPhoto | yes | `/host/listings/$`, `/listings/$` |
| `host/HostListingsScreen.tsx` | host | useHostListings, useListingReadiness | yes | `/host/listings/$`, `/listings/host/listings` |
| `host/HostProfileScreen.tsx` | host | useHostEarnings, useHostOwnProfile, useUpdateHostProfile | yes | `/auth/logout`, `/host/earnings`, `/host/profile` |
| `host/HostReservationDetailScreen.tsx` | host | useCancelBooking, useCheckIn, useCheckOut, useHostBookingUpdate, useHostReservationDetail | yes | `/bookings/$`, `/host/reservations/$` |
| `host/HostTodayScreen.tsx` | host | useHostToday | yes | `/host/today` |

## Notes

- Navigation is a single `App.tsx` navigator (role-aware home switch).
- Push tokens register via `src/lib/push.ts` → `POST /auth/device-token`.
- Paymob hosted checkout opens inside `PaymentScreen` (WebView handoff).
- Host area has its own screen set under `src/screens/host/`.