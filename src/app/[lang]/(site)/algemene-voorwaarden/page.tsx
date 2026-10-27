import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { LegalPage } from "@/components/LegalPage";
import { companyAddressLine, hasSeparateLegalName, site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/algemene-voorwaarden";

const copy = defineCopy({
  nl: {
    title: "Algemene voorwaarden",
    description: `De algemene voorwaarden van ${site.name} voor voedingsschema's, trainingsschema's en abonnementen.`,
    intro: `Deze algemene voorwaarden gelden voor alle aankopen bij ${site.name}. We hebben ze zo duidelijk mogelijk geschreven. Heb je een vraag? Mail ons gerust.`,
  },
  en: {
    title: "Terms and conditions",
    description: `The terms and conditions of ${site.name} for nutrition plans, workout plans and subscriptions.`,
    intro: `These terms and conditions apply to all purchases from ${site.name}. We have written them as clearly as possible. Do you have a question? Feel free to email us.`,
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { title: copy[l].title, description: copy[l].description, alternates: alternates(l, PATH) };
}

export default async function AlgemeneVoorwaardenPage() {
  const l = await getLocale();
  const t = copy[l];
  return (
    <LegalPage title={t.title} intro={t.intro} path={PATH}>
      {l === "en" ? <En /> : <Nl />}
    </LegalPage>
  );
}

function Nl() {
  const c = site.company;
  const g = site.guarantee;
  return (
    <>
      <h2 id="artikel-1">Artikel 1 – Definities</h2>
      <ul>
        <li>
          <strong>Wij / ondernemer:</strong> {c.legalName}
          {hasSeparateLegalName() && <>, handelend onder de naam {site.name}</>}.
        </li>
        <li>
          <strong>Jij / klant:</strong> de natuurlijke persoon die niet handelt in de uitoefening van beroep of bedrijf
          (consument) en een overeenkomst met ons sluit.
        </li>
        <li>
          <strong>Schema:</strong> een persoonlijk voedingsschema en/of trainingsschema in digitale vorm, gemaakt op basis
          van de antwoorden in de vragenlijst.
        </li>
        <li>
          <strong>Abonnement:</strong> een overeenkomst waarbij je gedurende een bepaalde periode periodiek (elke 4 weken)
          een nieuw schema ontvangt.
        </li>
        <li>
          <strong>Los schema:</strong> een eenmalige aankoop van één schema voor 4 weken, zonder abonnement.
        </li>
        <li>
          <strong>Herroepingstermijn:</strong> de termijn waarbinnen je gebruik kunt maken van je herroepingsrecht.
        </li>
        <li>
          <strong>Duurzame gegevensdrager:</strong> elk middel waarmee informatie zo kan worden opgeslagen dat je die later
          ongewijzigd kunt raadplegen, zoals e-mail.
        </li>
      </ul>

      <h2 id="artikel-2">Artikel 2 – Identiteit van de ondernemer</h2>
      <p>
        {c.legalName}
        <br />
        {companyAddressLine()}, {c.country} (geen bezoekadres)
        <br />
        E-mail: <a href={`mailto:${c.email}`}>{c.email}</a>
        <br />
        KvK-nummer: {c.kvk}
        <br />
        Btw-identificatienummer: {c.vat}
      </p>

      <h2 id="artikel-3">Artikel 3 – Toepasselijkheid</h2>
      <p>
        Deze voorwaarden zijn van toepassing op elk aanbod van ons en op elke overeenkomst die via de website{" "}
        {site.domain} tot stand komt. Voordat de overeenkomst wordt gesloten, stellen we deze voorwaarden aan je
        beschikbaar. Je kunt ze opslaan en printen. Je ontvangt ze bovendien bij de bevestiging van je bestelling.
      </p>

      <h2 id="artikel-4">Artikel 4 – Het aanbod</h2>
      <ol>
        <li>
          Het aanbod bevat een volledige en nauwkeurige omschrijving van de schema&apos;s, de looptijden en de prijzen.
          Kennelijke vergissingen of fouten in het aanbod binden ons niet.
        </li>
        <li>
          Afbeeldingen op de website zijn sfeerbeelden (stockfoto&apos;s) en geven niet de exacte inhoud van je schema weer.
        </li>
        <li>
          Een voorbeeldschema op de website is een voorbeeld voor een fictieve persoon. Jouw schema wordt op jouw gegevens
          afgestemd en kan daardoor anders zijn.
        </li>
      </ol>

      <h2 id="artikel-5">Artikel 5 – De overeenkomst</h2>
      <ol>
        <li>
          De overeenkomst komt tot stand op het moment dat je de bestelling afrondt en de betaling is gelukt of, bij een
          abonnement, de SEPA-machtiging is afgegeven. We bevestigen de bestelling zo snel mogelijk per e-mail.
        </li>
        <li>Je moet minimaal 18 jaar oud zijn om een overeenkomst met ons te sluiten.</li>
        <li>
          Je bent zelf verantwoordelijk voor het naar waarheid, juist en volledig invullen van de vragenlijst en de
          check-ins. Dat geldt in het bijzonder voor de vragen over je gezondheid (zoals zwangerschap of borstvoeding, een
          eetstoornis, medische aandoeningen, medicijngebruik en blessures) en over allergieën en intoleranties. Verandert
          daar iets in, geef dat dan zo snel mogelijk aan ons door, bijvoorbeeld in je check-in. Je schema is uitsluitend
          gebaseerd op de gegevens die je opgeeft; wij controleren die niet.
        </li>
        <li>
          Voor de betaling doen we op basis van je antwoorden een automatische veiligheidscheck. Die check is een
          eenvoudige eerste selectie aan de hand van jouw eigen antwoorden, en geen medische beoordeling of advies. Hij
          werkt alleen als je de vragen naar waarheid beantwoordt. Dat je bestelling door de check komt, betekent niet dat
          een schema voor jou medisch verantwoord is; dat beoordeel je zelf, zo nodig samen met je arts (zie artikel{" "}
          {g.enabled ? 12 : 11}).
        </li>
        <li>
          We mogen een bestelling weigeren of een overeenkomst niet uitvoeren als er gegronde redenen zijn, bijvoorbeeld
          als een schema op basis van je antwoorden niet verantwoord is (zoals bij zwangerschap, een eetstoornis of
          ondergewicht). Je hebt dan recht op terugbetaling van wat je al betaald hebt.
        </li>
      </ol>

      <h2 id="artikel-6">Artikel 6 – De schema&apos;s en levering</h2>
      <ol>
        <li>
          Een schema wordt automatisch samengesteld door onze software, op basis van jouw antwoorden, onze berekeningen,
          instructies en kwaliteitscontroles (onder meer op calorieën, eiwit en de allergenen die je opgeeft). We doen ons
          best om een zorgvuldig en passend schema te maken (inspanningsverplichting).
        </li>
        <li>
          We beginnen direct na de betaling aan je schema en streven ernaar het binnen 2 uur te leveren, en in elk geval
          binnen 2 werkdagen.
          Levering vindt plaats via je persoonlijke omgeving &quot;Mijn schema&apos;s&quot; en een e-mail met een link.
        </li>
        <li>
          Bij een abonnement ontvang je elke 4 weken een nieuw schema, zolang het abonnement loopt. Elke periode start op
          een maandag en duurt 4 weken; de eerste periode start direct na je bestelling en loopt tot de maandag die het
          dichtst bij 4 weken later ligt (25 tot 31 dagen). Elk vervolgschema maken we op basis van een check-in, waarin je
          je voortgang doorgeeft. De check-in opent op de donderdag voor de nieuwe periode; je ontvangt dan een uitnodiging
          per e-mail en zo nodig herinneringen. Het nieuwe schema maken we zodra je de check-in hebt ingevuld; het staat
          binnen 2 uur voor je klaar en start op de maandag van de nieuwe periode, of meteen als die al is begonnen. Zolang je de
          check-in niet hebt ingevuld, maken we geen nieuw schema; het abonnement en de maandelijkse betaling lopen dan
          gewoon door en je houdt toegang tot je laatste schema.
        </li>
        <li>
          Een schema is leefstijladvies en geen medisch advies, geen diagnose en geen behandeling. Zie ook artikel 12 en
          onze <Link href="/disclaimer">disclaimer</Link>.
        </li>
        <li>
          We geven geen garantie op een bepaald resultaat, zoals een bepaald aantal kilo&apos;s gewichtsverlies of een
          bepaalde toename van je spiermassa. Je koopt een persoonlijk schema en begeleiding, geen resultaat. Resultaten
          verschillen per persoon en hangen onder meer af van je lichaam, je gezondheid, je omstandigheden en hoe je het
          schema volgt. Prognoses, voorbeelden en de verwachte voortgang op de website en in Mijn schema&apos;s zijn
          schattingen, geen toezeggingen.
        </li>
      </ol>

      <h2 id="artikel-7">Artikel 7 – Herroepingsrecht</h2>
      <ol>
        <li>
          Je kunt de overeenkomst binnen 14 dagen zonder opgave van redenen herroepen (ontbinden). Die termijn gaat
          vanzelf in op de dag waarop de overeenkomst tot stand komt, de dag van je betaling (artikel 5), en eindigt 14
          dagen daarna. Een herroeping die we uiterlijk op die 14e dag ontvangen of die je uiterlijk op die dag verstuurt,
          is op tijd.
        </li>
        <li>
          <strong>Direct beginnen.</strong> Bij het bestellen ga je ermee akkoord dat we direct na je betaling beginnen
          met het maken van je schema, en dat je herroepingsrecht op de dag van je betaling ingaat en 14 dagen later
          eindigt. Je herroepingsrecht blijft gelden als je schema binnen die 14 dagen al is geleverd. We bevestigen dit
          met de einddatum in de orderbevestiging.
        </li>
        <li>
          Je herroept via de <Link href="/herroepen">herroepingsfunctie op onze website</Link>, met het modelformulier
          hieronder of met een andere ondubbelzinnige verklaring per e-mail of post. We sturen je direct een
          ontvangstbevestiging op een duurzame gegevensdrager.
        </li>
        <li>
          Na een herroeping binnen de termijn betalen we alle betalingen binnen 14 dagen terug, via dezelfde betaalmethode
          die je hebt gebruikt, tenzij je uitdrukkelijk met een andere methode instemt, en stoppen we het abonnement. Je
          betaalt hiervoor geen kosten.
        </li>
        <li>Na afloop van de 14 dagen kun je de overeenkomst niet meer herroepen.</li>
        <li>
          Los van het herroepingsrecht kun je een abonnement altijd opzeggen volgens artikel 9
          {g.enabled ? " en geldt de tevredenheidsgarantie uit artikel 10" : ""}.
        </li>
      </ol>

      <h2 id="artikel-8">Artikel 8 – Prijzen en betaling</h2>
      <ol>
        <li>Alle prijzen zijn in euro&apos;s en inclusief 21% btw. Er zijn geen bijkomende kosten.</li>
        <li>
          Een abonnement betaal je per maand, vooraf. De eerste maand betaal je bij het bestellen via onze betaalpartner
          Mollie met iDEAL | Wero of Bancontact. Daarmee geef je een SEPA-machtiging voor doorlopende incasso: de volgende
          maanden schrijven we het maandbedrag automatisch af van je rekening, op dezelfde dag van de maand als je eerste
          betaling. Op je bankafschrift staat de afschrijving van onze betaalpartner Mollie. Een los schema betaal je
          eenmalig met iDEAL | Wero, Bancontact of creditcard.
        </li>
        <li>
          De hoogte van het maandbedrag hangt af van de minimale looptijd die je kiest. Het maandbedrag en de datum van
          afschrijving staan in je orderbevestiging; die geldt als vooraankondiging van de maandelijkse incasso. Verandert
          het bedrag, dan laten we je dat minimaal 14 dagen vooraf weten.
        </li>
        <li>
          Je kunt een afschrijving binnen 8 weken via je bank laten terugboeken. Daarmee is het abonnement niet opgezegd
          en blijft het bedrag verschuldigd; wil je stoppen, zeg dan op volgens artikel 9.
        </li>
        <li>Een los schema betaal je eenmalig vooraf, met iDEAL | Wero, Bancontact, creditcard of een andere aangeboden methode.</li>
        <li>
          Lukt een afschrijving niet, dan proberen we het opnieuw en ontvang je een bericht. Blijft betaling uit, dan mogen we
          de levering van nieuwe schema&apos;s opschorten tot de betaling binnen is.
        </li>
        <li>
          Een actiekorting (zoals een Black Friday-actie) geldt alleen voor de periode en voorwaarden die bij de actie staan
          vermeld, meestal alleen voor de eerste maand.
        </li>
        <li>
          We kunnen de prijzen van een abonnement wijzigen. Een prijsverhoging maken we minimaal 30 dagen van tevoren
          bekend. Je mag het abonnement dan kosteloos opzeggen tegen de datum waarop de verhoging ingaat. Een
          prijsverhoging binnen 3 maanden na het sluiten van de overeenkomst geven we niet door, tenzij de wet dat
          toestaat.
        </li>
      </ol>

      <h2 id="artikel-9">Artikel 9 – Duur, verlenging en opzegging van abonnementen</h2>
      <ol>
        <li>
          Je kiest bij het bestellen een abonnement per maand, of een abonnement met een minimale looptijd van 3, 6 of 12
          maanden tegen een lagere maandprijs. Ook dan betaal je per maand.
        </li>
        <li>
          Na de minimale looptijd loopt het abonnement automatisch door voor onbepaalde tijd, tegen dezelfde maandprijs.
          Je kunt het dan op elk moment opzeggen met een opzegtermijn van maximaal één maand.
        </li>
        <li>
          Een maandabonnement kun je op elk moment opzeggen tegen het einde van de lopende maand. Zeg je een abonnement met
          een minimale looptijd binnen die looptijd op, dan loopt het nog door (en betaal je de resterende maanden) tot het
          einde van de minimale looptijd, en stopt het daarna.
        </li>
        <li>
          Opzeggen doe je online, op dezelfde eenvoudige manier als waarop je het abonnement hebt afgesloten: via &quot;Mijn
          schema&apos;s&quot; of via de pagina <Link href="/abonnement-opzeggen">abonnement opzeggen</Link>. Je kunt ook
          opzeggen per e-mail. We bevestigen de opzegging en de einddatum per e-mail. Na de einddatum schrijven we niets
          meer af.
        </li>
        <li>Na het einde van het abonnement houd je toegang tot de schema&apos;s die je al hebt ontvangen.</li>
        <li>
          We kunnen een abonnement met een opzegtermijn van minimaal één maand beëindigen, bijvoorbeeld als we de dienst
          stoppen. Wat je al betaalde voor de periode na de beëindiging, betalen we terug.
        </li>
      </ol>

      {g.enabled && (
        <>
          <h2 id="garantie">Artikel 10 – Tevredenheidsgarantie</h2>
          <ol>
            <li>
              Ben je niet tevreden, dan kun je binnen {g.days} dagen na je eerste aankoop (tot en met de {g.days}e dag na
              de besteldag) om terugbetaling vragen, zonder opgaaf van reden. Dat doe je in Mijn schema&apos;s, op het
              tabblad Abonnement, of per e-mail aan <a href={`mailto:${c.email}`}>{c.email}</a>. We betalen dan binnen{" "}
              {site.responseTimeDays} werkdagen het volledige bedrag van je eerste betaling terug en beëindigen het
              abonnement direct.
            </li>
            <li>
              De garantie geldt één keer per klant en alleen voor de eerste betaling, niet voor latere termijnen of
              verlengingen.
            </li>
            <li>
              De garantie gaat over je tevredenheid met onze dienst. Het is geen garantie op een bepaald resultaat (zie
              artikel 6).
            </li>
            <li>Deze garantie komt bovenop je wettelijke rechten en beperkt die niet.</li>
          </ol>
        </>
      )}

      <h2 id="artikel-11">Artikel {g.enabled ? 11 : 10} – Gebruik en intellectueel eigendom</h2>
      <ol>
        <li>Je schema is uitsluitend bestemd voor persoonlijk, niet-commercieel gebruik.</li>
        <li>
          Het is niet toegestaan om schema&apos;s, teksten of andere inhoud van de website te verkopen, openbaar te maken of
          op grote schaal te verspreiden zonder onze schriftelijke toestemming.
        </li>
        <li>Je persoonlijke inloglink is vertrouwelijk; deel deze niet met anderen.</li>
      </ol>

      <h2 id="artikel-12">Artikel {g.enabled ? 12 : 11} – Gezondheid en eigen verantwoordelijkheid</h2>
      <ol>
        <li>
          Raadpleeg een arts voordat je met een nieuw voedings- of trainingsschema begint als je een medische aandoening
          hebt, medicijnen gebruikt, ouder bent dan 65, of twijfelt of het voor jou verantwoord is. De veiligheidscheck
          (artikel 5) en de controles van je schema vervangen geen advies van een arts, diëtist of andere zorgverlener.
        </li>
        <li>
          Stop met trainen en raadpleeg een arts of fysiotherapeut als je tijdens het trainen pijn, duizeligheid,
          benauwdheid of andere klachten krijgt.
        </li>
        <li>
          <strong>Allergieën en intoleranties.</strong> Je geeft zelf op welke allergieën en intoleranties je hebt. We
          houden in je schema alleen rekening met wat je hebt opgegeven, en controleren elk voedingsschema daar ook op.
          We kunnen echter niet garanderen dat een schema, gerecht of product vrij is van een allergeen of van sporen
          daarvan: samenstellingen verschillen per merk en supermarkt en kunnen veranderen. Je bent daarom zelf
          verantwoordelijk voor het controleren van de ingrediënten en de etiketten van alle producten die je koopt en
          gebruikt. Twijfel je, gebruik het product dan niet.
        </li>
        <li>
          Het opvolgen van een schema, en de keuze welke producten je koopt en gebruikt, gebeurt op eigen
          verantwoordelijkheid, binnen de grenzen van wat redelijk is en met inachtneming van artikel {g.enabled ? 13 : 12}.
        </li>
      </ol>

      <h2 id="artikel-13">Artikel {g.enabled ? 13 : 12} – Aansprakelijkheid</h2>
      <ol>
        <li>
          Onze aansprakelijkheid is beperkt tot het bedrag dat je in de 12 maanden voorafgaand aan de schadeveroorzakende
          gebeurtenis aan ons hebt betaald.
        </li>
        <li>
          We zijn niet aansprakelijk voor schade die ontstaat doordat je onjuiste of onvolledige gegevens hebt ingevuld
          (bijvoorbeeld over je gezondheid, allergieën of intoleranties), doordat je wijzigingen niet hebt doorgegeven,
          doordat je de ingrediënten en etiketten niet zelf hebt gecontroleerd, of doordat je de adviezen uit artikel{" "}
          {g.enabled ? 12 : 11} niet opvolgt.
        </li>
        <li>
          Deze beperkingen gelden niet bij opzet of bewuste roekeloosheid van ons, en laten je dwingende wettelijke rechten
          als consument onverlet.
        </li>
      </ol>

      <h2 id="artikel-14">Artikel {g.enabled ? 14 : 13} – Conformiteit</h2>
      <p>
        We staan ervoor in dat de schema&apos;s voldoen aan de overeenkomst, de omschrijving op de website en de redelijke
        verwachtingen. Voldoet een schema niet (bijvoorbeeld omdat het een product bevat dat je als allergie hebt
        opgegeven), meld het ons dan. We maken dan kosteloos een aangepast schema. Lukt dat niet, dan heb je recht op een
        passende prijsvermindering of ontbinding, conform de wet.
      </p>

      <h2 id="artikel-15">Artikel {g.enabled ? 15 : 14} – Klachten</h2>
      <ol>
        <li>
          Heb je een klacht? Stuur die zo snel mogelijk, volledig en duidelijk omschreven naar{" "}
          <a href={`mailto:${c.email}`}>{c.email}</a>.
        </li>
        <li>
          We bevestigen je klacht binnen {site.responseTimeDays} werkdagen en geven binnen 14 dagen inhoudelijk antwoord.
          Hebben we meer tijd nodig, dan laten we je dat weten met een indicatie van wanneer je antwoord krijgt.
        </li>
        <li>
          Komen we er samen niet uit, dan kun je het geschil voorleggen aan de bevoegde rechter. Als consument kun je ook
          kiezen voor de rechter van je eigen woonplaats.
        </li>
      </ol>

      <h2 id="artikel-16">Artikel {g.enabled ? 16 : 15} – Persoonsgegevens</h2>
      <p>
        We verwerken je persoonsgegevens, waaronder gezondheidsgegevens, zorgvuldig en alleen met jouw uitdrukkelijke
        toestemming. Lees hierover meer in ons <Link href="/privacybeleid">privacybeleid</Link>.
      </p>

      <h2 id="artikel-17">Artikel {g.enabled ? 17 : 16} – Wijzigingen en toepasselijk recht</h2>
      <ol>
        <li>
          We mogen deze voorwaarden wijzigen. Wijzigingen die nadelig voor je zijn, maken we minimaal 30 dagen vooraf
          bekend; je mag een abonnement dan kosteloos opzeggen tegen de ingangsdatum.
        </li>
        <li>Op alle overeenkomsten is Nederlands recht van toepassing.</li>
      </ol>

      <h2 id="modelformulier">Bijlage – Modelformulier voor herroeping</h2>
      <p>
        Vul dit formulier alleen in en stuur het terug als je de overeenkomst wilt herroepen. Online herroepen kan
        sneller via de <Link href="/herroepen">herroepingsfunctie</Link>.
      </p>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p>
          Aan: {c.legalName}, {companyAddressLine()}, {c.email}
        </p>
        <p>
          Ik/Wij (*) deel/delen (*) u hierbij mede dat ik/wij (*) onze overeenkomst betreffende de levering van de
          volgende digitale inhoud/dienst (*) herroep/herroepen (*):
        </p>
        <p>
          ______________________________________________
          <br />
          Besteld op (*) / ontvangen op (*): ____________________
          <br />
          Naam/Namen consument(en): ____________________
          <br />
          Adres consument(en): ____________________
          <br />
          Handtekening van consument(en) (alleen wanneer dit formulier op papier wordt ingediend): ____________________
          <br />
          Datum: ____________________
        </p>
        <p className="text-sm text-muted">(*) Doorhalen wat niet van toepassing is.</p>
      </div>
    </>
  );
}

function En() {
  const c = site.company;
  const g = site.guarantee;
  // Het land staat in het Nederlands in de config.
  const country = c.country === "Nederland" ? "the Netherlands" : c.country;
  return (
    <>
      <h2 id="artikel-1">Article 1 – Definitions</h2>
      <ul>
        <li>
          <strong>We / trader:</strong> {c.legalName}
          {hasSeparateLegalName() && <>, trading under the name {site.name}</>}.
        </li>
        <li>
          <strong>You / customer:</strong> the natural person who is not acting in the exercise of a profession or
          business (consumer) and who enters into a contract with us.
        </li>
        <li>
          <strong>Plan:</strong> a personal nutrition plan and/or workout plan in digital form, created on the basis of
          the answers in the questionnaire.
        </li>
        <li>
          <strong>Subscription:</strong> a contract under which you periodically (every 4 weeks) receive a new plan for a
          certain period.
        </li>
        <li>
          <strong>Single plan:</strong> a one-off purchase of one plan for 4 weeks, without a subscription.
        </li>
        <li>
          <strong>Withdrawal period:</strong> the period within which you can exercise your right of withdrawal.
        </li>
        <li>
          <strong>Durable medium:</strong> any means that enables information to be stored in such a way that you can
          consult it unchanged at a later time, such as email.
        </li>
      </ul>

      <h2 id="artikel-2">Article 2 – Identity of the trader</h2>
      <p>
        {c.legalName}
        <br />
        {companyAddressLine()}, {country} (not a visiting address)
        <br />
        Email: <a href={`mailto:${c.email}`}>{c.email}</a>
        <br />
        Chamber of Commerce (KvK) number: {c.kvk}
        <br />
        VAT identification number: {c.vat}
      </p>

      <h2 id="artikel-3">Article 3 – Applicability</h2>
      <p>
        These terms and conditions apply to every offer we make and to every contract concluded via the website{" "}
        {site.domain}. Before the contract is concluded, we make these terms and conditions available to you. You can
        save and print them. You will also receive them with the confirmation of your order.
      </p>

      <h2 id="artikel-4">Article 4 – The offer</h2>
      <ol>
        <li>
          The offer contains a complete and accurate description of the plans, the terms and the prices. Obvious
          mistakes or errors in the offer are not binding on us.
        </li>
        <li>
          Images on the website are illustrative images (stock photos) and do not show the exact content of your plan.
        </li>
        <li>
          A sample plan on the website is an example for a fictional person. Your plan is tailored to your details and
          may therefore differ.
        </li>
      </ol>

      <h2 id="artikel-5">Article 5 – The contract</h2>
      <ol>
        <li>
          The contract is concluded at the moment you complete your order and the payment has succeeded or, in the case
          of a subscription, the SEPA mandate has been given. We will confirm the order by email as soon as possible.
        </li>
        <li>You must be at least 18 years old to enter into a contract with us.</li>
        <li>
          You are responsible for filling in the questionnaire and the check-ins truthfully, correctly and completely.
          This applies in particular to the questions about your health (such as pregnancy or breastfeeding, an eating
          disorder, medical conditions, medication and injuries) and about allergies and intolerances. If anything
          changes, let us know as soon as possible, for example in your check-in. Your plan is based solely on the
          information you provide; we do not verify it.
        </li>
        <li>
          Before payment, we carry out an automatic safety check based on your answers. This check is a simple initial
          screening based on your own answers, not a medical assessment or advice. It only works if you answer the
          questions truthfully. If your order passes the check, that does not mean a plan is medically responsible for
          you; you assess that yourself, together with your doctor if necessary (see article {g.enabled ? 12 : 11}).
        </li>
        <li>
          We may refuse an order or decline to perform a contract if there are valid reasons for doing so, for example if
          a plan would not be responsible based on your answers (such as in the case of pregnancy, an eating disorder or
          underweight). In that case you are entitled to a refund of what you have already paid.
        </li>
      </ol>

      <h2 id="artikel-6">Article 6 – The plans and delivery</h2>
      <ol>
        <li>
          A plan is put together automatically by our software, based on your answers, our calculations, instructions and
          quality checks (including on calories, protein and the allergens you tell us about). We do our best to create a
          careful and suitable plan (obligation of effort).
        </li>
        <li>
          We start on your plan straight after payment and aim to deliver it within 2 hours, and in any case within 2
          working days. Delivery
          takes place via your personal environment &quot;My plans&quot; and an email with a link.
        </li>
        <li>
          With a subscription, you receive a new plan every 4 weeks for as long as the subscription runs. Each period
          starts on a Monday and lasts 4 weeks; the first period starts straight after your order and runs until the
          Monday closest to 4 weeks later (25 to 31 days). We create each follow-up plan on the basis of a check-in, in
          which you tell us about your progress. The check-in opens on the Thursday before the new period; you will then
          receive an invitation by email and, if necessary, reminders. We create the new plan as soon as you have
          completed the check-in; it will be ready for you within 2 hours and starts on the Monday of the new period, or
          immediately if that period has already begun. As long as you have not completed the check-in, we do not create
          a new plan; the subscription and the monthly payment simply continue and you keep access to your latest plan.
        </li>
        <li>
          A plan is lifestyle advice and not medical advice, a diagnosis or a treatment. See also article 12 and our{" "}
          <Link href="/disclaimer">disclaimer</Link>.
        </li>
        <li>
          We do not guarantee any particular result, such as losing a certain number of kilos or gaining a certain
          amount of muscle mass. You are buying a personal plan and guidance, not a result. Results vary from person to
          person and depend, among other things, on your body, your health, your circumstances and how you follow the
          plan. Projections, examples and the expected progress on the website and in My plans are estimates, not
          promises.
        </li>
      </ol>

      <h2 id="artikel-7">Article 7 – Right of withdrawal</h2>
      <ol>
        <li>
          You can withdraw from (dissolve) the contract within 14 days without giving any reason. That period starts
          automatically on the day the contract is concluded, the day of your payment (article 5), and ends 14 days
          later. A withdrawal that we receive, or that you send, no later than that 14th day is on time.
        </li>
        <li>
          <strong>Starting immediately.</strong> When you order, you agree that we will start creating your plan
          immediately after your payment, and that your right of withdrawal starts on the day of your payment and ends 14
          days later. Your right of withdrawal still applies if your plan has already been delivered within those 14
          days. We confirm this, including the end date, in the order confirmation.
        </li>
        <li>
          You withdraw via the <Link href="/herroepen">withdrawal function on our website</Link>, using the model form
          below or by means of any other unequivocal statement by email or post. We will immediately send you an
          acknowledgement of receipt on a durable medium.
        </li>
        <li>
          After a withdrawal within the period, we will refund all payments within 14 days, using the same payment method
          you used, unless you expressly agree to a different method, and stop the subscription. You will not incur any
          costs for this.
        </li>
        <li>Once the 14 days have passed, you can no longer withdraw from the contract.</li>
        <li>
          Separately from the right of withdrawal, you can always cancel a subscription in accordance with article 9
          {g.enabled ? " and the satisfaction guarantee in article 10 applies" : ""}.
        </li>
      </ol>

      <h2 id="artikel-8">Article 8 – Prices and payment</h2>
      <ol>
        <li>All prices are in euros and include 21% VAT. There are no additional costs.</li>
        <li>
          You pay for a subscription monthly, in advance. You pay for the first month when you order, via our payment
          partner Mollie, with iDEAL | Wero or Bancontact. In doing so, you give a SEPA mandate for recurring direct
          debits: in the following months, we automatically collect the monthly amount from your account, on the same day
          of the month as your first payment. Your bank statement will show the debit from our payment partner Mollie. You
          pay for a one-off plan in a single payment with iDEAL | Wero, Bancontact or credit card.
        </li>
        <li>
          The monthly amount depends on the minimum term you choose. The monthly amount and the collection date are
          stated in your order confirmation; this serves as the pre-notification of the monthly direct debit. If the
          amount changes, we will let you know at least 14 days in advance.
        </li>
        <li>
          You can have a direct debit reversed through your bank within 8 weeks. This does not cancel the subscription
          and the amount remains due; if you want to stop, cancel in accordance with article 9.
        </li>
        <li>
          You pay for a single plan once, in advance, with iDEAL | Wero, Bancontact, credit card or another method
          offered.
        </li>
        <li>
          If a direct debit fails, we will try again and you will receive a message. If payment is still not received,
          we may suspend the delivery of new plans until the payment has been received.
        </li>
        <li>
          A promotional discount (such as a Black Friday offer) only applies for the period and under the conditions stated
          with the promotion, usually only for the first month.
        </li>
        <li>
          We may change the prices of a subscription. We will announce a price increase at least 30 days in advance. You
          may then cancel the subscription free of charge with effect from the date on which the increase takes effect.
          We will not pass on a price increase within 3 months of the contract being concluded, unless the law permits
          this.
        </li>
      </ol>

      <h2 id="artikel-9">Article 9 – Duration, renewal and cancellation of subscriptions</h2>
      <ol>
        <li>
          When you order, you choose a monthly subscription, or a subscription with a minimum term of 3, 6 or 12 months
          at a lower monthly price. In that case, too, you pay monthly.
        </li>
        <li>
          After the minimum term, the subscription automatically continues for an indefinite period, at the same monthly
          price. You can then cancel it at any time, with a notice period of no more than one month.
        </li>
        <li>
          You can cancel a monthly subscription at any time with effect from the end of the current month. If you cancel
          a subscription with a minimum term during that term, it continues (and you pay the remaining months) until the
          end of the minimum term, and then stops.
        </li>
        <li>
          You cancel online, in the same simple way in which you took out the subscription: via &quot;My plans&quot; or
          via the <Link href="/abonnement-opzeggen">cancel subscription</Link> page. You can also cancel by email. We
          will confirm the cancellation and the end date by email. After the end date, we will not collect any further
          payments.
        </li>
        <li>After the subscription ends, you keep access to the plans you have already received.</li>
        <li>
          We may terminate a subscription with a notice period of at least one month, for example if we discontinue the
          service. We will refund anything you have already paid for the period after the termination.
        </li>
      </ol>

      {g.enabled && (
        <>
          <h2 id="garantie">Article 10 – Satisfaction guarantee</h2>
          <ol>
            <li>
              If you are not satisfied, you can request a refund within {g.days} days of your first purchase (up to and
              including day {g.days} after the order date), without giving a reason. You can do this in My plans,
              on the Subscription tab, or by email to <a href={`mailto:${c.email}`}>{c.email}</a>. We will then refund
              the full amount of your first payment within {site.responseTimeDays} working days and end the subscription
              immediately.
            </li>
            <li>
              The guarantee applies once per customer and only to the first payment, not to later instalments or
              renewals.
            </li>
            <li>
              The guarantee concerns your satisfaction with our service. It is not a guarantee of any particular result
              (see article 6).
            </li>
            <li>This guarantee is in addition to your statutory rights and does not limit them.</li>
          </ol>
        </>
      )}

      <h2 id="artikel-11">Article {g.enabled ? 11 : 10} – Use and intellectual property</h2>
      <ol>
        <li>Your plan is intended exclusively for personal, non-commercial use.</li>
        <li>
          You may not sell, publish or distribute on a large scale any plans, texts or other content from the website
          without our written permission.
        </li>
        <li>Your personal login link is confidential; do not share it with others.</li>
      </ol>

      <h2 id="artikel-12">Article {g.enabled ? 12 : 11} – Health and personal responsibility</h2>
      <ol>
        <li>
          Consult a doctor before starting a new nutrition or workout plan if you have a medical condition, take
          medication, are over 65, or are unsure whether it is responsible for you. The safety check (article 5) and the
          checks on your plan do not replace advice from a doctor, dietitian or other healthcare professional.
        </li>
        <li>
          Stop training and consult a doctor or physiotherapist if you experience pain, dizziness, shortness of breath or
          other symptoms while training.
        </li>
        <li>
          <strong>Allergies and intolerances.</strong> You tell us which allergies and intolerances you have. In your plan,
          we only take into account what you have told us, and we check every nutrition plan for it. However, we cannot
          guarantee that a plan, dish or product is free from an allergen or traces of it: recipes differ between brands
          and supermarkets and may change. You are therefore responsible for checking the ingredients and labels of all
          products you buy and use. If in doubt, do not use the product.
        </li>
        <li>
          You follow a plan, and choose which products you buy and use, at your own responsibility, within the limits of
          what is reasonable and subject to article {g.enabled ? 13 : 12}.
        </li>
      </ol>

      <h2 id="artikel-13">Article {g.enabled ? 13 : 12} – Liability</h2>
      <ol>
        <li>
          Our liability is limited to the amount you paid us in the 12 months preceding the event that caused the
          damage.
        </li>
        <li>
          We are not liable for damage resulting from you having entered incorrect or incomplete information (for example
          about your health, allergies or intolerances), from you not having passed on changes, from you not having
          checked the ingredients and labels yourself, or from you not following the advice in article{" "}
          {g.enabled ? 12 : 11}.
        </li>
        <li>
          These limitations do not apply in the event of intent or deliberate recklessness on our part, and do not affect
          your mandatory statutory rights as a consumer.
        </li>
      </ol>

      <h2 id="artikel-14">Article {g.enabled ? 14 : 13} – Conformity</h2>
      <p>
        We guarantee that the plans conform to the contract, the description on the website and reasonable
        expectations. If a plan does not conform (for example because it contains a product you have listed as an
        allergy), please let us know. We will then create an adjusted plan free of charge. If that is not possible, you
        are entitled to an appropriate price reduction or to termination of the contract, in accordance with the law.
      </p>

      <h2 id="artikel-15">Article {g.enabled ? 15 : 14} – Complaints</h2>
      <ol>
        <li>
          Do you have a complaint? Send it as soon as possible, fully and clearly described, to{" "}
          <a href={`mailto:${c.email}`}>{c.email}</a>.
        </li>
        <li>
          We will acknowledge your complaint within {site.responseTimeDays} working days and give a substantive response
          within 14 days. If we need more time, we will let you know, with an indication of when you will receive a
          response.
        </li>
        <li>
          If we cannot resolve the matter together, you can submit the dispute to the competent court. As a consumer,
          you can also choose the court of your own place of residence.
        </li>
      </ol>

      <h2 id="artikel-16">Article {g.enabled ? 16 : 15} – Personal data</h2>
      <p>
        We process your personal data, including health data, with care and only with your explicit consent. You can
        read more about this in our <Link href="/privacybeleid">privacy policy</Link>.
      </p>

      <h2 id="artikel-17">Article {g.enabled ? 17 : 16} – Changes and applicable law</h2>
      <ol>
        <li>
          We may change these terms and conditions. We will announce changes that are unfavourable to you at least 30
          days in advance; you may then cancel a subscription free of charge with effect from the date on which they take
          effect.
        </li>
        <li>All contracts are governed by Dutch law.</li>
      </ol>

      <h2 id="modelformulier">Annex – Model withdrawal form</h2>
      <p>
        Only complete and return this form if you want to withdraw from the contract. Withdrawing online is quicker via
        the <Link href="/herroepen">withdrawal function</Link>.
      </p>
      <div className="rounded-2xl border border-line bg-white p-5">
        <p>
          To: {c.legalName}, {companyAddressLine()}, {c.email}
        </p>
        <p>
          I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the supply of the following
          digital content/service (*):
        </p>
        <p>
          ______________________________________________
          <br />
          Ordered on (*) / received on (*): ____________________
          <br />
          Name of consumer(s): ____________________
          <br />
          Address of consumer(s): ____________________
          <br />
          Signature of consumer(s) (only if this form is submitted on paper): ____________________
          <br />
          Date: ____________________
        </p>
        <p className="text-sm text-muted">(*) Delete as appropriate.</p>
      </div>
    </>
  );
}
