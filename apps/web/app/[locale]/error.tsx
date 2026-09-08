"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");

  useEffect(() => {
    console.error("[page error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <p className="text-5xl font-bold text-neutral-200">500</p>
        <h1 className="mt-4 text-xl font-semibold text-neutral-900">
          {t("generic")}
        </h1>
        {error.digest && (
          <p className="mt-1 font-mono text-xs text-neutral-400">
            {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-md bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
