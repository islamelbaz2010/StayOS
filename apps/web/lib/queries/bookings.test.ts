import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";

import { api } from "@/lib/api";
import { getHostBookingsPaginated } from "./bookings";

vi.mock("@/lib/auth/storage", () => ({
  getSession: vi.fn(() => null),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

describe("getHostBookingsPaginated — combined filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends status + unit_id + area + search together", async () => {
    let captured: InternalAxiosRequestConfig | null = null;
    api.defaults.adapter = (config) => {
      captured = config;
      return Promise.resolve({
        data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 0 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    };

    await getHostBookingsPaginated({
      status: "confirmed",
      unitId: "u-1",
      area: "Maadi",
      search: "guest",
      page: 2,
      limit: 10,
    });

    expect(captured).not.toBeNull();
    const params = (captured as unknown as InternalAxiosRequestConfig & {
      params: Record<string, unknown>;
    }).params;
    expect(params).toMatchObject({
      status: "confirmed",
      unit_id: "u-1",
      area: "Maadi",
      search: "guest",
      limit: 10,
      offset: 10,
    });
  });

  it("omits empty filters", async () => {
    let captured: InternalAxiosRequestConfig | null = null;
    api.defaults.adapter = (config) => {
      captured = config;
      return Promise.resolve({
        data: { items: [], total: 0, page: 1, page_size: 10, total_pages: 0 },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      });
    };

    await getHostBookingsPaginated({});

    const params = (
      captured as unknown as InternalAxiosRequestConfig & {
        params: Record<string, unknown>;
      }
    ).params;
    expect(params).not.toHaveProperty("status");
    expect(params).not.toHaveProperty("unit_id");
    expect(params).not.toHaveProperty("area");
    expect(params).not.toHaveProperty("search");
  });
});
