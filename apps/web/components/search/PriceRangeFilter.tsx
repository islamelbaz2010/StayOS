"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import type { ApiPriceDistribution } from "@/lib/queries/listings";
import { formatMoney } from "@/lib/utils";

interface PriceRangeFilterProps {
  distribution: ApiPriceDistribution | undefined;
  isLoading: boolean;
  /** Current applied filter values (URL params, EGP). */
  minPrice: string | undefined;
  maxPrice: string | undefined;
  /** Commit a new range; null clears that bound. */
  onApply: (min: number | null, max: number | null) => void;
}

/**
 * Price-range filter: histogram of the current result distribution with a
 * two-handle slider and numeric min/max inputs. Slider commits on release;
 * the histogram always shows the unfiltered distribution for the current
 * search so the user can see what widening the range would unlock.
 */
export function PriceRangeFilter({
  distribution,
  isLoading,
  minPrice,
  maxPrice,
  onApply,
}: PriceRangeFilterProps) {
  const t = useTranslations("search.priceRange");
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? "ar";
  const format = useCallback(
    (v: number) => formatMoney(v, "EGP", locale === "ar" ? "ar-EG" : "en-EG"),
    [locale]
  );

  const distMin = distribution?.min_price_egp ?? null;
  const distMax = distribution?.max_price_egp ?? null;
  const hasData =
    distMin != null && distMax != null && distMax > distMin;

  const appliedMin = minPrice ? Number(minPrice) : null;
  const appliedMax = maxPrice ? Number(maxPrice) : null;

  const [minVal, setMinVal] = useState<number>(appliedMin ?? distMin ?? 0);
  const [maxVal, setMaxVal] = useState<number>(appliedMax ?? distMax ?? 0);

  // Re-sync local slider state when the applied params or the
  // distribution range change (e.g. city changed → different prices).
  useEffect(() => {
    setMinVal(appliedMin ?? distMin ?? 0);
    setMaxVal(appliedMax ?? distMax ?? 0);
  }, [appliedMin, appliedMax, distMin, distMax]);

  const maxCount = useMemo(
    () =>
      Math.max(
        1,
        ...(distribution?.buckets.map((b) => b.count) ?? [1])
      ),
    [distribution]
  );

  const commit = useCallback(
    (lo: number, hi: number) => {
      if (!hasData) {
        onApply(lo > 0 ? lo : null, hi > 0 ? hi : null);
        return;
      }
      onApply(
        lo > distMin! ? lo : null,
        hi < distMax! ? hi : null
      );
    },
    [hasData, distMin, distMax, onApply]
  );

  const clampMin = (v: number) => Math.min(v, maxVal);
  const clampMax = (v: number) => Math.max(v, minVal);

  // Drag state: commit once when the pointer/key interaction ends.
  const dragging = useRef(false);
  const endDrag = () => {
    if (dragging.current) {
      dragging.current = false;
      commit(minVal, maxVal);
    }
  };

  const minPct = hasData
    ? ((minVal - distMin!) / (distMax! - distMin!)) * 100
    : 0;
  const maxPct = hasData
    ? ((maxVal - distMin!) / (distMax! - distMin!)) * 100
    : 100;

  return (
    <div className="w-full">
      <span className="block text-xs font-medium text-neutral-500">
        {t("label")}
      </span>

      {isLoading ? (
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-neutral-100" />
      ) : !hasData ? (
        /* No distribution data — fall back to plain numeric bounds. */
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label={t("min")}
            placeholder={t("min")}
            value={appliedMin ?? ""}
            onChange={(e) =>
              onApply(
                e.target.value ? Math.max(0, Number(e.target.value)) : null,
                appliedMax
              )
            }
            className="input w-28 text-sm"
          />
          <span className="text-neutral-400">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            aria-label={t("max")}
            placeholder={t("max")}
            value={appliedMax ?? ""}
            onChange={(e) =>
              onApply(
                appliedMin,
                e.target.value ? Math.max(0, Number(e.target.value)) : null
              )
            }
            className="input w-28 text-sm"
          />
        </div>
      ) : (
        <>
          {/* Histogram — bars outside the selected range are dimmed. */}
          <div
            className="mt-3 flex h-16 items-end gap-px"
            dir="ltr"
            role="img"
            aria-label={t("histogramLabel", {
              min: format(distMin!),
              max: format(distMax!),
            })}
          >
            {distribution!.buckets.map((bucket, i) => {
              const inRange =
                bucket.to_egp >= minVal && bucket.from_egp <= maxVal;
              return (
                <div
                  key={i}
                  title={`${format(bucket.from_egp)}–${format(
                    bucket.to_egp
                  )}: ${bucket.count}`}
                  className={`flex-1 rounded-t-sm transition-colors ${
                    inRange ? "bg-brand-500" : "bg-neutral-200"
                  }`}
                  style={{
                    height: `${Math.max(8, (bucket.count / maxCount) * 100)}%`,
                  }}
                />
              );
            })}
          </div>

          {/* Dual slider — two stacked range inputs sharing one track. */}
          <div className="relative mt-1 h-6" dir="ltr">
            <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-neutral-200" />
            <div
              className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-600"
              style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
            />
            <input
              type="range"
              min={distMin!}
              max={distMax!}
              value={minVal}
              aria-label={t("min")}
              aria-valuetext={format(minVal)}
              className="price-range-thumb absolute inset-0 h-6 w-full appearance-none bg-transparent"
              onChange={(e) => {
                dragging.current = true;
                setMinVal(clampMin(Number(e.target.value)));
              }}
              onPointerUp={endDrag}
              onKeyUp={endDrag}
              onBlur={endDrag}
            />
            <input
              type="range"
              min={distMin!}
              max={distMax!}
              value={maxVal}
              aria-label={t("max")}
              aria-valuetext={format(maxVal)}
              className="price-range-thumb absolute inset-0 h-6 w-full appearance-none bg-transparent"
              onChange={(e) => {
                dragging.current = true;
                setMaxVal(clampMax(Number(e.target.value)));
              }}
              onPointerUp={endDrag}
              onKeyUp={endDrag}
              onBlur={endDrag}
            />
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1">
              <span className="block text-[11px] text-neutral-400">
                {t("min")}
              </span>
              <input
                type="number"
                min={distMin!}
                max={maxVal}
                inputMode="numeric"
                value={minVal}
                onChange={(e) =>
                  setMinVal(clampMin(Number(e.target.value) || distMin!))
                }
                onBlur={() => commit(minVal, maxVal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(minVal, maxVal);
                }}
                className="input mt-0.5 w-full text-sm"
              />
            </div>
            <span className="mt-4 text-neutral-400">–</span>
            <div className="flex-1">
              <span className="block text-[11px] text-neutral-400">
                {t("max")}
              </span>
              <input
                type="number"
                min={minVal}
                max={distMax!}
                inputMode="numeric"
                value={maxVal}
                onChange={(e) =>
                  setMaxVal(clampMax(Number(e.target.value) || distMax!))
                }
                onBlur={() => commit(minVal, maxVal)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commit(minVal, maxVal);
                }}
                className="input mt-0.5 w-full text-sm"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-neutral-500">
            {t("summary", {
              min: format(minVal),
              max: format(maxVal),
              count: distribution!.total,
            })}
          </p>
        </>
      )}
    </div>
  );
}
