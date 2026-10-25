import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatus } from "@/app/[lang]/(site)/bedankt/OrderStatus";
import { defineCopy } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    metaTitle: "Bedankt voor je bestelling",
    eyebrow: "Bestelling geslaagd",
    title: "Bedankt, we gaan voor je aan de slag!",
    nextTitle: "Wat kun je nu alvast doen?",
    next: [
      "Weeg jezelf morgenochtend nuchter; dat is je startgewicht.",
      "Maak een foto van jezelf als nulmeting; het verschil zie je later beter dan op de weegschaal.",
      "Plan je trainingen alvast in je agenda.",
    ],
  },
  en: {
    metaTitle: "Thank you for your order",
    eyebrow: "Order successful",
    title: "Thank you, we're getting to work for you!",
    nextTitle: "What can you do in the meantime?",
    next: [
      "Weigh yourself tomorrow morning before eating or drinking; that's your starting weight.",
      "Take a photo of yourself as a baseline; you'll see the difference more clearly later than on the scales.",
      "Schedule your workouts in your calendar now.",
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: copy[l].metaTitle,
    robots: { index: false },
  };
}

export default async function BedanktPage({ searchParams }: PageProps<"/[lang]/bedankt">) {
  const c = copy[await getLocale()];
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-3 text-center">{c.eyebrow}</p>
        <h1 className="heading-lg text-center">{c.title}</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-64 animate-pulse" aria-hidden />}>
            <Status searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="mt-8 rounded-[var(--radius-card)] bg-sand p-6 text-[0.9375rem]">
          <h2 className="font-bold">{c.nextTitle}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {c.next.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

async function Status({ searchParams }: Pick<PageProps<"/[lang]/bedankt">, "searchParams">) {
  const sp = await searchParams;
  const intakeId = typeof sp.bestelling === "string" ? sp.bestelling : "";
  return <OrderStatus intakeId={intakeId} />;
}
