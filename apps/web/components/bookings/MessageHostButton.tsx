"use client";

import { useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { api } from "@/lib/api";
import type { ConversationResponse } from "@/lib/queries/messages";
import { getApiErrorMessage } from "@/lib/utils";

export function MessageHostButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const t = useTranslations("trips");
  const tc = useTranslations("common");
  const params = useParams<{ locale: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.get<ConversationResponse>(
        `/messages/bookings/${bookingId}/conversation`
      );
      return data;
    },
    onSuccess: (conversation) => {
      setError(null);
      const locale = params?.locale ?? "en";
      router.push(`/${locale}/messages/${conversation.id}`);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, t("messageHostError")));
    },
  });

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="btn-secondary"
      >
        {mutation.isPending ? tc("loading") : t("messageHost")}
      </button>
      {error && <p className="text-sm text-danger-600">{error}</p>}
    </div>
  );
}
