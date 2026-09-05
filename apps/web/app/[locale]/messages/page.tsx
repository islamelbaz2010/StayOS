"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useConversations } from "@/lib/queries/messages";
import type { ConversationListItem } from "@/lib/queries/messages";

function formatTime(iso: string, dateLocale: string): string {
  const date = new Date(iso);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString(dateLocale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString(dateLocale);
}

function ConversationCard({
  item,
  locale,
  dateLocale,
}: {
  item: ConversationListItem;
  locale: string;
  dateLocale: string;
}) {
  const t = useTranslations("messages");
  const title = item.counterparty_name || item.unit_title || t("conversation");

  return (
    <Link
      href={`/${locale}/messages/${item.id}`}
      className="block rounded-xl bg-white p-4 shadow-card transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-neutral-900">{title}</p>
        {item.last_message && (
          <span className="ms-2 shrink-0 text-xs text-neutral-400">
            {formatTime(item.last_message.created_at, dateLocale)}
          </span>
        )}
      </div>
      {item.unit_title && item.counterparty_name && (
        <p className="mt-0.5 truncate text-sm text-neutral-500">
          {item.unit_title}
        </p>
      )}
      <div className="mt-1 flex items-center justify-between gap-3">
        <p
          className={`truncate text-sm ${
            item.unread_count > 0
              ? "font-medium text-neutral-900"
              : "text-neutral-500"
          }`}
        >
          {item.last_message?.content ?? ""}
        </p>
        {item.unread_count > 0 && (
          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
            {item.unread_count}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function MessagesPage() {
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data: conversations, isLoading, error, refetch } = useConversations();

  return (
    <ProtectedRoute>
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-neutral-900">
            {t("inboxTitle")}
          </h1>

          {isLoading && (
            <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
              {tc("loading")}
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-white p-8 text-center shadow-card">
              <p className="text-danger-600">{t("loadError")}</p>
              <button
                onClick={() => refetch()}
                className="mt-3 text-sm font-medium text-brand-600 hover:underline"
              >
                {tc("retry")}
              </button>
            </div>
          )}

          {!isLoading && !error && conversations?.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center text-neutral-500 shadow-card">
              {t("empty")}
            </div>
          )}

          <div className="space-y-3">
            {conversations?.map((item) => (
              <ConversationCard
                key={item.id}
                item={item}
                locale={locale}
                dateLocale={dateLocale}
              />
            ))}
          </div>
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
