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

let mockDays: Day[] = [];

vi.mock("@/lib/queries/listings", () => ({
  useListingAvailability: () => ({ data: { days: mockDays } }),
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

  it("resets the pending range when the checkout crosses a blocked day", () => {
    mockDays = buildDays(62, [10]);
    const onSelect = renderCalendar(dayStr(5), "");

    fireEvent.click(screen.getAllByLabelText(dayStr(12))[0]);
    expect(onSelect).toHaveBeenLastCalledWith(dayStr(12), "");
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
});
