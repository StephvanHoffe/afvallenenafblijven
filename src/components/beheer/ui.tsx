import Link from "@/i18n/Link";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { OrderStatus, PlanStatus } from "@/lib/repo";
import { durations, products, type DurationId, type ProductId } from "@/config/pricing";
import { formatDateTime } from "@/lib/format";

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

/**
 * Waar een schema staat richting de klant: bij de klant, gepland (willekeurig
 * moment binnen 2 uur) of wachtend op jouw goedkeuring.
 */
export function PlanDelivery({
  plan,
  approval,
}: {
  plan: { status: PlanStatus; releaseAfter: Date; releasedAt: Date | null; approvedAt: Date | null };
  approval: boolean;
}) {
  if (plan.releasedAt) return <span className="block text-xs text-muted">Bij de klant: {formatDateTime(plan.releasedAt)}</span>;
  if (plan.status === "ready" && approval && !plan.approvedAt) {
    return <span className="block text-xs font-semibold text-amber-800">Wacht op je goedkeuring · gepland {formatDateTime(plan.releaseAfter)}</span>;
  }
  return <span className="block text-xs text-muted">Gepland voor de klant: {formatDateTime(plan.releaseAfter)}</span>;
}

export function planName(product: ProductId, duration: DurationId): string {
  const d = duration === "eenmalig" ? "los" : duration === "1m" ? "per maand" : `min. ${durations[duration].label}`;
  return `${products[product].shortName} · ${d}`;
}

