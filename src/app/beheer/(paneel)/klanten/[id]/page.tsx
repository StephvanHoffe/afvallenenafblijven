import { describeCampaign } from "@/lib/campaign";
import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, ExternalLink, RotateCw, Send, Star, Trash2 } from "lucide-react";
import {
  adminCancelSubscription,
  deleteCustomer,
  refundOrder,
  resendPlanEmail,
  retryPlan,
  sendCustomerLoginLink,
  startPeriodWithoutCheckin,
} from "@/app/beheer/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { CustomerDetailsForm, IntakeEditForm, NotesPanelBody } from "@/components/beheer/CustomerForms";
import { Badge, NeedsDatabase, Notice, OrderStatusBadge, Panel, PlanDelivery, PlanStatusBadge, planName, table } from "@/components/beheer/ui";
import { adminData, adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { describeCheckin, describeIntake, stripeDashboardUrl } from "@/lib/admin/describe";
import { customerEmails, customerJourney, customerNotes } from "@/lib/admin/insights";
import { catalogEntry } from "@/lib/admin/mail-catalog";
import { CANCEL_REASONS, cancelReasonLabel } from "@/lib/cancel-reasons";
import type { CheckinWindow } from "@/lib/checkin";
import { euro, formatDate, formatDateTime } from "@/lib/format";
import { startsLater } from "@/lib/schedule";
import { adminNow } from "@/lib/admin/clock";

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
  const { customer: c, orders, payments, plans, intake, checkins, weekly } = detail;
  const [notes, journey, emails] = await Promise.all([customerNotes(c.id), customerJourney(c.id), customerEmails(c.email)]);
  const here = `/beheer/klanten/${c.id}`;
  const demo = isDemoMode();
  const rated = plans.filter((p) => p.rating);
  const now = adminNow();

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
            {c.email} · klant sinds {formatDate(c.createdAt)} · {c.locale === "en" ? "Engelstalig" : "Nederlandstalig"} · nieuwsbrief{" "}
            {c.marketing ? "ja" : "nee"}
            {rated.length > 0 && (
              <>
                {" "}
                · gem. beoordeling schema&apos;s {(rated.reduce((s, p) => s + (p.rating ?? 0), 0) / rated.length).toLocaleString("nl-NL", { maximumFractionDigits: 1 })}/5
              </>
            )}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Panel title="Bestellingen">
            <div className={table.wrap}>
              <table className="w-full min-w-[34rem] text-left text-sm">
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
                        {o.discountCode && (
                          <span className="mt-1 inline-block">
                            <Badge tone="info">Code {o.discountCode}</Badge>
                          </span>
                        )}
                      </td>
                      <td className={table.td}>
                        <OrderStatusBadge status={o.status} cancelAt={o.cancelAt} />
                        {o.cancelAt && <span className="block text-xs text-muted">tot {formatDate(o.cancelAt)}</span>}
                        {o.checkin && <span className="mt-1 block text-xs text-muted">{checkinLabel(o.checkin)}</span>}
                        {(o.cancelReason || o.cancelComment) && (
                          <span className="mt-1 block text-xs text-muted">
                            Reden: {cancelReasonLabel(o.cancelReason)}
                            {o.cancelComment && <> &ldquo;{o.cancelComment}&rdquo;</>}
                          </span>
                        )}
                      </td>
                      <td className={`${table.td} text-right ${table.num}`}>
                        {o.monthlyCents ? euro(o.monthlyCents) : euro(o.amountCents)}
                        {o.refundedCents > 0 && <span className="block text-xs font-semibold text-accent-600">{euro(o.refundedCents)} terugbetaald</span>}
                      </td>
                      <td className={`${table.td} ${table.num}`}>{formatDate(o.createdAt)}</td>
                      <td className={`${table.td} text-right`}>
                        {o.stripeSubscriptionId && o.status === "active" && !o.cancelAt && (
                          <details className="inline-block text-left">
                            <summary className="cursor-pointer list-none text-sm font-bold text-accent-600 [&::-webkit-details-marker]:hidden">
                              Opzeggen
                            </summary>
                            <form action={adminCancelSubscription} className="mt-2 w-64 space-y-2 rounded-xl bg-sand p-3 text-xs">
                              <input type="hidden" name="bestelling" value={o.id} />
                              <input type="hidden" name="terug" value={here} />
                              <p>Stopt aan het einde van de minimale looptijd of lopende maand. De klant krijgt een bevestiging.</p>
                              <label className="block">
                                <span className="font-semibold">Reden (voor de analyse)</span>
                                <select name="categorie" defaultValue="" className="input mt-1 !py-1.5 text-xs">
                                  <option value="">Niet opgegeven</option>
                                  {CANCEL_REASONS.map((r) => (
                                    <option key={r} value={r}>
                                      {cancelReasonLabel(r)}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <input name="reden" maxLength={1000} className="input !py-1.5 text-xs" placeholder="Toelichting (optioneel)" aria-label="Toelichting" />
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
                        {o.refundedCents === 0 && (
                          <details className="ml-3 inline-block text-left">
                            <summary className="cursor-pointer list-none text-sm font-bold text-accent-600 [&::-webkit-details-marker]:hidden">
                              Terugbetalen
                            </summary>
                            <form action={refundOrder} className="mt-2 w-64 space-y-2 rounded-xl bg-sand p-3 text-xs">
                              <input type="hidden" name="bestelling" value={o.id} />
                              <input type="hidden" name="terug" value={here} />
                              <p>
                                Betaalt de eerste betaling volledig terug via Stripe (bijv. bij de 14-dagengarantie of een herroeping). De
                                klant krijgt het bedrag binnen 5-10 werkdagen terug.
                              </p>
                              <input name="reden" maxLength={200} className="input !py-1.5 text-xs" placeholder="Reden, bijv. garantie" aria-label="Reden" />
                              {o.stripeSubscriptionId && o.status !== "canceled" && (
                                <label className="flex items-start gap-1.5">
                                  <input type="checkbox" name="beeindigen" value="1" defaultChecked className="mt-0.5" /> Abonnement direct beëindigen
                                  (geen nieuwe incasso&apos;s)
                                </label>
                              )}
                              <SubmitButton className="btn-primary w-full !py-2 text-xs">Bevestig terugbetalen</SubmitButton>
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

          <Panel title="Betalingen">
            {payments.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">
                Nog geen betalingen vastgelegd. Betalingen komen binnen via de Stripe-webhook (invoice.paid en de afgeronde checkout).
              </p>
            ) : (
              <div className={table.wrap}>
                <table className="w-full min-w-[34rem] text-left text-sm">
                  <thead>
                    <tr>
                      <th className={table.th}>Datum</th>
                      <th className={table.th}>Omschrijving</th>
                      <th className={`${table.th} text-right`}>Bedrag</th>
                      <th className={table.th}>
                        <span className="sr-only">Factuur</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className={`${table.td} whitespace-nowrap`}>{formatDate(p.date)}</td>
                        <td className={table.td}>
                          <span className="font-semibold">{paymentLabel(p.kind, p.description)}</span>
                          {p.orderReference && <span className="block text-xs text-muted">#{p.orderReference}</span>}
                        </td>
                        <td className={`${table.td} ${table.num} text-right font-semibold ${p.kind === "refund" ? "text-accent-600" : ""}`}>
                          {p.kind === "refund" ? `− ${euro(-p.amountCents)}` : euro(p.amountCents)}
                        </td>
                        <td className={`${table.td} text-right`}>
                          {p.invoiceId &&
                            (demo ? (
                              <span className="text-xs text-muted">Factuur (demo)</span>
                            ) : (
                              <a href={invoiceHref(p.id)} target="_blank" rel="noopener" className="text-sm font-semibold text-brand-700 hover:underline">
                                Factuur
                              </a>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="border-t border-line px-5 py-3 text-xs text-muted">
              Totaal ontvangen: {euro(payments.reduce((sum, p) => sum + p.amountCents, 0))} (na terugbetalingen, inclusief btw). De klant ziet dezelfde
              lijst met facturen in Mijn schema&apos;s onder Betalingen.
            </p>
          </Panel>

          <Panel title="Schema's">
            <div className={table.wrap}>
              <table className="w-full min-w-[34rem] text-left text-sm">
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
                        {startsLater(p.startsAt, now) && (
                          <span className="block text-xs font-semibold text-brand-700">Start {formatDate(p.startsAt)}</span>
                        )}
                        {p.error && <span className="block max-w-xs truncate text-xs text-accent-600">{p.error}</span>}
                        {p.rating && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                            <Star className="size-3 fill-current text-amber-500" aria-hidden /> {p.rating}/5
                          </span>
                        )}
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

          <Panel title="Verstuurde e-mails" action={<Link href={`/beheer/emails?weergave=log&q=${encodeURIComponent(c.email)}`} className="text-sm font-semibold text-brand-700 hover:underline">Alle in log</Link>}>
            {emails.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">Nog geen e-mails gelogd voor dit adres.</p>
            ) : (
              <ul className="divide-y divide-line">
                {emails.slice(0, 20).map((m) => (
                  <li key={m.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 py-2.5 text-sm">
                    <span className="min-w-0">
                      <span className="font-medium">{m.subject}</span>
                      <span className="block text-xs text-muted">{(m.kind && catalogEntry(m.kind)?.label) ?? m.kind ?? "Overig"}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted tabular-nums">
                      {m.status !== "sent" && <Badge tone={m.status === "failed" ? "bad" : "muted"}>{m.status === "failed" ? "Mislukt" : "Niet verstuurd"}</Badge>}
                      {formatDateTime(m.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Notities">
            <NotesPanelBody customerId={c.id} notes={notes} back={here} />
          </Panel>

          <Panel title="Gegevens">
            <CustomerDetailsForm customer={c} back={here} />
          </Panel>

          <Panel title="Klantreis">
            {journey ? (
              <dl className="divide-y divide-line text-sm">
                {(
                  [
                    ["Eerste bezoek", formatDateTime(journey.firstAt)],
                    ["Binnengekomen via", journey.source ?? "Direct of onbekend"],
                    ["Campagne", journey.campaign ?? "–"],
                    ["Eerste pagina", journey.landing ?? "–"],
                    ["Apparaat", journey.device === "mobiel" ? "Mobiel" : journey.device === "tablet" ? "Tablet" : journey.device === "desktop" ? "Computer" : "–"],
                    ["Bekeken pagina's", journey.pages.length ? journey.pages.join(" → ") : "–"],
                    ["Vragen beantwoord", `${journey.stepsSeen}`],
                    [
                      "Tijd tot bestelling",
                      journey.minutesToOrder === null
                        ? "–"
                        : journey.minutesToOrder < 60
                          ? `${journey.minutesToOrder} min`
                          : `${Math.floor(journey.minutesToOrder / 60)} u ${journey.minutesToOrder % 60} min`,
                    ],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3 px-5 py-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="font-medium break-words">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="px-5 py-6 text-sm text-muted">
                Geen bezoekgegevens: de klant bestelde vóór de meting bestond, had &quot;niet volgen&quot; aan in de browser, of het bezoek is ouder
                dan 13 maanden.
              </p>
            )}
          </Panel>

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
            {intake && (
              <details className="border-t border-line">
                <summary className="cursor-pointer px-5 py-3 text-sm font-bold text-brand-700">Antwoorden aanpassen</summary>
                <IntakeEditForm customerId={c.id} intake={intake.data} back={here} />
              </details>
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

/** Link naar de factuur (pdf) van een betaling; de route vraagt Stripe om een verse link. */
function invoiceHref(paymentId: string): string {
  return `/beheer/factuur/${encodeURIComponent(paymentId)}`;
}

function paymentLabel(kind: "payment" | "refund", description: string | null): string {
  if (kind === "refund") return description ? `Terugbetaling (${description})` : "Terugbetaling";
  switch (description) {
    case "subscription_create":
      return "Eerste betaling";
    case "subscription_cycle":
      return "Maandbedrag (incasso)";
    case "eenmalig":
      return "Los schema";
    default:
      return description ? `Betaling (${description})` : "Betaling";
  }
}
