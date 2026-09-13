"""Review constants — subrating categories and publication window.

Airbnb collects 6 fixed category ratings alongside the overall rating.
These are a deterministic, benchmark-grounded vocabulary (not an
invented business rule). Host-to-guest reviews do not use subratings
in Airbnb's model — only guest-to-host reviews do.
"""

from enum import StrEnum


class ReviewSubRating(StrEnum):
    """Airbnb's 6 fixed subrating categories for guest reviews."""

    CLEANLINESS = "cleanliness"
    ACCURACY = "accuracy"
    CHECK_IN = "check_in"
    COMMUNICATION = "communication"
    LOCATION = "location"
    VALUE = "value"


# All valid subrating keys
SUBRATING_KEYS = frozenset(s.value for s in ReviewSubRating)


# Airbnb's simultaneous-publication window: a submitted review is hidden
# until the other party also submits OR this many days pass.
PUBLICATION_WINDOW_DAYS = 14
