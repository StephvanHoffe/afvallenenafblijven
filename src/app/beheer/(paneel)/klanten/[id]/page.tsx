import { describeCampaign } from "@/lib/campaign";
import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, ExternalLink, RotateCw, Send, Trash2 } from "lucide-react";
import {
  adminCancelSubscription,
  deleteCustomer,
  resendPlanEmail,
  retryPlan,
  sendCustomerLoginLink,
  startPeriodWithoutCheckin,
} from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { NeedsDatabase, Notice, OrderStatusBadge, Panel, PlanDelivery, PlanStatusBadge, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { describeCheckin, describeIntake, stripeDashboardUrl } from "@/lib/admin/describe";
import type { CheckinWindow } from "@/lib/checkin";
import { euro, formatDate } from "@/lib/format";
import { startsLater } from "@/lib/schedule";

export const metadata: Metadata = { title: "Klant" };

export default function KlantPage({ params, searchParams }: PageProps<"/beheer/klanten/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <CustomerDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const small = "btn-secondary !px-3.5 !py-2 text-sm";

function checkinLabel(c: CheckinWindow): string {
  switch (c.status) {
    case "upcoming":
      return `Check-in periode ${c.seq} opent ${formatDate(c.opensAt)}`;
    case "open":
      return `Check-in periode ${c.seq} staat open (nieuwe periode start ${formatDate(c.dueAt)}, advies: invullen uiterlijk ${formatDate(c.advisedBy)})`;
    case "overdue":
      return `Check-in periode ${c.seq} verlopen sinds ${formatDate(c.dueAt)}`;
    default:
      return `Check-in periode ${c.seq} ontvangen`;
  }
}

async function CustomerDetail({ params, searchParams }: PageProps<"/beheer/klanten/[id]">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [detail, approval] = await Promise.all([adminData().customer(id), adminData().approvalRequired()]);
  if (!detail) notFound();
  const { customer: c, orders, plans, intake, checkins, weekly } = detail;
  const here = `/beheer/klanten/${c.id}`;
  const demo = isDemoMode();

  return (
    <>
      <Link href="/beheer/klanten" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Klanten
      </Link>
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{c.name}</h1>
          <p className="mt-1 text-[0.9375rem] text-muted">
            {c.email} · klant sinds {formatDate(c.createdAt)} · nieuwsbrief {c.marketing ? "ja" : "nee"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={sendCustomerLoginLink}>
            <input type="hidden" name="klant" value={c.id} />
            <input type="hidden" name="terug" value={here} />
            <SubmitButton className={small}>
              <Send className="size-4" aria-hidden /> Inloglink sturen
            </SubmitButton>
          </form>
          {c.stripeCustomerId && !demo && (
            <a href={stripeDashboardUrl("customers", c.stripeCustomerId)} target="_blank" rel="noopener noreferrer" className={small}>
              <ExternalLink className="size-4" aria-hidden /> Open in Stripe
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Bestellingen">
            <div className={table.wrap}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className={table.th}>Plan</th>
                    <th className={table.th}>Status</th>
                    <th className={`${table.th} text-right`}>Per maand</th>
                    <th className={table.th}>Besteld</th>
                    <th className={table.th}>
                      <span className="sr-only">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td className={table.td}>
                        <span className="font-semibold">{planName(o.product, o.duration)}</span>
                        <span className="block text-xs text-muted">#{o.reference}</span>
                        {o.campaign && <span className="block text-xs text-muted">Via {describeCampaign(o.campaign)}</span>}
                      </td>
                      <td className={table.td}>
                        <OrderStatusBadge status={o.status} cancelAt={o.cancelAt} />
                        {o.cancelAt && <span className="block text-xs text-muted">tot {formatDate(o.cancelAt)}</span>}
                        {o.checkin && <span className="mt-1 block text-xs text-muted">{checkinLabel(o.checkin)}</span>}
                      </td>
                      <td className={`${table.td} text-right ${table.num}`}>{o.monthlyCents ? euro(o.monthlyCents) : euro(o.amountCents)}</td>
                      <td className={`${table.td} ${table.num}`}>{formatDate(o.createdAt)}</td>
                      <td className={`${table.td} text-right`}>
                        {o.stripeSubscriptionId && o.status === "active" && !o.cancelAt && (
                          <details className="inline-block text-left">
                            <summary className="cursor-pointer list-none text-sm font-bold text-accent-600 [&::-webkit-details-marker]:hidden">
                              Opzeggen
                            </summary>
                            <form action={adminCancelSubscription} className="mt-2 w-56 rounded-xl bg-sand p-3 text-xs">
                              <input type="hidden" name="bestelling" value={o.id} />
                              <input type="hidden" name="terug" value={here} />
                              <p className="mb-2">Stopt aan het einde van de minimale looptijd of lopende maand. De klant krijgt een bevestiging.</p>
                              <SubmitButton className="btn-primary w-full !py-2 text-xs">Bevestig opzeggen</SubmitButton>
                            </form>
                          </details>
                        )}
                        {o.checkin && o.checkin.status !== "submitted" && (
                          <details className="ml-3 inline-block text-left">
                            <summary className="cursor-pointer list-none text-sm font-bold text-brand-700 [&::-webkit-details-marker]:hidden">
                              Nieuwe periode
                            </summary>
                            <form action={startPeriodWithoutCheckin} className="mt-2 w-60 rounded-xl bg-sand p-3 text-xs">
                              <input type="hidden" name="bestelling" value={o.id} />
                              <input type="hidden" name="terug" value={here} />
                              <p className="mb-2">
                                Maakt nu de schema&apos;s voor periode {o.checkin.seq} zonder check-in, op basis van de laatst bekende
                                gegevens. Alleen gebruiken als de klant zijn gegevens op een andere manier heeft doorgegeven.
                              </p>
                              <SubmitButton className="btn-primary w-full !py-2 text-xs">Start periode {o.checkin.seq}</SubmitButton>
                            </form>
                          </details>
                        )}
                        {o.stripeSubscriptionId && !demo && (
                          <a
                            href={stripeDashboardUrl("subscriptions", o.stripeSubscriptionId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 text-sm font-semibold text-muted hover:text-ink"
                          >
                            Stripe
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Schema's">
            <div className={table.wrap}>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr>
                    <th className={table.th}>Schema</th>
                    <th className={table.th}>Status</th>
                    <th className={table.th}>Gemaakt</th>
                    <th className={table.th}>
                      <span className="sr-only">Acties</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td className={table.td}>
                        <Link href={`/beheer/schemas/${p.id}`} className="font-semibold hover:underline">
                          {p.type === "voeding" ? "Voeding" : "Training"} · periode {p.seq}
                        </Link>
                        {startsLater(p.startsAt) && (
                          <span className="block text-xs font-semibold text-brand-700">Start {formatDate(p.startsAt)}</span>
                        )}
                        {p.error && <span className="block max-w-xs truncate text-xs text-accent-600">{p.error}</span>}
                      </td>
                      <td className={table.td}>
                        <PlanStatusBadge status={p.status} attempts={p.attempts} />
                        <PlanDelivery plan={p} approval={approval} />
                      </td>
                      <td className={`${table.td} ${table.num}`}>{p.generatedAt ? formatDate(p.generatedAt) : "–"}</td>
                      <td className={`${table.td} text-right`}>
                        {p.status === "ready" && p.releasedAt && (
                          <form action={resendPlanEmail} className="inline">
                            <input type="hidden" name="plan" value={p.id} />
                            <input type="hidden" name="terug" value={here} />
                            <SubmitButton className="text-sm font-semibold text-brand-700 hover:underline">Mail opnieuw</SubmitButton>
                          </form>
                        )}
                        {p.status !== "generating" && (
                          <form action={retryPlan} className="inline sm:ml-3">
                            <input type="hidden" name="plan" value={p.id} />
                            <input type="hidden" name="terug" value={here} />
                            <SubmitButton className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                              <RotateCw className="size-3.5" aria-hidden /> Opnieuw maken
                            </SubmitButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Weegmomenten">
            {weekly.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">Nog geen weegmomenten.</p>
            ) : (
              <ul className="divide-y divide-line">
                {weekly.map((w) => (
                  <li key={`${w.seq}-${w.week}`} className="px-5 py-3 text-sm">
                    <p className="font-semibold">
                      Periode {w.seq}, week {w.week} · {formatDate(w.createdAt)} · {String(w.data.weightKg).replace(".", ",")} kg
                    </p>
                    <p className="text-muted">
                      {[w.data.energy && `energie: ${w.data.energy}`, w.data.hunger && `honger: ${w.data.hunger}`, w.data.nutritionAdherence && `voeding: ${w.data.nutritionAdherence}`, w.data.difficulty && `training: ${w.data.difficulty}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-0.5">
                      {w.status !== "ready"
                        ? "Aanwijzingen worden gemaakt…"
                        : w.adjustment && (w.adjustment.kcal || w.adjustment.training)
                          ? `Bijgestuurd: ${[w.adjustment.kcal ? `${w.adjustment.kcal > 0 ? "+" : ""}${w.adjustment.kcal} kcal` : null, w.adjustment.training ? `training ${w.adjustment.training}` : null].filter(Boolean).join(", ")}`
                          : "Op koers, niets aangepast"}
                    </p>
                    {w.data.comments && <p className="mt-1">&ldquo;{w.data.comments}&rdquo;</p>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Check-ins">
            {checkins.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">Nog geen check-ins.</p>
            ) : (
              <ul className="divide-y divide-line">
                {checkins.map((ci) => (
                  <li key={ci.createdAt.toISOString()} className="px-5 py-3 text-sm">
                    <p className="font-semibold">
                      {ci.forSeq ? `Voor periode ${ci.forSeq}` : "Check-in"} · {formatDate(ci.createdAt)}
                    </p>
                    <dl className="mt-1.5 grid grid-cols-[9rem_minmax(0,1fr)] gap-x-3 gap-y-0.5">
                      {describeCheckin(ci.data).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="text-muted">{k}</dt>
                          <dd className="break-words">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Antwoorden vragenlijst">
            {intake ? (
              <dl className="divide-y divide-line text-sm">
                {describeIntake(intake.data).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-5 py-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
                <div className="px-5 py-3 text-xs text-muted">
                  Toestemmingen gegeven op {formatDate(intake.createdAt)}: gezondheidsgegevens, voorwaarden en directe levering
                  {intake.consents.marketing ? ", nieuwsbrief" : ""}.
                </div>
              </dl>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">Geen vragenlijst gevonden.</p>
            )}
          </Panel>

          <Panel title="Klant verwijderen">
            <form action={deleteCustomer} className="space-y-3 p-5 text-sm">
              <input type="hidden" name="klant" value={c.id} />
              <input type="hidden" name="terug" value={here} />
              <p className="text-muted">
                Verwijdert de klant met alle bestellingen, schema&apos;s, antwoorden en check-ins (AVG-verzoek). Zeg een lopend
                abonnement eerst op. Facturen blijven bewaard in Stripe.
              </p>
              <label className="block">
                <span className="label">Typ VERWIJDER ter bevestiging</span>
                <input name="bevestiging" className="input !py-2.5 text-sm" autoComplete="off" />
              </label>
              <SubmitButton className="btn-secondary !border-accent-200 !px-4 !py-2 text-sm !text-accent-600">
                <Trash2 className="size-4" aria-hidden /> Definitief verwijderen
              </SubmitButton>
            </form>
          </Panel>
        </div>
      </div>
    </>
  );
}
