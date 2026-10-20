const euroFormatter = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

/** 1995 -> "€ 19,95" */
export function euro(cents: number): string {
  return euroFormatter.format(cents / 100);
}

/** 1995 -> "19,95" (zonder valutateken, handig in grote prijsweergaven). */
export function euroAmount(cents: number): string {
  return (cents / 100).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const dateFormatter = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam",
});

export function formatDate(date: Date | string): string {
  return dateFormatter.format(typeof date === "string" ? new Date(date) : date);
}

export function formatNumber(n: number, digits = 0): string {
  return n.toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
