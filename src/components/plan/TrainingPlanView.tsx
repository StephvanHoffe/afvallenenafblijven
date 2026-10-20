import { Activity, CalendarDays, Flame, HeartPulse, ShieldAlert, Timer, TrendingUp } from "lucide-react";
import type { TrainingPlan } from "@/lib/ai/schemas";

export function TrainingPlanView({ plan, preview = false }: { plan: TrainingPlan; preview?: boolean }) {
  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="heading-lg">{plan.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted">{plan.intro}</p>
      </header>

      <section className="avoid-break rounded-[var(--radius-card)] bg-brand-900 p-6 text-white">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          <CalendarDays className="size-5 text-lime-glow" aria-hidden /> Jouw week
        </h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {plan.weekSchedule.map((d) => (
            <li key={d.day} className="rounded-2xl bg-white/10 p-3">
              <p className="text-xs font-bold tracking-wide text-lime-glow uppercase">{d.day}</p>
              <p className="mt-1 text-sm leading-snug">{d.activity}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="avoid-break card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Flame className="size-5 text-accent-500" aria-hidden /> Warming-up ({plan.warmup.minutes} min) – voor elke training
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {plan.warmup.steps.map((s) => (
            <li key={s} className="rounded-2xl bg-sand px-4 py-2.5 text-[0.9375rem]">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {plan.workouts.map((w, index) => (
        <section key={w.name} className={index > 0 ? "print-break" : ""}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="heading-md">{w.name}</h2>
              <p className="text-muted">{w.focus}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-sm font-semibold">
              <Timer className="size-4" aria-hidden /> ± {w.minutes} min
            </span>
          </div>
          <div className="space-y-3">
            {w.exercises.map((e, i) => (
              <article key={e.name} className="avoid-break card grid gap-4 p-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
                <div>
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg leading-snug font-bold">{e.name}</h3>
                      <p className="text-sm text-muted">{e.muscleGroups}</p>
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-2xl bg-brand-50 p-2.5">
                      <dt className="text-xs font-semibold text-muted">Sets</dt>
                      <dd className="text-lg font-extrabold">{e.sets}</dd>
                    </div>
                    <div className="rounded-2xl bg-brand-50 p-2.5">
                      <dt className="text-xs font-semibold text-muted">Herhalingen</dt>
                      <dd className="text-lg font-extrabold">{e.reps}</dd>
                    </div>
                    <div className="rounded-2xl bg-brand-50 p-2.5">
                      <dt className="text-xs font-semibold text-muted">Rust</dt>
                      <dd className="text-lg font-extrabold">{e.restSeconds}s</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm">
                    <strong>Intensiteit:</strong> {e.intensity}
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-bold">Zo doe je het</h4>
                    <ul className="mt-1 list-disc space-y-1 pl-4 text-ink/85">
                      {e.cues.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="rounded-2xl bg-accent-50 p-3">
                    <strong>Alternatief:</strong> {e.alternative}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {w.finisher && (
            <p className="mt-3 flex gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[0.9375rem]">
              <Activity className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              <span>
                <strong>Afsluiter:</strong> {w.finisher}
              </span>
            </p>
          )}
        </section>
      ))}

      {preview && (
        <p className="rounded-2xl border-2 border-dashed border-brand-300 p-5 text-center font-semibold text-brand-800">
          In je eigen schema staan alle trainingen voor jouw aantal trainingsdagen, afgestemd op jouw materiaal en niveau.
        </p>
      )}

      <section className="avoid-break card p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <TrendingUp className="size-5 text-brand-600" aria-hidden /> Zo bouw je op in 4 weken
        </h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-4">
          {plan.progression.map((p) => (
            <li key={p.week} className="rounded-2xl bg-sand p-4">
              <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">Week {p.week}</p>
              <p className="mt-1 font-bold">{p.focus}</p>
              <p className="mt-1 text-sm text-ink/85">{p.instructions}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="avoid-break grid gap-4 md:grid-cols-3">
        <div className="card p-6">
          <h2 className="text-lg font-bold">Cooling-down</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.cooldown.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <HeartPulse className="size-5 text-brand-600" aria-hidden /> Stappen & cardio
          </h2>
          <p className="mt-3 text-[0.9375rem]">{plan.cardioAndSteps}</p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Herstel</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
            {plan.recoveryTips.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {plan.safetyNotes.length > 0 && (
        <section className="avoid-break flex gap-3 rounded-[var(--radius-card)] border border-accent-200 bg-accent-50 p-5 text-[0.9375rem]">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-accent-600" aria-hidden />
          <ul className="space-y-1">
            {plan.safetyNotes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
