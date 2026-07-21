import { ReactNode } from "react";
import { notFound } from "next/navigation";

const locales = ["ar", "en"];

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale)) {
    notFound();
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir}>
      <body>
        {children}
      </body>
    </html>
  );
}
