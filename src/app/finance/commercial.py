"""Canonical StayOS commercial engine — the single source of truth for
booking economics.

FOUNDER DECISION (Model B — final commercial model, supersedes DEC-023):

- StayOS economics total 12% of the accommodation amount, split into a
  real HOST-SIDE COMMISSION (6%) and a GUEST-SIDE allocation (6%). The
  split is a ledger/reporting concept — NEVER shown to the guest.
- The host-side 6% is settled by DEDUCTING it from the host payable —
  it is never added to the guest's charge. Host net =
  ``accommodation + cleaning − host_commission``.
- The guest-side 6% is charged to the guest inside the taxable amount:
  ``taxable = accommodation + cleaning + guest_side_6%``.
- VAT at ``VAT_RATE_PCT`` (14%) applies to that taxable amount and is
  added on top: ``guest_total = taxable + vat``. VAT is a separate tax
  liability — never host revenue, never StayOS revenue.
- Ledger identity: ``guest_total = host_net + stayos_revenue + vat``
  where ``stayos_revenue = host_commission + guest_side``.
- The Guest-facing price is strictly all-inclusive and identical from
  search through payment: the guest sees one Accommodation figure equal
  to ``guest_total`` plus "Prices include all fees". No fee, cleaning,
  tax or share line items.
- Fee base: the 6%+6% applies to the accommodation amount only — never
  to cleaning (per-stay, never multiplied by nights), pass-through
  charges, taxes, or deposits.
- The closed-alpha share waiver keeps the guest charge identical but
  moves the platform revenue to the host: the host is payable the full
  taxable amount (accommodation + cleaning + the collected guest 6%,
  no commission deducted). It never waives VAT.

All money is Decimal EGP at 2 decimal places — VAT on the taxable base
produces fractional piastres (e.g. 1,544 × 14% = 216.16).
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.config import settings

CENT = Decimal("0.01")
ONE = Decimal("1")


def money(value) -> Decimal:
    """Coerce an int/Decimal/numeric-string to a 2dp EGP amount."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def rate(pct: float) -> Decimal:
    return Decimal(str(pct))


@dataclass(frozen=True)
class BookingEconomics:
    """Internal economics of one booking. Guest surfaces must only ever
    render ``guest_total_egp`` as the Accommodation/Total amount — every
    other field is internal (host/admin/ledger)."""

    accommodation_egp: Decimal  # nightly prices after the applicable discount
    cleaning_fee_egp: Decimal
    taxable_amount_egp: Decimal  # accom + cleaning + host 6% + guest 6%
    vat_egp: Decimal  # 14% of the taxable amount — owed to VAT_PAYABLE
    guest_total_egp: Decimal  # taxable + VAT — the final price the guest pays
    platform_share_egp: Decimal  # StayOS revenue = host_side + guest_side
    host_net_egp: Decimal  # host payable = accommodation + cleaning
    # Internal 6% + 6% allocation — ledger/reporting only.
    host_side_share_egp: Decimal
    guest_side_share_egp: Decimal


def compute_vat(taxable_amount_egp) -> Decimal:
    """VAT on a taxable booking amount at the configured rate.

    VAT is a separate tax — it never depends on the platform share or the
    alpha waiver. Returns 0 for non-positive bases.
    """
    taxable = money(taxable_amount_egp)
    if taxable <= 0:
        return Decimal("0")
    return money(taxable * rate(settings.VAT_RATE_PCT))


def vat_inclusive_portion(amount_egp) -> Decimal:
    """VAT component of an amount that already includes VAT — used for
    VAT-inclusive custom offers. ``portion + taxable`` reconstructs the
    original amount exactly."""
    amount = money(amount_egp)
    if amount <= 0:
        return Decimal("0")
    return amount - money(amount / (ONE + rate(settings.VAT_RATE_PCT)))


def decompose_all_in_total(total_egp) -> tuple[Decimal, Decimal, Decimal]:
    """Split a final all-inclusive guest price into its canonical parts.

    Returns ``(taxable, vat, host_gross)``. Used for host custom offers
    (FD-07): the offered total IS the final guest price, so the host
    gross inside it is ``taxable / 1.06`` — the accommodation-plus-cleaning
    equivalent whose own guest-side 6% rebuilds the taxable amount. The
    host's NET is that gross minus their 6% commission, resolved by
    ``booking_economics`` downstream.
    """
    total = money(total_egp)
    vat = vat_inclusive_portion(total)
    taxable = total - vat
    host_gross = money(taxable / (ONE + rate(settings.GUEST_SIDE_SHARE_PCT)))
    return taxable, vat, host_gross


def compute_booking_economics(
    accommodation_egp,
    cleaning_fee_egp=0,
    *,
    platform_share_waived: bool = False,
) -> BookingEconomics:
    """Split a booking into VAT, platform share and host payable.

    Model B: the guest-side 6% is added to the guest's taxable amount;
    the host-side 6% is a commission deducted from the host payable.
    ``platform_share_waived`` implements the closed-alpha incentive — the
    guest charge is unchanged, StayOS revenue is zero, no commission is
    deducted and the collected guest 6% accrues to the host, who is
    payable the full taxable amount. VAT is a separate tax on the
    taxable amount and is never waived.
    """
    accom = money(accommodation_egp)
    cleaning = money(cleaning_fee_egp)
    if accom <= 0:
        host_side = guest_side = Decimal("0")
    else:
        host_side = money(accom * rate(settings.HOST_SIDE_SHARE_PCT))
        guest_side = money(accom * rate(settings.GUEST_SIDE_SHARE_PCT))
    taxable = accom + cleaning + guest_side
    vat = compute_vat(taxable)
    return BookingEconomics(
        accommodation_egp=accom,
        cleaning_fee_egp=cleaning,
        taxable_amount_egp=taxable,
        vat_egp=vat,
        guest_total_egp=taxable + vat,
        platform_share_egp=(
            Decimal("0") if platform_share_waived else host_side + guest_side
        ),
        host_net_egp=(
            taxable if platform_share_waived else accom + cleaning - host_side
        ),
        host_side_share_egp=host_side,
        guest_side_share_egp=guest_side,
    )


def to_minor_units(amount_egp) -> int:
    """EGP amount → Paymob minor units (piastres, 1/100 EGP)."""
    return int(
        (money(amount_egp) * 100).quantize(ONE, rounding=ROUND_HALF_UP)
    )


def all_inclusive_nightly_egp(
    base_price_egp, cleaning_fee_egp=0, min_nights: int = 1
) -> Decimal:
    """Per-night equivalent of the all-inclusive guest price.

    Cleaning is a per-stay amount, so for undated discovery it is
    amortized over the listing's minimum stay — the smallest booking the
    host allows. The result is mathematically truthful for a min-night
    stay and already incorporates cleaning, StayOS economics and VAT.
    """
    nights = max(int(min_nights or 1), 1)
    economics = compute_booking_economics(
        money(base_price_egp) * nights, cleaning_fee_egp
    )
    return money(economics.guest_total_egp / nights)


def guest_all_in_price_for_host_target(host_target_net_egp) -> Decimal:
    """Gross-up helper for the host earnings simulator: under Model B a
    host net target corresponds to ``accommodation = target / 0.94``
    (net of the 6% commission), whose guest price is
    ``accommodation × 1.06 × 1.14``."""
    target = money(host_target_net_egp)
    accom = money(target / (ONE - rate(settings.HOST_SIDE_SHARE_PCT)))
    taxable = money(accom * (ONE + rate(settings.GUEST_SIDE_SHARE_PCT)))
    return taxable + compute_vat(taxable)
