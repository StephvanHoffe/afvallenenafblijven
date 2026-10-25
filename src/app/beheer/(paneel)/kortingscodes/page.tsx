import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { Download, Pause, Play, Plus, Trash2 } from "lucide-react";
import { createDiscount, removeDiscount, toggleDiscount } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, pct, table } from "@/components/beheer/ui";
import { DURATION_IDS, PRODUCT_IDS, durations, products } from "@/config/pricing";
import { site } from "@/config/site";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { discountCodes } from "@/lib/admin/insights";
import { describeDiscount } from "@/lib/discounts";
import type { DiscountCodeRow } from "@/lib/discounts-server";
import { euro, formatDate, formatNumber } from "@/lib/format";
import { exportHref } from "@/lib/admin/export";
import { adminNow } from "@/lib/admin/clock";

export const metadata: Metadata = { title: "Kortingscodes" };

export default function KortingscodesPage({ searchParams }: PageProps<"/beheer/kortingscodes">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Codes searchParams={searchParams} />
    </Suspense>
  );
}

function status(row: DiscountCodeRow, now: number): { tone: "ok" | "warn" | "muted" | "info"; label: string } {
  if (!row.active) return { tone: "muted", label: "Gepauzeerd" };
  if (row.expires_at && row.expires_at.getTime() < now) return { tone: "muted", label: "Verlopen" };
  if (row.starts_at && row.starts_at.getTime() > now) return { tone: "info", label: "Gepland" };
  if (row.max_redemptions !== null && row.redemptions >= row.max_redemptions) return { tone: "warn", label: "Op" };
  return { tone: "ok", label: "Actief" };
}

const durationName = (d: string) => (d === "eenmalig" ? "los" : d === "1m" ? "per maand" : `min. ${durations[d as keyof typeof durations].label}`);

