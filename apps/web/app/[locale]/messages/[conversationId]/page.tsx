"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GuestLayout } from "@/components/layouts";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useMarkRead,
  useMessages,
  useSendMessage,
} from "@/lib/queries/messages";

function ThreadContent({ conversationId, locale }: { conversationId: string; locale: string }) {
  const t = useTranslations("messages");
  const tc = useTranslations("common");
  const { user } = useAuth();
  const dateLocale = locale === "ar" ? "ar-EG" : "en-EG";
  const { data: messages, isLoading, error, refetch } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkRead(conversationId);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || send.isPending) return;
    try {
      setInput("");
      await send.mutateAsync(text);
    } catch {
      setInput(text);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <Link
          href={`/${locale}/messages`}
          className="text-sm text-neutral-500 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {t("backToInbox")}
        </Link>
      </div>

      <div className="flex min-h-[60vh] flex-col rounded-xl bg-white shadow-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {isLoading && (
            <p className="text-center text-sm text-neutral-500">{tc("loading")}</p>
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
            const isMe =
              user !== null && message.sender_id === user.id;
            return (
              <div
                key={message.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMe
                      ? "bg-brand-600 text-white"
                      : "bg-neutral-100 text-neutral-900"
                  }`}
                >
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
            {t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage() {
  const params = useParams<{ locale: string; conversationId: string }>();
  const locale = params?.locale ?? "ar";
  const conversationId = params?.conversationId ?? "";

  return (
    <ProtectedRoute>
      <GuestLayout>
        <section className="container mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <ThreadContent conversationId={conversationId} locale={locale} />
        </section>
      </GuestLayout>
    </ProtectedRoute>
  );
}
