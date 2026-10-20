import Link from "next/link";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { OrderStatus, PlanStatus } from "@/lib/repo";
import { durations, products, type DurationId, type ProductId } from "@/config/pricing";

export function PageTitle({ title, intro, children }: { title: string; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {intro && <p className="mt-1 text-[0.9375rem] text-muted">{intro}</p>}
      </div>
      {children}
    </div>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-bold">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "default" }: { label: string; value: string; hint?: string; tone?: "default" | "warn" }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-[1.75rem] leading-tight font-extrabold tracking-tight ${tone === "warn" ? "text-accent-600" : ""}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

type Tone = "ok" | "warn" | "bad" | "muted" | "info";

export function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const styles: Record<Tone, string> = {
    ok: "bg-brand-50 text-brand-800",
    warn: "bg-amber-50 text-amber-800",
    bad: "bg-accent-50 text-accent-600",
    muted: "bg-sand text-muted",
    info: "bg-sky-50 text-sky-800",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap ${styles[tone]}`}>{children}</span>;
}

export function OrderStatusBadge({ status, cancelAt }: { status: OrderStatus; cancelAt?: Date | null }) {
  if (status === "active" && cancelAt) return <Badge tone="warn">Opgezegd</Badge>;
  const map: Record<OrderStatus, [Tone, string]> = {
    active: ["ok", "Actief"],
    past_due: ["bad", "Betaling mislukt"],
    canceled: ["muted", "Beëindigd"],
    completed: ["info", "Los schema"],
  };
  const [tone, label] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function PlanStatusBadge({ status, attempts }: { status: PlanStatus; attempts: number }) {
  if (status === "failed" && attempts >= 5) return <Badge tone="bad">Mislukt</Badge>;
  const map: Record<PlanStatus, [Tone, string]> = {
    ready: ["ok", "Klaar"],
    generating: ["info", "Wordt gemaakt"],
    pending: ["muted", "In wachtrij"],
    failed: ["warn", `Nieuwe poging (${attempts}/5)`],
  };
  const [tone, label] = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}

export function planName(product: ProductId, duration: DurationId): string {
  const d = duration === "eenmalig" ? "los" : duration === "1m" ? "per maand" : `min. ${durations[duration].label}`;
  return `${products[product].shortName} · ${d}`;
}

const MESSAGES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  demo: { tone: "warn", text: "Demo-modus: acties worden niet uitgevoerd." },
  "opnieuw-gestart": { tone: "ok", text: "Het schema wordt opnieuw gemaakt. Ververs de pagina over een paar minuten." },
  "mail-verstuurd": { tone: "ok", text: "De e-mail met de schema's is opnieuw verstuurd." },
  "inloglink-verstuurd": { tone: "ok", text: "De klant heeft een nieuwe inloglink ontvangen." },
  opgezegd: { tone: "ok", text: "Het abonnement is opgezegd. De klant heeft een bevestiging ontvangen." },
  verwijderd: { tone: "ok", text: "De klant en alle bijbehorende gegevens zijn verwijderd." },
  afgehandeld: { tone: "ok", text: "De herroeping is als afgehandeld gemarkeerd." },
  "testmail-verstuurd": { tone: "ok", text: "De testmail is verstuurd naar het beheeradres." },
  "testmail-mislukt": { tone: "warn", text: "De testmail kon niet worden verstuurd. Controleer de SMTP-instellingen." },
  "niet-gevonden": { tone: "warn", text: "Niet gevonden of niet mogelijk in de huidige status." },
  "nog-niet-klaar": { tone: "warn", text: "Er zijn nog geen klaarstaande schema's in deze periode." },
  "bevestig-verwijderen": { tone: "warn", text: "Typ VERWIJDER om het verwijderen te bevestigen." },
  "eerst-opzeggen": { tone: "warn", text: "Deze klant heeft nog een lopend abonnement. Zeg dat eerst op." },
};

export function Notice({ code }: { code?: string }) {
  const m = code ? MESSAGES[code] : undefined;
  if (!m) return null;
  return (
    <p
      role="status"
      className={`mb-6 flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${m.tone === "ok" ? "bg-brand-50 text-brand-800" : "bg-amber-50 text-amber-800"}`}
    >
      {m.tone === "ok" ? <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />}
      {m.text}
    </p>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-10 text-center text-sm text-muted">
        {children}
      </td>
    </tr>
  );
}

export function FilterTabs({ base, current, options }: { base: string; current?: string; options: { value?: string; label: string }[] }) {
  return (
    <nav aria-label="Filter" className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = (o.value ?? "") === (current ?? "");
        return (
          <Link
            key={o.label}
            href={o.value ? `${base}?status=${o.value}` : base}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${active ? "bg-brand-900 text-white" : "border border-line bg-white hover:border-brand-300"}`}
          >
            {o.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DemoNote() {
  return (
    <p className="flex items-center gap-2 rounded-xl bg-lime-glow/30 px-3 py-2 text-xs font-bold text-brand-950">
      <Info className="size-4 shrink-0" aria-hidden /> Demo-modus met fictieve voorbeelddata
    </p>
  );
}

/** Gedeelde tabelstijl. */
export const table = {
  wrap: "overflow-x-auto",
  table: "w-full min-w-[40rem] text-left text-sm",
  th: "border-b border-line bg-sand/60 px-5 py-2.5 text-xs font-bold tracking-wide text-muted uppercase",
  td: "border-b border-line px-5 py-3 align-middle",
  num: "tabular-nums",
};

export function NeedsDatabase() {
  return (
    <div className="rounded-2xl border border-line bg-white p-8 text-center">
      <h1 className="text-xl font-extrabold">Nog geen database gekoppeld</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Stel DATABASE_URL in bij je hosting om klanten, bestellingen en schema&apos;s te zien. Op de pagina Instellingen zie je
        welke koppelingen nog ontbreken.
      </p>
      <Link href="/beheer/instellingen" className="btn-primary mt-5 !px-5 !py-2.5 text-sm">
        Naar Instellingen
      </Link>
    </div>
  );
}
