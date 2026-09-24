import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";

import en from "@/messages/en.json";
import ar from "@/messages/ar.json";

import { FeesIncludedPopup } from "./FeesIncludedNotice";

function renderPopup(messages: AbstractIntlMessages, locale: string) {
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <FeesIncludedPopup />
    </NextIntlClientProvider>
  );
}

describe("FeesIncludedPopup", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows the canonical English all-inclusive pricing copy", () => {
    renderPopup(en as never, "en");
    const fees = en.fees as Record<string, string>;
    expect(screen.getByText(fees.popupTitle)).toBeInTheDocument();
    expect(screen.getByText(fees.popupBody)).toBeInTheDocument();
    // Guest privacy: no internal fee allocation may leak into the copy.
    expect(fees.popupTitle + fees.popupBody).not.toMatch(/12%|6%|commission/i);
  });

  it("shows the canonical Arabic all-inclusive pricing copy", () => {
    renderPopup(ar as never, "ar");
    const fees = ar.fees as Record<string, string>;
    expect(screen.getByText(fees.popupTitle)).toBeInTheDocument();
    expect(screen.getByText(fees.popupBody)).toBeInTheDocument();
  });

  it("does not render after a previous dismissal", () => {
    window.localStorage.setItem("stayos_fees_notice_v1", "1");
    renderPopup(en as never, "en");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
