import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Dumbbell,
  Loader2,
  LogOut,
  Salad,
  TriangleAlert,
} from "lucide-react";
import { CheckinForm } from "@/app/(site)/account/CheckinForm";
import { cancelSubscription, logout, openBillingPortal, undoCancellation } from "@/app/(site)/account/actions";
import { DemoButton } from "@/components/account/DemoButton";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durations, products, type DurationId, type PlanType, type ProductId } from "@/config/pricing";
import { formatDate } from "@/lib/format";
import { site } from "@/config/site";
import type { OrderStatus, PlanStatus } from "@/lib/repo";

export interface DashboardOrder {
  id: string;
  reference: string;
  product: ProductId;
  duration: DurationId;
  status: OrderStatus;
  cancelAt: Date | null;
  createdAt: Date;
  /** Heeft een lopend Stripe-abonnement dat de klant kan beheren. */
  manageable: boolean;
  commitmentEndsAt: Date | null;
  nextPlanAt: Date | null;
}

export interface DashboardPlan {
  id: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  generatedAt: Date | null;
  failed: boolean;
  href: string;
}

interface Props {
  name: string;
  orders: DashboardOrder[];
  plans: DashboardPlan[];
  notice?: "opgezegd" | "opzeggen" | null;
  /** Voorbeeldweergave: knoppen doen niets en tonen een uitleg. */
  demo?: boolean;
}

const planMeta: Record<PlanType, { title: string; icon: typeof Salad; image: string }> = {
  voeding: { title: "Voedingsschema", icon: Salad, image: "/images/bowl-salmon.jpg" },
  training: { title: "Trainingsschema", icon: Dumbbell, image: "/images/woman-overhead-press.jpg" },
};

function orderStatus(order: DashboardOrder): { text: string; tone: "ok" | "warn" | "muted" } {
  if (order.duration === "eenmalig") return { text: "Los schema", tone: "muted" };
  switch (order.status) {
    case "active":
      return order.cancelAt
        ? { text: `Opgezegd, loopt tot ${formatDate(order.cancelAt)}`, tone: "warn" }
        : { text: "Actief", tone: "ok" };
    case "past_due":
      return { text: "Afschrijving mislukt", tone: "warn" };
    case "canceled":
      return { text: "Beëindigd", tone: "muted" };
    default:
      return { text: "Afgerond", tone: "muted" };
  }
}

