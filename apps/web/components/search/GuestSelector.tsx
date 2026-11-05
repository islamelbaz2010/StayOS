"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface GuestSelectorProps {
  /** Total guest count submitted as the `guests` search param. */
  value: number;
  onChange: (total: number) => void;
  /** Pets row is a real search filter (`pets` param) on the results page. */
  pets?: boolean;
  onPetsChange?: (value: boolean) => void;
  max?: number;
}

function StepperRow({
  title,
  subtitle,
  count,
  onDecrement,
  onIncrement,
  min,
  max,
}: {
  title: string;
  subtitle: string;
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
  min: number;
  max: number;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition hover:border-neutral-900 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900";
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="text-xs text-neutral-500">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={count <= min}
          aria-label={`Decrease ${title}`}
          className={btn}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </button>
        <span className="w-5 text-center text-sm tabular-nums text-neutral-900">
          {count}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={count >= max}
          aria-label={`Increase ${title}`}
          className={btn}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Reference guest panel: Adults / Children / Infants stepper rows
 * separated by hairlines inside a dropdown card. The search model only
 * carries a total `guests` count, so Adults + Children sum into it
 * (infants do not count toward occupancy, matching marketplace norms).
 * Pets maps to the real `pets` filter when provided.
 */
export function GuestSelector({
  value,
  onChange,
  pets,
  onPetsChange,
  max = 16,
}: GuestSelectorProps) {
  const t = useTranslations("search");
  const adults = Math.max(1, value);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);

  return (
    <div className="divide-y divide-neutral-150 px-2 py-1">
      <StepperRow
        title={t("adults")}
        subtitle={t("adultsHint")}
        count={adults}
        min={1}
        max={max}
        onDecrement={() => onChange(adults - 1 + children)}
        onIncrement={() => onChange(adults + 1 + children)}
      />
      <StepperRow
        title={t("children")}
        subtitle={t("childrenHint")}
        count={children}
        min={0}
        max={max}
        onDecrement={() => {
          const next = children - 1;
          setChildren(next);
          onChange(adults + next);
        }}
        onIncrement={() => {
          const next = children + 1;
          setChildren(next);
          onChange(adults + next);
        }}
      />
      <StepperRow
        title={t("infants")}
        subtitle={t("infantsHint")}
        count={infants}
        min={0}
        max={5}
        onDecrement={() => setInfants(infants - 1)}
        onIncrement={() => setInfants(infants + 1)}
      />
      {onPetsChange !== undefined && (
        <div className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              {t("pets")}
            </p>
            <p className="text-xs text-neutral-500">{t("petsHint")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(pets)}
            onClick={() => onPetsChange(!pets)}
            className={`relative h-8 w-14 shrink-0 rounded-full transition ${
              pets ? "bg-neutral-900" : "bg-neutral-200"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                pets ? "start-7" : "start-1"
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
}
