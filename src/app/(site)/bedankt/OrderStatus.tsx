"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, CircleCheck, Loader2, Mail, TriangleAlert } from "lucide-react";
import { trackEvent } from "@/lib/consent";

type Status = {
  state: "ready" | "processing" | "failed" | "awaiting_payment" | "unknown";
  value?: number;
  product?: string;
  duration?: string;
  plans?: { type: "voeding" | "training"; status: string }[];
};

const steps = [
  "Betaling ontvangen",
  "Je dagdoelen berekenen",
  "Gerechten en trainingen samenstellen",
  "Kwaliteitscontrole",
];

export function OrderStatus({ sessionId }: { sessionId: string }) {
  const [status, setStatus] = useState<Status>({ state: "processing" });
  const [tick, setTick] = useState(0);
  const tracked = useRef(false);

  useEffect(() => {
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      try {
        const res = await fetch(`/api/bestelling/status?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
        const data = (await res.json()) as Status;
        if (stop) return;
        setStatus(data);
        if (!tracked.current && data.value !== undefined) {
          tracked.current = true;
          trackEvent("purchase", { value: data.value, currency: "EUR", transaction_id: sessionId });
        }
        if (data.state === "processing" || data.state === "awaiting_payment") timer = setTimeout(poll, 5000);
      } catch {
        if (!stop) timer = setTimeout(poll, 8000);
      }
    }
    poll();
    const ticker = setInterval(() => setTick((t) => t + 1), 4000);
    return () => {
      stop = true;
      clearTimeout(timer);
      clearInterval(ticker);
    };
  }, [sessionId]);

  if (status.state === "ready") {
    return (
      <div className="card p-8 text-center">
        <CircleCheck className="mx-auto size-14 text-brand-600" aria-hidden />
        <h2 className="heading-md mt-4">Je schema staat klaar!</h2>
        <p className="mt-2 text-muted">We hebben je ook een e-mail gestuurd met een persoonlijke link.</p>
        <a href={`/api/bestelling/inloggen?session_id=${encodeURIComponent(sessionId)}`} className="btn-primary mt-6 text-lg">
          Bekijk mijn schema <ArrowRight className="size-5" aria-hidden />
        </a>
      </div>
    );
  }

  if (status.state === "failed") {
    return (
      <div className="card p-8 text-center">
        <TriangleAlert className="mx-auto size-12 text-accent-500" aria-hidden />
        <h2 className="heading-md mt-4">Het maken van je schema duurt langer dan normaal</h2>
        <p className="mt-2 text-muted">
          Geen zorgen: je betaling is binnen en we zijn ermee bezig. Je ontvangt je schema per e-mail zodra het klaar is.
          Vragen? <Link href="/contact" className="font-semibold underline">Neem contact op</Link>.
        </p>
      </div>
    );
  }

  if (status.state === "unknown") {
    return (
      <div className="card p-8 text-center">
        <Mail className="mx-auto size-12 text-brand-600" aria-hidden />
        <h2 className="heading-md mt-4">Bedankt voor je bestelling!</h2>
        <p className="mt-2 text-muted">Je ontvangt je schema per e-mail zodra het klaar is. Check ook je spammap.</p>
      </div>
    );
  }

  const active = status.state === "awaiting_payment" ? 0 : Math.min(1 + Math.floor(tick / 2), steps.length - 1);
  return (
    <div className="card p-8" role="status" aria-live="polite">
      <div className="flex items-center gap-3">
        <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden />
        <h2 className="heading-md">
          {status.state === "awaiting_payment" ? "We wachten op de bevestiging van je betaling…" : "Je schema wordt nu gemaakt…"}
        </h2>
      </div>
      <ol className="mt-6 space-y-3">
        {steps.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 ${i <= active ? "text-ink" : "text-muted/60"}`}>
            {i < active ? (
              <CircleCheck className="size-5 text-brand-600" aria-hidden />
            ) : i === active ? (
              <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
            ) : (
              <span className="size-5 rounded-full border-2 border-line" aria-hidden />
            )}
            <span className="font-semibold">{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted">
        Dit duurt meestal een paar minuten. Je mag deze pagina open laten staan; je ontvangt ook een e-mail zodra je schema
        klaar is.
      </p>
    </div>
  );
}
