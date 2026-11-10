import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CircleCheck } from "lucide-react";
import { Quiz } from "@/components/quiz/Quiz";
import { isDurationId, isProductId } from "@/config/pricing";
import { defineCopy, localePath } from "@/i18n/config";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";
import { isDatabaseConfigured, loadStoredConfig } from "@/lib/db";
import { intakeSchema } from "@/lib/intake";
import { getIntake, getOrderByIntake } from "@/lib/repo";

const copy = defineCopy({
  nl: {
    metaTitle: "Maak je schema compleet",
    eyebrow: "Betaling ontvangen",
    title: "Nog een paar vragen, dan maken we je schema",
    intro: "Over wat je lekker vindt, je maaltijden en je training. Dat duurt ongeveer 2 minuten; daarna staat je schema binnen 2 uur klaar.",
    notFoundTitle: "We konden je bestelling niet vinden",
    notFoundText: "Gebruik de link uit je e-mail, of neem contact met ons op; dan helpen we je verder.",
    contact: "Neem contact op",
  },
  en: {
    metaTitle: "Complete your plan",
    eyebrow: "Payment received",
    title: "A few more questions, then we'll create your plan",
    intro: "About what you like to eat, your meals and your workouts. It takes about 2 minutes; after that, your plan will be ready within 2 hours.",
    notFoundTitle: "We couldn't find your order",
    notFoundText: "Please use the link from your email, or get in touch with us and we'll help you.",
    contact: "Get in touch",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].metaTitle, robots: { index: false, follow: false } };
}

/**
 * Korte route: na het betalen vult de klant hier de rest van de vragenlijst in
 * (?bestelling = het nummer van de vragenlijst, dat alleen de klant kent; het
 * staat ook in de orderbevestiging en de herinneringsmails). Daarna maken we
 * het eerste schema. Is alles al ingevuld, dan gaat de klant naar de bedankpagina.
 */
export default function SchemaAanvullenPage({ searchParams }: PageProps<"/[lang]/schema-aanvullen">) {
  return (
    <section className="container-page py-10 sm:py-14">
      <Suspense fallback={<div className="mx-auto h-96 max-w-2xl animate-pulse rounded-3xl bg-white" aria-hidden />}>
        <Details searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function Details({ searchParams }: Pick<PageProps<"/[lang]/schema-aanvullen">, "searchParams">) {
  const l = await getLocale();
  const c = copy[l];
  const sp = await searchParams;
  const intakeId = typeof sp.bestelling === "string" && /^[0-9a-f-]{36}$/i.test(sp.bestelling) ? sp.bestelling : "";
  await loadStoredConfig();
  const row = intakeId && isDatabaseConfigured() ? await getIntake(intakeId).catch(() => null) : null;
  const order = row ? await getOrderByIntake(intakeId).catch(() => null) : null;
  const intake = row ? intakeSchema.safeParse(row.data) : null;

  if (!row || !order || !intake?.success || !isProductId(order.product)) {
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <h1 className="heading-md">{c.notFoundTitle}</h1>
        <p className="mt-3 text-muted">{c.notFoundText}</p>
        <Link href="/contact" className="btn-secondary mt-6">
          {c.contact}
        </Link>
      </div>
    );
  }
  if (!row.details_pending) redirect(localePath(l, `/bedankt?bestelling=${intakeId}`));

  return (
    <>
      <div className="mx-auto mb-8 max-w-2xl">
        <p className="eyebrow mb-2 flex items-center gap-1.5">
          <CircleCheck className="size-4" aria-hidden /> {c.eyebrow}
        </p>
        <h1 className="heading-lg">{c.title}</h1>
        <p className="mt-3 text-lg text-muted">{c.intro}</p>
      </div>
      <Quiz
        flow="aanvullen"
        details={{ intakeId, product: order.product, intake: intake.data }}
        initialProduct={order.product}
        initialDuration={isDurationId(order.duration) ? order.duration : "1m"}
        startAtPlan={false}
        promo={null}
      />
    </>
  );
}
