import { Sparkles } from "lucide-react";

/** "Wat is er aangepast": de wijzigingen na de check-in, bovenaan een vervolgschema. */
export function ChangesCard({ changes }: { changes: string[] | undefined }) {
  if (!changes?.length) return null;
  return (
    <section className="avoid-break rounded-[var(--radius-card)] border-2 border-lime-glow bg-[#f6fbe8] p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold">
        <Sparkles className="size-5 text-brand-600" aria-hidden /> Aangepast na je check-in
      </h2>
      <ul className="mt-3 space-y-2 text-[0.9375rem]">
        {changes.map((c) => (
          <li key={c} className="flex gap-2.5">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden />
            {c}
          </li>
        ))}
      </ul>
    </section>
  );
}
