import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const apiGet = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
const storage = vi.hoisted(() => ({
  getSession: vi.fn(() => null),
  setSession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { get: apiGet, post: apiPost },
}));

vi.mock("@/lib/auth/storage", () => storage);

vi.mock("@/lib/auth/firebase", () => ({
  firebaseAuth: null,
  isFirebaseConfigured: false,
}));

import { AuthProvider } from "./context";
import { useAuth } from "./useAuth";

function Probe({ onReady }: { onReady: (auth: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onReady(auth);
  return <div data-testid="user">{auth.user?.id ?? "anon"}</div>;
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  let auth: ReturnType<typeof useAuth> | null = null;
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe onReady={(a) => (auth = a)} />
      </AuthProvider>
    </QueryClientProvider>
  );
  return { queryClient, getAuth: () => auth! };
}

describe("AuthProvider session switching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storage.getSession.mockReturnValue(null);
  });

  it("clears the entire query cache on logout", async () => {
    const { queryClient, getAuth } = setup();
    queryClient.setQueryData(["host-payments", undefined], [{ id: "p1" }]);
    queryClient.setQueryData(["guest-bookings"], [{ id: "b1" }]);
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0);

    await act(async () => {
      await getAuth().logout();
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(screen.getByTestId("user").textContent).toBe("anon");
  });

  it("clears the query cache on login so a previous account cannot leak", async () => {
    apiGet.mockResolvedValue({
      data: { id: "user-b", role: "guest", display_name: "B" },
    });
    const { queryClient, getAuth } = setup();
    // Stale data cached under account A.
    queryClient.setQueryData(["my-payments"], [{ id: "p-old" }]);
    queryClient.setQueryData(["admin-overview"], { users_total: 5 });

    await act(async () => {
      await getAuth().login({
        access_token: "tok",
        refresh_token: "ref",
        token_type: "bearer",
        expires_in: 3600,
      });
    });

    expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(screen.getByTestId("user").textContent).toBe("user-b");
  });
});
