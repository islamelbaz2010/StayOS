import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuestLayout } from "@/components/layouts";
import { BlockRenderer } from "@/components/cms/BlockRenderer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface PublicBlock {
  id: string;
  block_type: string;
  sort_order: number;
  content: Record<string, unknown>;
}

interface PublicPage {
  slug: string;
  title: string | null;
  locale: string;
  seo: Record<string, unknown>;
  version: number;
  published_at: string | null;
  blocks: PublicBlock[];
}

async function fetchPage(
  slug: string,
  locale: string
): Promise<PublicPage | null> {
  try {
    const res = await fetch(
      `${API_URL}/content/pages/${encodeURIComponent(slug)}?lang=${locale}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return (await res.json()) as PublicPage;
  } catch {
    return null;
  }
}

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
