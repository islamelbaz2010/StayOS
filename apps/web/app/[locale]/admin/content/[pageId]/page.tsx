"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import {
  CMS_BLOCK_TYPES,
  useCmsPage,
  useCmsRevisions,
  useCreateCmsBlock,
  useDeleteCmsBlock,
  usePublishCmsPage,
  useRestoreCmsRevision,
  useUnpublishCmsPage,
  useUpdateCmsBlock,
  useUpdateCmsPage,
  type CmsBlock,
} from "@/lib/queries/cms";
import { cn, getApiErrorMessage } from "@/lib/utils";

const BLOCK_TEMPLATE: Record<string, Record<string, unknown>> = {
  hero: { en: { heading: "", subheading: "", cta_label: "", cta_href: "" } },
  heading_text: { en: { heading: "", body: "" } },
  image_text: { en: { heading: "", body: "", image_url: "", alt: "" } },
  feature_cards: {
    en: { heading: "", cards: [{ title: "", body: "" }] },
  },
  cta: { en: { heading: "", cta_label: "", cta_href: "" } },
  faq: { en: { heading: "", items: [{ question: "", answer: "" }] } },
  testimonial: { en: { items: [{ quote: "", author: "" }] } },
  banner: { en: { text: "", link_label: "", link_href: "" } },
  gallery: { en: { images: [{ url: "", alt: "" }] } },
  rich_text: { en: { body: "" } },
  announcement: { en: { text: "", link_label: "", link_href: "" } },
};

interface PreviewBlock {
  id: string;
  block_type: string;
  content: Record<string, unknown>;
}

