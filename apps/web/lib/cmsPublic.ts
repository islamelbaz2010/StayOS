const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface PublicBlock {
  id: string;
  block_type: string;
  sort_order: number;
  content: Record<string, unknown>;
}

export interface PublicPage {
  slug: string;
  title: string | null;
  locale: string;
  seo: Record<string, unknown>;
  version: number;
  published_at: string | null;
  blocks: PublicBlock[];
}

export async function fetchPublicPage(
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
