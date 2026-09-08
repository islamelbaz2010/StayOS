"use client";

import { useEffect } from "react";

/**
 * Syncs <html lang> and <html dir> with the active locale.
 *
 * The root layout renders <html> above the [locale] segment and cannot
 * see the locale param, so the correct direction/language is applied
 * here on the client once the locale layout mounts.
 */
export function DocumentDirection({
  locale,
  dir,
}: {
  locale: string;
  dir: "ltr" | "rtl";
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return null;
}
