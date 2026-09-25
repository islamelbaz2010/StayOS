import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import messages from "@/messages/en.json";

let mockUser: Record<string, unknown> | null = null;

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/en/profile",
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: mockUser !== null,
    refreshUser: vi.fn(async () => {}),
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/queries/kyc", () => ({
  useKycStatus: () => ({ data: null }),
}));

let mockAccount: Record<string, unknown> | null = null;

vi.mock("@/lib/queries/account", () => ({
  useAccount: () => ({ data: mockAccount }),
  useUpdateAccount: () => ({ mutateAsync: vi.fn(async () => ({})) }),
}));

vi.mock("@/lib/api", () => ({
  api: {
    post: vi.fn(async () => ({ data: {} })),
    patch: vi.fn(async () => ({ data: {} })),
  },
}));

vi.mock("@/components/layouts", () => ({
  GuestLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/auth/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import ProfilePage from "./page";

const auth = messages.auth as Record<string, string>;

function renderProfile(user: Record<string, unknown>, account?: Record<string, unknown>) {
  mockUser = user;
  mockAccount = account ?? null;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale="en" messages={messages}>
        <ProfilePage />
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const baseUser = {
  id: "u1",
  display_name: "Test User",
  phone_number: "+20100000000",
  email: null,
  role: "guest",
  is_active: true,
  kyc_status: "verified",
  created_at: "2026-01-01T00:00:00Z",
};

describe("Profile password section state", () => {
  it("shows 'Set password' (no current-password field) when has_password is false", () => {
    renderProfile({ ...baseUser, has_password: false });
    expect(screen.getByText(auth.setPassword)).toBeInTheDocument();
    expect(screen.queryByText(auth.changePassword)).toBeNull();
    expect(screen.queryByLabelText(auth.currentPassword)).toBeNull();
  });

  it("shows 'Change password' + current-password field when has_password is true", () => {
    renderProfile({ ...baseUser, has_password: true });
    expect(screen.getByText(auth.changePassword)).toBeInTheDocument();
    expect(screen.queryByText(auth.setPassword)).toBeNull();
    expect(screen.getByLabelText(auth.currentPassword)).toBeInTheDocument();
  });

  it.each(["guest", "host", "admin", "staff"])(
    "applies the same rule for %s",
    (role) => {
      const { unmount } = renderProfile({ ...baseUser, role, has_password: false });
      expect(screen.getByText(auth.setPassword)).toBeInTheDocument();
      unmount();
      renderProfile({ ...baseUser, role, has_password: true });
      expect(screen.getByText(auth.changePassword)).toBeInTheDocument();
    }
  );

  it.each(["guest", "host", "admin", "staff", "field_staff"])(
    "renders a translated role badge for %s",
    (role) => {
      const roles = (messages.profile as { role: Record<string, string> }).role;
      renderProfile({ ...baseUser, role, staff_permissions: ["kyc"] });
      expect(screen.getByText(roles[role])).toBeInTheDocument();
    }
  );
});

describe("Profile — canonical personal information", () => {
  const profile = messages.profile as unknown as Record<string, string>;

  it("renders the account record fields read-only by default", () => {
    renderProfile(baseUser, {
      legal_name: "Ahmed Test",
      date_of_birth: "1990-01-02",
      address: { street: "12 Nile St", city: "Cairo", governorate: "Cairo" },
    });
    expect(screen.getByText(profile.personalInfo)).toBeInTheDocument();
    expect(screen.getByText("Ahmed Test")).toBeInTheDocument();
    expect(screen.getByText("1990-01-02")).toBeInTheDocument();
    expect(
      screen.getByText("12 Nile St, Cairo, Cairo")
    ).toBeInTheDocument();
  });

  it("locks legal name for a KYC-verified user", () => {
    renderProfile(baseUser, { legal_name: "Ahmed Test" });
    expect(screen.getByText(profile.legalNameLocked)).toBeInTheDocument();
  });

  it("shows Not set for empty account fields", () => {
    renderProfile({ ...baseUser, kyc_status: "unverified" }, {});
    expect(screen.getAllByText(profile.notSet).length).toBeGreaterThanOrEqual(3);
  });
});
