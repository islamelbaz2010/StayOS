import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";

import enMessages from "@/messages/en.json";
import arMessages from "@/messages/ar.json";

let mockUser: { role: string; kyc_status?: string } | null = null;
let mockKycStatus: {
  kyc_status: string;
  documents: unknown[];
  verification_mode: string;
  automated_available: boolean;
  required_sides: Record<string, string[]>;
} | undefined = undefined;
let sessionCalls = 0;

const REQUIRED_SIDES = {
  passport: ["front", "selfie"],
  national_id: ["front", "back", "selfie"],
  driving_license: ["front", "back", "selfie"],
  residence_permit: ["front", "back", "selfie"],
};

vi.mock("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/kyc",
}));

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    isAuthenticated: mockUser !== null,
    refreshUser: vi.fn(async () => {}),
    logout: vi.fn(async () => {}),
  }),
}));

vi.mock("@/lib/queries/kyc", () => ({
  useKycStatus: () => ({ data: mockKycStatus, isLoading: false }),
  useInitiateKyc: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSubmitKyc: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpgradeRole: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useKycVerificationSession: () => ({
    mutateAsync: vi.fn(async () => {
      sessionCalls += 1;
      return { mode: "manual" };
    }),
    isPending: false,
  }),
}));

import { KycUpload } from "./KycUpload";

function renderWith(ui: React.ReactNode, messages = enMessages, locale = "en") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {ui}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}

const t = enMessages.kyc;
const at = arMessages.kyc;

function manualStatus(kyc_status = "unverified") {
  return {
    kyc_status,
    documents: [],
    verification_mode: "manual",
    automated_available: false,
    required_sides: REQUIRED_SIDES,
  };
}

describe("KycUpload — manual fallback", () => {
  beforeEach(() => {
    mockUser = { role: "guest", kyc_status: "unverified" };
    mockKycStatus = manualStatus();
    sessionCalls = 0;
  });

  it("renders a document-type selector before any upload slots", () => {
    renderWith(<KycUpload />);
    const select = screen.getByLabelText(t.documentType);
    expect(select).toBeInTheDocument();
    // No image slots until the user picks a document type.
    expect(screen.queryByText(t.passportPhotoPage)).not.toBeInTheDocument();
    expect(screen.queryByText(t.selfie)).not.toBeInTheDocument();
    for (const type of [
      "passport",
      "national_id",
      "driving_license",
      "residence_permit",
    ] as const) {
      expect(
        screen.getByRole("option", { name: t.docTypes[type] })
      ).toBeInTheDocument();
    }
  });

  it("passport shows photo page + selfie, no fake back side", () => {
    renderWith(<KycUpload />);
    fireEvent.change(screen.getByLabelText(t.documentType), {
      target: { value: "passport" },
    });
    expect(screen.getAllByText(t.passportPhotoPage).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.selfie).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.documentBack)).not.toBeInTheDocument();
  });

  it("national ID shows front + back + selfie", () => {
    renderWith(<KycUpload />);
    fireEvent.change(screen.getByLabelText(t.documentType), {
      target: { value: "national_id" },
    });
    expect(screen.getAllByText(t.documentFront).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.documentBack).length).toBeGreaterThan(0);
    expect(screen.getAllByText(t.selfie).length).toBeGreaterThan(0);
  });

  it("submit without required photos shows the missing-images error", () => {
    renderWith(<KycUpload />);
    fireEvent.change(screen.getByLabelText(t.documentType), {
      target: { value: "national_id" },
    });
    fireEvent.click(screen.getByRole("button", { name: t.submit }));
    expect(screen.getByRole("alert")).toHaveTextContent(t.bothRequired);
  });

  it("renders in Arabic", () => {
    renderWith(<KycUpload />, arMessages, "ar");
    const select = screen.getByLabelText(at.documentType);
    fireEvent.change(select, { target: { value: "passport" } });
    expect(screen.getAllByText(at.passportPhotoPage).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("option", { name: at.docTypes.residence_permit })
    ).toBeInTheDocument();
  });
});

describe("KycUpload — automated mode", () => {
  beforeEach(() => {
    mockUser = { role: "guest", kyc_status: "unverified" };
    mockKycStatus = {
      kyc_status: "unverified",
      documents: [],
      verification_mode: "automated_fallback",
      automated_available: true,
      required_sides: REQUIRED_SIDES,
    };
    sessionCalls = 0;
  });

  it("shows a start CTA and does not create a session before click", () => {
    renderWith(<KycUpload />);
    const cta = screen.getByRole("button", { name: t.startVerification });
    expect(cta).toBeInTheDocument();
    expect(screen.queryByLabelText(t.documentType)).not.toBeInTheDocument();
    expect(sessionCalls).toBe(0);
  });

  it("offers the manual upload escape hatch", () => {
    renderWith(<KycUpload />);
    const link = screen.getByRole("button", { name: t.manualInstead });
    fireEvent.click(link);
    // Falls back to the manual form with the document-type selector.
    expect(screen.getByLabelText(t.documentType)).toBeInTheDocument();
  });
});

describe("KycUpload — status branches", () => {
  beforeEach(() => {
    mockUser = { role: "guest", kyc_status: "unverified" };
    sessionCalls = 0;
  });

  it("retry_required shows friendly retry copy, not provider internals", () => {
    mockKycStatus = manualStatus("retry_required");
    renderWith(<KycUpload />);
    expect(screen.getByText(t.retryTitle)).toBeInTheDocument();
    expect(screen.getByText(t.retryMessage)).toBeInTheDocument();
  });

  it("manual_review shows the additional-review message", () => {
    mockKycStatus = manualStatus("manual_review");
    renderWith(<KycUpload />);
    expect(screen.getByText(t.manualReviewMessage)).toBeInTheDocument();
  });

  it("verified with a verified document shows the success state", () => {
    mockUser = { role: "host", kyc_status: "verified" };
    mockKycStatus = {
      ...manualStatus("verified"),
      documents: [{ status: "verified" }],
    };
    renderWith(<KycUpload />);
    expect(screen.getByText(t.verifiedTitle)).toBeInTheDocument();
  });
});

describe("KYC copy is globally neutral", () => {
  it("no Egypt-specific or universal national-ID language", () => {
    const genericKeys = [
      "pageSubtitle",
      "step1",
      "step2",
      "step3",
      "autoVerifyTitle",
      "autoVerifyHint",
      "bothRequired",
    ] as const;
    for (const key of genericKeys) {
      expect(t[key].toLowerCase()).not.toContain("national id");
      expect(t[key]).not.toContain("Egypt");
      expect(at[key]).not.toContain("بطاقتك الشخصية");
      expect(at[key]).not.toContain("مصر");
    }
  });
});
