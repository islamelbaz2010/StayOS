import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(
  amount: number,
  currency = "EGP",
  locale = "ar-EG"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  locale: string = "ar-EG"
): string {
  const value =
    typeof date === "string"
      ? (parseInputDate(date) ?? new Date(date))
      : date;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function toInputDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseInputDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  unavailable?: string
): string {
  const axiosError = error as {
    response?: {
      status?: number;
      data?: { error?: { code?: string; message?: string } };
    };
  };
  // 503 responses carry infrastructure diagnostics (missing storage/config
  // keys) meant for logs and operators — users get a safe localized message.
  if (
    axiosError.response?.status === 503 ||
    axiosError.response?.data?.error?.code === "SERVICE_UNAVAILABLE"
  ) {
    return unavailable ?? fallback;
  }
  return axiosError.response?.data?.error?.message || fallback;
}
