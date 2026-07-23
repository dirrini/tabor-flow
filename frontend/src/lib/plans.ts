import type { Locale } from "./i18n";

export const premiumMonthlyPrice =
  Number(import.meta.env.VITE_PREMIUM_MONTHLY_PRICE) || null;

export const premiumAnnualPrice =
  Number(import.meta.env.VITE_PREMIUM_ANNUAL_PRICE) || null;

export function formatPlanPrice(
  value: number | null,
  locale: Locale
) {
  if (value === null) {
    return locale === "pt-BR"
      ? "Preço em definição"
      : "Pricing to be announced";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2
  }).format(value);
}
