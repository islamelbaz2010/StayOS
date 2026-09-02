"""Host Operating System domain.

This module aggregates existing services (bookings, payments, listings,
messages, reviews) into host-facing operations. It does NOT duplicate
business logic — it orchestrates the live ``bookings + payments`` path
through a host lens, with proper server-side authorization.
"""
