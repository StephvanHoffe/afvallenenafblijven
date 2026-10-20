import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Clock, Dumbbell, Flame, Salad, ShoppingCart, X } from "lucide-react";
import {
  Benefits,
  CtaBanner,
  FaqJsonLd,
  FaqList,
  Guarantee,
  SectionHeading,
  Steps,
  TrustRow,
} from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { StickyCta } from "@/components/StickyCta";
import { faq } from "@/content/faq";
import { launchOfferActive } from "@/lib/launch";
import { site } from "@/config/site";
import { products } from "@/config/pricing";

export default async function HomePage() {
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-gradient-to-b from-brand-50 to-cream" />
        <div className="container-page grid items-center gap-12 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800">
              <span className="size-2 rounded-full bg-brand-500" aria-hidden /> Persoonlijk schema in 2 minuten
            </p>
            <h1 className="heading-xl">
              Afvallen én afblijven, met een plan dat bij <span className="text-brand-600">jóu</span> past.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Een persoonlijk voedings- en trainingsschema, afgestemd op jouw doel, lichaam, smaak en agenda. Zonder
              crashdiëten, zonder honger, en binnen enkele minuten in je mailbox.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/start" className="btn-primary text-lg">
                Start de vragenlijst <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/voorbeeld" className="btn-secondary text-lg">
                Bekijk een voorbeeldschema
              </Link>
            </div>
            <div className="mt-8">
              <TrustRow />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)] sm:aspect-[5/5]">
              <Image
                src="/images/hero-workout-home.jpg"
                alt="Vrouw doet thuis een buikspieroefening op een yogamat"
                fill
                preload
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover object-[68%_50%]"
              />
            </div>
            <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-10">
              <div className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
                  <Image src="/images/bowl-salmon.jpg" alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-600 uppercase">Lunch · 10 min</p>
                  <p className="text-sm leading-snug font-bold">Zalmbowl met ei &amp; groente</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5 text-[0.6875rem] font-bold">
                <span className="rounded-full bg-sand px-2 py-1">452 kcal</span>
                <span className="rounded-full bg-sand px-2 py-1">38 g eiwit</span>
              </div>
            </div>
            <div className="absolute -top-4 -right-2 rounded-3xl bg-brand-900 p-4 text-white shadow-[var(--shadow-lift)] sm:-right-6">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                <Flame className="size-3.5 text-lime-glow" aria-hidden /> Jouw dagdoel
              </p>
              <p className="text-2xl font-extrabold">1.580 kcal</p>
              <p className="text-xs text-white/70">120 g eiwit · 8.000 stappen</p>
            </div>
          </div>
        </div>
      </section>

      {/* WAAROM HET WERKT */}
      <section className="container-page py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image
              src="/images/cooking-woman.jpg"
              alt="Vrouw kookt een gezonde maaltijd in een lichte keuken"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">Waarom het deze keer wél lukt</p>
            <h2 className="heading-lg">Geen dieet. Een plan dat je volhoudt.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              Strenge diëten werken even, en dan komen de kilo&apos;s terug. Wij doen het anders: een realistisch
              tekort, genoeg eiwit, krachttraining die je spieren beschermt en eten dat je gewoon lekker vindt.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-line bg-white p-5">
                <p className="mb-3 font-bold text-ink/60">Standaard dieet</p>
                <ul className="space-y-2 text-[0.9375rem]">
                  {["Eén lijstje voor iedereen", "Honger en trek", "Saai en streng", "Jojo-effect"].map((t) => (
                    <li key={t} className="flex gap-2 text-muted">
                      <X className="mt-0.5 size-5 shrink-0 text-accent-500" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-brand-900 p-5 text-white">
                <p className="mb-3 font-bold text-lime-glow">{site.name}</p>
                <ul className="space-y-2 text-[0.9375rem]">
                  {["Op jóu afgestemd", "Verzadigd door eiwit & vezels", "Gerechten die je lekker vindt", "Resultaat dat blijft"].map(
                    (t) => (
                      <li key={t} className="flex gap-2">
                        <Check className="mt-0.5 size-5 shrink-0 text-lime-glow" aria-hidden /> {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section className="bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Zo werkt het"
            title="In 3 stappen naar jouw persoonlijke schema"
            intro="Geen wachttijden of intakegesprekken. Vandaag beginnen kan gewoon."
          />
          <Steps />
          <div className="mt-10 text-center">
            <Link href="/start" className="btn-primary text-lg">
              Beantwoord de vragen <ArrowRight className="size-5" aria-hidden />
            </Link>
            <p className="mt-3 text-sm text-muted">Duurt ongeveer 2 minuten · Je betaalt pas als je een plan kiest</p>
          </div>
        </div>
      </section>

      {/* PRODUCTEN */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow="Kies wat bij je past"
          title="Voeding, training of allebei"
          intro="Los te koop of voordelig als bundel. De bundel is het snelst: voeding en training versterken elkaar."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {(["voeding", "bundel", "training"] as const).map((id) => {
            const p = products[id];
            const Icon = id === "voeding" ? Salad : id === "training" ? Dumbbell : Flame;
            return (
              <Link
                key={id}
                href={p.href}
                className={`group card overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${id === "bundel" ? "ring-2 ring-brand-500" : ""}`}
              >
                <div className="relative aspect-[16/10]">
                  <Image src={p.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  {id === "bundel" && (
                    <span className="absolute top-3 left-3 rounded-full bg-lime-glow px-3 py-1 text-xs font-extrabold text-brand-950 uppercase">
                      Meest gekozen
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-xl font-extrabold">
                    <Icon className="size-5 text-brand-600" aria-hidden /> {p.name}
                  </h3>
                  <p className="mt-2 text-muted">{p.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-700 group-hover:gap-2">
                    Meer over {p.shortName.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WAT JE KRIJGT */}
      <section className="bg-brand-950 py-16 text-white sm:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 !text-lime-glow">Wat je krijgt</p>
            <h2 className="heading-lg text-white">Alles wat je nodig hebt, overzichtelijk op één plek</h2>
            <ul className="mt-8 space-y-5">
              {[
                { icon: Flame, title: "Jouw persoonlijke dagdoelen", text: "Calorieën, eiwit, koolhydraten en vet, berekend voor jouw lichaam en doel." },
                { icon: Salad, title: "Weekmenu met recepten", text: "Elke dag ontbijt, lunch, avondeten en tussendoortjes, met hoeveelheden en bereiding." },
                { icon: ShoppingCart, title: "Boodschappenlijst", text: "Per afdeling gesorteerd, voor de hele week." },
                { icon: Dumbbell, title: "Trainingsschema met progressie", text: "Sets, herhalingen, rusttijden en uitleg, opgebouwd over 4 weken." },
                { icon: Clock, title: "Elke 4 weken een nieuw schema", text: "Bijgestuurd op basis van je check-in, zodat je blijft vooruitgaan." },
              ].map((i) => (
                <li key={i.title} className="flex gap-4">
                  <i.icon className="size-11 shrink-0 rounded-2xl bg-white/10 p-2.5 text-lime-glow" aria-hidden />
                  <div>
                    <h3 className="font-bold">{i.title}</h3>
                    <p className="text-white/70">{i.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/voorbeeld" className="btn-glow mt-10">
              Bekijk een voorbeeldschema <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-3xl">
              <Image src="/images/food-flatlay.jpg" alt="Gezonde maaltijden op tafel" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src="/images/ingredients-board.jpg" alt="Verse ingrediënten op een snijplank" fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src="/images/gym-woman-cable.jpg" alt="Vrouw traint in de sportschool" fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow="Waarom kiezen voor ons" title="Persoonlijke begeleiding, zonder de hoge kosten" />
        <Benefits />
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Prijzen"
            title="Kies je plan en looptijd"
            intro="Hoe langer de looptijd, hoe voordeliger. Na de eerste periode is elk abonnement maandelijks opzegbaar."
          />
          <PricingTable launch={launch} />
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      {/* AFBLIJVEN */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow mb-3">Het geheim zit in het afblijven</p>
            <h2 className="heading-lg">Je streefgewicht bereikt? Dan begint het pas.</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              De meeste mensen vallen terug zodra het dieet stopt. Daarom stappen we na het afvallen met je over op
              een onderhoudsplan: meer eten, sterk blijven en gewoontes vasthouden. Zo blijft je resultaat ook echt
              van jou.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Geleidelijk terug naar je onderhoudsniveau",
                "Krachttraining om je stofwisseling te ondersteunen",
                "Flexibel eten, ook op feestjes en vakantie",
              ].map((t) => (
                <li key={t} className="flex gap-2.5 font-semibold">
                  <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image src="/images/running.jpg" alt="Mensen hardlopen bij zonsopkomst" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Veelgestelde vragen" title="Nog twijfels? Logisch." />
          <FaqList items={faq.slice(0, 7)} />
          <p className="mt-6 text-center">
            <Link href="/veelgestelde-vragen" className="font-bold text-brand-700 underline underline-offset-2">
              Bekijk alle vragen
            </Link>
          </p>
          <FaqJsonLd items={faq.slice(0, 7)} />
        </div>
      </section>

      <CtaBanner />
      <StickyCta />
    </>
  );
}
