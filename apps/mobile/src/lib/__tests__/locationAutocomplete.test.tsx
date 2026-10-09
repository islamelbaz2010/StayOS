/**
 * Location-autocomplete contract: the hook must hit the real
 * /locations/autocomplete endpoint with the supported `q`/`limit` params,
 * stay disabled below the minimum query length, and keep each query's
 * results under its own cache key so a slow earlier response can never
 * overwrite newer input.
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
import { useLocationAutocomplete } from "../hooks";

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const CAIRO_SUGGESTIONS = {
  suggestions: [
    {
      canonical_name_en: "New Cairo",
      canonical_name_ar: "القاهرة الجديدة",
      city: "Cairo",
      governorate: "Cairo",
      lat: 30.0,
      lng: 31.5,
    },
  ],
};

describe("useLocationAutocomplete", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("requests /locations/autocomplete with q and limit", async () => {
    const get = jest
      .spyOn(api, "get")
      .mockResolvedValue({ data: CAIRO_SUGGESTIONS } as never);

    const { result } = renderHook(() => useLocationAutocomplete("cai"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    expect(get).toHaveBeenCalledWith("/locations/autocomplete", {
      params: { q: "cai", limit: 8 },
    });
    expect(result.current.data?.[0].canonical_name_en).toBe("New Cairo");
  });

  it("does not request below the two-character minimum", async () => {
    const get = jest.spyOn(api, "get");
    const { result } = renderHook(() => useLocationAutocomplete("c"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.fetchStatus).toBe("idle"));
    expect(get).not.toHaveBeenCalled();
  });

  it("keeps each query under its own cache key (no stale overwrites)", async () => {
    const get = jest.spyOn(api, "get").mockImplementation(async (url, cfg) => {
      const q = (cfg as { params: { q: string } }).params.q;
      if (q === "cai") return { data: CAIRO_SUGGESTIONS } as never;
      return { data: { suggestions: [] } } as never;
    });

    // Typing forward changes the debounced value → a new queryKey. The
    // previous query's response is stored under "ca" and can never land
    // in the "cai" result.
    const first = renderHook(() => useLocationAutocomplete("ca"), { wrapper });
    await waitFor(() => expect(first.result.current.data).toEqual([]));

    const second = renderHook(() => useLocationAutocomplete("cai"), { wrapper });
    await waitFor(() => expect(second.result.current.data).toHaveLength(1));

    expect(first.result.current.data).toEqual([]);
    expect(second.result.current.data?.[0].canonical_name_en).toBe("New Cairo");
    expect(get).toHaveBeenCalledTimes(2);
  });
});
