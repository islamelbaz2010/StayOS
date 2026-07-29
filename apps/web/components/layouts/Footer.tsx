"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer() {
  const t = useTranslations("nav");

  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">StayOS</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/careers"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Careers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("host")}
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/host/start"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Get started
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Support</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/help"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Legal</p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-neutral-500 hover:text-neutral-900"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-8">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} StayOS. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