const MESSAGES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  demo: { tone: "warn", text: "Demo-modus: acties worden niet uitgevoerd." },
  "opnieuw-gestart": { tone: "ok", text: "Het schema wordt opnieuw gemaakt. Ververs de pagina over een paar minuten." },
  goedgekeurd: { tone: "ok", text: "Goedgekeurd. Het schema gaat op het geplande moment naar de klant (zodra alle schema's van de periode zijn goedgekeurd)." },
  vrijgegeven: { tone: "ok", text: "Het schema staat nu klaar voor de klant; de klant krijgt een e-mail." },
  "goedkeuring-aan": { tone: "ok", text: "Goedkeuren staat aan: nieuwe schema's gaan pas naar de klant nadat jij ze hebt goedgekeurd." },
  "goedkeuring-uit": { tone: "ok", text: "Goedkeuren staat uit: nieuwe schema's gaan automatisch op het geplande moment naar de klant." },
  "periode-gestart": { tone: "ok", text: "De nieuwe periode is gestart. De schema's worden nu gemaakt; de klant krijgt een e-mail zodra ze klaarstaan." },
  "mail-verstuurd": { tone: "ok", text: "De e-mail met de schema's is opnieuw verstuurd." },
  "inloglink-verstuurd": { tone: "ok", text: "De klant heeft een nieuwe inloglink ontvangen." },
  opgezegd: { tone: "ok", text: "Het abonnement is opgezegd. De klant heeft een bevestiging ontvangen." },
  verwijderd: { tone: "ok", text: "De klant en alle bijbehorende gegevens zijn verwijderd." },
  afgehandeld: { tone: "ok", text: "De herroeping is als afgehandeld gemarkeerd." },
  "garantie-afgehandeld": { tone: "ok", text: "De garantie-aanvraag is als afgehandeld gemarkeerd." },
  "melding-mail-aan": { tone: "ok", text: "Je krijgt deze melding weer per mail." },
  "melding-mail-uit": { tone: "ok", text: "Je krijgt deze melding niet meer per mail. Hier in het beheer zie je hem nog wel." },
  "testmail-verstuurd": { tone: "ok", text: "De testmail is verstuurd naar het beheeradres." },
  "testmail-mislukt": { tone: "warn", text: "De testmail kon niet worden verstuurd. Controleer de SMTP-instellingen." },
  "niet-gevonden": { tone: "warn", text: "Niet gevonden of niet mogelijk in de huidige status." },
  "nog-niet-klaar": { tone: "warn", text: "De schema's van deze periode zijn nog niet bij de klant; de mail gaat vanzelf mee op het geplande moment." },
  "bevestig-verwijderen": { tone: "warn", text: "Typ VERWIJDER om het verwijderen te bevestigen." },
  "eerst-opzeggen": { tone: "warn", text: "Deze klant heeft nog een lopend abonnement. Zeg dat eerst op." },
  "code-ongeldig": { tone: "warn", text: "Controleer de kortingscode: minimaal 3 tekens, een korting van 1-100% of een bedrag, en bij \"de eerste maanden\" 1-24 maanden." },
  "code-bestaat": { tone: "warn", text: "Deze kortingscode bestaat al. Kies een andere code." },
  "code-aangemaakt": { tone: "ok", text: "De kortingscode is aangemaakt en direct te gebruiken." },
  "code-aan": { tone: "ok", text: "De kortingscode is weer actief." },
  "code-uit": { tone: "ok", text: "De kortingscode is gepauzeerd; klanten kunnen hem niet meer gebruiken." },
  "code-verwijderd": { tone: "ok", text: "De kortingscode is verwijderd." },
  "code-gebruikt": { tone: "warn", text: "Deze code is al gebruikt en kan daarom niet worden verwijderd. Hij is gepauzeerd." },
  "mail-opgeslagen": { tone: "ok", text: "De teksten zijn opgeslagen. Nieuwe mails gebruiken ze direct (uiterlijk binnen een halve minuut)." },
  "mail-standaard": { tone: "ok", text: "De standaardteksten worden weer gebruikt." },
  "gegevens-ongeldig": { tone: "warn", text: "Controleer de naam en het e-mailadres." },
  "email-bestaat": { tone: "warn", text: "Er is al een andere klant met dit e-mailadres." },
  "klant-opgeslagen": { tone: "ok", text: "De klantgegevens zijn opgeslagen." },
  "vragenlijst-ongeldig": { tone: "warn", text: "Controleer de antwoorden (bijvoorbeeld een streefgewicht dat lager is dan het huidige gewicht)." },
  "vragenlijst-opgeslagen": { tone: "ok", text: "De antwoorden zijn aangepast. Het volgende schema gebruikt de nieuwe antwoorden; maak het huidige schema zo nodig opnieuw." },
  "notitie-leeg": { tone: "warn", text: "Schrijf eerst een notitie." },
  "notitie-opgeslagen": { tone: "ok", text: "De notitie is opgeslagen." },
  "notitie-verwijderd": { tone: "ok", text: "De notitie is verwijderd." },
  beoordeeld: { tone: "ok", text: "Je beoordeling is opgeslagen." },
  "al-terugbetaald": { tone: "warn", text: "Deze bestelling is al (deels) terugbetaald." },
  "terugbetalen-mislukt": { tone: "warn", text: "Terugbetalen via Mollie is mislukt. Controleer de betaling en je saldo in het Mollie-dashboard." },
  terugbetaald: { tone: "ok", text: "De betaling is terugbetaald via Mollie, met een creditnota." },
  "levering-ongeldig": { tone: "warn", text: "De levertijd moet tussen 0 en 110 minuten liggen, met het minimum lager dan het maximum." },
  "instellingen-opgeslagen": { tone: "ok", text: "De instellingen zijn opgeslagen." },
  "koppeling-werkt": { tone: "ok", text: "Opgeslagen en getest: de koppeling werkt. Wijzigingen gelden binnen een halve minuut, zonder opnieuw te deployen." },
  "koppeling-getest": { tone: "ok", text: "Opnieuw getest: de koppeling werkt." },
  "koppeling-opgeslagen": { tone: "warn", text: "Opgeslagen, maar de koppeling werkt nog niet. Zie de uitleg bij het onderdeel hieronder." },
  "koppeling-werkt-niet": { tone: "warn", text: "De koppeling werkt niet. Zie de uitleg bij het onderdeel hieronder." },
  "koppeling-mollie-sleutel": { tone: "warn", text: "Dit is geen Mollie-sleutel. Een API-sleutel begint met test_ of live_ (niet de profiel-ID of de organisatietoken)." },
  "koppeling-poort": { tone: "warn", text: "De poort is een getal, meestal 465 of 587." },
  "koppeling-e-mail": { tone: "warn", text: "Controleer het e-mailadres voor de meldingen." },
  "wachtwoord-gewijzigd": { tone: "ok", text: "Je beheerwachtwoord is gewijzigd. Andere apparaten zijn uitgelogd." },
  "herinnering-ongeldig": { tone: "warn", text: "Kies een wachttijd tussen 1 en 48 uur." },
  "herinnering-niet-mogelijk": { tone: "warn", text: "Een herinnering kan alleen als de bezoeker toestemming gaf voor e-mail, nog niet heeft betaald en nog geen herinnering kreeg." },
  "herinnering-verstuurd": { tone: "ok", text: "De herinnering is verstuurd." },
  "kans-verborgen": { tone: "ok", text: "De kans is 30 dagen verborgen. Is hij daarna nog actueel, dan verschijnt hij weer." },
  "kansen-hersteld": { tone: "ok", text: "Alle verborgen kansen worden weer getoond." },
  "kans-afgevinkt": {
    tone: "ok",
    text: "Afgevinkt. Over 30 dagen kijken we of het probleem uit de cijfers is verdwenen; ondertussen staan de volgende kansen bovenaan.",
  },
  "kans-teruggezet": { tone: "ok", text: "De kans staat weer open." },
  "ai-klaar": { tone: "ok", text: "Het advies van Claude staat hieronder." },
  "ai-mislukt": { tone: "warn", text: "Het advies kon niet worden gemaakt. Controleer de API-sleutel en het tegoed bij Anthropic, en probeer het later opnieuw." },
  "ai-te-snel": { tone: "warn", text: "Je hebt net al advies gevraagd. Probeer het over tien minuten opnieuw." },
  "ai-geen-sleutel": { tone: "warn", text: "Vul eerst de API-sleutel van Claude in bij Koppelingen." },
  "koppeling-instagram-account": { tone: "warn", text: "Het Instagram-account-ID bestaat alleen uit cijfers. Laat het leeg bij een token dat met IG begint." },
  "instagram-opdracht-leeg": { tone: "warn", text: "Schrijf eerst waar de post over moet gaan." },
  "instagram-moment-ongeldig": { tone: "warn", text: "Kies een datum en tijd in de toekomst." },
  "instagram-niet-gekoppeld": { tone: "warn", text: "Koppel eerst Instagram bij Koppelingen, of kies \"Eerst bekijken\" om alleen een concept te maken." },
  "instagram-wordt-gemaakt": { tone: "ok", text: "Claude maakt de post. Dat duurt meestal één tot twee minuten; deze pagina ververst vanzelf." },
  "instagram-wordt-geplaatst": { tone: "ok", text: "De post wordt nu op Instagram geplaatst; deze pagina ververst vanzelf." },
  "instagram-ingepland": { tone: "ok", text: "De post is ingepland en wordt op het gekozen moment automatisch geplaatst." },
  "instagram-concept": { tone: "ok", text: "De post is nu een concept en wordt niet automatisch geplaatst." },
  "instagram-opgeslagen": { tone: "ok", text: "Je aanpassingen zijn opgeslagen en de afbeeldingen zijn opnieuw getekend." },
  "instagram-ongeldig": { tone: "warn", text: "Controleer de post: elke slide heeft een kop nodig en er moet minstens één slide overblijven." },
  "instagram-opnieuw": { tone: "ok", text: "Claude maakt een nieuwe versie (als concept). Deze pagina ververst vanzelf." },
  "instagram-verwijderd": { tone: "ok", text: "De post is verwijderd uit het beheer. Stond hij al op Instagram, dan blijft hij daar staan." },
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
  wrap: "relative overflow-x-auto",
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
        Koppel de database bij je hosting (bij Vercel: Storage → Neon) om klanten, bestellingen en schema&apos;s te zien. Op de pagina Instellingen zie je
        welke koppelingen nog ontbreken.
      </p>
      <Link href="/beheer/instellingen" className="btn-primary mt-5 !px-5 !py-2.5 text-sm">
        Naar Instellingen
      </Link>
    </div>
  );
}

