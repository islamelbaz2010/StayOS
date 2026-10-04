/**
 * Booking contract regression: the mobile request must match the backend
 * `BookingCreate` schema (unit_id, check_in, check_out, adults, children,
 * infants) — the failure mode this guards is a silently wrong payload or
 * endpoint.
 */

const store: Record<string, string> = {};
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    store[key] = value;
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    delete store[key];
  }),
}));

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react-native";
import { api } from "../api";
import { useCreateBooking } from "../hooks";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCreateBooking contract", () => {
  it("POSTs the backend BookingCreate shape to /bookings", async () => {
    const post = jest.spyOn(api, "post").mockResolvedValue({
      data: { id: "b1", status: "requested" },
    } as never);

    const { result } = renderHook(() => useCreateBooking(), { wrapper });
    await result.current.mutateAsync({
      unit_id: "unit-1",
      check_in: "2026-11-01",
      check_out: "2026-11-05",
      adults: 2,
      children: 1,
      infants: 0,
    });

    await waitFor(() => expect(post).toHaveBeenCalled());
    const [url, body] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe("/bookings");
    expect(Object.keys(body).sort()).toEqual(
      ["adults", "check_in", "check_out", "children", "infants", "unit_id"].sort()
    );
    post.mockRestore();
  });
});
