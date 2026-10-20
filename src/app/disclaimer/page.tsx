import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: `Disclaimer van ${site.name}: onze schema's zijn leefstijladvies en geen medisch advies.`,
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer">
      <h2>Geen medisch advies</h2>
      <p>
        De schema&apos;s en informatie van {site.name} zijn bedoeld als algemeen leefstijladvies voor gezonde volwassenen.
        Ze zijn geen medisch advies, geen diagnose en geen behandeling, en vervangen geen consult bij een arts, diëtist,
        fysiotherapeut of andere zorgverlener.
      </p>
      <p>
        Overleg altijd eerst met je huisarts als je een medische aandoening hebt (zoals diabetes, hart- en vaatziekten of
        nierproblemen), medicijnen gebruikt, zwanger bent of borstvoeding geeft, een eetstoornis hebt (gehad), of
        twijfelt of afvallen of trainen voor jou verantwoord is. Stop met trainen bij pijn, duizeligheid of benauwdheid.
      </p>

      <h2>Gemaakt met behulp van AI</h2>
      <p>
        Onze schema&apos;s worden gemaakt met Claude, een AI-model van Anthropic, op basis van jouw antwoorden, onze
        berekeningen en onze instructies. We controleren voedingsschema&apos;s automatisch op onder meer calorieën, eiwit
        en het aantal maaltijden. Toch kan een schema onvolkomenheden bevatten, zoals een afwijkende voedingswaarde of een
        oefening die minder goed bij je past. Gebruik je gezonde verstand, pas waar nodig aan en neem contact met ons op als
        iets niet klopt; we passen het dan kosteloos aan.
      </p>

      <h2>Allergieën</h2>
      <p>
        We houden rekening met de allergieën en intoleranties die je opgeeft. Lees bij een allergie altijd zelf de
        etiketten, want de samenstelling van producten kan per merk verschillen en veranderen.
      </p>

      <h2>Resultaten</h2>
      <p>
        Resultaten verschillen per persoon. Prognoses op de website, zoals een verwachte datum om je streefgewicht te
        bereiken, zijn indicaties op basis van gemiddelden en geen garantie.
      </p>

      <h2>Informatie op de website</h2>
      <p>
        We besteden zorg aan de inhoud van deze website, maar kunnen niet garanderen dat alle informatie altijd volledig,
        juist en actueel is. Links naar websites van anderen zijn alleen ter informatie; voor de inhoud daarvan zijn we niet
        verantwoordelijk.
      </p>

      <h2>Intellectueel eigendom en beeld</h2>
      <p>
        Teksten, schema&apos;s en vormgeving van deze website zijn eigendom van {site.company.legalName}. Overnemen is niet
        toegestaan zonder schriftelijke toestemming. De foto&apos;s op deze website zijn stockfoto&apos;s van Unsplash
        (Unsplash-licentie) en tonen modellen, geen klanten.
      </p>
      <p>
        Zie ook onze <Link href="/algemene-voorwaarden">algemene voorwaarden</Link> en ons{" "}
        <Link href="/privacybeleid">privacybeleid</Link>.
      </p>
    </LegalPage>
  );
}
