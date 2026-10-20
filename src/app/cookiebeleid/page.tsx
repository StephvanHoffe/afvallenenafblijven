import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { CookieSettingsButton } from "@/components/cookies/CookieSettingsButton";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Cookiebeleid",
  description: `Welke cookies ${site.name} gebruikt en hoe je je voorkeuren aanpast.`,
  alternates: { canonical: "/cookiebeleid" },
};

const cookies = [
  {
    name: "afb_cookie_consent",
    type: "Noodzakelijk",
    party: site.name,
    purpose: "Onthoudt je cookiekeuze.",
    duration: "12 maanden",
  },
  {
    name: "afb_sessie",
    type: "Noodzakelijk",
    party: site.name,
    purpose: "Houdt je ingelogd op Mijn schema's (alleen na inloggen).",
    duration: "90 dagen",
  },
  {
    name: "__stripe_mid, __stripe_sid",
    type: "Noodzakelijk",
    party: "Stripe",
    purpose: "Veilig betalen en fraude voorkomen op de betaalpagina.",
    duration: "30 minuten tot 1 jaar",
  },
  {
    name: "_ga, _ga_*",
    type: "Analytisch (toestemming)",
    party: "Google Analytics",
    purpose: "Anonieme statistieken over het gebruik van de website.",
    duration: "Tot 2 jaar",
  },
  {
    name: "_fbp",
    type: "Marketing (toestemming)",
    party: "Meta",
    purpose: "Meten en verbeteren van advertenties op Facebook en Instagram.",
    duration: "3 maanden",
  },
];

export default function CookiebeleidPage() {
  return (
    <LegalPage
      title="Cookiebeleid"
      intro="Cookies zijn kleine bestanden die een website op je apparaat opslaat. We gebruiken alleen cookies die nodig zijn om de website te laten werken, tenzij je toestemming geeft voor meer."
    >
      <h2>Welke cookies gebruiken we?</h2>
      <table>
        <thead>
          <tr>
            <th>Naam</th>
            <th>Soort</th>
            <th>Van</th>
            <th>Doel</th>
            <th>Bewaartermijn</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((c) => (
            <tr key={c.name}>
              <td>
                <code>{c.name}</code>
              </td>
              <td>{c.type}</td>
              <td>{c.party}</td>
              <td>{c.purpose}</td>
              <td>{c.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Daarnaast slaan we tijdens het invullen van de vragenlijst je antwoorden tijdelijk op in je browser (sessionStorage),
        zodat je verder kunt waar je gebleven was. Deze gegevens verdwijnen als je het tabblad sluit en worden pas naar ons
        verstuurd als je een plan bestelt.
      </p>

      <h2>Toestemming</h2>
      <p>
        Analytische en marketingcookies plaatsen we alleen als je daar via de cookiebanner toestemming voor geeft.
        Weigeren is net zo makkelijk als accepteren en heeft geen invloed op het gebruik van de website. Je kunt je keuze
        altijd wijzigen of je toestemming intrekken:
      </p>
      <p>
        <CookieSettingsButton className="btn-secondary" />
      </p>
      <p>
        Je kunt cookies ook verwijderen via de instellingen van je browser. Meer over hoe we met persoonsgegevens omgaan,
        lees je in ons <Link href="/privacybeleid">privacybeleid</Link>.
      </p>
    </LegalPage>
  );
}
