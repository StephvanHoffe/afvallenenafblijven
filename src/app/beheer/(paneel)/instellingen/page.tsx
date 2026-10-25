import { isAppleHealthEnabled, isJunctionConfigured, isWithingsConfigured, junctionProviders } from "@/lib/health/config";
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleAlert, CircleCheck, Download, Mail, Save } from "lucide-react";
import { saveCheckoutReminder, saveDelivery, sendTestEmail, setApprovalMode } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Notice, PageTitle, Panel, table } from "@/components/beheer/ui";
import { PRODUCT_IDS, SUBSCRIPTION_DURATIONS, durations, monthlyPrice, products } from "@/config/pricing";
import { site } from "@/config/site";
import { adminNow } from "@/lib/admin/clock";
import { isAdminConfigured, isDemoMode, mustChangePassword, requireAdmin } from "@/lib/admin/auth";
import { adminEmail } from "@/lib/email";
import { mollieMode, webhookUrl } from "@/lib/mollie";
import { db, isDatabaseConfigured, loadStoredConfig } from "@/lib/db";
import { euro, formatDateTime } from "@/lib/format";
import { adminData } from "@/lib/admin/data";
import { lastCronRun } from "@/lib/admin/koppelingen";
import { EXPORTS, exportHref, type ExportKind } from "@/lib/admin/export";
import Link from "@/i18n/Link";
import { checkoutReminderSettings, deliverySettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Instellingen" };

export default function InstellingenPage({ searchParams }: PageProps<"/beheer/instellingen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Settings searchParams={searchParams} />
    </Suspense>
  );
}

async function databaseReachable(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const sql = await db();
    await sql`select 1`;
    return true;
  } catch {
    return false;
  }
}

