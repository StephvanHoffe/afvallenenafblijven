import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { markGuaranteeHandled, markWithdrawalHandled, refundOrder } from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { Badge, EmptyRow, NeedsDatabase, Notice, PageTitle, Panel, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { site } from "@/config/site";
import { stripeDashboardUrl } from "@/lib/admin/describe";
import { guaranteeDeadline } from "@/lib/guarantee";
import { euro, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Herroepingen en garantie" };

export default function HerroepingenPage({ searchParams }: PageProps<"/beheer/herroepingen">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Withdrawals searchParams={searchParams} />
    </Suspense>
  );
}

async function Withdrawals({ searchParams }: Pick<PageProps<"/beheer/herroepingen">, "searchParams">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [rows, guarantees, sp] = await Promise.all([adminData().withdrawals(), adminData().guaranteeRequests(), searchParams]);

  return (
    <>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Herroepingen en garantie"
        intro="Verklaringen via de herroepingsfunctie op de website. De klant heeft direct een ontvangstbevestiging gekregen. Beoordeel of het herroepingsrecht nog gold, betaal zo nodig terug in Stripe en laat het de klant weten."
      />
      <Panel title="Herroepingen">
        <div className={table.wrap}>
          <table className={table.table}>
            <thead>
              <tr>
                <th className={table.th}>Ontvangen</th>
                <th className={table.th}>Klant</th>
                <th className={table.th}>Bestelling</th>
                <th className={table.th}>Toelichting</th>
                <th className={table.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <EmptyRow colSpan={5}>Geen herroepingen ontvangen.</EmptyRow>}
              {rows.map((w) => (
                <tr key={w.id}>
                  <td className={`${table.td} ${table.num}`}>{formatDate(w.createdAt)}</td>
                  <td className={table.td}>
                    <span className="font-semibold">{w.name}</span>
                    <span className="block text-xs text-muted">{w.email}</span>
                  </td>
                  <td className={table.td}>{w.orderReference}</td>
                  <td className={`${table.td} max-w-xs text-muted`}>{w.message ?? "–"}</td>
                  <td className={table.td}>
                    {w.handledAt ? (
                      <Badge tone="ok">Afgehandeld {formatDate(w.handledAt)}</Badge>
                    ) : (
                      <form action={markWithdrawalHandled}>
                        <input type="hidden" name="herroeping" value={w.id} />
                        <input type="hidden" name="terug" value="/beheer/herroepingen" />
                        <SubmitButton className="btn-secondary !px-3 !py-1.5 text-xs">Markeer als afgehandeld</SubmitButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div id="garantie" className="mt-6 scroll-mt-6">
        <Panel title={`Garantie-aanvragen (${site.guarantee.days} dagen geld terug)`}>
          <p className="border-b border-line px-5 py-3.5 text-sm text-muted">
            Aangevraagd door de klant in Mijn schema&apos;s. De klant heeft een bevestiging gekregen waarin staat dat we binnen{" "}
            {site.responseTimeDays} werkdagen terugbetalen. Met &quot;Terugbetalen via Stripe&quot; betaal je de eerste betaling volledig terug,
            beëindig je het abonnement direct (niet aan het einde van de periode) en markeer je de aanvraag als afgehandeld, in één keer.
          </p>
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr>
                  <th className={table.th}>Aangevraagd</th>
                  <th className={table.th}>Klant</th>
                  <th className={table.th}>Bestelling</th>
                  <th className={table.th}>Terug</th>
                  <th className={table.th}>Reden</th>
                  <th className={table.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {guarantees.length === 0 && <EmptyRow colSpan={6}>Geen garantie-aanvragen.</EmptyRow>}
                {guarantees.map((g) => (
                  <tr key={g.id}>
                    <td className={`${table.td} ${table.num}`}>{formatDate(g.createdAt)}</td>
                    <td className={table.td}>
                      <span className="font-semibold">{g.order.customerName}</span>
                      <span className="block text-xs text-muted">{g.order.customerEmail}</span>
                    </td>
                    <td className={table.td}>
                      <span className="font-semibold">{g.order.reference}</span>
                      <span className="block text-xs text-muted">
                        {planName(g.order.product, g.order.duration)} · besteld {formatDate(g.order.createdAt)} · termijn t/m{" "}
                        {formatDate(guaranteeDeadline(g.order.createdAt))}
                      </span>
                      {(g.order.stripeSubscriptionId || g.stripeCustomerId) && (
                        <span className="mt-1 flex flex-wrap gap-x-3 text-xs">
                          {g.order.stripeSubscriptionId && (
                            <a href={stripeDashboardUrl("subscriptions", g.order.stripeSubscriptionId)} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
                              Abonnement in Stripe
                            </a>
                          )}
                          {g.stripeCustomerId && (
                            <a href={stripeDashboardUrl("customers", g.stripeCustomerId)} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 underline">
                              Betalingen in Stripe
                            </a>
                          )}
                        </span>
                      )}
                    </td>
                    <td className={`${table.td} ${table.num}`}>{euro(g.order.amountCents)}</td>
                    <td className={`${table.td} max-w-xs text-muted`}>{g.reason ?? "–"}</td>
                    <td className={table.td}>
                      {g.handledAt ? (
                        <Badge tone="ok">
                          Afgehandeld {formatDate(g.handledAt)}
                          {g.order.refundedCents > 0 && ` · ${euro(g.order.refundedCents)} terug`}
                        </Badge>
                      ) : (
                        <div className="flex flex-col items-start gap-2">
                          {g.order.refundedCents === 0 && (
                            <form action={refundOrder} className="space-y-1.5">
                              <input type="hidden" name="bestelling" value={g.order.id} />
                              <input type="hidden" name="aanvraag" value={g.id} />
                              <input type="hidden" name="reden" value="14-dagengarantie" />
                              <input type="hidden" name="terug" value="/beheer/herroepingen" />
                              {g.order.stripeSubscriptionId && (
                                <label className="flex items-center gap-1.5 text-xs">
                                  <input type="checkbox" name="beeindigen" value="1" defaultChecked /> Abonnement direct beëindigen
                                </label>
                              )}
                              <SubmitButton className="btn-primary !px-3 !py-1.5 text-xs">Terugbetalen via Stripe</SubmitButton>
                            </form>
                          )}
                          <form action={markGuaranteeHandled}>
                            <input type="hidden" name="aanvraag" value={g.id} />
                            <input type="hidden" name="terug" value="/beheer/herroepingen" />
                            <SubmitButton className="text-xs font-semibold text-muted hover:text-ink hover:underline">
                              {g.order.refundedCents > 0 ? "Markeer als afgehandeld" : "Al zelf terugbetaald, markeer als afgehandeld"}
                            </SubmitButton>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