async function Codes({ searchParams }: Pick<PageProps<"/beheer/kortingscodes">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  const rows = await discountCodes();
  const now = adminNow();
  const here = "/beheer/kortingscodes";

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Kortingscodes"
        intro="Maak codes voor acties, influencers of bedrijven. Klanten vullen de code in bij het afrekenen, of je deelt een link waarin de code al staat. Een code vervangt de actiekorting (bijv. Black Friday)."
      />

      <Panel
        title="Codes"
        action={
          <a href={exportHref("kortingscodes")} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            <Download className="size-3.5" aria-hidden /> CSV
          </a>
        }
      >
        <div className={table.wrap}>
          <table className="w-full min-w-[60rem] text-left text-sm">
            <thead>
              <tr>
                <th className={table.th}>Code</th>
                <th className={table.th}>Korting</th>
                <th className={table.th}>Geldig voor</th>
                <th className={table.th}>Geldigheid</th>
                <th className={`${table.th} text-right`}>Gebruikt</th>
                <th className={`${table.th} text-right`}>Afgerond</th>
                <th className={`${table.th} text-right`}>Eerste betalingen</th>
                <th className={table.th}>Status</th>
                <th className={table.th}>
                  <span className="sr-only">Acties</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={9}>Nog geen kortingscodes. Maak hieronder je eerste code.</EmptyRow>}
              {rows.map((r) => {
                const st = status(r, now);
                return (
                  <tr key={r.id} className="align-top">
                    <td className={table.td}>
                      <span className="font-mono text-[0.9375rem] font-bold">{r.code}</span>
                      {r.description && <span className="block text-xs text-muted">{r.description}</span>}
                      <span className="mt-1 block font-mono text-[0.6875rem] break-all text-muted">{`${site.url}/start?code=${r.code}`}</span>
                    </td>
                    <td className={table.td}>
                      {describeDiscount({ percentOff: r.percent_off, amountOffCents: r.amount_off_cents, duration: r.duration, durationMonths: r.duration_months })}
                    </td>
                    <td className={table.td}>
                      {r.products.length ? r.products.map((p) => products[p].shortName).join(", ") : "Alle producten"}
                      <span className="block text-xs text-muted">{r.durations.length ? r.durations.map(durationName).join(", ") : "Alle looptijden"}</span>
                    </td>
                    <td className={`${table.td} ${table.num}`}>
                      {r.starts_at || r.expires_at ? (
                        <>
                          {r.starts_at ? formatDate(r.starts_at) : "Nu"} – {r.expires_at ? formatDate(r.expires_at) : "geen einddatum"}
                        </>
                      ) : (
                        "Altijd"
                      )}
                    </td>
                    <td className={`${table.td} ${table.num} text-right`}>
                      {formatNumber(r.redemptions)}
                      {r.max_redemptions !== null && <span className="text-muted"> / {formatNumber(r.max_redemptions)}</span>}
                    </td>
                    <td className={`${table.td} ${table.num} text-right`} title={`${r.checkouts} keer de betaalpagina geopend met deze code`}>
                      {pct(r.redemptions, r.checkouts)}
                    </td>
                    <td className={`${table.td} ${table.num} text-right`}>{euro(r.revenue_cents)}</td>
                    <td className={table.td}>
                      <Badge tone={st.tone}>{st.label}</Badge>
                    </td>
                    <td className={`${table.td} text-right whitespace-nowrap`}>
                      <form action={toggleDiscount} className="inline">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="code" value={r.code} />
                        <input type="hidden" name="aan" value={r.active ? "0" : "1"} />
                        <input type="hidden" name="terug" value={here} />
                        <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                          {r.active ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
                          {r.active ? "Pauzeren" : "Activeren"}
                        </SubmitButton>
                      </form>
                      <form action={removeDiscount} className="ml-3 inline">
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="code" value={r.code} />
                        <input type="hidden" name="terug" value={here} />
                        <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-accent-600 hover:underline">
                          <Trash2 className="size-3.5" aria-hidden /> Verwijderen
                        </SubmitButton>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-xs text-muted">
          Afgerond: aandeel van de keren dat de betaalpagina met deze code werd geopend en ook betaald. Een gebruikte code kun je niet verwijderen,
          alleen pauzeren. Codes werken ook in landingspagina-links: zet <span className="font-mono">?code=JOUWCODE</span> achter de link.
        </p>
      </Panel>

      <Panel title="Nieuwe kortingscode" className="mt-6">
        <form action={createDiscount} className="grid gap-5 p-5 lg:grid-cols-2">
          <input type="hidden" name="terug" value={here} />
          <div>
            <label htmlFor="code" className="label">
              Code
            </label>
            <input id="code" name="code" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_\-]+" className="input font-mono uppercase" placeholder="BIJV. WELKOM10" />
            <p className="mt-1 text-xs text-muted">Letters, cijfers, - en _. Hoofdletters maken niet uit voor de klant.</p>
          </div>
          <div>
            <label htmlFor="omschrijving" className="label">
              Omschrijving (alleen voor jou)
            </label>
            <input id="omschrijving" name="omschrijving" maxLength={200} className="input" placeholder="Bijv. Influencer Sanne, voorjaarsactie" />
          </div>
          <fieldset>
            <legend className="label">Korting</legend>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="soort" value="procent" defaultChecked /> Percentage
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="soort" value="bedrag" /> Vast bedrag (€)
              </label>
              <input name="waarde" required inputMode="decimal" className="input w-28" placeholder="10" aria-label="Hoeveel korting" />
            </div>
            <p className="mt-1 text-xs text-muted">Bij een percentage 1-100, bij een bedrag in euro&apos;s (bijv. 5 of 7,50).</p>
          </fieldset>
          <div>
            <label htmlFor="duur" className="label">
              Hoe lang
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <select id="duur" name="duur" className="input w-auto" defaultValue="once">
                <option value="once">Alleen de eerste betaling</option>
                <option value="repeating">De eerste maanden</option>
                <option value="forever">Zolang het abonnement loopt</option>
              </select>
              <label className="flex items-center gap-1.5 text-sm">
                <input name="maanden" type="number" min={1} max={24} defaultValue={3} className="input w-20" /> maanden
              </label>
            </div>
            <p className="mt-1 text-xs text-muted">Het aantal maanden geldt alleen bij &quot;De eerste maanden&quot;. Bij een los schema telt alleen de betaling zelf.</p>
          </div>
          <fieldset>
            <legend className="label">Geldig voor producten (niets aangevinkt = alle)</legend>
            <div className="flex flex-wrap gap-3">
              {PRODUCT_IDS.map((p) => (
                <label key={p} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="producten" value={p} /> {products[p].shortName}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">Geldig voor looptijden (niets aangevinkt = alle)</legend>
            <div className="flex flex-wrap gap-3">
              {DURATION_IDS.map((d) => (
                <label key={d} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="looptijden" value={d} /> {durationName(d)}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-3 lg:col-span-2">
            <div>
              <label htmlFor="max" className="label">
                Maximaal aantal keer
              </label>
              <input id="max" name="max" type="number" min={1} className="input" placeholder="Onbeperkt" />
            </div>
            <div>
              <label htmlFor="start" className="label">
                Geldig vanaf
              </label>
              <input id="start" name="start" type="date" className="input" />
            </div>
            <div>
              <label htmlFor="eind" className="label">
                Geldig tot en met
              </label>
              <input id="eind" name="eind" type="date" className="input" />
            </div>
          </div>
          <div className="lg:col-span-2">
            <SubmitButton className="btn-primary !px-5 !py-2.5 text-sm">
              <Plus className="size-4" aria-hidden /> Kortingscode aanmaken
            </SubmitButton>
            <p className="mt-2 text-xs text-muted">
              De korting wordt via Stripe verrekend (de bijbehorende coupon wordt bij het eerste gebruik automatisch aangemaakt). Voorwaarden van een
              bestaande code kun je niet wijzigen; maak dan een nieuwe code en pauzeer de oude.
            </p>
          </div>
        </form>
      </Panel>
    </>
  );
}
