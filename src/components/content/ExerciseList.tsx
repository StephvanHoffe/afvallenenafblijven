import { ShieldAlert } from "lucide-react";
import type { Locale } from "@/i18n/config";

/**
 * Oefeningen op de trainingspagina's (krachttraining thuis, full body,
 * buikspieren, HIIT): per oefening een H3 met de naam, de stappen, de
 * sets/herhalingen (of tijd) en een veelgemaakte fout. Alleen tekst.
 * Zet de lijst altijd binnen een <Section> (H2), zodat de kopniveaus kloppen.
 */
export interface Exercise {
  name: string;
  /** Welke spieren of welk doel, kort (optioneel). */
  focus?: string;
  /** "Zo doe je het": 2-5 korte stappen. */
  steps: string[];
  /** Sets × herhalingen of tijd, bijv. "2-3 sets van 8-15 herhalingen". */
  dose: string;
  /** De fout die je het vaakst ziet, met hoe het wel moet. */
  mistake: string;
  /** Makkelijker of zwaarder maken (optioneel). */
  variation?: string;
}

const labels = {
  nl: { focus: "Traint", how: "Zo doe je het", dose: "Sets en herhalingen", mistake: "Veelgemaakte fout", variation: "Makkelijker of zwaarder" },
  en: { focus: "Works", how: "How to do it", dose: "Sets and reps", mistake: "Common mistake", variation: "Easier or harder" },
} satisfies Record<Locale, Record<string, string>>;

export function ExerciseList({ l, items }: { l: Locale; items: Exercise[] }) {
  const t = labels[l];
  return (
    <ol className="space-y-4">
      {items.map((e, i) => (
        <li key={e.name} className="card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-700 tabular-nums"
              aria-hidden
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-bold sm:text-xl">{e.name}</h3>
              {e.focus && (
                <p className="mt-0.5 text-sm text-muted">
                  {t.focus}: {e.focus}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 font-bold">{t.how}</p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-6 leading-relaxed text-muted marker:font-bold marker:text-brand-600">
            {e.steps.map((s) => (
              <li key={s.slice(0, 48)}>{s}</li>
            ))}
          </ol>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-sand p-4">
              <dt className="text-xs font-bold text-muted uppercase">{t.dose}</dt>
              <dd className="mt-1 leading-relaxed font-semibold">{e.dose}</dd>
            </div>
            <div className="rounded-2xl bg-accent-50 p-4">
              <dt className="text-xs font-bold text-accent-600 uppercase">{t.mistake}</dt>
              <dd className="mt-1 leading-relaxed">{e.mistake}</dd>
            </div>
          </dl>
          {e.variation && (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              <span className="font-bold text-ink">{t.variation}:</span> {e.variation}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Extra alinea's binnen een <Section>, na een tabel of opsomming (zelfde opmaak als Section). */
export function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((p) => (
        <p key={p.slice(0, 48)} className="text-lg leading-relaxed text-muted">
          {p}
        </p>
      ))}
    </>
  );
}

/** Opvallend blok voor veiligheidsadvies (warming-up, pijn, huisarts of fysiotherapeut). */
export function SafetyNote({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[1.5rem] border-2 border-accent-200 bg-accent-50 p-5 sm:p-6">
      <p className="flex items-center gap-2 font-extrabold">
        <ShieldAlert className="size-5 shrink-0 text-accent-600" aria-hidden /> {title}
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-6 leading-relaxed text-ink/90 marker:text-accent-600">
        {items.map((b) => (
          <li key={b.slice(0, 48)}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
