import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight, Download, Loader2, TriangleAlert } from "lucide-react";
import { planMeta } from "@/components/account/shared";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import type { DashboardPlan } from "@/lib/account-types";
import { formatDate } from "@/lib/format";

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

export function currentPeriod(plans: DashboardPlan[]) {
  const latestSeq = plans.reduce((m, p) => Math.max(m, p.seq), 0);
  return {
    latestSeq,
    current: plans.filter((p) => p.seq === latestSeq),
    earlier: plans.filter((p) => p.seq !== latestSeq),
  };
}
