import { CircleCheck, Dumbbell, Salad, TriangleAlert } from "lucide-react";
import type { PlanType } from "@/config/pricing";
import { defineCopy, type Locale } from "@/i18n/config";
import type { DashboardOrder } from "@/lib/account-types";
import type { CheckinWindow } from "@/lib/checkin";
import { formatDate } from "@/lib/format";

/** Gedeelde stukjes voor de tabbladen van Mijn schema's. */

const copy = defineCopy({
  nl: {
    plans: { voeding: "Voedingsschema", training: "Trainingsschema" } as Record<PlanType, string>,
    oneOff: "Los schema",
    cancelled: (date: string) => `Opgezegd, loopt tot ${date}`,
    active: "Actief",
    pastDue: "Afschrijving mislukt",
    canceled: "Beëindigd",
    completed: "Afgerond",
    noneTitle: "Geen nieuw schema gepland",
    noneText: "Je abonnement loopt af of is niet actief.",
    upcomingTitle: (date: string) => `Na je check-in (vanaf ${date})`,
    upcomingText: (seq: number) => `Je schema voor periode ${seq} maken we zodra je je check-in hebt ingevuld.`,
    openTitle: "Wacht op je check-in",
    openText: (seq: number) => `Vul je check-in in, dan maken we direct je schema voor periode ${seq}.`,
    busyTitle: "Wordt nu gemaakt",
    busyText: "Je check-in is binnen. Binnen een paar minuten staat je nieuwe schema klaar.",
  },
  en: {
    plans: { voeding: "Nutrition plan", training: "Workout plan" },
    oneOff: "One-off plan",
    cancelled: (date: string) => `Cancelled, runs until ${date}`,
    active: "Active",
    pastDue: "Payment failed",
    canceled: "Ended",
    completed: "Completed",
    noneTitle: "No new plan scheduled",
    noneText: "Your subscription is ending or isn't active.",
    upcomingTitle: (date: string) => `After your check-in (from ${date})`,
    upcomingText: (seq: number) => `We'll create your plan for period ${seq} as soon as you've completed your check-in.`,
    openTitle: "Waiting for your check-in",
    openText: (seq: number) => `Complete your check-in and we'll create your plan for period ${seq} straight away.`,
    busyTitle: "Being created now",
    busyText: "Your check-in is in. Your new plan will be ready within a few minutes.",
  },
});

const planIcons: Record<PlanType, { icon: typeof Salad; image: string }> = {
  voeding: { icon: Salad, image: "/images/bowl-salmon.jpg" },
  training: { icon: Dumbbell, image: "/images/woman-overhead-press.jpg" },
};

/** Titel, pictogram en foto van elk soort schema, in de gegeven taal. */
export function planMeta(l: Locale): Record<PlanType, { title: string; icon: typeof Salad; image: string }> {
  const titles = copy[l].plans;
  return {
    voeding: { title: titles.voeding, ...planIcons.voeding },
    training: { title: titles.training, ...planIcons.training },
  };
}

export function orderStatus(order: DashboardOrder, l: Locale = "nl"): { text: string; tone: "ok" | "warn" | "muted" } {
  const c = copy[l];
  if (order.duration === "eenmalig") return { text: c.oneOff, tone: "muted" };
  switch (order.status) {
    case "active":
      return order.cancelAt ? { text: c.cancelled(formatDate(order.cancelAt, l)), tone: "warn" } : { text: c.active, tone: "ok" };
    case "past_due":
      return { text: c.pastDue, tone: "warn" };
    case "canceled":
      return { text: c.canceled, tone: "muted" };
    default:
      return { text: c.completed, tone: "muted" };
  }
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
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
export function nextPlanText(checkin: CheckinWindow | null, l: Locale = "nl"): { title: string; text: string } {
  const c = copy[l];
  if (!checkin) return { title: c.noneTitle, text: c.noneText };
  switch (checkin.status) {
    case "upcoming":
      return { title: c.upcomingTitle(formatDate(checkin.opensAt, l)), text: c.upcomingText(checkin.seq) };
    case "open":
    case "overdue":
      return { title: c.openTitle, text: c.openText(checkin.seq) };
    default:
      return { title: c.busyTitle, text: c.busyText };
  }
}

export function Section({ title, intro, action, children }: { title: React.ReactNode; intro?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card min-w-0 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {intro && <p className="mt-0.5 text-sm text-muted">{intro}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
