import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import { PrintButton } from "@/components/plan/PrintButton";
import type { PlanContent } from "@/lib/ai/schemas";
import { formatDate } from "@/lib/format";
import { site } from "@/config/site";

/** Een volledig schema zoals de klant het ziet: terug-link, printknop, inhoud en disclaimer. */
export function PlanDocument({
  content,
  customerName,
  generatedAt,
  backHref = "/account",
  backLabel = "Mijn schema's",
  preview = false,
}: {
  content: PlanContent;
  customerName: string;
  generatedAt: Date | null;
  backHref?: string;
  backLabel?: string;
  preview?: boolean;
}) {
  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {backLabel}
        </Link>
        <PrintButton />
      </div>
      <p className="mb-4 text-sm text-muted">
        Persoonlijk schema voor {customerName}
        {generatedAt ? `, gemaakt op ${formatDate(generatedAt)}` : ""} · {site.name}
      </p>
      {content.type === "voeding" ? (
        <NutritionPlanView plan={content.plan} targets={content.targets} preview={preview} />
      ) : (
        <TrainingPlanView plan={content.plan} preview={preview} />
      )}
      <p className="mt-12 rounded-2xl bg-sand p-4 text-xs leading-relaxed text-muted">
        Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden. Het is geen medisch advies en geen
        vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je klachten, een medische aandoening
        of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de etiketten.
      </p>
    </div>
  );
}
