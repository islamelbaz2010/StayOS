import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuestLayout } from "@/components/layouts";
import { BlockRenderer } from "@/components/cms/BlockRenderer";

import { fetchPublicPage as fetchPage } from "@/lib/cmsPublic";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const page = await fetchPage(slug, locale);
  if (!page) return {};
  const seo = page.seo ?? {};
  const robots =
    typeof seo.robots === "string" && seo.robots === "noindex"
      ? { index: false }
      : undefined;
  return {
    title: (seo.title as string) || page.title || page.slug,
    description: (seo.description as string) || undefined,
    alternates: {
      canonical: (seo.canonical as string) || undefined,
    },
    openGraph: {
      title: (seo.og_title as string) || (seo.title as string) || undefined,
      description:
        (seo.og_description as string) ||
        (seo.description as string) ||
        undefined,
    },
    robots,
  };
}

export default async function CmsPublicPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const page = await fetchPage(slug, locale);
  if (!page) notFound();

  return (
    <GuestLayout>
      <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <BlockRenderer blocks={page.blocks} />
      </div>
    </GuestLayout>
  );
}
