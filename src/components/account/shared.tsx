import { CircleCheck, Dumbbell, Salad, TriangleAlert } from "lucide-react";
import type { PlanType } from "@/config/pricing";
import type { DashboardOrder } from "@/lib/account-types";
import type { CheckinWindow } from "@/lib/checkin";
import { formatDate } from "@/lib/format";

/** Gedeelde stukjes voor de tabbladen van Mijn schema's. */

export const planMeta: Record<PlanType, { title: string; icon: typeof Salad; image: string }> = {
  voeding: { title: "Voedingsschema", icon: Salad, image: "/images/bowl-salmon.jpg" },
  training: { title: "Trainingsschema", icon: Dumbbell, image: "/images/woman-overhead-press.jpg" },
};

export function orderStatus(order: DashboardOrder): { text: string; tone: "ok" | "warn" | "muted" } {
  if (order.duration === "eenmalig") return { text: "Los schema", tone: "muted" };
  switch (order.status) {
    case "active":
      return order.cancelAt
        ? { text: `Opgezegd, loopt tot ${formatDate(order.cancelAt)}`, tone: "warn" }
        : { text: "Actief", tone: "ok" };
    case "past_due":
      return { text: "Afschrijving mislukt", tone: "warn" };
    case "canceled":
      return { text: "Beëindigd", tone: "muted" };
    default:
      return { text: "Afgerond", tone: "muted" };
  }
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "muted"; children: React.ReactNode }) {
  const styles = {
    ok: "bg-brand-50 text-brand-800",
    warn: "bg-accent-50 text-accent-600",
    muted: "bg-sand text-muted",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles}`}>
      {tone === "ok" && <CircleCheck className="size-3.5" aria-hidden />}
      {tone === "warn" && <TriangleAlert className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

/** Wat er bij het volgende schema staat, afhankelijk van de check-in. */
export function nextPlanText(checkin: CheckinWindow | null): { title: string; text: string } {
  if (!checkin) return { title: "Geen nieuw schema gepland", text: "Je abonnement loopt af of is niet actief." };
  switch (checkin.status) {
    case "upcoming":
      return {
        title: `Na je check-in (vanaf ${formatDate(checkin.opensAt)})`,
        text: `Je schema voor periode ${checkin.seq} maken we zodra je je check-in hebt ingevuld.`,
      };
    case "open":
    case "overdue":
      return { title: "Wacht op je check-in", text: `Vul je check-in in, dan maken we direct je schema voor periode ${checkin.seq}.` };
    default:
      return { title: "Wordt nu gemaakt", text: "Je check-in is binnen. Binnen een paar minuten staat je nieuwe schema klaar." };
  }
}

export function Section({ title, intro, action, children }: { title: React.ReactNode; intro?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card min-w-0 p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">{title}</h2>
          {intro && <p className="mt-0.5 text-sm text-muted">{intro}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
