import type { Json, Params } from "./client";

export type Args = { _: string[]; [flag: string]: string | boolean | string[] };

/** `--naam waarde`, `--naam=waarde` en losse vlaggen (`--confirm`). */
export function parseArgs(argv: string[]): Args {
  const args: Args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const [key, inline] = splitPair(arg.slice(2));
    if (inline !== undefined) args[key] = inline;
    else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) args[key] = argv[++i];
    else args[key] = true;
  }
  return args;
}

/** "naam=waarde" → ["naam", "waarde"]; zonder = is de waarde undefined. */
export function splitPair(text: string): [string, string | undefined] {
  const at = text.indexOf("=");
  return at === -1 ? [text, undefined] : [text.slice(0, at), text.slice(at + 1)];
}

export function str(args: Args, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" ? value : undefined;
}

export function need(args: Args, key: string, hint = ""): string {
  const value = str(args, key);
  if (!value) throw new Error(`--${key} ontbreekt${hint ? ` (${hint})` : ""}`);
  return value;
}

export function num(args: Args, key: string): number | undefined {
  const value = str(args, key);
  if (value === undefined) return undefined;
  const n = Number(value.replace(",", "."));
  if (Number.isNaN(n)) throw new Error(`--${key} moet een getal zijn, niet "${value}"`);
  return n;
}

export function list(args: Args, key: string): string[] | undefined {
  return str(args, key)
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Periode voor de insights-API: `--period last_30d` of `--since 2026-10-01 --until 2026-10-29`. */
export function period(args: Args, fallback = "last_30d"): Params {
  const since = str(args, "since");
  const until = str(args, "until");
  if (since || until) {
    if (!since || !until) throw new Error("Geef zowel --since als --until (JJJJ-MM-DD)");
    return { time_range: { since, until } };
  }
  return { date_preset: str(args, "period") ?? fallback };
}

export function periodLabel(args: Args, fallback = "last_30d"): string {
  const since = str(args, "since");
  return since ? `${since} t/m ${str(args, "until")}` : (str(args, "period") ?? fallback);
}

/** Tijdstip als unix-seconden; accepteert "2026-11-23 08:00" (Nederlandse tijd) of ISO. */
export function unixTime(value: string): number {
  const local = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(value);
  const date = local ? amsterdam(value.replace(" ", "T")) : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Onbekend tijdstip: "${value}" (gebruik bijv. "2026-11-23 08:00")`);
  return Math.floor(date.getTime() / 1000);
}

function amsterdam(local: string): Date {
  // eerst als UTC lezen, dan corrigeren met het verschil dat Amsterdam op dat moment heeft
  const asUtc = new Date(`${local}:00Z`);
  const shown = new Date(asUtc.toLocaleString("en-US", { timeZone: "Europe/Amsterdam" }));
  const utcShown = new Date(asUtc.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(asUtc.getTime() - (shown.getTime() - utcShown.getTime()));
}

export function table(rows: Json[], columns: [header: string, value: (row: Json) => unknown][]) {
  if (!rows.length) {
    console.log("(geen resultaten)");
    return;
  }
  const cells = rows.map((row) => columns.map(([, value]) => clean(value(row))));
  const widths = columns.map(([header], i) => Math.min(48, Math.max(header.length, ...cells.map((c) => c[i].length))));
  const line = (values: string[]) => values.map((v, i) => fit(v, widths[i])).join("  ").trimEnd();
  console.log(line(columns.map(([header]) => header)));
  console.log(widths.map((w) => "-".repeat(w)).join("  "));
  for (const row of cells) console.log(line(row));
}

function clean(value: unknown): string {
  if (value === undefined || value === null || value === "") return "-";
  return String(value).replace(/\s+/g, " ");
}

function fit(value: string, width: number): string {
  return value.length > width ? `${value.slice(0, width - 1)}…` : value.padEnd(width);
}

export function heading(text: string) {
  console.log(`\n${text}\n${"=".repeat(text.length)}`);
}

export function dump(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

export function date(value: string | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam", dateStyle: "short", timeStyle: "short" });
}

/** Schrijfacties lopen alleen met --confirm; anders tonen we wat er zou gebeuren. */
export function confirmed(args: Args, preview: string[]): boolean {
  if (args.confirm) return true;
  console.log("VOORBEELD, er is nog niets gewijzigd:");
  for (const line of preview) console.log(`  ${line}`);
  console.log("\nVoer dezelfde opdracht uit met --confirm om het echt te doen.");
  return false;
}
