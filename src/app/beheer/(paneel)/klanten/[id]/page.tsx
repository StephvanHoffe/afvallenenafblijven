import type { Metadata } from "next";
import Link from "next/link";
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
} from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { NeedsDatabase, Notice, OrderStatusBadge, Panel, PlanStatusBadge, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { describeIntake, stripeDashboardUrl } from "@/lib/admin/describe";
import { euro, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Klant" };

export default function KlantPage({ params, searchParams }: PageProps<"/beheer/klanten/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <CustomerDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const small = "btn-secondary !px-3.5 !py-2 text-sm";

async function CustomerDetail({ params, searchParams }: PageProps<"/beheer/klanten/[id]">) {
  if (!isDemoMode()) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const detail = await adminData().customer(id);
  if (!detail) notFound();
  const { customer: c, orders, plans, intake, checkins } = detail;
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
                      </td>
                      <td className={table.td}>
                        <OrderStatusBadge status={o.status} cancelAt={o.cancelAt} />
                        {o.cancelAt && <span className="block text-xs text-muted">tot {formatDate(o.cancelAt)}</span>}
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
                        {p.error && <span className="block max-w-xs truncate text-xs text-accent-600">{p.error}</span>}
                      </td>
                      <td className={table.td}>
                        <PlanStatusBadge status={p.status} attempts={p.attempts} />
                      </td>
                      <td className={`${table.td} ${table.num}`}>{p.generatedAt ? formatDate(p.generatedAt) : "–"}</td>
                      <td className={`${table.td} text-right`}>
                        {p.status === "ready" && (
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

          <Panel title="Check-ins">
            {checkins.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">Nog geen check-ins.</p>
            ) : (
              <ul className="divide-y divide-line">
                {checkins.map((ci) => (
                  <li key={ci.createdAt.toISOString()} className="px-5 py-3 text-sm">
                    <p className="font-semibold">{formatDate(ci.createdAt)}</p>
                    <p className="text-muted">
                      {[
                        ci.data.weightKg ? `${ci.data.weightKg} kg` : null,
                        ci.data.energy ? `energie: ${ci.data.energy}` : null,
                        ci.data.hunger ? `honger: ${ci.data.hunger}` : null,
                        ci.data.difficulty ? `haalbaarheid: ${ci.data.difficulty}` : null,
                        ci.data.goal ? `nieuw doel: ${ci.data.goal}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {ci.data.comments && <p className="mt-1">&ldquo;{ci.data.comments}&rdquo;</p>}
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
