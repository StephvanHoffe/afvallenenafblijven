import { Loader2, SlidersHorizontal } from "lucide-react";
import { formatDate, formatNumber } from "@/lib/format";
import type { PlanAdjustment } from "@/lib/weekly";

/**
 * Bijsturingen uit de wekelijkse weegmomenten, bovenaan een schema. Ze gelden
 * voor de rest van de periode, tot het volgende schema na de check-in.
 */
export function AdjustmentsCard({ type, adjustments }: { type: "voeding" | "training"; adjustments: PlanAdjustment[] | undefined }) {
  if (!adjustments?.length) return null;
  const latestFirst = [...adjustments].sort((a, b) => b.week - a.week);
  return (
    <section className="avoid-break rounded-[var(--radius-card)] border-2 border-brand-200 bg-brand-50 p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <SlidersHorizontal className="size-5 text-brand-600" aria-hidden /> Bijgestuurd na je weegmoment
      </h2>
      <p className="mt-1 text-sm text-muted">Deze aanpassingen gelden voor de rest van deze periode, bovenop het schema hieronder.</p>
      <ol className="mt-4 space-y-4">
        {latestFirst.map((a) => (
          <li key={a.week} className="rounded-2xl bg-white p-4">
            <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">
              Week {a.week} · {formatDate(a.date)}
            </p>
            {type === "voeding" ? (
              <>
                <p className="mt-1 font-bold">
                  {a.kcal > 0 ? "+" : "−"}
                  {Math.abs(a.kcal)} kcal per dag{a.calories ? `: je dagdoel is nu ${formatNumber(a.calories)} kcal` : ""}
                </p>
                {a.nutritionReason && <p className="mt-1 text-sm text-muted">{a.nutritionReason}</p>}
                {a.pending ? (
                  <Pending />
                ) : (
                  a.nutrition && (
                    <ul className="mt-3 space-y-2 text-[0.9375rem]">
                      {a.nutrition.swaps.map((s) => (
                        <li key={s.meal + s.change} className="flex gap-3">
                          <span className="mt-0.5 shrink-0 self-start rounded-full bg-sand px-2 py-0.5 text-xs font-bold tabular-nums">
                            {s.kcal > 0 ? "+" : "−"}
                            {Math.abs(Math.round(s.kcal))}
                          </span>
                          <span>
                            <strong>{s.meal}:</strong> {s.change}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </>
            ) : (
              <>
                <p className="mt-1 font-bold">Trainingen {a.training}</p>
                {a.trainingReason && <p className="mt-1 text-sm text-muted">{a.trainingReason}</p>}
                {a.pending ? (
                  <Pending />
                ) : (
                  a.trainingPlan && (
                    <ul className="mt-3 space-y-1.5 text-[0.9375rem]">
                      {a.trainingPlan.changes.map((c) => (
                        <li key={c.exercise + c.change}>
                          <strong>{c.exercise}:</strong> {c.change}
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function Pending() {
  return (
    <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
      <Loader2 className="size-4 animate-spin" aria-hidden /> We werken je aanwijzingen uit…
    </p>
  );
}