/** Tabs die één queryparameter zetten en de andere behouden (bijv. periode en bron). */
export function QueryTabs({
  base,
  param,
  current,
  options,
  params = {},
  label = "Filter",
}: {
  base: string;
  param: string;
  current?: string | null;
  options: { value?: string; label: string }[];
  params?: Record<string, string | null | undefined>;
  label?: string;
}) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = (o.value ?? "") === (current ?? "");
        const q = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) if (v && k !== param) q.set(k, v);
        if (o.value) q.set(param, o.value);
        const href = q.size ? `${base}?${q.toString()}` : base;
        return (
          <Link
            key={o.label}
            href={href}
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

/** Dunne balk voor een waarde ten opzichte van het maximum (één kleur). */
export function Meter({ value, max, tone = "brand" }: { value: number; max: number; tone?: "brand" | "warn" }) {
  const width = max > 0 ? Math.max(value > 0 ? 2 : 0, (value / max) * 100) : 0;
  return (
    <div className="h-2 rounded-full bg-brand-50" aria-hidden>
      <div className={`h-full rounded-full ${tone === "warn" ? "bg-accent-500" : "bg-brand-600"}`} style={{ width: `${width}%` }} />
    </div>
  );
}

/** Een duur als tekst: "2 min 14 s" of "48 s" ("–" zonder meting). */
export function duration(seconds: number | null): string {
  if (seconds === null) return "–";
  const s = Math.round(seconds);
  return s >= 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s} s`;
}

/** Percentage als tekst ("12%", of "–" zonder noemer). */
export function pct(n: number, d: number, digits = 0): string {
  if (!d) return "–";
  return `${((n / d) * 100).toLocaleString("nl-NL", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}
