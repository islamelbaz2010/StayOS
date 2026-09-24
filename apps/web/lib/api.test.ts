import { describe, it, expect, vi, beforeEach } from "vitest";
import type { InternalAxiosRequestConfig } from "axios";

import { clearSession } from "@/lib/auth/storage";
import { api } from "./api";
import { getApiErrorMessage } from "./utils";

vi.mock("@/lib/auth/storage", () => ({
  getSession: vi.fn(() => null),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

function reject401(config: InternalAxiosRequestConfig) {
  return Promise.reject(
    Object.assign(new Error("unauthorized"), {
      config,
      response: { status: 401, data: { error: { message: "unauthorized" } } },
      isAxiosError: true,
    })
  );
}

describe("api 401 interceptor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.defaults.adapter = reject401;
  });

  it.each([
    "/auth/login",
    "/auth/register",
    "/auth/password/forgot",
    "/auth/password/reset",
  ])(
    "does not clear the session or redirect on a %s 401",
    async (path) => {
      await expect(api.post(path, {})).rejects.toMatchObject({
        response: { status: 401 },
      });
      expect(clearSession).not.toHaveBeenCalled();
    }
  );

  it("clears the session on a 401 from a protected endpoint", async () => {
    await expect(api.get("/bookings")).rejects.toBeTruthy();
    expect(clearSession).toHaveBeenCalled();
  });
});

describe("getApiErrorMessage", () => {
  const storageError = {
    response: {
      status: 503,
      data: {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            "Profile photo storage is not configured (missing: S3_LISTINGS_BUCKET, AWS_REGION)",
        },
      },
    },
  };

  it("hides infrastructure diagnostics behind the unavailable copy on 503", () => {
    const msg = getApiErrorMessage(storageError, "Failed", "Unavailable");
    expect(msg).toBe("Unavailable");
    expect(msg).not.toContain("S3_LISTINGS_BUCKET");
  });

  it("falls back to the generic copy on 503 when no unavailable copy given", () => {
    expect(getApiErrorMessage(storageError, "Failed")).toBe("Failed");
  });

  it("surfaces ordinary backend error messages", () => {
    const err = {
      response: {
        status: 422,
        data: { error: { message: "File too large" } },
      },
    };
    expect(getApiErrorMessage(err, "Failed", "Unavailable")).toBe(
      "File too large"
    );
  });
});
