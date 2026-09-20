import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

interface Day {
  date: string;
  status: string;
  price_egp: number;
}

let mockDays: Day[] | null = [];
let lastQuery: { checkIn: string; checkOut: string } | null = null;

vi.mock("@/lib/queries/listings", () => ({
  useListingAvailability: (_unitId: string, checkIn: string, checkOut: string) => {
    lastQuery = { checkIn, checkOut };
    return { data: { days: mockDays ?? buildRangeDays(checkIn, checkOut) } };
  },
}));

import { AvailabilityCalendar } from "./AvailabilityCalendar";

function dayStr(offset: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function buildDays(count: number, blocked: number[] = []): Day[] {
  const days: Day[] = [];
  for (let i = 0; i < count; i++) {
    days.push({
      date: dayStr(i),
      status: blocked.includes(i) ? "BOOKED" : "AVAILABLE",
      price_egp: 1000,
    });
  }
  return days;
}

// Builds AVAILABLE days for an arbitrary [start, end) ISO window — mimics
// the API for windows beyond the current month.
function buildRangeDays(startStr: string, endStr: string): Day[] {
  const days: Day[] = [];
  const cur = new Date(`${startStr}T00:00:00`);
  const end = new Date(`${endStr}T00:00:00`);
  while (cur < end) {
    days.push({
      date: `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`,
      status: "AVAILABLE",
      price_egp: 1000,
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function renderCalendar(checkIn: string, checkOut: string, onSelect = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <AvailabilityCalendar
          unitId="unit-1"
          checkIn={checkIn}
          checkOut={checkOut}
          onSelect={onSelect}
        />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
  return onSelect;
}

describe("AvailabilityCalendar", () => {
  beforeEach(() => {
    cleanup();
    mockDays = buildDays(62);
  });

  it("selects a check-in then completes the range on a later click", () => {
    const onSelect = renderCalendar("", "");

    fireEvent.click(screen.getAllByLabelText(dayStr(3))[0]);
    expect(onSelect).toHaveBeenLastCalledWith(dayStr(3), "");

    cleanup();
    onSelect.mockClear();
    renderCalendar(dayStr(3), "", onSelect);

    fireEvent.click(screen.getAllByLabelText(dayStr(6))[0]);
    expect(onSelect).toHaveBeenLastCalledWith(dayStr(3), dayStr(6));
  });

  it("completes the range when the checkout crosses a blocked day (panel reports it)", () => {
    // Regression: the calendar used to silently reset the pending check-in
    // when the range crossed a blocked day — users saw their selection vanish
    // with no feedback. Now the range is completed so BookingPanel can show
    // the "dates unavailable" error and keep submit disabled.
    mockDays = buildDays(62, [10]);
    const onSelect = renderCalendar(dayStr(5), "");

    fireEvent.click(screen.getAllByLabelText(dayStr(12))[0]);
    expect(onSelect).toHaveBeenLastCalledWith(dayStr(5), dayStr(12));
  });

  it("ignores clicks on unavailable and past days", () => {
    mockDays = buildDays(62, [10]);
    const onSelect = renderCalendar("", "");

    fireEvent.click(screen.getAllByLabelText(dayStr(10))[0]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("navigates forward and backward between months", () => {
    renderCalendar("", "");

    const prev = screen.getByLabelText("Previous month");
    const next = screen.getByLabelText("Next month");
    expect(prev).toBeDisabled();
    expect(next).not.toBeDisabled();

    const firstMonthLabel = screen.getAllByText(/\d{4}/)[0].textContent;
    fireEvent.click(next);
    const secondMonthLabel = screen.getAllByText(/\d{4}/)[0].textContent;
    expect(secondMonthLabel).not.toBe(firstMonthLabel);
    expect(prev).not.toBeDisabled();

    fireEvent.click(prev);
    expect(screen.getAllByText(/\d{4}/)[0].textContent).toBe(firstMonthLabel);
  });

  it("does not mark out-of-window days as unavailable", () => {
    // Only a short window loaded: days beyond it must not be struck through.
    mockDays = buildDays(5);
    renderCalendar("", "");

    const beyondWindow = screen.getAllByLabelText(dayStr(20))[0];
    expect(beyondWindow).toBeDisabled();
    expect(beyondWindow.className).not.toContain("line-through");

    const available = screen.getAllByLabelText(dayStr(2))[0];
    expect(available).not.toBeDisabled();
  });

  it("clears the selection via Clear dates", () => {
    const onSelect = renderCalendar(dayStr(3), dayStr(6));
    fireEvent.click(screen.getByText("Clear dates"));
    expect(onSelect).toHaveBeenCalledWith("", "");
  });

  it("keeps Next month enabled past the first 90 days and slides the fetch window", () => {
    renderCalendar("", "");
    const next = screen.getByLabelText("Next month");

    // Regression: navigation was previously capped at the ~90-day API window,
    // making any date further out unreachable even though the API allows it.
    for (let i = 0; i < 4; i++) fireEvent.click(next);
    expect(next).not.toBeDisabled();

    // The requested window must slide forward — anchoring at today would
    // exceed the API's 90-day per-request limit and fail.
    const spanDays =
      (new Date(`${lastQuery!.checkOut}T00:00:00`).getTime() -
        new Date(`${lastQuery!.checkIn}T00:00:00`).getTime()) /
      86400000;
    expect(spanDays).toBeLessThanOrEqual(90);
    expect(lastQuery!.checkIn > dayStr(90)).toBe(true);
  });

  it("shows no per-day price labels before a check-in is selected", () => {
    // Founder requirement: date numbers only until the user starts selecting.
    renderCalendar("", "");
    expect(screen.queryAllByText("1,000")).toHaveLength(0);
    // date numbers still render
    expect(screen.getAllByLabelText(dayStr(5)).length).toBeGreaterThan(0);
  });

  it("shows price labels only while a check-out is pending", () => {
    renderCalendar(dayStr(3), "");
    expect(screen.getAllByText("1,000").length).toBeGreaterThan(0);

    cleanup();
    renderCalendar(dayStr(3), dayStr(6));
    expect(screen.queryAllByText("1,000")).toHaveLength(0);
  });

  it("completes a range whose endpoints are in different months", () => {
    // null => mock derives AVAILABLE days from whatever window is requested.
    mockDays = null;
    const onSelect = renderCalendar(dayStr(3), "");

    const next = screen.getByLabelText("Next month");
    fireEvent.click(next);
    fireEvent.click(next);

    const target = screen.getAllByLabelText(dayStr(70))[0];
    fireEvent.click(target);
    expect(onSelect).toHaveBeenLastCalledWith(dayStr(3), dayStr(70));
  });
});
