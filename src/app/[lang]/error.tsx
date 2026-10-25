"use client";

import { defineCopy } from "@/i18n/config";
import { useLocale } from "@/i18n/client";

const copy = defineCopy({
  nl: {
    title: "Er ging iets mis",
    text: "Probeer het opnieuw. Blijft het misgaan? Neem dan contact met ons op.",
    retry: "Opnieuw proberen",
  },
  en: {
    title: "Something went wrong",
    text: "Please try again. Still not working? Get in touch with us.",
    retry: "Try again",
  },
});

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const c = copy[useLocale()];
  return (
    <section className="container-page py-20 text-center">
      <h1 className="heading-lg">{c.title}</h1>
      <p className="mt-3 text-muted">{c.text}</p>
      <button type="button" onClick={() => retry()} className="btn-primary mt-8">
        {c.retry}
      </button>
    </section>
  );
}
