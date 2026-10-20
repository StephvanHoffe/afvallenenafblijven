import { checkinOptions, type CheckinData } from "@/lib/checkin";
import { formatDate, formatNumber } from "@/lib/format";

/** Kleine, rustige weergaven voor de voortgang: kerncijfers, een meter en schalen. */

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good";
}) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight sm:text-[1.75rem] ${tone === "good" ? "text-brand-700" : ""}`}>{value}</p>
      {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
    </div>
  );
}

/** Hoe ver je bent richting je streefgewicht. */
export function GoalMeter({ startKg, currentKg, targetKg, share }: { startKg: number; currentKg: number; targetKg: number; share: number }) {
  const pct = Math.round(share * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-semibold">Op weg naar je streefgewicht</span>
        <span className="font-extrabold">{pct}%</span>
      </div>
      <div
        className="mt-2 h-3 overflow-hidden rounded-full bg-brand-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${pct}% van de weg naar je streefgewicht`}
      >
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted tabular-nums">
        <span>Start {formatNumber(startKg, 1)} kg</span>
        <span>Nu {formatNumber(currentKg, 1)} kg</span>
        <span>Doel {formatNumber(targetKg, 1)} kg</span>
      </div>
    </div>
  );
}

const BMI_MIN = 16;
const BMI_MAX = 40;
const BMI_BANDS = [
  { from: 16, to: 18.5, label: "Onder" },
  { from: 18.5, to: 25, label: "Gezond" },
  { from: 25, to: 30, label: "Overgewicht" },
  { from: 30, to: 40, label: "Obesitas" },
];

