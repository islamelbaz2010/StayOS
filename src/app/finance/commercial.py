"""Canonical StayOS commercial engine — the single source of truth for
booking economics.

FOUNDER DECISION (final commercial model):

- StayOS economics total 12% of the accommodation amount.
- Internally allocated 6% host-side + 6% guest-side — this split is a
  reporting/ledger concept only. It is NEVER shown to the guest.
- The Guest-facing price is strictly all-inclusive: the amount shown in
  search, listing, booking, checkout, confirmation, and trips is the final
  price ("Includes all fees"). No service-fee line, no fee breakdown, no
  commission or payout disclosure.
- Fee base: the 12% applies to the accommodation amount only — never to
  cleaning/additional fees, pass-through charges, taxes, or deposits.
- Host payout derives from the SAME computation the guest was charged
  with: ``host_net = guest_total - platform_share``.

The listing ``base_price_egp`` is the advertised guest-facing nightly
price (the semantic that already existed: search and listing pages show
it directly). Under the all-inclusive model the guest pays exactly the
advertised price — the platform share is internal, not grossed-up.

All money is integer EGP minor-major units; never floats.
"""

from dataclasses import dataclass

from app.config import settings


@dataclass(frozen=True)
class BookingEconomics:
    """Internal economics of one booking. Guest surfaces must only ever
    render ``guest_total_egp`` — every other field is internal."""

    accommodation_egp: int  # nightly prices after the applicable discount
    cleaning_fee_egp: int
    guest_total_egp: int  # the all-inclusive price the guest pays
    platform_share_egp: int  # StayOS economics (12% of accommodation)
    host_net_egp: int  # what the host is owed (guest_total - platform share)
    # Internal 6% + 6% allocation — ledger/reporting only.
    host_side_share_egp: int
    guest_side_share_egp: int
    # VAT (configured ``VAT_RATE_PCT``) is a platform-service tax component
    # INSIDE ``platform_share_egp`` — the guest total and host net are
    # deliberately unchanged. ``platform_net_revenue_egp`` is the revenue
    # StayOS retains after remitting VAT.
    vat_egp: int = 0
    platform_net_revenue_egp: int = 0


def compute_booking_economics(
    accommodation_egp: int,
    cleaning_fee_egp: int = 0,
    *,
    platform_share_waived: bool = False,
) -> BookingEconomics:
    """Split a booking's collected total into platform share and host net.

    ``platform_share_waived`` implements the closed-alpha incentive
    (first ALPHA_HOST_FREE_BOOKINGS completed bookings carry no platform
    share) — when waived the host receives the full collected amount.
    """
    guest_total = accommodation_egp + cleaning_fee_egp
    if platform_share_waived:
        platform_share = 0
    else:
        platform_share = int(
            round(accommodation_egp * settings.PLATFORM_TOTAL_SHARE_PCT)
        )
    host_net = guest_total - platform_share
    # Split the platform share into the two internal 6% allocations,
    # putting any rounding remainder on the host-side bucket so the two
    # always sum exactly to platform_share.
    guest_side = int(
        round(accommodation_egp * settings.GUEST_SIDE_SHARE_PCT)
    ) if platform_share else 0
    host_side = platform_share - guest_side
    vat, net_revenue = split_vat(platform_share)
    return BookingEconomics(
        accommodation_egp=accommodation_egp,
        cleaning_fee_egp=cleaning_fee_egp,
        guest_total_egp=guest_total,
        platform_share_egp=platform_share,
        host_net_egp=host_net,
        host_side_share_egp=host_side,
        guest_side_share_egp=guest_side,
        vat_egp=vat,
        platform_net_revenue_egp=net_revenue,
    )


def split_vat(platform_share_egp: int) -> tuple[int, int]:
    """Split a VAT-inclusive platform share into (vat, net revenue).

    Tax base rule (canonical): VAT at ``VAT_RATE_PCT`` applies to the
    StayOS platform service share — the fee base is the discounted
    accommodation amount only (post-discount, post-cleaning exclusion).
    The guest pays the all-inclusive total unchanged and the host net is
    unchanged: VAT is carved out of StayOS's own share, not added on top
    and not taken from the host. ``vat + net == platform_share`` exactly.
    """
    if platform_share_egp <= 0:
        return 0, platform_share_egp
    rate = settings.VAT_RATE_PCT
    net = int(round(platform_share_egp / (1 + rate)))
    return platform_share_egp - net, net


def guest_all_in_price_for_host_target(host_target_net_egp: int) -> int:
    """Gross-up helper for the host earnings simulator: if a host thinks
    in terms of a target net amount, the equivalent all-inclusive guest
    price is ``target / (1 - 0.12)``. Rounds to the nearest EGP such that
    the resulting host net is never below the target."""
    rate = settings.PLATFORM_TOTAL_SHARE_PCT
    if rate >= 1.0:
        raise ValueError("Platform share must be below 100%")
    return int(round(host_target_net_egp / (1.0 - rate)))
