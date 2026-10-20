"use client";

import { ArrowRight, Footprints, Dumbbell, Watch } from "lucide-react";
import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import Link from "@/i18n/Link";
import { formatNumber } from "@/lib/format";
import { summarizeActivity } from "@/lib/health/insights";
import type { HealthView } from "@/lib/health/view";

const DAY = 24 * 60 * 60 * 1000;

const copy = defineCopy({
  nl: {
    title: "Deze week",
    workouts: (done: number, planned: number | null) => (planned ? `${done} van ${planned} trainingen` : `${done} trainingen`),
    steps: (n: string) => `${n} stappen per dag`,
    more: "Bekijk je activiteit",
    connectTitle: "Koppel je app of horloge",
    connectText: "Dan zie je of je echt traint en wat het oplevert, en rekenen we met je echte activiteit.",
    connect: "Koppelen",
  },
  en: {
    title: "This week",
    workouts: (done: number, planned: number | null) => (planned ? `${done} of ${planned} workouts` : `${done} workouts`),
    steps: (n: string) => `${n} steps a day`,
    more: "See your activity",
    connectTitle: "Connect your app or watch",
    connectText: "Then you'll see whether you really train and what it achieves, and we'll use your real activity.",
    connect: "Connect",
  },
});

/** Kort blok op het overzicht: trainingen en stappen van deze week, of een uitnodiging om te koppelen. */
export function HealthOverviewCard({ health, progressHref, connectHref }: { health: HealthView; progressHref: string; connectHref: string }) {
  const l = useLocale();
  const c = copy[l];
  const available = health.available.withings || health.available.junction;

  if (health.connections.length === 0) {
    if (!available) return null;
    return (
      <Link href={connectHref} className="card flex items-center gap-4 p-5 hover:border-brand-300">
        <Watch className="size-6 shrink-0 text-brand-600" aria-hidden />
        <span className="flex-1">
          <span className="block font-extrabold">{c.connectTitle}</span>
          <span className="block text-sm text-muted">{c.connectText}</span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-700">
          {c.connect} <ArrowRight className="size-4" aria-hidden />
        </span>
      </Link>
    );
  }

  const now = new Date(health.now);
  // Deze week: vanaf maandag.
  const monday = new Date(now.getTime() - ((now.getUTCDay() + 6) % 7) * DAY);
  monday.setUTCHours(0, 0, 0, 0);
  const week = summarizeActivity(health.days, health.workouts, monday, now, null);
  const planned = health.plannedPerWeek;

  return (
    <Link href={progressHref} className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-5 hover:border-brand-300">
      <span className="font-extrabold">{c.title}</span>
      <span className="flex items-center gap-2 text-[0.9375rem]">
        <Dumbbell className="size-5 text-brand-600" aria-hidden /> {c.workouts(week.workouts, planned)}
      </span>
      {week.avgSteps !== null && (
        <span className="flex items-center gap-2 text-[0.9375rem]">
          <Footprints className="size-5 text-brand-600" aria-hidden /> {c.steps(formatNumber(week.avgSteps, 0, l))}
        </span>
      )}
      <span className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-brand-700">
        {c.more} <ArrowRight className="size-4" aria-hidden />
      </span>
    </Link>
  );
}
