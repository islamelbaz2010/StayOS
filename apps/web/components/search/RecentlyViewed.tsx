"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

import type { Listing } from "@/components/listings/ListingCard";

const STORAGE_KEY = "stayos_recently_viewed";
const MAX_ITEMS = 6;

export interface RecentlyViewedItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  coverImage: string | null;
  city: string | null;
}

export function pushRecentlyViewed(listing: {
  id: string;
  title: string;
  price: number;
  currency: string;
  coverImage: string | null;
  city: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((item) => item.id !== listing.id);
    const next = [
      {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        coverImage: listing.coverImage,
        city: listing.city,
      },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage might be unavailable
  }
}

export function getRecentlyViewed(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentlyViewedItem[];
  } catch {
    return [];
  }
}

export function RecentlyViewed({ locale }: { locale: string }) {
  const t = useTranslations("search");
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    setItems(getRecentlyViewed());
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h2 className="mb-4 text-xl font-bold text-brand-900">
        {t("recentlyViewed")}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/${locale}/listings/${item.id}`}
            className="group flex flex-col gap-2"
          >
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100">
              {item.coverImage ? (
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  sizes="200px"
                  className="object-cover transition group-hover:scale-105"
                />
              ) : null}
            </div>
            <p className="line-clamp-1 text-sm font-medium text-neutral-800">
              {item.title}
            </p>
            {item.city && (
              <p className="text-xs text-neutral-500">{item.city}</p>
            )}
            <p className="text-sm font-semibold text-brand-700">
              {item.price.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {item.currency}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
