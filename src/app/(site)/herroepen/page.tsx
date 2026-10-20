import type { Metadata } from "next";
import Link from "next/link";
import { WithdrawalForm } from "@/app/(site)/herroepen/WithdrawalForm";
import { companyAddressLine, site } from "@/config/site";

export const metadata: Metadata = {
  title: "Overeenkomst herroepen",
  description: "Herroep je overeenkomst online met onze herroepingsfunctie.",
  alternates: { canonical: "/herroepen" },
};

export default function HerroepenPage() {
  const c = site.company;
  return (
    <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-2 [&>*]:min-w-0">
      <div>
        <p className="eyebrow mb-3">Herroepingsrecht</p>
        <h1 className="heading-lg">Overeenkomst herroepen</h1>
        <div className="prose-legal mt-6">
          <p>
            Als consument heb je bij een aankoop op afstand in principe 14 dagen bedenktijd. Binnen die termijn kun je de
            overeenkomst zonder opgaaf van redenen herroepen via de knop op deze pagina.
          </p>
          <h2>Belangrijk bij digitale schema&apos;s</h2>
          <p>
            Onze schema&apos;s zijn digitale inhoud die we direct na je betaling voor je maken. Bij het bestellen geef je
            uitdrukkelijk toestemming om direct te beginnen en verklaar je dat je weet dat je herroepingsrecht vervalt
            zodra het schema aan je is geleverd. Is je schema al geleverd, dan kun je de overeenkomst daarom in de regel
            niet meer herroepen. Wel kun je je abonnement altijd <Link href="/abonnement-opzeggen">opzeggen</Link>
            {site.guarantee.enabled ? (
              <>
                {" "}
                en geldt onze <Link href="/algemene-voorwaarden#garantie">tevredenheidsgarantie van {site.guarantee.days} dagen</Link>{" "}
                op je eerste betaling
              </>
            ) : null}
            .
          </p>
          <h2>Zo werkt het</h2>
          <ol>
            <li>Klik op &quot;Overeenkomst hier herroepen&quot; en vul je gegevens in.</li>
            <li>Controleer de gegevens en klik op &quot;Herroeping bevestigen&quot;.</li>
            <li>Je ontvangt direct per e-mail een ontvangstbevestiging met de inhoud, datum en tijd van je herroeping.</li>
          </ol>
          <p>
            Voor zover het herroepingsrecht van toepassing is, betalen we alle betalingen binnen 14 dagen terug via dezelfde
            betaalmethode. Liever per post of e-mail? Gebruik dan het{" "}
            <Link href="/algemene-voorwaarden#modelformulier">modelformulier voor herroeping</Link> en stuur het naar{" "}
            {c.legalName}, {companyAddressLine()} of naar <a href={`mailto:${c.email}`}>{c.email}</a>.
          </p>
        </div>
      </div>
      <div className="card h-fit p-6 sm:p-8">
        <WithdrawalForm />
      </div>
    </section>
  );
}
