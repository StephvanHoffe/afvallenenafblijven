import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/app/inloggen/LoginForm";

export const metadata: Metadata = {
  title: "Abonnement opzeggen",
  description: "Zeg je abonnement eenvoudig online op. Maandelijks opzegbaar na de eerste periode.",
  alternates: { canonical: "/abonnement-opzeggen" },
};

export default function OpzeggenPage() {
  return (
    <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-2 [&>*]:min-w-0">
      <div>
        <p className="eyebrow mb-3">Abonnement opzeggen</p>
        <h1 className="heading-lg">Opzeggen kan altijd online, in een paar klikken</h1>
        <div className="prose-legal mt-6">
          <p>Jammer dat je wilt stoppen! Zo werkt opzeggen:</p>
          <ul>
            <li>
              <strong>Maandabonnement:</strong> je zegt op tegen het einde van de lopende maand.
            </li>
            <li>
              <strong>Abonnement van 3, 6 of 12 maanden:</strong> je zegt op tegen het einde van de vooruitbetaalde periode. Na
              die eerste periode loopt je abonnement per maand door en is het maandelijks opzegbaar.
            </li>
            <li>Je houdt toegang tot alle schema&apos;s die je al hebt ontvangen.</li>
            <li>Je ontvangt altijd een bevestiging van je opzegging per e-mail.</li>
          </ul>
          <p>
            Ben je ingelogd? Ga dan naar <Link href="/account?opzeggen=1">Mijn schema&apos;s</Link> en klik op
            &quot;Opzeggen&quot;. Niet ingelogd? Vul hiernaast je e-mailadres in; je ontvangt dan direct een link waarmee
            je opzegt.
          </p>
          <p>
            Wil je je bestelling binnen de wettelijke bedenktijd herroepen? Gebruik dan de{" "}
            <Link href="/herroepen">herroepingsfunctie</Link>.
          </p>
        </div>
      </div>
      <div className="card h-fit p-6 sm:p-8">
        <h2 className="heading-md mb-4">Abonnement opzeggen</h2>
        <LoginForm purpose="opzeggen" />
      </div>
    </section>
  );
}
