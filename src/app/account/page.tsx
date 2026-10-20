import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CircleCheck, Loader2, LogOut, TriangleAlert } from "lucide-react";
import { CheckinForm } from "@/app/account/CheckinForm";
import { cancelSubscription, logout, openBillingPortal, undoCancellation } from "@/app/account/actions";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durations, isSubscription, products } from "@/config/pricing";
import { currentCustomer } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { planTitle } from "@/lib/plans";
import { ordersForCustomer, plansForCustomer, type Order } from "@/lib/repo";

export const metadata: Metadata = {
  title: "Mijn schema's",
  robots: { index: false },
};

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <section className="container-page py-12 sm:py-16">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

function statusLabel(order: Order): { text: string; tone: "ok" | "warn" | "muted" } {
  if (!isSubscription(order.duration)) return { text: "Los schema", tone: "muted" };
  switch (order.status) {
    case "active":
      return order.cancel_at
        ? { text: `Opgezegd, loopt tot ${formatDate(order.cancel_at)}`, tone: "warn" }
        : { text: "Actief", tone: "ok" };
    case "past_due":
      return { text: "Betaling mislukt – werk je betaalgegevens bij", tone: "warn" };
    case "canceled":
      return { text: "Beëindigd", tone: "muted" };
    default:
      return { text: "Afgerond", tone: "muted" };
  }
}

async function AccountContent({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  // Altijd per verzoek renderen (ingelogde klant, actuele status).
  await connection();
  if (!isDatabaseConfigured()) {
    return <NotLoggedIn note="Mijn schema's is nog niet beschikbaar (database niet ingesteld)." />;
  }
  const customer = await currentCustomer();
  if (!customer) return <NotLoggedIn />;

  const [orders, plans, sp] = await Promise.all([ordersForCustomer(customer.id), plansForCustomer(customer.id), searchParams]);
  const wantsCancel = sp.opzeggen === "1";
  const activeSubs = orders.filter((o) => o.stripe_subscription_id && (o.status === "active" || o.status === "past_due"));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Mijn schema&apos;s</p>
          <h1 className="heading-lg">Hoi {customer.name}!</h1>
        </div>
        <form action={logout}>
          <button type="submit" className="btn-secondary !py-2.5 text-sm">
            <LogOut className="size-4" aria-hidden /> Uitloggen
          </button>
        </form>
      </div>

      {sp.opgezegd === "1" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">Je abonnement is opgezegd</h2>
          <p className="mt-1 text-[0.9375rem]">We hebben je een bevestiging per e-mail gestuurd. Hieronder zie je tot wanneer het nog loopt.</p>
        </div>
      )}

      {wantsCancel && activeSubs.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">Abonnement opzeggen</h2>
          <p className="mt-1 text-[0.9375rem]">
            Klik op &quot;Bevestig opzeggen&quot; bij het abonnement hieronder. Je houdt toegang tot je schema&apos;s en
            ontvangt een bevestiging per e-mail.
          </p>
        </div>
      )}

      <section>
        <h2 className="heading-md mb-4">Jouw schema&apos;s</h2>
        {plans.length === 0 ? (
          <p className="card p-6 text-muted">Je hebt nog geen schema&apos;s.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {plans.map((p) => (
              <li key={p.id} className="card flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-bold">{planTitle(p)}</p>
                  <p className="text-sm text-muted">
                    {p.status === "ready" && p.generated_at
                      ? `Gemaakt op ${formatDate(p.generated_at)}`
                      : p.status === "failed" && p.attempts >= 5
                        ? "Er ging iets mis; we nemen contact met je op"
                        : "Wordt gemaakt…"}
                  </p>
                </div>
                {p.status === "ready" ? (
                  <Link href={`/schema/${p.id}`} className="btn-primary !px-4 !py-2.5 text-sm">
                    Bekijk <ArrowRight className="size-4" aria-hidden />
                  </Link>
                ) : p.status === "failed" && p.attempts >= 5 ? (
                  <TriangleAlert className="size-6 text-accent-500" aria-label="Mislukt" />
                ) : (
                  <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Bezig" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="heading-md mb-4">Abonnementen & bestellingen</h2>
        <ul className="space-y-3">
          {orders.map((o) => {
            const status = statusLabel(o);
            return (
              <li key={o.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-bold">
                    {products[o.product].name} · {durations[o.duration].label}
                  </p>
                  <p className="text-sm text-muted">
                    Besteld op {formatDate(o.created_at)} · Bestelnummer {o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${
                      status.tone === "ok" ? "text-brand-700" : status.tone === "warn" ? "text-accent-600" : "text-muted"
                    }`}
                  >
                    {status.tone === "ok" && <CircleCheck className="size-4" aria-hidden />} {status.text}
                  </p>
                </div>
                {o.stripe_subscription_id && (o.status === "active" || o.status === "past_due") && (
                  <div className="flex flex-wrap items-start gap-2">
                    <form action={openBillingPortal}>
                      <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Betaalgegevens & facturen</SubmitButton>
                    </form>
                    {o.cancel_at ? (
                      <form action={undoCancellation}>
                        <input type="hidden" name="order" value={o.id} />
                        <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Opzegging intrekken</SubmitButton>
                      </form>
                    ) : (
                      <details className="group" open={wantsCancel}>
                        <summary className={`${wantsCancel ? "btn-primary" : "btn-secondary"} cursor-pointer list-none !px-4 !py-2.5 text-sm [&::-webkit-details-marker]:hidden`}>
                          Opzeggen
                        </summary>
                        <form action={cancelSubscription} className="mt-2 max-w-xs rounded-2xl bg-sand p-3 text-sm">
                          <input type="hidden" name="order" value={o.id} />
                          <p className="mb-2">Je abonnement stopt aan het einde van de lopende periode. Je houdt toegang tot je schema&apos;s.</p>
                          <SubmitButton className="btn-primary w-full !py-2.5 text-sm">Bevestig opzeggen</SubmitButton>
                        </form>
                      </details>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm text-muted">
          Wil je je bestelling herroepen? Gebruik dan de{" "}
          <Link href="/herroepen" className="font-semibold underline">
            herroepingsfunctie
          </Link>
          .
        </p>
      </section>

      {activeSubs.length > 0 && (
        <section className="card p-6 sm:p-8">
          <h2 className="heading-md">Check-in</h2>
          <p className="mt-2 mb-6 text-muted">
            Vul dit in vóór je volgende schema (elke 4 weken). Zo stemmen we je nieuwe schema af op je voortgang.
          </p>
          <CheckinForm />
        </section>
      )}
    </div>
  );
}

function NotLoggedIn({ note }: { note?: string }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="heading-lg">Mijn schema&apos;s</h1>
      <p className="mt-3 text-muted">{note ?? "Log in met je e-mailadres om je schema's te bekijken."}</p>
      <Link href="/inloggen" className="btn-primary mt-6">
        Inloggen
      </Link>
      <p className="mt-6 text-sm text-muted">
        Nog geen schema?{" "}
        <Link href="/start" className="font-semibold text-brand-700 underline">
          Start de vragenlijst
        </Link>
      </p>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden>
      <div className="h-10 w-1/3 rounded-2xl bg-line" />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="h-24 rounded-3xl bg-white" />
        <div className="h-24 rounded-3xl bg-white" />
      </div>
    </div>
  );
}