/** BMI op een schaal, met de start (open rondje) en nu (gevuld). */
export function BmiScale({ start, now }: { start: number | null; now: number }) {
  const pos = (v: number) => `${((Math.min(Math.max(v, BMI_MIN), BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN)) * 100}%`;
  return (
    <div>
      <div className="relative pt-6">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {BMI_BANDS.map((b) => (
            <div
              key={b.label}
              className={b.label === "Gezond" ? "bg-brand-200" : "bg-line"}
              style={{ width: `${((b.to - b.from) / (BMI_MAX - BMI_MIN)) * 100}%` }}
            />
          ))}
        </div>
        {start !== null && start !== now && (
          <span
            className="absolute top-[1.375rem] size-4 -translate-x-1/2 rounded-full border-[3px] border-muted bg-white"
            style={{ left: pos(start) }}
            aria-hidden
          />
        )}
        <span
          className="absolute top-[1.375rem] size-4 -translate-x-1/2 rounded-full border-2 border-white bg-brand-700 shadow"
          style={{ left: pos(now) }}
          aria-hidden
        />
        <span className="absolute top-0 -translate-x-1/2 text-xs font-extrabold" style={{ left: pos(now) }}>
          {formatNumber(now, 1)}
        </span>
      </div>
      <div className="mt-2 flex text-[0.6875rem] text-muted">
        {BMI_BANDS.map((b) => (
          <span key={b.label} style={{ width: `${((b.to - b.from) / (BMI_MAX - BMI_MIN)) * 100}%` }} className="truncate">
            {b.label}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">
        {start !== null && start !== now ? `Bij de start ${formatNumber(start, 1)}, nu ${formatNumber(now, 1)}.` : `Je BMI is ${formatNumber(now, 1)}.`}{" "}
        BMI is een grove maat: spieren wegen ook. Je taille en hoe je je voelt zeggen vaak meer.
      </p>
    </div>
  );
}

// Gevalideerd op kleurenblindheid (eiwit, koolhydraten, vet als buren in één balk).
const MACRO_COLORS = { protein: "#1c7a48", carbs: "#eda100", fat: "#2a78d6" };

/** Verdeling van de calorieën over eiwit, koolhydraten en vet. */
export function MacroBar({ proteinG, carbsG, fatG }: { proteinG: number; carbsG: number; fatG: number }) {
  const parts = [
    { key: "protein", label: "Eiwit", grams: proteinG, kcal: proteinG * 4, color: MACRO_COLORS.protein },
    { key: "carbs", label: "Koolhydraten", grams: carbsG, kcal: carbsG * 4, color: MACRO_COLORS.carbs },
    { key: "fat", label: "Vet", grams: fatG, kcal: fatG * 9, color: MACRO_COLORS.fat },
  ];
  const total = parts.reduce((s, p) => s + p.kcal, 0) || 1;
  return (
    <div>
      <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {parts.map((p) => (
          <div key={p.key} style={{ width: `${(p.kcal / total) * 100}%`, background: p.color }} title={`${p.label}: ${p.grams} g`} />
        ))}
      </div>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2">
            <span className="size-3 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span>
              <strong>{p.label}</strong> {p.grams} g <span className="text-muted">· {Math.round((p.kcal / total) * 100)}% van je calorieën</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ruststofwisseling, dagelijks verbruik en het caloriedoel als staven. */
export function EnergyBars({ bmr, tdee, calories }: { bmr: number; tdee: number; calories: number }) {
  const max = Math.max(bmr, tdee, calories);
  const rows = [
    { label: "Ruststofwisseling", hint: "wat je lichaam in rust verbruikt", value: bmr, emphasis: false },
    { label: "Verbruik per dag", hint: "inclusief je dagelijkse activiteit en training", value: tdee, emphasis: false },
    { label: "Jouw caloriedoel", hint: "wat je schema per dag bevat", value: calories, emphasis: true },
  ];
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span>
              <strong>{r.label}</strong> <span className="text-muted">· {r.hint}</span>
            </span>
            <span className="font-extrabold whitespace-nowrap tabular-nums">{formatNumber(r.value)} kcal</span>
          </div>
          <div className="mt-1.5 h-2.5 rounded-full bg-sand">
            <div
              className={`h-full rounded-r-[4px] rounded-l-full ${r.emphasis ? "bg-brand-600" : "bg-[#b9c4be]"}`}
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ---------- Check-in-antwoorden per periode ----------

type Tone = "good" | "mid" | "low";
const short = (v: string) => v.replace(/\s*\(.*\)$/, "");

const ROWS: { key: keyof CheckinData; label: string; tones: Record<string, Tone> }[] = [
  { key: "energy", label: "Energie", tones: { Goed: "good", Gemiddeld: "mid", Laag: "low" } },
  { key: "sleep", label: "Slaap", tones: { Goed: "good", Matig: "mid", Slecht: "low" } },
  { key: "hunger", label: "Honger", tones: { "Bijna nooit": "good", Soms: "mid", Vaak: "low" } },
  {
    key: "nutritionAdherence",
    label: "Voedingsschema gevolgd",
    tones: Object.fromEntries(checkinOptions.nutritionAdherence.map((o, i) => [o, (["good", "good", "mid", "low"] as const)[i]])),
  },
  {
    key: "trainingAdherence",
    label: "Trainingen gedaan",
    tones: Object.fromEntries(checkinOptions.trainingAdherence.map((o, i) => [o, (["good", "good", "mid", "low"] as const)[i]])),
  },
  { key: "difficulty", label: "Zwaarte trainingen", tones: { "Precies goed": "good", "Te licht": "mid", "Te zwaar": "mid" } },
];

const TONE: Record<Tone, { dot: string; label: string }> = {
  good: { dot: "bg-brand-600", label: "goed" },
  mid: { dot: "bg-amber-400", label: "kan beter" },
  low: { dot: "bg-accent-500", label: "aandacht" },
};

/** Tabel met de antwoorden uit elke check-in, met een kleurstip (en tekst) per antwoord. */
export function AnswersGrid({ checkins }: { checkins: { seq: number | null; date: Date; data: CheckinData }[] }) {
  const rows = ROWS.filter((r) => checkins.some((c) => c.data[r.key] !== undefined));
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="relative overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-sand text-xs font-bold tracking-wide text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2.5">
                Vraag
              </th>
              {checkins.map((c) => (
                <th key={c.date.toString()} scope="col" className="px-3 py-2.5 whitespace-nowrap">
                  {c.seq ? `Periode ${c.seq}` : "Check-in"}
                  <span className="block font-semibold tracking-normal normal-case">{formatDate(c.date)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="px-4 py-2.5 font-semibold whitespace-nowrap">
                  {r.label}
                </th>
                {checkins.map((c) => {
                  const value = c.data[r.key];
                  const tone = typeof value === "string" ? r.tones[value] : undefined;
                  return (
                    <td key={c.date.toString()} className="px-3 py-2.5">
                      {typeof value === "string" ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          {tone && <span className={`size-2.5 rounded-full ${TONE[tone].dot}`} aria-hidden />}
                          {short(value)}
                          {tone && <span className="sr-only"> ({TONE[tone].label})</span>}
                        </span>
                      ) : (
                        <span className="text-muted">–</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
        {(Object.keys(TONE) as Tone[]).map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${TONE[t].dot}`} /> {TONE[t].label}
          </span>
        ))}
      </p>
    </div>
  );
}
