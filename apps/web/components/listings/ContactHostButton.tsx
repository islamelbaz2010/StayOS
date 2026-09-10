"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { useAuth } from "@/lib/auth/useAuth";
import { useContactHost } from "@/lib/queries/messages";
import { getApiErrorMessage } from "@/lib/utils";

interface ContactHostButtonProps {
  unitId: string;
  locale: string;
  className?: string;
}

export function ContactHostButton({ unitId, locale, className }: ContactHostButtonProps) {
  const t = useTranslations("listing");
  const router = useRouter();
  const { isAuthenticated, isGuest } = useAuth();
  const contactHost = useContactHost();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated || !isGuest) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    try {
      const conversation = await contactHost.mutateAsync({
        unitId,
        content: message.trim(),
      });
      setOpen(false);
      setMessage("");
      router.push(`/${locale}/messages/${conversation.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, t("contactHostError")));
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:border-brand-400 hover:text-brand-600 ${className ?? ""}`}
      >
        {t("contactHost")}
      </button>
    );
  }

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-4 shadow-card ${className ?? ""}`}>
      <form onSubmit={handleSubmit}>
        <label
          htmlFor="contact-host-message"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          {t("contactHostTitle")}
        </label>
        <textarea
          id="contact-host-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("contactHostPlaceholder")}
          rows={3}
          maxLength={4000}
          className="input mt-1 w-full text-sm"
          required
          autoFocus
        />
        {error && (
          <p className="mt-2 text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            disabled={contactHost.isPending || !message.trim()}
            className="btn-primary flex-1 text-sm"
          >
            {contactHost.isPending ? t("sending") : t("sendMessage")}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setMessage("");
              setError(null);
            }}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
