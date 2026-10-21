import Image from "next/image";
import Link from "@/i18n/Link";
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
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    trust: {
      inbox: "Binnen minuten in je mailbox",
      cancel: "Maandelijks opzegbaar",
      pay: "Veilig betalen met iDEAL | Wero",
      guarantee: (days: number) => `${days} dagen geld-terug-garantie`,
    },
    steps: [
      {
        title: "Beantwoord de vragen",
        text: "In ongeveer 2 minuten vertel je ons je doel, je lichaam, wat je lekker vindt en hoeveel tijd je hebt.",
      },
      {
        title: "Kies je plan",
        text: "Voeding, training of allebei. Per maand, of voordeliger voor 3, 6 of 12 maanden.",
      },
      {
        title: "Ontvang je schema",
        text: "Binnen enkele minuten staat je persoonlijke schema klaar. Na elke 4 weken een korte check-in, en je krijgt een nieuw, bijgestuurd schema.",
      },
    ],
    benefits: [
      {
        title: "100% op jou afgestemd",
        text: "Jouw calorie- en eiwitdoel, berekend op basis van je lichaam, activiteit en doel. Geen standaardlijstje.",
      },
      {
        title: "Lekker én haalbaar",
        text: "Gerechten met producten uit de Nederlandse supermarkt, binnen jouw kooktijd en budget.",
      },
      {
        title: "Boodschappenlijst erbij",
        text: "Alles voor de hele week, per afdeling gesorteerd. Sneller boodschappen doen, minder verspilling.",
      },
      {
        title: "Thuis of in de sportschool",
        text: "Oefeningen die passen bij jouw materiaal en niveau, met uitleg en alternatieven.",
      },
      {
        title: "Elke 4 weken vernieuwd",
        text: "Na een korte check-in maken we je nieuwe schema, afgestemd op je voortgang, zodat je blijft vooruitgaan en het niet saai wordt.",
      },
      {
        title: "Verantwoord & veilig",
        text: "Gebaseerd op de Richtlijnen goede voeding. Geen crashdiëten, geen pillen, geen poeders.",
      },
    ],
    guarantee: {
      title: (days: number) => `${days} dagen tevredenheidsgarantie`,
      text: (days: number) =>
        `Ben je niet tevreden over je schema? Vraag binnen ${days} dagen na je aankoop je eerste betaling volledig terug, eenvoudig in Mijn schema's of per e-mail. Geen vragen, geen gedoe.`,
    },
    cta: {
      title: "Klaar om te beginnen?",
      text: "Beantwoord de vragen in 2 minuten en ontvang vandaag nog je persoonlijke schema.",
      label: "Start je persoonlijke plan",
    },
  },
  en: {
    trust: {
      inbox: "In your inbox within minutes",
      cancel: "Cancel monthly",
      pay: "Pay securely with iDEAL | Wero",
      guarantee: (days: number) => `${days}-day money-back guarantee`,
    },
    steps: [
      {
        title: "Answer the questions",
        text: "In about 2 minutes, tell us your goal, a little about your body, what you love to eat and how much time you have.",
      },
      {
        title: "Choose your plan",
        text: "Nutrition, training or both. Pay month by month, or save more with 3, 6 or 12 months.",
      },
      {
        title: "Get your plan",
        text: "Your personal plan is ready within minutes. Every 4 weeks you do a short check-in and get a new, fine-tuned plan.",
      },
    ],
    benefits: [
      {
        title: "100% tailored to you",
        text: "Your calorie and protein targets, calculated from your body, activity level and goal. No one-size-fits-all list.",
      },
      {
        title: "Delicious and doable",
        text: "Dishes made with products from Dutch supermarkets, within your cooking time and budget.",
      },
      {
        title: "Shopping list included",
        text: "Everything for the whole week, sorted by supermarket aisle. Quicker shopping, less waste.",
      },
      {
        title: "At home or at the gym",
        text: "Exercises that match your equipment and level, with clear instructions and alternatives.",
      },
      {
        title: "Refreshed every 4 weeks",
        text: "After a short check-in, we create your new plan based on your progress, so you keep moving forward and it never gets boring.",
      },
      {
        title: "Responsible & safe",
        text: "Based on the official Dutch dietary guidelines. No crash diets, no pills, no powders.",
      },
    ],
    guarantee: {
      title: (days: number) => `${days}-day satisfaction guarantee`,
      text: (days: number) =>
        `Not happy with your plan? Within ${days} days of your purchase, get your first payment back in full, easily in My plans or by email. No questions asked, no hassle.`,
    },
    cta: {
      title: "Ready to get started?",
      text: "Answer the questions in 2 minutes and get your personal plan today.",
      label: "Start your personal plan",
    },
  },
});

export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = true,
  light = false,
  as: Heading = "h2",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  center?: boolean;
  light?: boolean;
  /** "h1" als dit de paginatitel is. */
  as?: "h1" | "h2";
}) {
  return (
    <div className={`mb-10 max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className={`eyebrow mb-3 ${light ? "!text-lime-glow" : ""}`}>{eyebrow}</p>}
      <Heading className={`heading-lg ${light ? "text-white" : ""}`}>{title}</Heading>
      {intro && <p className={`mt-4 text-lg leading-relaxed ${light ? "text-white/75" : "text-muted"}`}>{intro}</p>}
    </div>
  );
}

export async function TrustRow({ light = false }: { light?: boolean }) {
  const c = copy[await getLocale()].trust;
  const items = [
    { icon: Clock, text: c.inbox },
    { icon: RefreshCw, text: c.cancel },
    { icon: Lock, text: c.pay },
    ...(site.guarantee.enabled ? [{ icon: ShieldCheck, text: c.guarantee(site.guarantee.days) }] : []),
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

const stepIcons = [ListChecks, Target, CalendarDays];

export async function Steps() {
  const steps = copy[await getLocale()].steps.map((s, i) => ({ ...s, icon: stepIcons[i] }));
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

const benefitIcons = [Target, ChefHat, ShoppingCart, Dumbbell, RefreshCw, HeartPulse];

export async function Benefits() {
  const items = copy[await getLocale()].benefits.map((b, i) => ({ ...b, icon: benefitIcons[i] }));
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

export async function Guarantee() {
  if (!site.guarantee.enabled) return null;
  const c = copy[await getLocale()].guarantee;
  return (
    <div className="card mx-auto flex max-w-3xl flex-col items-center gap-5 p-7 text-center sm:flex-row sm:text-left">
      <div className="grid size-20 shrink-0 place-items-center rounded-full bg-lime-glow/40">
        <BadgeCheck className="size-10 text-brand-700" aria-hidden />
      </div>
      <div>
        <h3 className="text-xl font-extrabold">{c.title(site.guarantee.days)}</h3>
        <p className="mt-2 text-muted">{c.text(site.guarantee.days)}</p>
      </div>
    </div>
  );
}

export async function CtaBanner({
  title,
  text,
  href = "/start",
  label,
}: {
  title?: string;
  text?: string;
  href?: string;
  label?: string;
}) {
  const c = copy[await getLocale()].cta;
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
          <h2 className="heading-lg text-white">{title ?? c.title}</h2>
          <p className="mt-4 text-lg text-white/80">{text ?? c.text}</p>
          <Link href={href} className="btn-glow mt-8 text-lg">
            {label ?? c.label} <ArrowRight className="size-5" aria-hidden />
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
