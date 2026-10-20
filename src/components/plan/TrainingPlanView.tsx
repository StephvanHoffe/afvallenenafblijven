import { Activity, ChevronDown, Flame, HeartPulse, ShieldAlert, Snowflake, Timer } from "lucide-react";
import type { TrainingPlan } from "@/lib/ai/schemas";
import { ChangesCard } from "@/components/plan/ChangesCard";
import { PlanTabs } from "@/components/plan/PlanTabs";
import { isTrainingDay, restLabel, workoutShortName } from "@/lib/plan-format";

type Workout = TrainingPlan["workouts"][number];

function WeekStrip({ schedule }: { schedule: TrainingPlan["weekSchedule"] }) {
  return (
    <section aria-label="Jouw week" className="avoid-break overflow-hidden rounded-[var(--radius-card)] bg-brand-900 text-white">
      <p className="px-5 pt-4 text-xs font-bold tracking-wide text-lime-glow uppercase">Jouw week</p>
      <ol className="grid gap-2 p-4 pt-3 sm:grid-cols-7">
        {schedule.map((d) => {
          const training = isTrainingDay(d.activity);
          return (
            <li
              key={d.day}
              className={`flex items-baseline gap-3 rounded-2xl px-3 py-2.5 sm:block ${training ? "bg-lime-glow text-brand-950" : "bg-white/10"}`}
            >
              <p className={`w-8 shrink-0 text-xs font-extrabold uppercase sm:w-auto ${training ? "" : "text-white/70"}`}>
                {d.day.slice(0, 2)}
              </p>
              <p className="text-sm leading-snug sm:mt-1">{d.activity}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Collapsible({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <details className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 font-bold sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2">
          {icon} {title}
        </span>
        <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-line px-4 py-4 text-[0.9375rem] sm:px-5">{children}</div>
    </details>
  );
}

function WorkoutPanel({ workout, plan }: { workout: Workout; plan: TrainingPlan }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="heading-md">{workout.name}</h2>
          <p className="text-muted">{workout.focus}</p>
        </div>
        <p className="flex flex-wrap gap-2 text-sm font-semibold">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5">
            <Timer className="size-4" aria-hidden /> ± {workout.minutes} min
          </span>
          <span className="rounded-full bg-sand px-3 py-1.5">{workout.exercises.length} oefeningen</span>
        </p>
      </div>

      <Collapsible icon={<Flame className="size-5 text-accent-500" aria-hidden />} title={`Eerst: warming-up (${plan.warmup.minutes} min)`}>
        <ol className="list-decimal space-y-1 pl-5">
          {plan.warmup.steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </Collapsible>

      <p className="text-sm text-muted">Tik op een oefening voor uitleg, intensiteit en een alternatief.</p>
      <ol className="space-y-2.5">
        {workout.exercises.map((e, i) => (
          <li key={e.name}>
            <details className="group card overflow-hidden">
              <summary className="grid cursor-pointer list-none grid-cols-[2rem_minmax(0,1fr)_auto_1.25rem] items-center gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="grid size-8 place-items-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block leading-snug font-bold">{e.name}</span>
                  <span className="block truncate text-sm text-muted">{e.muscleGroups}</span>
                </span>
                <span className="text-right">
                  <span className="block max-w-[6.5rem] font-extrabold tabular-nums sm:max-w-none sm:whitespace-nowrap">
                    {e.sets} × {e.reps}
                  </span>
                  <span className="block text-xs text-muted">{restLabel(e.restSeconds)} rust</span>
                </span>
                <ChevronDown className="size-5 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="grid gap-4 border-t border-line px-4 py-4 text-[0.9375rem] sm:grid-cols-2 sm:px-5">
                <div>
                  <p>
                    <strong>Intensiteit:</strong> {e.intensity}
                  </p>
                  <h4 className="mt-3 font-bold">Zo doe je het</h4>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {e.cues.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </div>
                <p className="self-start rounded-2xl bg-accent-50 p-3 text-sm">
                  <strong>Alternatief:</strong> {e.alternative}
                </p>
              </div>
            </details>
          </li>
        ))}
      </ol>

      {workout.finisher && (
        <p className="flex gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-[0.9375rem]">
          <Activity className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
          <span>
            <strong>Afsluiter:</strong> {workout.finisher}
          </span>
        </p>
      )}

      <Collapsible icon={<Snowflake className="size-5 text-brand-600" aria-hidden />} title="Tot slot: cooling-down">
        <ul className="list-disc space-y-1 pl-5">
          {plan.cooldown.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </Collapsible>
    </div>
  );
}

function ProgressionPanel({ plan }: { plan: TrainingPlan }) {
  return (
    <div className="space-y-5">
      <ol className="grid gap-3 md:grid-cols-4">
        {plan.progression.map((p) => (
          <li key={p.week} className="card p-5">
            <p className="text-xs font-bold tracking-wide text-brand-700 uppercase">Week {p.week}</p>
            <p className="mt-1 font-bold">{p.focus}</p>
            <p className="mt-1 text-sm text-ink/85">{p.instructions}</p>
          </li>
        ))}
      </ol>
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <HeartPulse className="size-5 text-brand-600" aria-hidden /> Stappen & cardio
        </h2>
        <p className="mt-2 text-[0.9375rem]">{plan.cardioAndSteps}</p>
      </section>
    </div>
  );
}

function TipsPanel({ plan }: { plan: TrainingPlan }) {
  return (
    <div className="space-y-5">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-bold">Herstel</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[0.9375rem]">
          {plan.recoveryTips.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </section>
      {plan.safetyNotes.length > 0 && (
        <section className="flex gap-3 rounded-[var(--radius-card)] border border-accent-200 bg-accent-50 p-5 text-[0.9375rem]">
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

export function TrainingPlanView({ plan, preview = false }: { plan: TrainingPlan; preview?: boolean }) {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="heading-lg">{plan.title}</h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted">{plan.intro}</p>
      </header>

      <WeekStrip schedule={plan.weekSchedule} />
      <ChangesCard changes={plan.changes} />

      <PlanTabs
        label="Onderdelen van je trainingsschema"
        tabs={[
          ...plan.workouts.map((w, i) => ({
            id: `training-${i + 1}`,
            label: workoutShortName(w.name),
            content: <WorkoutPanel workout={w} plan={plan} />,
          })),
          { id: "opbouw", label: "Opbouw in 4 weken", content: <ProgressionPanel plan={plan} /> },
          { id: "tips", label: "Herstel & veiligheid", content: <TipsPanel plan={plan} /> },
        ]}
      />

      {preview && (
        <p className="rounded-2xl border-2 border-dashed border-brand-300 p-4 text-center text-sm font-semibold text-brand-800">
          In je eigen schema staan alle trainingen voor jouw aantal trainingsdagen, afgestemd op jouw materiaal en niveau.
        </p>
      )}
    </div>
  );
}
