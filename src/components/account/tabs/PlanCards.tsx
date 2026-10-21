import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight, CalendarCheck, Download, Loader2, ShoppingCart, TriangleAlert } from "lucide-react";
import { planMeta } from "@/components/account/shared";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import type { DashboardPlan } from "@/lib/account-types";
import { formatDate, formatDayDate } from "@/lib/format";
import { periodStarts, periodsAt } from "@/lib/schedule";

const copy = defineCopy({
  nl: {
    none: "Je hebt nog geen schema's.",
    madeOn: (date: string) => `Gemaakt op ${date}`,
    failed: "Er ging iets mis; we nemen contact met je op",
    busy: "Wordt gemaakt…",
    downloadAria: (title: string) => `${title} downloaden als PDF`,
    download: "Download als PDF",
    open: "Open",
    failedAria: "Mislukt",
    busyAria: "Bezig",
    upcomingReady: "Je schema voor de nieuwe periode staat klaar",
    upcomingBusy: "Je schema voor de nieuwe periode wordt gemaakt",
    upcomingText: (start: string, shopping: boolean) =>
      `Het start op ${start}. Tot die tijd volg je gewoon je huidige schema.${shopping ? " Bekijk alvast de nieuwe boodschappenlijst, dan kun je op tijd je boodschappen doen." : ""}`,
    view: (title: string) => `Bekijk ${title.toLowerCase()}`,
    shopping: "Boodschappenlijst (PDF)",
  },
  en: {
    none: "You don't have any plans yet.",
    madeOn: (date: string) => `Created on ${date}`,
    failed: "Something went wrong; we'll get in touch with you",
    busy: "Being created…",
    downloadAria: (title: string) => `Download ${title} as PDF`,
    download: "Download as PDF",
    open: "Open",
    failedAria: "Failed",
    busyAria: "In progress",
    upcomingReady: "Your plan for the new period is ready",
    upcomingBusy: "Your plan for the new period is being created",
    upcomingText: (start: string, shopping: boolean) =>
      `It starts on ${start}. Until then, simply keep following your current plan.${shopping ? " Have a look at the new shopping list now, so you can do your shopping in time." : ""}`,
    view: (title: string) => `View ${title.toLowerCase()}`,
    shopping: "Shopping list (PDF)",
  },
});

/** Kaarten van de schema's van de huidige periode. */
export function PlanCards({ plans, l, compact = false }: { plans: DashboardPlan[]; l: Locale; compact?: boolean }) {
  const c = copy[l];
  const meta = planMeta(l);
  if (plans.length === 0) return <p className="card p-6 text-muted">{c.none}</p>;
  return (
    <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
      {plans.map((p) => {
        const info = meta[p.type];
        return (
          <article key={p.id} className={`overflow-hidden ${compact ? "rounded-2xl border border-line" : "card"}`}>
            {!compact && (
              <div className="relative aspect-[16/7]">
                <Image src={info.image} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              </div>
            )}
            <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "p-4" : "p-5"}`}>
              <div>
                <h3 className="flex items-center gap-2 font-extrabold sm:text-lg">
                  <info.icon className="size-5 text-brand-600" aria-hidden /> {info.title}
                </h3>
                <p className="text-sm text-muted">
                  {p.status === "ready" && p.generatedAt ? c.madeOn(formatDate(p.generatedAt, l)) : p.failed ? c.failed : c.busy}
                </p>
              </div>
              {p.status === "ready" ? (
                <div className="flex items-center gap-2">
                  <a
                    href={localePath(l, p.pdfHref)}
                    className="grid size-10 place-items-center rounded-full border border-line bg-white hover:border-brand-300"
                    aria-label={c.downloadAria(info.title)}
                    title={c.download}
                  >
                    <Download className="size-4" aria-hidden />
                  </a>
                  <Link href={p.href} className="btn-primary !px-5 !py-2.5 text-sm">
                    {c.open} <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </div>
              ) : p.failed ? (
                <TriangleAlert className="size-6 text-accent-500" aria-label={c.failedAria} />
              ) : (
                <Loader2 className="size-6 animate-spin text-brand-600" aria-label={c.busyAria} />
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export interface UpcomingPeriod {
  seq: number;
  startsAt: Date;
  plans: DashboardPlan[];
}

/**
 * De lopende periode (de laatste die al begonnen is), een eventuele volgende
 * die al klaarstaat maar pas op maandag begint, en de eerdere perioden.
 */
export function currentPeriod(plans: DashboardPlan[], now: Date) {
  const { current, upcoming } = periodsAt(
    periodStarts(plans, (p) => p.seq, (p) => new Date(p.startsAt)),
    now.getTime(),
  );
  const latestSeq = current?.seq ?? 0;
  return {
    latestSeq,
    current: plans.filter((p) => p.seq === latestSeq),
    upcoming: upcoming ? ({ seq: upcoming.seq, startsAt: upcoming.start, plans: plans.filter((p) => p.seq === upcoming.seq) } as UpcomingPeriod) : null,
    earlier: plans.filter((p) => p.seq < latestSeq),
  };
}

/** Het schema voor de nieuwe periode staat al klaar: met startdatum en de boodschappenlijst. */
export function UpcomingPlans({ upcoming, l }: { upcoming: UpcomingPeriod; l: Locale }) {
  const c = copy[l];
  const meta = planMeta(l);
  // Voeding eerst: daar hoort de boodschappenlijst bij.
  const ready = upcoming.plans.filter((p) => p.status === "ready").sort((a, b) => (a.type === "voeding" ? -1 : b.type === "voeding" ? 1 : 0));
  const nutrition = ready.find((p) => p.type === "voeding");
  const allReady = ready.length === upcoming.plans.length;
  return (
    <section className="rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-5 sm:p-6">
      <div className="flex gap-3">
        <CalendarCheck className="mt-0.5 size-6 shrink-0 text-brand-600" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold">{allReady ? c.upcomingReady : c.upcomingBusy}</h2>
          <p className="mt-1 text-[0.9375rem]">{c.upcomingText(formatDayDate(upcoming.startsAt, l), upcoming.plans.some((p) => p.type === "voeding"))}</p>
          {allReady ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {ready.map((p, i) => (
                <Link key={p.id} href={p.href} className={`${i === 0 ? "btn-primary" : "btn-secondary"} !px-4 !py-2.5 text-sm`}>
                  {c.view(meta[p.type].title)} <ArrowRight className="size-4" aria-hidden />
                </Link>
              ))}
              {nutrition && (
                <a href={localePath(l, `${nutrition.pdfHref}?deel=boodschappen`)} className="btn-secondary !px-4 !py-2.5 text-sm">
                  <ShoppingCart className="size-4" aria-hidden /> {c.shopping}
                </a>
              )}
            </div>
          ) : (
            <Loader2 className="mt-3 size-5 animate-spin text-brand-600" aria-label={c.busyAria} />
          )}
        </div>
      </div>
    </section>
  );
}
