import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/disclaimer";

const copy = defineCopy({
  nl: {
    title: "Disclaimer",
    description: `Disclaimer van ${site.name}: onze schema's zijn leefstijladvies, geen medisch advies en geen garantie op resultaat.`,
  },
  en: {
    title: "Disclaimer",
    description: `Disclaimer of ${site.name}: our plans are lifestyle advice, not medical advice and not a guarantee of results.`,
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function DisclaimerPage() {
  const l = await getLocale();
  return (
    <LegalPage title={copy[l].title} path={PATH}>
      {l === "en" ? <En /> : <Nl />}
    </LegalPage>
  );
}

function Nl() {
  return (
    <>
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

      <h2>Automatisch samengesteld</h2>
      <p>
        Onze schema&apos;s worden automatisch samengesteld door onze software, op basis van jouw antwoorden, onze
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

      <h2 id="resultaten">Geen garantie op resultaat</h2>
      <p>
        Bij {site.name} koop je een persoonlijk schema en begeleiding, geen gegarandeerd resultaat. We beloven niet dat
        je een bepaald aantal kilo&apos;s afvalt, je streefgewicht binnen een bepaalde tijd bereikt of een bepaalde
        hoeveelheid spiermassa opbouwt. Hoeveel je afvalt of aan spiermassa opbouwt, verschilt per persoon en hangt onder
        meer af van je lichaam, je gezondheid, je slaap, je omstandigheden en hoe goed je het schema volgt.
      </p>
      <p>
        Prognoses op de website en in Mijn schema&apos;s, zoals een verwachte datum om je streefgewicht te bereiken of de
        verwachte voortgang in een grafiek, zijn schattingen op basis van gemiddelden en geen toezeggingen. Voorbeelden en
        grafieken van fictieve klanten laten zien hoe het werkt, niet wat jij zult bereiken.
      </p>
      {site.guarantee.enabled && (
        <p>
          Wel heb je {site.guarantee.days} dagen tevredenheidsgarantie op je eerste betaling: ben je niet tevreden over
          de dienst, dan vraag je je geld terug in Mijn schema&apos;s. Die garantie gaat over je tevredenheid, niet over een
          bepaald resultaat. Zie <Link href="/algemene-voorwaarden#garantie">artikel 10 van de algemene voorwaarden</Link>.
        </p>
      )}

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
    </>
  );
}

function En() {
  return (
    <>
      <h2>Not medical advice</h2>
      <p>
        The plans and information from {site.name} are intended as general lifestyle advice for healthy adults. They are
        not medical advice, a diagnosis or a treatment, and do not replace a consultation with a doctor, dietitian,
        physiotherapist or other healthcare provider.
      </p>
      <p>
        Always consult your GP first if you have a medical condition (such as diabetes, cardiovascular disease or kidney
        problems), take medication, are pregnant or breastfeeding, have (or have had) an eating disorder, or are unsure
        whether losing weight or training is responsible for you. Stop training if you experience pain, dizziness or
        shortness of breath.
      </p>

      <h2>Put together automatically</h2>
      <p>
        Our plans are put together automatically by our software, based on your answers, our calculations and our
        instructions. We automatically check nutrition plans for things such as calories, protein and the number of
        meals. Even so, a plan may contain imperfections, such as an inaccurate nutritional value or an exercise that
        suits you less well. Use your common sense, adjust where necessary and get in touch with us if something
        isn&apos;t right; we will then adjust it free of charge.
      </p>

      <h2>Allergies</h2>
      <p>
        We take into account the allergies and intolerances you tell us about. If you have an allergy, always read the
        labels yourself, as the composition of products can differ between brands and can change.
      </p>

      <h2 id="resultaten">No guaranteed results</h2>
      <p>
        With {site.name}, you are buying a personal plan and guidance, not a guaranteed result. We do not promise that you
        will lose a certain number of kilos, reach your target weight within a certain time or build a certain amount of
        muscle. How much weight you lose or muscle you build varies from person to person and depends on factors such as
        your body, your health, your sleep, your circumstances and how closely you follow the plan.
      </p>
      <p>
        Forecasts on the website and in My plans, such as an expected date for reaching your target weight or the
        expected progress in a chart, are estimates based on averages and not promises. Examples and charts of fictional
        customers show how it works, not what you will achieve.
      </p>
      {site.guarantee.enabled && (
        <p>
          You do have a {site.guarantee.days}-day satisfaction guarantee on your first payment: if you are not satisfied
          with the service, you can request your money back in My plans. This guarantee concerns your satisfaction, not
          any particular result. See <Link href="/algemene-voorwaarden#garantie">article 10 of the terms and conditions</Link>.
        </p>
      )}

      <h2>Information on the website</h2>
      <p>
        We take care over the content of this website, but cannot guarantee that all information is always complete,
        correct and up to date. Links to third-party websites are for information only; we are not responsible for their
        content.
      </p>

      <h2>Intellectual property and images</h2>
      <p>
        The texts, plans and design of this website are the property of {site.company.legalName}. Copying them is not
        permitted without written permission. The photos on this website are stock photos from Unsplash (Unsplash
        License) and show models, not customers.
      </p>
      <p>
        See also our <Link href="/algemene-voorwaarden">terms and conditions</Link> and our{" "}
        <Link href="/privacybeleid">privacy policy</Link>.
      </p>
    </>
  );
}
