import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { GuestLayout } from "@/components/layouts";
import { HelpCenterClient } from "@/components/help/HelpCenterClient";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "helpCenter" });
  return { title: t("title"), description: t("subtitle") };
}

export default function HelpPage() {
  return (
    <GuestLayout>
      <Suspense fallback={null}>
        <HelpCenterClient />
      </Suspense>
    </GuestLayout>
  );
}
