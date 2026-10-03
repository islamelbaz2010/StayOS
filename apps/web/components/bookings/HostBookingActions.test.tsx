import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-intl")>();
  return { ...actual, useLocale: () => "en" };
});

let mockUser: { role: string } | null = { role: "host" };

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/queries/bookings", () => ({
  useCheckOut: () => ({ mutate: vi.fn(), isPending: false }),
  useCompleteBooking: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateBooking: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

import { HostBookingActions } from "./HostBookingActions";
import type { BookingResponse } from "@/lib/queries/bookings";

const t = messages.hostBookings;

function renderWith(ui: React.ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <NextIntlClientProvider locale="en" messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

function makeBooking(overrides: Partial<BookingResponse> = {}): BookingResponse {
  return {
    id: "b-1",
    unit_id: "u-1",
    guest_id: "g-1",
    status: "confirmed",
    check_in: "2026-10-10",
    check_out: "2026-10-13",
    adults: 2,
    children: 0,
    infants: 0,
    unit_title: "Luxury Villa in Marassi",
    unit_cover_image: null,
    guest_name: "Guest",
    permission_scope: "owner",
    stay_phase: "upcoming",
    checked_in_at: null,
    checked_out_at: null,
    ...overrides,
  } as BookingResponse;
}

describe("HostBookingActions — action matrix", () => {
  it("confirmed booking: no Check-in, no Cancel for the host", () => {
    renderWith(
      <HostBookingActions booking={makeBooking()} onSuccess={vi.fn()} />
    );
    expect(screen.getByText(t.confirmedMessage)).toBeTruthy();
    expect(screen.queryByText(t.checkIn)).toBeNull();
    expect(screen.queryByText(t.cancel)).toBeNull();
    expect(screen.queryByText(t.checkOut)).toBeNull();
  });

  it("checked-in confirmed booking shows Check-out (host operational)", () => {
    renderWith(
      <HostBookingActions
        booking={makeBooking({ checked_in_at: "2026-10-10T15:00:00Z" })}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText(t.checkOut)).toBeTruthy();
    expect(screen.queryByText(t.cancel)).toBeNull();
  });

  it("requested booking shows Accept + Reject but never Cancel", () => {
    renderWith(
      <HostBookingActions
        booking={makeBooking({ status: "requested" })}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText(t.accept)).toBeTruthy();
    expect(screen.getByText(t.reject)).toBeTruthy();
    expect(screen.queryByText(t.cancel)).toBeNull();
    expect(screen.queryByText(t.confirmCancel)).toBeNull();
  });

  it("accepted booking shows no cancel affordance for the host", () => {
    renderWith(
      <HostBookingActions
        booking={makeBooking({ status: "accepted" })}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.queryByText(t.cancel)).toBeNull();
  });

  it("calendar_only co-host gets the read-only state", () => {
    renderWith(
      <HostBookingActions
        booking={makeBooking({ permission_scope: "calendar_only" })}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.getByText(t.readOnlyScope)).toBeTruthy();
  });

  it("terminal statuses render a single status message", () => {
    renderWith(
      <HostBookingActions
        booking={makeBooking({ status: "cancelled" })}
        onSuccess={vi.fn()}
      />
    );
    expect(screen.queryByText(t.cancel)).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
