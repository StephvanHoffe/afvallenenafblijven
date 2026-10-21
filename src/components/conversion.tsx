import { ArrowRight, Check, HeartCrack, Hourglass, Wallet, X } from "lucide-react";
import { SectionHeading } from "@/components/marketing";
import { painCopy, painLabels, type PainTopic } from "@/content/pains";
import type { Locale } from "@/i18n/config";
import Link from "@/i18n/Link";

/** Geld, tijd en vertrouwen: wat het kost om zo door te gaan. */
const costIcons = [Wallet, Hourglass, HeartCrack];

/**
 * "Herken je dit?": eerst het probleem, dan wat het kost om zo door te gaan,
 * dan de omslag ("het ligt niet aan jou") met een knop op het moment dat de
 * bezoeker zich herkent.
 */
export function PainSection({
  topic,
  l,
  href,
  cta,
}: {
  topic: PainTopic;
  l: Locale;
  href: string;
  /** Kenmerk voor de campagnemeting op de landingspagina's (data-lp-cta). */
  cta?: string;
}) {
  const c = painLabels[l];
  const p = painCopy[l][topic];
  return (
    <section className="bg-sand py-16">
      <div className="container-page">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
          <div>
            <p className="eyebrow mb-3">{c.painsEyebrow}</p>
            <h2 className="heading-lg">{p.painTitle}</h2>
            <ul className="mt-6 space-y-3.5">
              {p.painPoints.map((point) => (
                <li key={point} className="flex gap-3 text-[1.0625rem] leading-relaxed">
                  <X className="mt-1 size-5 shrink-0 text-accent-500" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="self-start rounded-[var(--radius-card)] bg-brand-950 p-6 text-white sm:p-8">
            <h3 className="text-xl font-extrabold">{c.costTitle}</h3>
            <ul className="mt-6 space-y-5">
              {p.costs.map((x, i) => {
                const Icon = costIcons[i] ?? Hourglass;
                return (
                  <li key={x.title} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lime-glow">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-bold">{x.title}</span>
                      <span className="mt-0.5 block text-[0.9375rem] text-white/70">{x.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-3xl text-center">
          <h2 className="heading-md">{p.reframe.title}</h2>
          <p className="mt-3 text-lg leading-relaxed text-muted">{p.reframe.text}</p>
          <Link href={href} data-lp-cta={cta} className="btn-primary mt-7 text-lg">
            {c.painCta} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <p className="mt-3 text-sm text-muted">{c.painCtaNote}</p>
        </div>
      </div>
    </section>
  );
}

/** "Zo pakken we het anders aan": per kaart hoe het meestal gaat, en hoe wij het doen. */
export function FixSection({ topic, l, className = "container-page py-16" }: { topic: PainTopic; l: Locale; className?: string }) {
  const c = painLabels[l];
  return (
    <section className={className}>
      <SectionHeading eyebrow={c.fixEyebrow} title={c.fixTitle} />
      <ul className="grid gap-5 sm:grid-cols-2">
        {painCopy[l][topic].fixes.map((f) => (
          <li key={f.pain} className="card flex flex-col p-6">
            <p className="text-xs font-bold tracking-wide text-muted uppercase">{c.fixLabels[0]}</p>
            <p className="mt-1.5 flex gap-3 text-muted">
              <X className="mt-0.5 size-5 shrink-0 text-accent-500" aria-hidden />
              {f.pain}
            </p>
            <p className="mt-4 border-t border-line pt-4 text-xs font-bold tracking-wide text-brand-600 uppercase">{c.fixLabels[1]}</p>
            <p className="mt-1.5 flex gap-3 font-semibold">
              <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
              {f.answer}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
