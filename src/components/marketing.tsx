import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChefHat,
  Clock,
  Dumbbell,
  HeartPulse,
  ListChecks,
  Lock,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Target,
} from "lucide-react";
import type { FaqItem } from "@/content/faq";
import { site } from "@/config/site";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = true,
  light = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow mb-3 ${light ? "!text-lime-glow" : ""}`}>{eyebrow}</p>}
      <h2 className={`heading-lg ${light ? "text-white" : ""}`}>{title}</h2>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-muted"}`}>{intro}</p>}
    </div>
  );
}

export function TrustRow({ light = false }: { light?: boolean }) {
  const items = [
    { icon: Clock, text: "Binnen minuten in je mailbox" },
    { icon: RefreshCw, text: "Maandelijks opzegbaar" },
    { icon: Lock, text: "Veilig betalen met iDEAL | Wero" },
    ...(site.guarantee.enabled ? [{ icon: ShieldCheck, text: `${site.guarantee.days} dagen geld-terug-garantie` }] : []),
  ];
  return (
    <ul className={`flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold ${light ? "text-white/85" : "text-ink/80"}`}>
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-2">
          <Icon className={`size-4 ${light ? "text-lime-glow" : "text-brand-600"}`} aria-hidden />
          {text}
        </li>
      ))}
    </ul>
  );
}

export function Steps() {
  const steps = [
    {
      title: "Beantwoord de vragen",
      text: "In ongeveer 2 minuten vertel je ons je doel, je lichaam, wat je lekker vindt en hoeveel tijd je hebt.",
      icon: ListChecks,
    },
    {
      title: "Kies je plan",
      text: "Voeding, training of allebei. Per maand, of voordeliger voor 3, 6 of 12 maanden.",
      icon: Target,
    },
    {
      title: "Ontvang je schema",
      text: "Binnen enkele minuten staat je persoonlijke schema klaar. Elke 4 weken krijg je een nieuw, bijgestuurd schema.",
      icon: CalendarDays,
    },
  ];
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {steps.map((s, i) => (
        <li key={s.title} className="card relative p-6">
          <span className="absolute top-6 right-6 text-5xl leading-none font-extrabold text-brand-100">{i + 1}</span>
          <s.icon className="size-9 rounded-xl bg-brand-50 p-2 text-brand-600" aria-hidden />
          <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
          <p className="mt-2 text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function Benefits() {
  const items = [
    {
      icon: Target,
      title: "100% op jou afgestemd",
      text: "Jouw calorie- en eiwitdoel, berekend op basis van je lichaam, activiteit en doel. Geen standaardlijstje.",
    },
    {
      icon: ChefHat,
      title: "Lekker én haalbaar",
      text: "Gerechten met producten uit de Nederlandse supermarkt, binnen jouw kooktijd en budget.",
    },
    {
      icon: ShoppingCart,
      title: "Boodschappenlijst erbij",
      text: "Alles voor de hele week, per afdeling gesorteerd. Sneller boodschappen doen, minder verspilling.",
    },
    {
      icon: Dumbbell,
      title: "Thuis of in de sportschool",
      text: "Oefeningen die passen bij jouw materiaal en niveau, met uitleg en alternatieven.",
    },
    {
      icon: RefreshCw,
      title: "Elke 4 weken vernieuwd",
      text: "Met een korte check-in sturen we je schema bij, zodat je blijft vooruitgaan en het niet saai wordt.",
    },
    {
      icon: HeartPulse,
      title: "Verantwoord & veilig",
      text: "Gebaseerd op de Richtlijnen goede voeding. Geen crashdiëten, geen pillen, geen poeders.",
    },
  ];
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((b) => (
        <div key={b.title} className="card p-6">
          <b.icon className="size-10 rounded-xl bg-brand-50 p-2 text-brand-600" aria-hidden />
          <h3 className="mt-4 text-lg font-bold">{b.title}</h3>
          <p className="mt-2 text-muted">{b.text}</p>
        </div>
      ))}
    </div>
  );
}

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
      {items.map((item) => (
        <details key={item.q} className="group p-5 sm:p-6 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
            {item.q}
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 transition group-open:rotate-45">
              +
            </span>
          </summary>
          <p className="mt-3 leading-relaxed text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FaqJsonLd({ items }: { items: FaqItem[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function Guarantee() {
  if (!site.guarantee.enabled) return null;
  return (
    <div className="card mx-auto flex max-w-3xl flex-col items-center gap-5 p-7 text-center sm:flex-row sm:text-left">
      <div className="grid size-20 shrink-0 place-items-center rounded-full bg-lime-glow/40">
        <BadgeCheck className="size-10 text-brand-700" aria-hidden />
      </div>
      <div>
        <h3 className="text-xl font-extrabold">{site.guarantee.days} dagen tevredenheidsgarantie</h3>
        <p className="mt-2 text-muted">
          Probeer het zonder risico. Ben je niet tevreden over je schema? Mail ons binnen {site.guarantee.days} dagen na je
          aankoop en je krijgt je eerste betaling volledig terug. Geen vragen, geen gedoe.
        </p>
      </div>
    </div>
  );
}

export function CtaBanner({
  title = "Klaar om te beginnen?",
  text = "Beantwoord de vragen in 2 minuten en ontvang vandaag nog je persoonlijke schema.",
  href = "/start",
  label = "Start je persoonlijke plan",
}: {
  title?: string;
  text?: string;
  href?: string;
  label?: string;
}) {
  return (
    <section className="container-page py-16">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-14 text-center text-white sm:px-12">
        <Image
          src="/images/vegetables.jpg"
          alt=""
          fill
          sizes="(min-width: 1152px) 1152px, 100vw"
          className="object-cover opacity-15"
        />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="heading-lg text-white">{title}</h2>
          <p className="mt-4 text-lg text-white/80">{text}</p>
          <Link href={href} className="btn-glow mt-8 text-lg">
            {label} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <div className="mt-8 flex justify-center">
            <TrustRow light />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro: React.ReactNode;
  image: string;
  imageAlt: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="container-page grid items-center gap-10 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="heading-xl">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">{intro}</p>
        {children}
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
        <Image src={image} alt={imageAlt} fill preload sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}
