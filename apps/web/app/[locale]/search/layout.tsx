import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "search" });
  return {
    title: t("title"),
  };
}

export default function SearchLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
