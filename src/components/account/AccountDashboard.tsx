import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  ClipboardList,
  Download,
  Dumbbell,
  Loader2,
  LogOut,
  Salad,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { CheckinForm } from "@/app/(site)/account/CheckinForm";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import { cancelSubscription, logout, openBillingPortal, undoCancellation } from "@/app/(site)/account/actions";
import { DemoButton } from "@/components/account/DemoButton";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { durations, products, type DurationId, type PlanType, type ProductId } from "@/config/pricing";
import { formatDate } from "@/lib/format";
import { site } from "@/config/site";
import type { CheckinWindow } from "@/lib/checkin";
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
  /** De verplichte check-in voor de volgende periode (null als die er niet is). */
  checkin: CheckinWindow | null;
  lastWeightKg: number | null;
}

export interface DashboardPlan {
  id: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  generatedAt: Date | null;
  failed: boolean;
  href: string;
  pdfHref: string;
}

interface Props {
  name: string;
  orders: DashboardOrder[];
  plans: DashboardPlan[];
  notice?: "opgezegd" | "opzeggen" | "checkin" | null;
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

/** Wat er bij het volgende schema staat, afhankelijk van de check-in. */
function nextPlanText(checkin: CheckinWindow | null): { title: string; text: string } {
  if (!checkin) return { title: "Geen nieuw schema gepland", text: "Je abonnement loopt af of is niet actief." };
  switch (checkin.status) {
    case "upcoming":
      return {
        title: `Na je check-in (vanaf ${formatDate(checkin.opensAt)})`,
        text: `Je schema voor periode ${checkin.seq} maken we zodra je je check-in hebt ingevuld.`,
      };
    case "open":
    case "overdue":
      return { title: "Wacht op je check-in", text: `Vul je check-in in, dan maken we direct je schema voor periode ${checkin.seq}.` };
    default:
      return { title: "Wordt nu gemaakt", text: "Je check-in is binnen. Binnen een paar minuten staat je nieuwe schema klaar." };
  }
}

function checkinTile(checkin: CheckinWindow | null): string {
  if (!checkin) return "Niet nodig";
  switch (checkin.status) {
    case "upcoming":
      return `Opent op ${formatDate(checkin.opensAt)}`;
    case "open":
      return "Staat voor je klaar";
    case "overdue":
      return "Nog niet ingevuld";
    default:
      return "Ontvangen";
  }
}

export function AccountDashboard({ name, orders, plans, notice = null, demo = false }: Props) {
  const activeSubs = orders.filter((o) => o.manageable && (o.status === "active" || o.status === "past_due"));
  const mainSub = activeSubs[0] ?? null;
  const latestSeq = plans.reduce((m, p) => Math.max(m, p.seq), 0);
  const current = plans.filter((p) => p.seq === latestSeq);
  const earlier = plans.filter((p) => p.seq !== latestSeq);
  const wantsCancel = notice === "opzeggen";
  const withCheckin = activeSubs.filter((o) => o.checkin);
  const openCheckin = withCheckin.find((o) => o.checkin?.status === "open" || o.checkin?.status === "overdue") ?? null;
  // Wordt er nog aan een schema gewerkt (of wordt het opnieuw geprobeerd), dan ververst de pagina zichzelf.
  const busy = current.some((p) => p.status !== "ready" && !p.failed);
  const anyReady = current.some((p) => p.status === "ready");
  const allPdfHref = demo ? "/voorbeeld/pdf/alles" : `/account/pdf?periode=${latestSeq}`;
  const next = nextPlanText(mainSub?.checkin ?? null);

  return (
    <div className="space-y-10">
      {busy && !demo && <PlanStatusRefresher />}
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

      {notice === "checkin" && (
        <div role="status" className="rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-6">
          <h2 className="text-lg font-bold">Dank je, je check-in is binnen!</h2>
          <p className="mt-1 text-[0.9375rem]">
            We maken nu je nieuwe schema, afgestemd op je antwoorden. Dat duurt een paar minuten; deze pagina ververst vanzelf
            en je krijgt een e-mail zodra het klaar is.
          </p>
        </div>
      )}
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

      {openCheckin?.checkin && notice !== "checkin" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-6">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-lg font-extrabold">
                {openCheckin.checkin.status === "overdue" ? "Je nieuwe schema wacht op je check-in" : "Tijd voor je check-in!"}
              </h2>
              <p className="mt-1 text-[0.9375rem]">
                Vul hem in (2 minuten), dan maken we direct je schema voor periode {openCheckin.checkin.seq}, afgestemd op
                hoe het ging.
              </p>
            </div>
          </div>
          <a href="#check-in" className="btn-primary !py-2.5 text-sm">
            Check-in invullen <ArrowRight className="size-4" aria-hidden />
          </a>
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
          <p className="mt-1 text-lg font-extrabold">{mainSub ? next.title : "Geen nieuw schema gepland"}</p>
          <p className="text-sm text-muted">{mainSub ? next.text : "Met een abonnement krijg je elke 4 weken een nieuw schema."}</p>
        </div>
        <div className="card p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
            <ClipboardList className="size-4" aria-hidden /> Check-in
          </p>
          <p className="mt-1 text-lg font-extrabold">{checkinTile(mainSub?.checkin ?? null)}</p>
          {mainSub?.checkin && (
            <a href="#check-in" className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
              {mainSub.checkin.status === "open" || mainSub.checkin.status === "overdue" ? "Nu invullen" : "Meer over de check-in"}{" "}
              <ArrowRight className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </div>

      {/* Huidige schema's */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="heading-md">{latestSeq > 1 ? `Je schema's van periode ${latestSeq}` : "Je schema's"}</h2>
          {anyReady && (
            <a href={allPdfHref} className="btn-secondary !px-4 !py-2.5 text-sm">
              <Download className="size-4" aria-hidden /> {current.length > 1 ? "Alles downloaden (PDF)" : "Download als PDF"}
            </a>
          )}
        </div>
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
                      <div className="flex items-center gap-2">
                        <a
                          href={p.pdfHref}
                          className="grid size-10 place-items-center rounded-full border border-line bg-white hover:border-brand-300"
                          aria-label={`${info.title} downloaden als PDF`}
                          title="Download als PDF"
                        >
                          <Download className="size-4" aria-hidden />
                        </a>
                        <Link href={p.href} className="btn-primary !px-5 !py-2.5 text-sm">
                          Open schema <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </div>
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

      {withCheckin.map((o) => (
        <section key={o.id} id={o === withCheckin[0] ? "check-in" : undefined} className="card scroll-mt-24 p-6 sm:p-8">
          <h2 className="heading-md">Check-in voor periode {o.checkin!.seq}</h2>
          {withCheckin.length > 1 && <p className="mt-1 text-sm font-semibold text-muted">{products[o.product].name}</p>}
          {o.checkin!.status === "upcoming" ? (
            <div className="mt-3 space-y-2 text-[0.9375rem] text-muted">
              <p>
                Je check-in opent op <strong className="text-ink">{formatDate(o.checkin!.opensAt)}</strong>, een paar dagen voor
                het einde van je huidige periode. Je krijgt dan een e-mail.
              </p>
              <p>
                Je nieuwe schema maken we pas na je check-in. Zo past het precies bij je voortgang: meer of minder eten,
                zwaarder of lichter trainen, of overstappen op op gewicht blijven als je je doel hebt bereikt.
              </p>
            </div>
          ) : o.checkin!.status === "submitted" ? (
            <p className="mt-3 text-[0.9375rem] text-muted">Je check-in is ontvangen. Je nieuwe schema wordt gemaakt.</p>
          ) : (
            <>
              <p className="mt-2 mb-6 text-muted">
                {o.checkin!.status === "overdue"
                  ? "Je huidige periode is voorbij. Vul je check-in in, dan maken we direct je nieuwe schema."
                  : `Je huidige periode loopt tot ${formatDate(o.checkin!.dueAt)}. Vul je check-in in, dan maken we direct je nieuwe schema.`}{" "}
                Het kost je ongeveer 2 minuten.
              </p>
              <CheckinForm orderId={o.id} seq={o.checkin!.seq} product={o.product} lastWeightKg={o.lastWeightKg} demo={demo} />
            </>
          )}
        </section>
      ))}

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
                  <div className="flex items-center gap-4 text-sm font-bold">
                    <a href={p.pdfHref} className="inline-flex items-center gap-1 text-muted hover:text-ink">
                      <Download className="size-4" aria-hidden /> PDF
                    </a>
                    <Link href={p.href} className="text-brand-700 underline underline-offset-2">
                      Bekijk
                    </Link>
                  </div>
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
