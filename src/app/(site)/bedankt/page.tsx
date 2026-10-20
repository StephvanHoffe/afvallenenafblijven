import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderStatus } from "@/app/(site)/bedankt/OrderStatus";

export const metadata: Metadata = {
  title: "Bedankt voor je bestelling",
  robots: { index: false },
};

export default function BedanktPage({ searchParams }: PageProps<"/bedankt">) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-3 text-center">Bestelling geslaagd</p>
        <h1 className="heading-lg text-center">Bedankt, we gaan voor je aan de slag!</h1>
        <div className="mt-8">
          <Suspense fallback={<div className="card h-64 animate-pulse" aria-hidden />}>
            <Status searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="mt-8 rounded-[var(--radius-card)] bg-sand p-6 text-[0.9375rem]">
          <h2 className="font-bold">Wat kun je nu alvast doen?</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Weeg jezelf morgenochtend nuchter; dat is je startgewicht.</li>
            <li>Maak een foto van jezelf als nulmeting; het verschil zie je later beter dan op de weegschaal.</li>
            <li>Plan je trainingen alvast in je agenda.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

async function Status({ searchParams }: Pick<PageProps<"/bedankt">, "searchParams">) {
  const sp = await searchParams;
  const sessionId = typeof sp.session_id === "string" ? sp.session_id : "";
  return <OrderStatus sessionId={sessionId} />;
}
