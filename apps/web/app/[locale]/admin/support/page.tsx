"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminLayout } from "@/components/layouts";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useMarkRead,
  useMessages,
  useSendMessage,
  useSetSupportStatus,
  useSupportQueue,
  type ConversationListItem,
} from "@/lib/queries/messages";

const STATUS_TABS = [
  { key: "all", value: null },
  { key: "open", value: "open" },
  { key: "waiting_for_support", value: "waiting_for_support" },
  { key: "waiting_for_user", value: "waiting_for_user" },
  { key: "resolved", value: "resolved" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  open: "bg-info-50 text-info-700",
  waiting_for_support: "bg-warning-50 text-warning-700",
  waiting_for_user: "bg-accent-100 text-accent-700",
  resolved: "bg-success-50 text-success-700",
};

function statusKey(status: string | null | undefined) {
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

function StaffThread({
  conversation,
  dateLocale,
}: {
  conversation: ConversationListItem;
  dateLocale: string;
}) {
  const t = useTranslations("adminSupport");
  const { user } = useAuth();
  const { data: messages, isLoading } = useMessages(conversation.id);
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

  return (
    <div className="flex min-h-[55vh] flex-col rounded-xl bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
        <div>
          <p className="font-semibold text-brand-900">
            {conversation.counterparty_name || t("requester")}
          </p>
          <p className="text-xs text-neutral-500">
            {conversation.subject || conversation.unit_title || ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500">{t("setStatus")}:</label>
          <select
            value={conversation.support_status ?? "open"}
            onChange={(e) => setStatus.mutate(e.target.value)}
            disabled={setStatus.isPending}
            className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
          >
            <option value="open">{t("statusOpen")}</option>
            <option value="waiting_for_support">
              {t("statusWaiting_support")}
            </option>
            <option value="waiting_for_user">
              {t("statusWaiting_user")}
            </option>
            <option value="resolved">{t("statusResolved")}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-sm text-neutral-500">…</p>
        ) : !messages || messages.length === 0 ? (
          <p className="text-center text-sm text-neutral-500">
            {t("noMessages")}
          </p>
        ) : (
          messages.map((message) => {
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
                  <p className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      isMe ? "text-brand-100" : "text-neutral-400"
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString(
                      dateLocale,
                      { hour: "2-digit", minute: "2-digit" }
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

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
          placeholder={t("replyPlaceholder")}
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

export default function AdminSupportPage() {
  const t = useTranslations("adminSupport");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";

  const [tab, setTab] = useState<string>("all");
  const status = STATUS_TABS.find((s) => s.key === tab)?.value ?? null;
  const { data: queue, isLoading, isError, refetch } = useSupportQueue(status);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = queue?.find((c) => c.id === selectedId) ?? null;

  return (
    <ProtectedRoute allowedRoles={["admin", "staff"]}>
      <AdminLayout>
        <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-bold text-brand-900 sm:text-3xl">
            {t("title")}
          </h1>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setTab(s.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-sm font-medium transition ${
                  tab === s.key
                    ? "bg-brand-900 text-white"
                    : "bg-surface-card text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {s.key === "all"
                  ? t("queueAll")
                  : t(statusKey(s.key) as never)}
              </button>
            ))}
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading ? (
            <div className="card p-12 text-center text-neutral-600">…</div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-2 lg:col-span-1">
                {!queue || queue.length === 0 ? (
                  <div className="card p-6 text-center text-neutral-600">
                    {t("empty")}
                  </div>
                ) : (
                  queue.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={`block w-full rounded-xl p-4 text-start shadow-card transition hover:shadow-md ${
                        selectedId === c.id
                          ? "bg-accent-50 ring-1 ring-accent-400"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-medium text-brand-900">
                          {c.counterparty_name || t("requester")}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_COLORS[c.support_status ?? "open"]
                          }`}
                        >
                          {t(statusKey(c.support_status) as never)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-sm text-neutral-600">
                        {c.subject || c.unit_title || ""}
                      </p>
                      {c.last_message && (
                        <p className="mt-0.5 truncate text-sm text-neutral-500">
                          {c.last_message.content}
                        </p>
                      )}
                      <div className="mt-1 flex items-center justify-between">
                        <p className="text-xs text-neutral-400">
                          {new Date(c.updated_at).toLocaleString(dateLocale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                        {c.context_booking_id && (
                          <Link
                            href={`/${locale}/admin/bookings`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium text-accent-600 hover:underline"
                          >
                            {t("linkedBooking")}
                          </Link>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="lg:col-span-2">
                {selected ? (
                  <StaffThread
                    key={selected.id}
                    conversation={selected}
                    dateLocale={dateLocale}
                  />
                ) : (
                  <div className="card p-12 text-center text-neutral-600">
                    {t("select")}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </AdminLayout>
    </ProtectedRoute>
  );
}
