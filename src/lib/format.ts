import { intlLocale, type Locale } from "@/i18n/config";

const euroFormatters = new Map<Locale, Intl.NumberFormat>();
const dateFormatters = new Map<Locale, Intl.DateTimeFormat>();

/** 1995 -> "€ 19,95" (Engels: "€19.95") */
export function euro(cents: number, l: Locale = "nl"): string {
  let f = euroFormatters.get(l);
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(l), { style: "currency", currency: "EUR", minimumFractionDigits: 2 });
    euroFormatters.set(l, f);
  }
  return f.format(cents / 100);
}

/** 1995 -> "19,95" (zonder valutateken, handig in grote prijsweergaven). */
export function euroAmount(cents: number, l: Locale = "nl"): string {
  return (cents / 100).toLocaleString(intlLocale(l), { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDate(date: Date | string, l: Locale = "nl"): string {
  let f = dateFormatters.get(l);
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });
    dateFormatters.set(l, f);
  }
  return f.format(typeof date === "string" ? new Date(date) : date);
}

export function formatNumber(n: number, digits = 0, l: Locale = "nl"): string {
  return n.toLocaleString(intlLocale(l), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
