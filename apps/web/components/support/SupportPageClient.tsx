"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import { getArticle } from "@/lib/help";
import { useBooking } from "@/lib/queries/bookings";
import {
  useConversations,
  useMarkRead,
  useMessages,
  useSendMessage,
  useSetSupportStatus,
  useStartSupportConversation,
  type ConversationListItem,
} from "@/lib/queries/messages";

const POPULAR_ARTICLES = [
  "guest-cancel-booking",
  "guest-payment-verification",
  "guest-check-in",
  "verification-why",
  "account-language",
  "support-how-it-works",
];

function statusLabelKey(status: string | null | undefined): string {
  switch (status) {
    case "waiting_for_support":
      return "statusWaiting_support";
    case "waiting_for_user":
      return "statusWaiting_user";
    case "resolved":
      return "statusResolved";
    default:
      return "statusOpen";
  }
}

const STATUS_COLORS: Record<string, string> = {
  open: "bg-info-50 text-info-700",
  waiting_for_support: "bg-warning-50 text-warning-700",
  waiting_for_user: "bg-accent-100 text-accent-700",
  resolved: "bg-success-50 text-success-700",
};

function StatusBadge({ status }: { status: string | null | undefined }) {
  const t = useTranslations("support");
  const key = status ?? "open";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        STATUS_COLORS[key] ?? STATUS_COLORS.open
      }`}
    >
      {t(statusLabelKey(status))}
    </span>
  );
}

/* ---------------------------------------------------------------- */
/* New conversation form                                             */
/* ---------------------------------------------------------------- */

function NewConversationForm({
  bookingId,
  onCreated,
}: {
  bookingId: string | null;
  onCreated: (conversationId: string) => void;
}) {
  const t = useTranslations("support");
  const start = useStartSupportConversation();
  const { data: booking } = useBooking(bookingId ?? "", {
    refetchInterval: false,
  });
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState(false);

  const linkedTitle =
    (booking as { unit_title?: string | null } | undefined)?.unit_title ??
    (bookingId ? `#${bookingId.slice(0, 8)}` : null);

  const submit = async () => {
    const text = content.trim();
    if (!text || start.isPending) return;
    try {
      setError(false);
      const conversation = await start.mutateAsync({
        subject: subject.trim() || undefined,
        bookingId: bookingId ?? undefined,
        content: text,
      });
      setContent("");
      setSubject("");
      onCreated(conversation.id);
    } catch {
      setError(true);
    }
  };

  return (
    <div className="space-y-3">
      {linkedTitle && (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          {t("linkedBooking")}:{" "}
          <span className="font-medium text-brand-900">{linkedTitle}</span>
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t("subjectLabel")}{" "}
          <span className="font-normal text-neutral-400">
            ({t("subjectOptional")})
          </span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t("subjectPlaceholder")}
          maxLength={200}
          className="input w-full"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          {t("messageLabel")}
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("messagePlaceholder")}
          rows={4}
          maxLength={4000}
          className="input w-full resize-none"
        />
      </div>
      {error && (
        <p className="text-sm text-danger-600" role="alert">
          {t("sendError")}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={!content.trim() || start.isPending}
        className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
      >
        {start.isPending ? t("sending") : t("send")}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Thread                                                            */
/* ---------------------------------------------------------------- */

function SupportThread({
  conversation,
  onBack,
  dateLocale,
}: {
  conversation: ConversationListItem;
  onBack: () => void;
  dateLocale: string;
}) {
  const t = useTranslations("support");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const { data: messages, isLoading, error, refetch } = useMessages(
    conversation.id
  );
  const send = useSendMessage(conversation.id);
  const markRead = useMarkRead(conversation.id);
  const setStatus = useSetSupportStatus(conversation.id);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    try {
      setSendError(false);
      setInput("");
      await send.mutateAsync(text);
    } catch {
      setInput(text);
      setSendError(true);
    }
  };

  const isResolved = conversation.support_status === "resolved";

  return (
    <div className="flex min-h-[55vh] flex-col rounded-xl bg-white shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-neutral-500 hover:text-neutral-700 md:hidden"
          >
            {t("backToList")}
          </button>
          <div>
            <p className="font-semibold text-brand-900">
              {conversation.subject || t("supportTeam")}
            </p>
            {conversation.unit_title && (
              <p className="text-xs text-neutral-500">
                {t("linkedBooking")}: {conversation.unit_title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={conversation.support_status} />
          {isResolved ? (
            <button
              type="button"
              onClick={() => setStatus.mutate("open")}
              disabled={setStatus.isPending}
              className="text-xs font-medium text-accent-600 hover:underline disabled:opacity-50"
            >
              {t("reopen")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStatus.mutate("resolved")}
              disabled={setStatus.isPending}
              className="text-xs font-medium text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
            >
              {t("markResolved")}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <p className="text-center text-sm text-neutral-500">
            {tc("loading")}
          </p>
        )}
        {error && (
          <div className="text-center">
            <p className="text-sm text-danger-600">{t("loadError")}</p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-sm font-medium text-brand-600 hover:underline"
            >
              {tc("retry")}
            </button>
          </div>
        )}
        {!isLoading && !error && messages?.length === 0 && (
          <p className="text-center text-sm text-neutral-500">{t("empty")}</p>
        )}
        {messages?.map((message) => {
          const isMe = user !== null && message.sender_id === user.id;
          return (
            <div
              key={message.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe
                    ? "bg-brand-600 text-white"
                    : "bg-neutral-100 text-neutral-900"
                }`}
              >
                {!isMe && (
                  <p className="mb-0.5 text-xs font-semibold text-neutral-500">
                    {t("supportTeam")}
                  </p>
                )}
                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${
                    isMe ? "text-brand-100" : "text-neutral-400"
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString(dateLocale, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {isResolved && (
        <p className="border-t border-neutral-100 px-4 py-2 text-center text-xs text-neutral-500">
          {t("resolvedBanner")}
        </p>
      )}
      {sendError && (
        <p
          className="border-t border-neutral-200 px-4 pt-3 text-sm text-danger-600"
          role="alert"
        >
          {t("sendError")}
        </p>
      )}
      <div className="flex items-end gap-2 border-t border-neutral-200 p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("typeMessage")}
          rows={1}
          maxLength={4000}
          className="flex-1 resize-none rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || send.isPending}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {send.isPending ? t("sending") : t("send")}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Page                                                              */
/* ---------------------------------------------------------------- */

export function SupportPageClient() {
  const t = useTranslations("support");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams?.get("bookingId") ?? null;
  const preselectId = searchParams?.get("conversation") ?? null;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: conversations, isLoading, isError, refetch } = useConversations();
  const supportThreads = (conversations ?? []).filter(
    (c) => c.type === "support"
  );

  const [selectedId, setSelectedId] = useState<string | null>(preselectId);
  const [composing, setComposing] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  const selected = supportThreads.find((c) => c.id === selectedId) ?? null;

  const goSearch = () => {
    const q = searchInput.trim();
    if (!q) return;
    router.push(`/${locale}/help?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Hero: title + help search */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-brand-900 sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-1 text-neutral-600">{t("subtitle")}</p>
        <div className="mt-4 flex max-w-xl gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
            placeholder={t("searchHelpPlaceholder")}
            className="input w-full"
            aria-label={t("searchHelp")}
          />
          <button
            type="button"
            onClick={goSearch}
            className="shrink-0 rounded-xl bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            {t("searchHelp")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Conversations */}
        <div className="lg:col-span-3">
          {selected ? (
            <SupportThread
              conversation={selected}
              onBack={() => setSelectedId(null)}
              dateLocale={dateLocale}
            />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-brand-900">
                    {isAuthenticated
                      ? t("newConversation")
                      : t("signInTitle")}
                  </h2>
                </div>
                {authLoading ? (
                  <p className="text-sm text-neutral-500">{tc("loading")}</p>
                ) : isAuthenticated ? (
                  composing || supportThreads.length === 0 || bookingId ? (
                    <NewConversationForm
                      bookingId={bookingId}
                      onCreated={(id) => {
                        setComposing(false);
                        setSelectedId(id);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setComposing(true)}
                      className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      {t("startConversation")}
                    </button>
                  )
                ) : (
                  <div>
                    <p className="text-sm text-neutral-600">{t("signInHint")}</p>
                    <Link
                      href={`/${locale}/auth/login?redirect=${encodeURIComponent(
                        `/${locale}/support`
                      )}`}
                      className="mt-3 inline-block rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      {t("signIn")}
                    </Link>
                  </div>
                )}
              </div>

              {isAuthenticated && (
                <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
                  <h2 className="mb-3 text-lg font-semibold text-brand-900">
                    {t("yourConversations")}
                  </h2>
                  {isLoading ? (
                    <p className="py-4 text-sm text-neutral-500">
                      {tc("loading")}
                    </p>
                  ) : isError ? (
                    <div className="py-4 text-center">
                      <p className="text-sm text-danger-600">
                        {t("loadError")}
                      </p>
                      <button
                        onClick={() => refetch()}
                        className="mt-2 text-sm font-medium text-brand-600 hover:underline"
                      >
                        {tc("retry")}
                      </button>
                    </div>
                  ) : supportThreads.length === 0 ? (
                    <p className="py-4 text-sm text-neutral-500">
                      {t("noConversations")}
                    </p>
                  ) : (
                    <div className="divide-y divide-neutral-100">
                      {supportThreads.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedId(c.id)}
                          className="block w-full py-3 text-start transition hover:bg-neutral-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-medium text-brand-900">
                              {c.subject || t("supportTeam")}
                            </p>
                            <div className="flex shrink-0 items-center gap-2">
                              <StatusBadge status={c.support_status} />
                              {c.unread_count > 0 && (
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white">
                                  {c.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                          {c.last_message && (
                            <p className="mt-0.5 truncate text-sm text-neutral-500">
                              {c.last_message.content}
                            </p>
                          )}
                          <p className="mt-0.5 text-xs text-neutral-400">
                            {new Date(c.updated_at).toLocaleString(dateLocale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right rail: topics + FAQ + safety */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
            <h2 className="mb-3 text-lg font-semibold text-brand-900">
              {t("popularTopics")}
            </h2>
            <ul className="divide-y divide-neutral-100">
              {POPULAR_ARTICLES.map((slug) => {
                const article = getArticle(slug);
                if (!article) return null;
                const loc = locale === "ar" ? "ar" : "en";
                return (
                  <li key={slug}>
                    <Link
                      href={`/${locale}/help/article/${slug}`}
                      className="block py-2.5 text-sm font-medium text-neutral-700 transition hover:text-accent-600"
                    >
                      {article.title[loc]}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Link
              href={`/${locale}/help`}
              className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:underline"
            >
              {t("searchHelp")} →
            </Link>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-semibold text-brand-900">
              {t("faqTitle")}
            </h2>
            <Link
              href={`/${locale}/faq`}
              className="mt-2 inline-block text-sm font-semibold text-accent-600 hover:underline"
            >
              {t("browseFaq")}
            </Link>
          </div>

          <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
            <h2 className="text-sm font-semibold text-warning-800">
              {t("reportSafety")}
            </h2>
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setComposing(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-2 text-sm font-semibold text-accent-600 hover:underline"
              >
                {t("startConversation")} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
