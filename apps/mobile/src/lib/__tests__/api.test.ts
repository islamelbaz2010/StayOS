/**
 * Regression tests for the auth-state propagation defect:
 * login/logout must change in-memory auth state immediately so the
 * app re-renders without a restart.
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

import {
  apiErrorMessage,
  clearTokens,
  hasTokens,
  setTokens,
  subscribeTokenChanges,
} from "../api";

beforeEach(() => {
  for (const key of Object.keys(store)) delete store[key];
});

describe("token state pub/sub", () => {
  it("notifies subscribers when tokens are set (login)", async () => {
    const listener = jest.fn();
    const unsubscribe = subscribeTokenChanges(listener);

    await setTokens("access-1", "refresh-1");

    expect(hasTokens()).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("notifies subscribers when tokens are cleared (logout)", async () => {
    await setTokens("access-1", "refresh-1");
    const listener = jest.fn();
    const unsubscribe = subscribeTokenChanges(listener);

    await clearTokens();

    expect(hasTokens()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("does not notify when state does not change", async () => {
    await setTokens("access-1", "refresh-1");
    const listener = jest.fn();
    subscribeTokenChanges(listener);

    await setTokens("access-2", "refresh-2");

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("apiErrorMessage", () => {
  const axiosError = (data: unknown, status = 400) => ({
    isAxiosError: true,
    response: { status, data },
  });

  it("reads the backend error envelope message", () => {
    const err = axiosError({ error: { code: "X", message: "Dates unavailable" } });
    // axios.isAxiosError checks a real flag — assert via a real-ish object
    const axios = jest.requireActual("axios").default;
    const real = new axios.AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: { error: { code: "X", message: "Dates unavailable" } },
    } as never);
    expect(apiErrorMessage(real)).toBe("Dates unavailable");
    void err;
  });

  it("prefers message_ar for the ar locale", () => {
    const axios = jest.requireActual("axios").default;
    const real = new axios.AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: {
        error: { code: "X", message: "Dates unavailable", message_ar: "التواريخ غير متاحة" },
      },
    } as never);
    expect(apiErrorMessage(real, "ar")).toBe("التواريخ غير متاحة");
    expect(apiErrorMessage(real, "en")).toBe("Dates unavailable");
  });

  it("falls back to detail then null", () => {
    const axios = jest.requireActual("axios").default;
    const real = new axios.AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: { detail: "plain detail" },
    } as never);
    expect(apiErrorMessage(real)).toBe("plain detail");
    expect(apiErrorMessage(new Error("nope"))).toBeNull();
  });
});
