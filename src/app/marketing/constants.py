class LeadStatus:
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    INVITED = "INVITED"
    ONBOARDED = "ONBOARDED"
    NOT_A_FIT = "NOT_A_FIT"
    ALL = (NEW, CONTACTED, QUALIFIED, INVITED, ONBOARDED, NOT_A_FIT)


class LeadKind:
    HOST = "HOST"
    GUEST = "GUEST"


PROPERTY_TYPES = (
    "apartment", "villa", "chalet", "serviced_apartment",
    "hotel_resort", "other",
)

PROPERTY_READINESS = ("ready_now", "needs_furnishing", "under_renovation", "exploring")

ALLOWED_EVENTS = (
    "page_view", "lang_switch", "host_cta_click", "host_form_start",
    "host_form_submit", "host_form_success", "guest_cta_click",
    "guest_form_start", "guest_waitlist_submit", "guest_waitlist_success",
)
