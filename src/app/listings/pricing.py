from datetime import date, timedelta

from .models import CalendarRule, UnitListing


def is_mena_weekend(day: date) -> bool:
    """Friday (4) and Saturday (5) are the common weekend in MENA markets."""
    return day.weekday() in (4, 5)


def find_rule_for_day(
    rules: list[CalendarRule], day: date
) -> CalendarRule | None:
    """Return the calendar rule that covers the given day, if any."""
    for rule in rules:
        if rule.date_from <= day < rule.date_to:
            return rule
    return None


def get_day_price(
    listing: UnitListing,
    rule: CalendarRule | None,
    day: date,
) -> int:
    """Compute the price for a single night using overrides and weekend multipliers."""
    price = listing.base_price_egp
    if rule is not None and rule.price_override is not None:
        price = rule.price_override
    if is_mena_weekend(day):
        price = int(round(price * float(listing.weekend_mult)))
    return price


def compute_subtotal(
    listing: UnitListing,
    rules: list[CalendarRule],
    check_in: date,
    check_out: date,
) -> int:
    """Sum nightly prices over the requested date range."""
    total = 0
    day = check_in
    while day < check_out:
        rule = find_rule_for_day(rules, day)
        total += get_day_price(listing, rule, day)
        day += timedelta(days=1)
    return total