function BlockEditor({
  block,
  pageId,
}: {
  block: CmsBlock;
  pageId: string;
}) {
  const updateBlock = useUpdateCmsBlock(pageId);
  const deleteBlock = useDeleteCmsBlock(pageId);
  const [json, setJson] = useState(JSON.stringify(block.content, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJson(JSON.stringify(block.content, null, 2));
  }, [block.content]);

  const save = async () => {
    setError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json);
    } catch {
      setError("Invalid JSON — check the content payload.");
      return;
    }
    try {
      await updateBlock.mutateAsync({ blockId: block.id, content: parsed });
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save block"));
    }
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={block.block_type}
          onChange={(e) =>
            updateBlock.mutate({
              blockId: block.id,
              block_type: e.target.value,
            })
          }
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          {CMS_BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          Order
          <input
            type="number"
            defaultValue={block.sort_order}
            onBlur={(e) =>
              updateBlock.mutate({
                blockId: block.id,
                sort_order: Number(e.target.value) || 0,
              })
            }
            className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-neutral-600">
          <input
            type="checkbox"
            checked={block.enabled}
            onChange={(e) =>
              updateBlock.mutate({
                blockId: block.id,
                enabled: e.target.checked,
              })
            }
          />
          Enabled
        </label>
        <div className="ms-auto flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={updateBlock.isPending}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => deleteBlock.mutate(block.id)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={8}
        dir="ltr"
        spellCheck={false}
        className="mt-3 w-full rounded-md border border-neutral-300 p-3 font-mono text-xs"
      />
      <p className="mt-1 text-xs text-neutral-400">
        Localized content — keys are {"\"en\""} / {"\"ar\""}. Disabled blocks
        are never shown publicly.
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminContentEditorPage() {
  const { pageId, locale } = useParams<{
    pageId: string;
    locale: string;
  }>();

  const { data: page, isPending, isError, refetch } = useCmsPage(pageId);
  const { data: revisions } = useCmsRevisions(pageId);
  const updatePage = useUpdateCmsPage(pageId);
  const publishPage = usePublishCmsPage(pageId);
  const unpublishPage = useUnpublishCmsPage(pageId);
  const restoreRevision = useRestoreCmsRevision(pageId);
  const createBlock = useCreateCmsBlock(pageId);

  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [seoJson, setSeoJson] = useState("{}");
  const [newBlockType, setNewBlockType] = useState("hero");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    title: string | null;
    blocks: PreviewBlock[];
  } | null>(null);
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    if (page) {
      setTitleEn(page.title_en ?? "");
      setTitleAr(page.title_ar ?? "");
      setSeoJson(JSON.stringify(page.seo ?? {}, null, 2));
    }
  }, [page]);

  const saveMeta = async () => {
    setError(null);
    let seo: Record<string, unknown>;
    try {
      seo = JSON.parse(seoJson);
    } catch {
      setError("SEO payload is not valid JSON.");
      return;
    }
    try {
      await updatePage.mutateAsync({
        title_en: titleEn.trim() || undefined,
        title_ar: titleAr.trim() || undefined,
        seo,
      });
      setNotice("Saved.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save"));
    }
  };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setError(null);
    setNotice(null);
    try {
      await fn();
      setNotice(ok);
    } catch (err) {
      setError(getApiErrorMessage(err, "Action failed"));
    }
  };

  const loadPreview = async () => {
    setError(null);
    try {
      const { data } = await api.get(
        `/admin/cms/pages/${pageId}/preview`,
        { params: { lang: previewLang } }
      );
      setPreview(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Preview failed"));
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {isError && (
            <ErrorState onRetry={() => refetch()} />
          )}
          {isPending || !page ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-brand-900">
                    /{page.slug}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600">
                    Status:{" "}
                    <span className="font-medium">{page.status}</span> · v
                    {page.version}
                    {page.status === "published" && (
                      <>
                        {" "}
                        ·{" "}
                        <a
                          href={`/${locale}/p/${page.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-700 underline"
                        >
                          View live
                        </a>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {page.status === "published" ? (
                    <button
                      type="button"
                      onClick={() =>
                        run(() => unpublishPage.mutateAsync(undefined), "Unpublished")
                      }
                      className="rounded-md border border-amber-300 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        run(
                          () => publishPage.mutateAsync(undefined),
                          "Published — now live publicly"
                        )
                      }
                      className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              {notice && (
                <p className="mb-4 rounded-md bg-green-50 px-4 py-2 text-sm text-green-700">
                  {notice}
                </p>
              )}

              <div className="rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Page metadata
                </h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Title (English)"
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="العنوان (العربية)"
                    dir="rtl"
                    className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
                  />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-neutral-800">
                  SEO (per-locale object + canonical/robots/og_image_key)
                </h3>
                <textarea
                  value={seoJson}
                  onChange={(e) => setSeoJson(e.target.value)}
                  rows={6}
                  dir="ltr"
                  spellCheck={false}
                  className="mt-2 w-full rounded-md border border-neutral-300 p-3 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={saveMeta}
                  disabled={updatePage.isPending}
                  className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Save metadata
                </button>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-neutral-800">
                  Blocks
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={newBlockType}
                    onChange={(e) => setNewBlockType(e.target.value)}
                    className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                  >
                    {CMS_BLOCK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      run(
                        () =>
                          createBlock.mutateAsync({
                            block_type: newBlockType,
                            content:
                              BLOCK_TEMPLATE[newBlockType] ?? { en: {} },
                          }),
                        "Block added"
                      )
                    }
                    className="rounded-md border border-brand-300 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                  >
                    Add block
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {page.blocks.map((block) => (
                  <BlockEditor
                    key={block.id}
                    block={block}
                    pageId={pageId}
                  />
                ))}
                {page.blocks.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    No blocks yet — add one above.
                  </p>
                )}
              </div>

              <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-800">
                    Preview (draft working copy — not public)
                  </h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={previewLang}
                      onChange={(e) =>
                        setPreviewLang(e.target.value as "en" | "ar")
                      }
                      className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                    <button
                      type="button"
                      onClick={loadPreview}
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
                    >
                      Load preview
                    </button>
                  </div>
                </div>
                {preview && (
                  <div
                    className={cn(
                      "mt-4 rounded-lg border border-dashed border-neutral-300 p-4",
                      previewLang === "ar" && "text-right"
                    )}
                    dir={previewLang === "ar" ? "rtl" : "ltr"}
                  >
                    <BlockRenderer blocks={preview.blocks} />
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-lg border border-neutral-200 bg-white p-4">
                <h2 className="text-sm font-semibold text-neutral-800">
                  Revision history
                </h2>
                <ul className="mt-3 divide-y divide-neutral-100 text-sm">
                  {(revisions ?? []).map((rev) => (
                    <li
                      key={rev.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span>
                        v{rev.version}
                        {rev.note ? ` — ${rev.note}` : ""}
                        <span className="ms-2 text-xs text-neutral-400">
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            () => restoreRevision.mutateAsync(rev.version),
                            `Restored v${rev.version} to draft`
                          )
                        }
                        className="rounded-md border border-neutral-300 px-3 py-1 text-xs hover:bg-neutral-50"
                      >
                        Restore to draft
                      </button>
                    </li>
                  ))}
                  {(revisions ?? []).length === 0 && (
                    <li className="py-2 text-neutral-500">
                      No published revisions yet.
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
