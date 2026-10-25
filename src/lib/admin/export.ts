import { durations, products } from "@/config/pricing";
import { isDemoMode } from "@/lib/admin/auth";
import { adminData } from "@/lib/admin/data";
import { discountCodes } from "@/lib/admin/insights";
import { cancelReasonLabel } from "@/lib/cancel-reasons";
import { db } from "@/lib/db";
import { describeDiscount } from "@/lib/discounts";

/**
 * CSV-exports uit het beheer. Puntkomma als scheidingsteken en een komma in
 * bedragen, zodat Excel met Nederlandse instellingen het bestand direct goed opent.
 */

export const EXPORTS = {
  klanten: "Klanten",
  bestellingen: "Bestellingen",
  betalingen: "Betalingen",
  nieuwsbrief: "Nieuwsbrief (met toestemming)",
  kortingscodes: "Kortingscodes",
} as const;
export type ExportKind = keyof typeof EXPORTS;

export function isExportKind(v: string): v is ExportKind {
  return v in EXPORTS;
}

/** Downloadlink voor een export (een gewone link: het is een bestand, geen pagina). */
export function exportHref(kind: ExportKind, params?: Record<string, string | undefined>): string {
  const q = new URLSearchParams(Object.entries(params ?? {}).filter((e): e is [string, string] => Boolean(e[1])));
  return `/beheer/export/${kind}${q.size ? `?${q}` : ""}`;
}

type Cell = string | number | boolean | Date | null | undefined;

const ORDER_STATUS: Record<string, string> = { active: "Actief", past_due: "Betaling mislukt", canceled: "Beëindigd", completed: "Los schema" };

function cell(v: Cell): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "ja" : "nee";
  if (v instanceof Date) return v.toISOString().slice(0, 16).replace("T", " ");
  const s = String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const money = (cents: number | null | undefined) => (cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ","));

export function toCsv(header: string[], rows: Cell[][]): string {
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(";")).join("\r\n") + "\r\n";
}

async function payments(): Promise<Cell[][]> {
  if (isDemoMode()) {
    const orders = await adminData().orders(undefined, 100_000);
    return orders.map((o) => [o.createdAt, `#${o.reference}`, o.customerName, o.customerEmail, "Betaling", products[o.product].shortName, money(o.amountCents)]);
  }
  const sql = await db();
  const rows = await sql<{ paid_at: Date; order_id: string | null; name: string | null; email: string | null; kind: string; description: string | null; amount_cents: number }[]>`
    select p.paid_at, p.order_id, c.name, c.email, p.kind, p.description, p.amount_cents
    from payments p left join customers c on c.id = p.customer_id order by p.paid_at desc`;
  return rows.map((r) => [
    r.paid_at,
    r.order_id ? `#${r.order_id.slice(0, 8).toUpperCase()}` : "",
    r.name,
    r.email,
    r.kind === "refund" ? "Terugbetaling" : "Betaling",
    r.description,
    money(r.amount_cents),
  ]);
}

export async function buildExport(kind: ExportKind, opts: { status?: string } = {}): Promise<{ header: string[]; rows: Cell[][] }> {
  switch (kind) {
    case "klanten": {
      const rows = await adminData().customers(undefined, 100_000);
      return {
        header: ["Naam", "E-mail", "Taal", "Klant sinds", "Nieuwsbrief", "Weegherinneringen", "Actieve abonnementen", "Bestellingen", "Schema's"],
        rows: rows.map((c) => [c.name, c.email, c.locale, c.createdAt, c.marketing, c.weeklyReminders, c.activeSubscriptions, c.orders, c.plans]),
      };
    }
    case "nieuwsbrief": {
      const rows = (await adminData().customers(undefined, 100_000)).filter((c) => c.marketing);
      return { header: ["Naam", "E-mail", "Taal", "Klant sinds"], rows: rows.map((c) => [c.name, c.email, c.locale, c.createdAt]) };
    }
    case "bestellingen": {
      const status = ["active", "past_due", "canceled", "completed"].find((s) => s === opts.status) as "active" | undefined;
      const rows = await adminData().orders(status, 100_000);
      return {
        header: [
          "Bestelling",
          "Datum",
          "Klant",
          "E-mail",
          "Product",
          "Looptijd",
          "Status",
          "Stopt per",
          "Eerste betaling (EUR)",
          "Per maand (EUR)",
          "Kortingscode",
          "Terugbetaald (EUR)",
          "Reden opzegging",
          "Toelichting opzegging",
          "Bron",
          "Campagne",
          "Landingspagina",
        ],
        rows: rows.map((o) => [
          `#${o.reference}`,
          o.createdAt,
          o.customerName,
          o.customerEmail,
          products[o.product].shortName,
          o.duration === "eenmalig" ? "Los" : durations[o.duration].label,
          ORDER_STATUS[o.status] ?? o.status,
          o.cancelAt,
          money(o.amountCents),
          o.monthlyCents ? money(o.monthlyCents) : "",
          o.discountCode,
          o.refundedCents ? money(o.refundedCents) : "",
          o.cancelReason || o.cancelComment ? cancelReasonLabel(o.cancelReason) : "",
          o.cancelComment,
          o.campaign?.source,
          o.campaign?.campaign,
          o.campaign?.landing,
        ]),
      };
    }
    case "betalingen":
      return { header: ["Datum", "Bestelling", "Klant", "E-mail", "Soort", "Omschrijving", "Bedrag (EUR)"], rows: await payments() };
    case "kortingscodes": {
      const rows = await discountCodes();
      return {
        header: ["Code", "Omschrijving", "Korting", "Actief", "Gebruikt", "Maximaal", "Betaalpagina geopend", "Eerste betalingen (EUR)", "Geldig vanaf", "Geldig tot", "Aangemaakt"],
        rows: rows.map((r) => [
          r.code,
          r.description,
          describeDiscount({ percentOff: r.percent_off, amountOffCents: r.amount_off_cents, duration: r.duration, durationMonths: r.duration_months }),
          r.active,
          r.redemptions,
          r.max_redemptions,
          r.checkouts,
          money(r.revenue_cents),
          r.starts_at,
          r.expires_at,
          r.created_at,
        ]),
      };
    }
  }
}