function Pill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-brand-50 text-brand-800",
    warn: "bg-accent-50 text-accent-600",
    muted: "bg-sand text-muted",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>
      {tone === "ok" && <CircleCheck className="size-3.5" aria-hidden />}
      {tone === "warn" && <TriangleAlert className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function AccountDashboard({ name, orders, plans, notice = null, demo = false }: Props) {
  const activeSubs = orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const mainSub = activeSubs[0] ?? null;
  const latestSeq = plans.reduce((m, p) => Math.max(m, p.seq), 0);
  const current = plans.filter((p) => p.seq === latestSeq);
  const earlier = plans.filter((p) => p.seq !== latestSeq);
  const wantsCancel = notice === "opzeggen";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Mijn schema&apos;s</p>
          <h1 className="heading-lg">Hoi {name}!</h1>
          <p className="mt-2 text-muted">Hier vind je al je schema&apos;s, je check-in en je abonnement.</p>
        </div>
        {demo ? (
          <DemoButton className="btn-secondary !py-2.5 text-sm">
            <LogOut className="size-4" aria-hidden /> Uitloggen
          </DemoButton>
        ) : (
          <form action={logout}>
            <button type="submit" className="btn-secondary !py-2.5 text-sm">
              <LogOut className="size-4" aria-hidden /> Uitloggen
            </button>
          </form>
        )}
      </div>

      {notice === "opgezegd" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">Je abonnement is opgezegd</h2>
          <p className="mt-1 text-[0.9375rem]">
            We hebben je een bevestiging per e-mail gestuurd. Hieronder zie je tot wanneer het nog loopt.
          </p>
        </div>
      )}
      {wantsCancel && activeSubs.length > 0 && (
        <div className="rounded-[var(--radius-card)] border-2 border-accent-200 bg-accent-50 p-6">
          <h2 className="text-lg font-bold">Abonnement opzeggen</h2>
          <p className="mt-1 text-[0.9375rem]">
            Klik op &quot;Bevestig opzeggen&quot; bij je abonnement hieronder. Je houdt toegang tot je schema&apos;s en
            ontvangt een bevestiging per e-mail.
          </p>
        </div>
      )}

      {/* Overzicht */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm font-semibold text-muted">Je abonnement</p>
          {mainSub ? (
            <>
              <p className="mt-1 text-lg font-extrabold">{products[mainSub.product].name}</p>
              <p className="text-sm text-muted">
                {mainSub.duration === "1m" ? "Per maand" : `Minimaal ${durations[mainSub.duration].label}`}
                {mainSub.commitmentEndsAt ? ` (tot ${formatDate(mainSub.commitmentEndsAt)})` : ""}
              </p>
              <div className="mt-3">
                <Pill tone={orderStatus(mainSub).tone}>{orderStatus(mainSub).text}</Pill>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-lg font-extrabold">Geen lopend abonnement</p>
              <Link href="/prijzen" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                Bekijk de abonnementen <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <CalendarDays className="size-4" aria-hidden /> Volgend schema
          </p>
          <p className="mt-1 text-lg font-extrabold">
            {mainSub?.nextPlanAt && !mainSub.cancelAt ? formatDate(mainSub.nextPlanAt) : "Geen nieuw schema gepland"}
          </p>
          <p className="text-sm text-muted">Abonnees krijgen elke 4 weken een nieuw, bijgestuurd schema.</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <ClipboardList className="size-4" aria-hidden /> Check-in
          </p>
          <p className="mt-1 text-lg font-extrabold">
            {activeSubs.length > 0 ? "Vul hem in vóór je volgende schema" : "Niet nodig"}
          </p>
          {activeSubs.length > 0 && (
            <a href="#check-in" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              Naar de check-in <ArrowRight className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {/* Huidige schema's */}
      <section>
        <h2 className="heading-md mb-4">{latestSeq > 1 ? `Je schema's van periode ${latestSeq}` : "Je schema's"}</h2>
        {current.length === 0 ? (
          <p className="card p-6 text-muted">Je hebt nog geen schema&apos;s.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {current.map((p) => {
              const info = planMeta[p.type];
              return (
                <article key={p.id} className="card overflow-hidden">
                  <div className="relative aspect-[16/7]">
                    <Image src={info.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-extrabold">
                        <info.icon className="size-5 text-brand-600" aria-hidden /> {info.title}
                      </h3>
                      <p className="text-sm text-muted">
                        {p.status === "ready" && p.generatedAt
                          ? `Gemaakt op ${formatDate(p.generatedAt)}`
                          : p.failed
                            ? "Er ging iets mis; we nemen contact met je op"
                            : "Wordt gemaakt…"}
                      </p>
                    </div>
                    {p.status === "ready" ? (
                      <Link href={p.href} className="btn-primary !px-5 !py-2.5 text-sm">
                        Open schema <ArrowRight className="size-4" aria-hidden />
                      </Link>
                    ) : p.failed ? (
                      <TriangleAlert className="size-6 text-accent-500" aria-label="Mislukt" />
                    ) : (
                      <Loader2 className="size-6 animate-spin text-brand-600" aria-label="Bezig" />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {earlier.length > 0 && (
        <section>
          <h2 className="heading-md mb-4">Eerdere schema&apos;s</h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
            {earlier.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold">
                    {planMeta[p.type].title} · periode {p.seq}
                  </p>
                  <p className="text-sm text-muted">{p.generatedAt ? formatDate(p.generatedAt) : "—"}</p>
                </div>
                {p.status === "ready" && (
                  <Link href={p.href} className="text-sm font-bold text-brand-700 underline underline-offset-2">
                    Bekijk
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Abonnementen */}
      <section>
        <h2 className="heading-md mb-4">Abonnementen & bestellingen</h2>
        <ul className="space-y-3">
          {orders.map((o) => {
            const status = orderStatus(o);
            return (
              <li key={o.id} className="card flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-bold">
                    {products[o.product].name} ·{" "}
                    {o.duration === "eenmalig"
                      ? "los schema"
                      : o.duration === "1m"
                        ? "per maand"
                        : `minimaal ${durations[o.duration].label}`}
                  </p>
                  <p className="text-sm text-muted">
                    Besteld op {formatDate(o.createdAt)} · Bestelnummer {o.reference}
                  </p>
                  {o.manageable && o.status === "active" && !o.cancelAt && (
                    <p className="text-sm text-muted">
                      Maandelijks via automatische incasso
                      {o.commitmentEndsAt ? `, minimale looptijd tot ${formatDate(o.commitmentEndsAt)}` : ""}
                    </p>
                  )}
                  <Pill tone={status.tone}>{status.text}</Pill>
                </div>
                {o.manageable && (o.status === "active" || o.status === "past_due") && (
                  <div className="flex flex-wrap items-start gap-2">
                    {demo ? (
                      <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">Betaalgegevens & facturen</DemoButton>
                    ) : (
                      <form action={openBillingPortal}>
                        <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Betaalgegevens & facturen</SubmitButton>
                      </form>
                    )}
                    {o.cancelAt ? (
                      demo ? (
                        <DemoButton className="btn-secondary !px-4 !py-2.5 text-sm">Opzegging intrekken</DemoButton>
                      ) : (
                        <form action={undoCancellation}>
                          <input type="hidden" name="order" value={o.id} />
                          <SubmitButton className="btn-secondary !px-4 !py-2.5 text-sm">Opzegging intrekken</SubmitButton>
                        </form>
                      )
                    ) : (
                      <details className="group" open={wantsCancel}>
                        <summary
                          className={`${wantsCancel ? "btn-primary" : "btn-secondary"} cursor-pointer list-none !px-4 !py-2.5 text-sm [&::-webkit-details-marker]:hidden`}
                        >
                          Opzeggen
                        </summary>
                        <div className="mt-2 max-w-xs rounded-2xl bg-sand p-3 text-sm">
                          <p className="mb-2">
                            {o.commitmentEndsAt
                              ? `Je abonnement stopt aan het einde van de minimale looptijd (${formatDate(o.commitmentEndsAt)}).`
                              : "Je abonnement stopt aan het einde van de lopende maand."}{" "}
                            Je houdt toegang tot je schema&apos;s.
                          </p>
                          {demo ? (
                            <DemoButton className="btn-primary w-full !py-2.5 text-sm">Bevestig opzeggen</DemoButton>
                          ) : (
                            <form action={cancelSubscription}>
                              <input type="hidden" name="order" value={o.id} />
                              <SubmitButton className="btn-primary w-full !py-2.5 text-sm">Bevestig opzeggen</SubmitButton>
                            </form>
                          )}
                        </div>
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
        <section id="check-in" className="card scroll-mt-24 p-6 sm:p-8">
          <h2 className="heading-md">Check-in</h2>
          <p className="mt-2 mb-6 text-muted">
            Vul dit in vóór je volgende schema. Zo stemmen we je nieuwe schema af op je voortgang: meer of minder eten,
            zwaarder of lichter trainen, of overstappen op op gewicht blijven als je je doel hebt bereikt.
          </p>
          <CheckinForm demo={demo} />
        </section>
      )}

      <section className="rounded-[var(--radius-card)] bg-sand p-6">
        <h2 className="text-lg font-bold">Hulp nodig?</h2>
        <p className="mt-1 text-[0.9375rem] text-muted">
          Bekijk de{" "}
          <Link href="/contact#veelgestelde-vragen" className="font-semibold text-brand-700 underline">
            veelgestelde vragen
          </Link>{" "}
          of{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            neem contact op
          </Link>
          . We reageren binnen {site.responseTimeDays} werkdagen.
        </p>
      </section>
    </div>
  );
}
