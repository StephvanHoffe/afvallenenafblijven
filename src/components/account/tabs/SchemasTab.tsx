import Link from "@/i18n/Link";
import { Download } from "lucide-react";
import { PlanStatusRefresher } from "@/components/account/PlanStatusRefresher";
import { planMeta } from "@/components/account/shared";
import { PlanCards, UpcomingPlans, currentPeriod } from "@/components/account/tabs/PlanCards";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import type { AccountView } from "@/lib/account-types";
import { formatDate } from "@/lib/format";

const copy = defineCopy({
  nl: {
    period: (seq: number) => `Periode ${seq}`,
    yourPlans: "Je schema's",
    intro: "Je huidige schema's. Open ze hier of download ze als PDF om te printen.",
    downloadAll: "Alles downloaden (PDF)",
    download: "Download als PDF",
    earlier: "Eerdere schema's",
    periodPdf: "Periode als PDF",
    view: "Bekijk",
  },
  en: {
    period: (seq: number) => `Period ${seq}`,
    yourPlans: "Your plans",
    intro: "Your current plans. Open them here or download them as a PDF to print.",
    downloadAll: "Download all (PDF)",
    download: "Download as PDF",
    earlier: "Earlier plans",
    periodPdf: "Period as PDF",
    view: "View",
  },
});

export function SchemasTab({ view, demo, l }: { view: AccountView; demo: boolean; l: Locale }) {
  const c = copy[l];
  const meta = planMeta(l);
  const { latestSeq, current, upcoming, earlier } = currentPeriod(view.plans, view.now);
  const busy = [...current, ...(upcoming?.plans ?? [])].some((p) => p.status !== "ready" && !p.failed);
  const allPdfHref = (seq: number) => localePath(l, demo ? "/voorbeeld/pdf/alles" : `/account/pdf?periode=${seq}`);
  const periods = [...new Set(earlier.map((p) => p.seq))].sort((a, b) => b - a);

  return (
    <div className="space-y-10">
      {busy && !demo && <PlanStatusRefresher />}
      {upcoming && <UpcomingPlans upcoming={upcoming} l={l} />}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="heading-md">{latestSeq > 1 ? c.period(latestSeq) : c.yourPlans}</h2>
            <p className="mt-1 text-sm text-muted">{c.intro}</p>
          </div>
          {current.some((p) => p.status === "ready") && (
            <a href={allPdfHref(latestSeq)} className="btn-secondary !px-4 !py-2.5 text-sm">
              <Download className="size-4" aria-hidden /> {current.length > 1 ? c.downloadAll : c.download}
            </a>
          )}
        </div>
        <PlanCards plans={current} l={l} />
      </section>

      {periods.length > 0 && (
        <section>
          <h2 className="heading-md mb-4">{c.earlier}</h2>
          <div className="space-y-4">
            {periods.map((seq) => (
              <div key={seq} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand/60 px-5 py-3">
                  <h3 className="font-extrabold">{c.period(seq)}</h3>
                  <a href={allPdfHref(seq)} className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
                    <Download className="size-4" aria-hidden /> {c.periodPdf}
                  </a>
                </div>
                <ul className="divide-y divide-line">
                  {earlier
                    .filter((p) => p.seq === seq)
                    .map((p) => {
                      const info = meta[p.type];
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <info.icon className="size-5 text-brand-600" aria-hidden />
                            <div>
                              <p className="font-semibold">{info.title}</p>
                              <p className="text-sm text-muted">{p.generatedAt ? formatDate(p.generatedAt, l) : "—"}</p>
                            </div>
                          </div>
                          {p.status === "ready" && (
                            <div className="flex items-center gap-4 text-sm font-bold">
                              <a href={localePath(l, p.pdfHref)} className="inline-flex items-center gap-1 text-muted hover:text-ink">
                                <Download className="size-4" aria-hidden /> PDF
                              </a>
                              <Link href={p.href} className="text-brand-700 underline underline-offset-2">
                                {c.view}
                              </Link>
                            </div>
                          )}
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