async function Settings({ searchParams }: Pick<PageProps<"/beheer/instellingen">, "searchParams">) {
  const demo = isDemoMode();
  if (!demo) await connection();
  await requireAdmin();
  // Koppelingen kunnen in het beheer staan in plaats van bij de hosting.
  if (!demo) await loadStoredConfig();
  const sp = await searchParams;
  const env = (k: string) => demo || Boolean(process.env[k]);
  const dbOk = demo || (await databaseReachable());
  const paymentMode = demo ? "test" : mollieMode();
  const webhook = demo ? `${site.url}/api/webhooks/mollie` : webhookUrl();
  const nowMs = adminNow();
  const mustChange = demo ? false : await mustChangePassword();
  const cronRun = dbOk && !demo ? await lastCronRun().catch(() => null) : null;
  const cronRecent = Boolean(cronRun && nowMs - cronRun.getTime() < 30 * 60 * 1000);
  const approval = dbOk ? await adminData().approvalRequired().catch(() => false) : false;
  const [delivery, reminder] = await Promise.all([deliverySettings(), demo ? Promise.resolve({ enabled: true, delayHours: 3 }) : checkoutReminderSettings()]);
  const here = "/beheer/instellingen";

  const checks: { label: string; ok: boolean; detail: string }[] = [
    { label: "Database", ok: dbOk, detail: dbOk ? "Verbonden" : isDatabaseConfigured() ? "Kan niet verbinden" : "DATABASE_URL ontbreekt" },
    { label: "Mollie (betalingen)", ok: env("MOLLIE_API_KEY"), detail: env("MOLLIE_API_KEY") ? `Ingesteld (${paymentMode}modus)` : "Nog niet ingevuld: zie Koppelingen" },
    {
      label: "Mollie-webhook",
      ok: Boolean(webhook),
      detail: webhook
        ? `Gaat automatisch mee met elke betaling: ${webhook}`
        : "Lokaal adres in NEXT_PUBLIC_SITE_URL: Mollie kan de website niet bereiken (de bedankpagina vangt eerste betalingen op)",
    },
    { label: "Schema's maken", ok: env("ANTHROPIC_API_KEY"), detail: env("ANTHROPIC_API_KEY") ? `Ingesteld (${process.env.ANTHROPIC_MODEL || "claude-opus-5-5"})` : "Nog niet ingevuld: zie Koppelingen" },
    { label: "E-mail (SMTP)", ok: env("SMTP_HOST"), detail: env("SMTP_HOST") ? `Meldingen naar ${adminEmail()}` : "Nog niet ingevuld (zie Koppelingen); e-mails komen alleen in de serverlog" },
    {
      label: "Geplande taak",
      ok: demo || cronRecent,
      detail:
        demo || cronRecent
          ? `${cronRun ? `Laatst gedraaid: ${formatDateTime(cronRun)}. ` : ""}Elke 5 minuten (schema's vrijgeven en mailen); herinneringen dagelijks vanaf 08:00. ${process.env.CRON_SECRET ? "Beveiligd met CRON_SECRET." : "Zonder sleutel: hooguit eens per 3 minuten."}`
          : cronRun
            ? `Laatst gedraaid: ${formatDateTime(cronRun)}. Draait niet meer elke 5 minuten: controleer of je project op Vercel Pro staat.`
            : "Nog niet gedraaid: controleer of je project op Vercel Pro staat (zie Koppelingen).",
    },
    { label: "Websiteadres", ok: true, detail: site.url },
    {
      label: "Gezondheidsapps: Withings (optioneel)",
      ok: demo || isWithingsConfigured(),
      detail: demo || isWithingsConfigured() ? "Ingesteld" : "Niet ingesteld (WITHINGS_CLIENT_ID, WITHINGS_CLIENT_SECRET en HEALTH_ENCRYPTION_KEY)",
    },
    {
      label: "Gezondheidsapps: Junction (optioneel)",
      ok: demo || isJunctionConfigured(),
      detail:
        demo || isJunctionConfigured()
          ? `Ingesteld: ${junctionProviders().join(", ")}${demo || isAppleHealthEnabled() ? " + Apple Health" : ""}${demo || process.env.JUNCTION_WEBHOOK_SECRET ? "" : " (JUNCTION_WEBHOOK_SECRET ontbreekt)"}`
          : "Niet ingesteld (JUNCTION_API_KEY)",
    },
    {
      label: "Beheerwachtwoord",
      ok: demo || (isAdminConfigured() && !mustChange),
      detail: demo ? "Demo-modus" : mustChange ? "Nog het startwachtwoord: kies een eigen wachtwoord" : "Eigen wachtwoord ingesteld (wijzigen kan bij Koppelingen)",
    },
  ];

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Instellingen"
        intro="Levering, herinneringen en exports pas je hier aan. Mollie, Claude en e-mail vul je in bij Koppelingen; prijzen en acties staan in de code."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Koppelingen">
          <ul className="divide-y divide-line">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-3 px-5 py-3 text-sm">
                {c.ok ? (
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-600" aria-label="In orde" />
                ) : (
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-accent-500" aria-label="Actie nodig" />
                )}
                <span>
                  <span className="font-semibold">{c.label}</span>
                  <span className="block text-muted">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <form action={sendTestEmail} className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4">
            <input type="hidden" name="terug" value="/beheer/instellingen" />
            <p className="text-sm text-muted">Stuur een testmail naar {demo ? "het beheeradres" : adminEmail()}.</p>
            <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
              <Mail className="size-4" aria-hidden /> Testmail versturen
            </SubmitButton>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel title="Levering van schema's">
            <form action={saveDelivery} className="space-y-3 px-5 py-4 text-sm">
              <input type="hidden" name="terug" value={here} />
              <p>
                Een nieuw schema wordt direct gemaakt en staat op een willekeurig moment tussen het minimum en maximum voor de klant klaar
                (belofte op de website: binnen {site.delivery.promiseHours} uur). De klant krijgt dan een e-mail.
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block">
                  <span className="label">Minimaal (minuten)</span>
                  <input name="min" type="number" min={0} max={site.delivery.promiseHours * 60 - 10} defaultValue={delivery.minMinutes} className="input w-28 !py-2.5" />
                </label>
                <label className="block">
                  <span className="label">Maximaal (minuten)</span>
                  <input name="max" type="number" min={0} max={site.delivery.promiseHours * 60 - 10} defaultValue={delivery.maxMinutes} className="input w-28 !py-2.5" />
                </label>
              </div>
              <label className="flex items-start gap-2">
                <input type="checkbox" name="naCheckin" value="1" defaultChecked={delivery.afterCheckin} className="mt-0.5" />
                <span>
                  Ook na een check-in met vertraging leveren
                  <span className="block text-xs text-muted">Uit = na een check-in staat het nieuwe schema klaar zodra het gemaakt is.</span>
                </span>
              </label>
              <p className="text-xs text-muted">
                Maximaal {site.delivery.promiseHours * 60 - 10} minuten, zodat de geplande taak (elke 5 minuten) de belofte altijd haalt.
                0 en 0 = direct leveren.
              </p>
              <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                <Save className="size-4" aria-hidden /> Levering opslaan
              </SubmitButton>
            </form>
            {dbOk && (
              <form action={setApprovalMode} className="space-y-3 border-t border-line px-5 py-4 text-sm">
                <input type="hidden" name="terug" value={here} />
                <input type="hidden" name="aan" value={approval ? "0" : "1"} />
                <p className="text-muted">
                  <strong className="text-ink">Schema&apos;s eerst zelf goedkeuren:</strong> {approval ? "staat aan" : "staat uit"}. Staat dit aan,
                  dan gaat een schema pas naar de klant als jij het in het beheer hebt goedgekeurd. Je krijgt per schema een e-mail met
                  het tijdstip waarop de klant het uiterlijk verwacht. Handig als steekproef in de eerste weken.
                </p>
                <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                  {approval ? "Goedkeuren uitzetten" : "Goedkeuren aanzetten"}
                </SubmitButton>
              </form>
            )}
          </Panel>

          <div id="herinnering" className="scroll-mt-6">
            <Panel title="Herinnering bij niet-afgeronde betaling">
              <form action={saveCheckoutReminder} className="space-y-3 px-5 py-4 text-sm">
                <input type="hidden" name="terug" value={here} />
                <p>
                  Vult iemand de vragenlijst in maar rondt de betaling niet af, dan sturen we één keer een vriendelijke herinnering met een
                  link waarmee de antwoorden al ingevuld zijn. Alleen als de bezoeker toestemming gaf voor e-mail (nieuwsbrief), alleen tussen
                  08:00 en 21:00 en niet als die persoon intussen toch heeft besteld.
                </p>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="aan" value="1" defaultChecked={reminder.enabled} /> Herinnering aan
                </label>
                <label className="block">
                  <span className="label">Versturen na (uur)</span>
                  <input name="uren" type="number" min={1} max={48} defaultValue={reminder.delayHours} className="input w-28 !py-2.5" />
                </label>
                <p className="text-xs text-muted">
                  De tekst van de mail pas je aan onder <Link href="/beheer/emails/checkout-reminder" className="font-semibold text-brand-700 underline">E-mails</Link>.
                  Je kunt ook per persoon een herinnering sturen vanuit de <Link href="/beheer/funnel#afgehaakt" className="font-semibold text-brand-700 underline">funnel</Link>.
                </p>
                <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                  <Save className="size-4" aria-hidden /> Opslaan
                </SubmitButton>
              </form>
            </Panel>
          </div>

          <Panel title="Gegevens exporteren (CSV)">
            <ul className="divide-y divide-line text-sm">
              {Object.entries(EXPORTS).map(([kind, label]) => (
                <li key={kind}>
                  <a href={exportHref(kind as ExportKind)} className="flex items-center justify-between gap-3 px-5 py-3 font-semibold hover:bg-sand/50">
                    {label}
                    <Download className="size-4 text-muted" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              Opent direct in Excel of Numbers. Gebruik de nieuwsbrieflijst alleen voor mensen die toestemming gaven, en bewaar exports niet
              langer dan nodig.
            </p>
          </Panel>

          <Panel title="Acties en garantie">
            {process.env.PROMOTION_OVERRIDE && (
              <p className="border-b border-line bg-accent-50 px-5 py-3 text-sm font-semibold text-accent-600">
                PROMOTION_OVERRIDE staat aan ({process.env.PROMOTION_OVERRIDE}): die actie geldt nu, ook bij het afrekenen. Alleen voor testen; haal hem
                weg in productie.
              </p>
            )}
            <dl className="divide-y divide-line text-sm">
              {site.promotions.map((p) => {
                const start = Date.parse(p.startsAt);
                const end = Date.parse(p.endsAt);
                const status = !p.enabled ? "uit" : nowMs > end ? "afgelopen" : nowMs >= start ? "loopt nu" : "gepland";
                const date = (iso: string) => new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Amsterdam" }).format(new Date(iso));
                return (
                  <div key={p.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-3">
                    <dt>
                      <span className="text-muted">{p.label}</span>
                      <span className="block text-xs text-muted">
                        {date(p.startsAt)} t/m {date(p.endsAt)} · {status}
                      </span>
                    </dt>
                    <dd className="text-right font-semibold">
                      {(["12m", "6m", "3m", "1m", "eenmalig"] as const)
                        .filter((d) => p.percentOff[d] > 0)
                        .map((d) => `${d === "eenmalig" ? "los" : d === "1m" ? "per maand" : durations[d].label} ${p.percentOff[d]}%`)
                        .join(" · ")}
                      <span className="block text-xs font-normal text-muted">
                        {p.months > 1 ? `op de eerste ${p.months} maanden (los schema: de betaling)` : "op de eerste betaling"}
                        {p.theme === "blackfriday" ? " · Black Friday-thema op de landingspagina's" : ""}
                      </span>
                    </dd>
                  </div>
                );
              })}
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted">Tevredenheidsgarantie</dt>
                <dd className="font-semibold">{site.guarantee.enabled ? `${site.guarantee.days} dagen` : "Uit"}</dd>
              </div>
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted">Nieuw schema voor abonnees</dt>
                <dd className="font-semibold">Elke {site.planIntervalDays} dagen</dd>
              </div>
            </dl>
            <p className="border-t border-line px-5 py-3 text-xs text-muted">Aanpassen in src/config/site.ts.</p>
          </Panel>

          <Panel title="Prijzen per maand (incl. btw)">
            <div className={table.wrap}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className={table.th}>Plan</th>
                    {SUBSCRIPTION_DURATIONS.map((d) => (
                      <th key={d} className={`${table.th} text-right`}>
                        {d === "1m" ? "Per maand" : `Min. ${durations[d].label}`}
                      </th>
                    ))}
                    <th className={`${table.th} text-right`}>Los</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCT_IDS.map((p) => (
                    <tr key={p}>
                      <td className={`${table.td} font-semibold`}>{products[p].shortName}</td>
                      {SUBSCRIPTION_DURATIONS.map((d) => (
                        <td key={d} className={`${table.td} text-right ${table.num}`}>
                          {euro(monthlyPrice(p, d))}
                        </td>
                      ))}
                      <td className={`${table.td} text-right ${table.num}`}>{euro(monthlyPrice(p, "eenmalig"))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-3 text-xs text-muted">Aanpassen in src/config/pricing.ts; nieuwe prijzen gelden voor nieuwe klanten.</p>
          </Panel>
        </div>
      </div>
    </>
  );
}
