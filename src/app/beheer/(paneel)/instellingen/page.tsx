import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import { sendTestEmail } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Notice, PageTitle, Panel, table } from "@/components/beheer/ui";
import { PRODUCT_IDS, SUBSCRIPTION_DURATIONS, durations, monthlyPrice, products } from "@/config/pricing";
import { launchOfferEndLabel, site } from "@/config/site";
import { isAdminConfigured, isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { adminEmail } from "@/lib/email";
import { db, isDatabaseConfigured } from "@/lib/db";
import { euro } from "@/lib/format";
import { launchOfferActive } from "@/lib/launch";

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
  const sp = await searchParams;
  const env = (k: string) => demo || Boolean(process.env[k]);
  const dbOk = demo || (await databaseReachable());
  const stripeMode = demo ? "test" : (process.env.STRIPE_SECRET_KEY ?? "").startsWith("sk_live") ? "live" : "test";
  const launch = await launchOfferActive();

  const checks: { label: string; ok: boolean; detail: string }[] = [
    { label: "Database", ok: dbOk, detail: dbOk ? "Verbonden" : isDatabaseConfigured() ? "Kan niet verbinden" : "DATABASE_URL ontbreekt" },
    { label: "Stripe (betalingen)", ok: env("STRIPE_SECRET_KEY"), detail: env("STRIPE_SECRET_KEY") ? `Ingesteld (${stripeMode}modus)` : "STRIPE_SECRET_KEY ontbreekt" },
    { label: "Stripe-webhook", ok: env("STRIPE_WEBHOOK_SECRET"), detail: env("STRIPE_WEBHOOK_SECRET") ? "Ingesteld" : "STRIPE_WEBHOOK_SECRET ontbreekt" },
    { label: "Schema's maken", ok: env("ANTHROPIC_API_KEY"), detail: env("ANTHROPIC_API_KEY") ? `Ingesteld (${process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5"})` : "ANTHROPIC_API_KEY ontbreekt" },
    { label: "E-mail (SMTP)", ok: env("SMTP_HOST"), detail: env("SMTP_HOST") ? `Meldingen naar ${adminEmail()}` : "SMTP_HOST ontbreekt; e-mails komen alleen in de serverlog" },
    { label: "Dagelijkse taak", ok: env("CRON_SECRET"), detail: env("CRON_SECRET") ? "Ingesteld (elke ochtend om 06:00 UTC)" : "CRON_SECRET ontbreekt" },
    { label: "Websiteadres", ok: env("NEXT_PUBLIC_SITE_URL"), detail: site.url },
    { label: "Beheerwachtwoord", ok: demo || isAdminConfigured(), detail: demo ? "Demo-modus" : isAdminConfigured() ? "Ingesteld" : "ADMIN_PASSWORD ontbreekt of is te kort" },
  ];

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle title="Instellingen" intro="Status van de koppelingen. Waarden pas je aan bij je hosting (omgevingsvariabelen) of in de code." />
      <div className="grid gap-6 xl:grid-cols-2">
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
          <Panel title="Acties en garantie">
            <dl className="divide-y divide-line text-sm">
              <div className="flex justify-between gap-4 px-5 py-3">
                <dt className="text-muted">{site.launchOffer.label}</dt>
                <dd className="font-semibold">
                  {site.launchOffer.enabled
                    ? `${site.launchOffer.percentOff}% op eerste betaling, t/m ${launchOfferEndLabel()} (${launch ? "loopt nu" : "nu niet actief"})`
                    : "Uit"}
                </dd>
              </div>
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
