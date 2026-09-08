import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { locales } from "../../i18n";
import { DocumentDirection } from "../../components/DocumentDirection";
import { Providers } from "../../components/providers";

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  const messages = await getMessages();
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} lang={locale}>
      <NextIntlClientProvider messages={messages}>
        <DocumentDirection locale={locale} dir={dir} />
        <Providers>{children}</Providers>
      </NextIntlClientProvider>
    </div>
  );
}
