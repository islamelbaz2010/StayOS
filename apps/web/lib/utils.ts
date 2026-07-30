import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number, currency = "EGP"): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date, locale: string = "ar-EG"): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
