import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuestLayout } from "@/components/layouts";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { fetchPublicPage } from "@/lib/cmsPublic";

const SLUG = "faq";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const page = await fetchPublicPage(SLUG, locale);
  if (!page) return {};
  const seo = page.seo ?? {};
  return {
    title: (seo.title as string) || page.title || undefined,
    description: (seo.description as string) || undefined,
    alternates: { canonical: (seo.canonical as string) || undefined },
  };
}

export default async function MarketingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await fetchPublicPage(SLUG, locale);
  if (!page) notFound();

  return (
    <GuestLayout>
      <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <BlockRenderer blocks={page.blocks} />
      </div>
    </GuestLayout>
  );
}
