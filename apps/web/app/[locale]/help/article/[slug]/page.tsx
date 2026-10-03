import type { Metadata } from "next";

import { GuestLayout } from "@/components/layouts";
import { HelpArticleClient } from "@/components/help/HelpArticleClient";
import { getArticle } from "@/lib/help";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const article = getArticle(slug);
  if (!article) return {};
  const loc = locale === "ar" ? "ar" : "en";
  return {
    title: article.title[loc],
    description: article.summary[loc],
  };
}

export default function HelpArticlePage({
  params: { slug },
}: {
  params: { slug: string };
}) {
  return (
    <GuestLayout>
      <HelpArticleClient slug={slug} />
    </GuestLayout>
  );
}
