# Afvallen & Afblijven

Website voor het verkopen van persoonlijke **voedingsschema's**, **trainingsschema's** en een **bundel**, los of als abonnement. Abonnementen worden maandelijks afgeschreven via SEPA-incasso, met een minimale looptijd van 1, 3, 6 of 12 maanden. De schema's worden na betaling automatisch gemaakt met **Claude** (Anthropic) en binnen enkele minuten geleverd.

## Wat zit erin

**Verkoop en conversie**
- Homepage, productpagina's (voeding, training, bundel), prijzen, hoe het werkt, voorbeeldschema (inclusief een voorbeeld van Mijn schema's), over ons en contact met veelgestelde vragen.
- Verkooppagina's beginnen bij het probleem van de bezoeker: een blok "Herken je dit?" (herkenbare situaties, wat het kost om zo door te gaan, "het ligt niet aan jou" en een knop), daarna "Zo pakken we het anders aan". De teksten per onderwerp (afvallen, voeding, training, bundel) staan in `src/content/pains.ts` en worden gedeeld met de campagne-landingspagina's. Bewust over frustratie en verspilde moeite, niet over iemands lichaam, en zonder beloftes over resultaat.
- Vragenlijst in stappen (`/start`). De bezoeker ziet direct een persoonlijk resultaat: calorie- en macrodoel en een prognose met streefdatum. Daarna volgen de plankeuze en de betaling.
- Prijstabel met looptijd-schakelaar (vanaf € 8,95 per maand), kortingslabels, "Meest gekozen"-bundel en een losse aankoop als alternatief.
- Kiest de bezoeker een los schema of 1 maand, dan toont de prijstabel een eerlijke vergelijking (een maandabonnement is goedkoper dan een los schema; met 3 maanden betaal je minder en heb je de ~66 dagen die een nieuwe gewoonte volgens onderzoek nodig heeft, Lally e.a. 2010). In de vragenlijst staat bij de plankeuze een persoonlijk looptijdadvies op basis van de prognose (3 of 6 maanden), dat is voorgeselecteerd zolang de bezoeker zelf nog niets koos.
- Vlak voor de prijzen: "Over 3 maanden kun je op twee plekken staan" (als je niets verandert, of als je vandaag begint).
- Acties (automatische korting op de eerste betaling, per looptijd, alleen binnen de ingestelde data): Black Friday van 23 t/m 30 november 2026 (tot 50%) en een goede voornemens-actie in januari 2027 (20%).
- Tevredenheidsgarantie van 14 dagen op de eerste betaling (aan/uit te zetten), aan te vragen in Mijn schema's.
- Bescheiden disclaimers dat je een schema en begeleiding koopt, geen gegarandeerd resultaat: in de footer, onder de prijzen, bij de prognose en het afrekenen, in de veelgestelde vragen en op de disclaimerpagina (teksten in `src/content/disclaimers.ts`).
- Vaste startknop onderin op mobiel.
- Conversiemeting voor GA4 en Meta Pixel, pas na cookietoestemming.

**Na de betaling**
- De Stripe-webhook legt de bestelling vast en verstuurt een orderbevestiging.
- Claude maakt het schema direct. Het systeem controleert het automatisch op calorieën, eiwit, het aantal maaltijden en de allergenen van de klant (`src/lib/allergens.ts`: elk ingrediënt, gerecht, alternatief en elke regel op de boodschappenlijst, in het Nederlands en Engels, ook voor zelf ingevulde allergieën zoals "kiwi"). Voldoet het niet, dan wordt het één keer opnieuw gemaakt; lukt dat niet, dan wordt het niet geleverd en later opnieuw geprobeerd.
- **Levering binnen 2 uur** (`site.delivery`): het schema is meestal na een paar minuten klaar, maar de klant krijgt het op een willekeurig moment tussen 20 en 110 minuten na de betaling te zien (de ene klant na 23 minuten, de andere na anderhalf uur), met een e-mail erbij. Hetzelfde geldt na een check-in. Tot dat moment ziet de klant "wordt gemaakt". De geplande taak (elke 5 minuten) geeft het schema op tijd vrij; opent de klant Mijn schema's, dan ziet hij het precies op het geplande moment.
- **Eerst zelf goedkeuren** (optioneel, aan te zetten in `/beheer/instellingen`): een schema gaat dan pas naar de klant als je het in het beheer hebt goedgekeurd. Je krijgt per periode een e-mail met het tijdstip waarop de klant het uiterlijk verwacht. Handig als steekproef in de eerste weken.
- De bedankpagina zegt dat het schema binnen 2 uur klaarstaat en laat het zien zodra het is vrijgegeven. De klant krijgt dan ook een e-mail met een inloglink.
- "Mijn schema's" (inloggen zonder wachtwoord) met tabbladen: **Overzicht**, **Schema's**, **Voortgang**, **Check-in**, **Mijn gegevens** en **Abonnement**. Elk tabblad heeft een eigen adres (`/account/voortgang` enz.).
  - Voortgang: grafiek van je gewicht (start uit de vragenlijst plus elke check-in) naast het verwachte verloop en je streefgewicht, een voortgangsbalk, taille-omtrek, BMI-schaal, je caloriedoel per periode en een overzicht van je check-in-antwoorden per periode.
  - Mijn gegevens: je antwoorden uit de vragenlijst (bijgewerkt met je check-ins), je energiebehoefte en de verdeling van eiwit, koolhydraten en vet.
  - Abonnement: opzeggen of de opzegging intrekken, en betaalgegevens en facturen inzien via het Stripe-portaal. In de eerste 14 dagen na de eerste aankoop staat hier ook, onopvallend, de geld-terug-garantie: de klant vraagt de eerste betaling terug (met een vinkje ter bevestiging) en krijgt een bevestiging per e-mail. Op het Overzicht staat er zolang één regel over. Daarna verdwijnt de optie vanzelf.
- Overzichtelijke schema's met tabbladen. Voeding: weekmenu in één oogopslag, recepten per dag (inklapbaar), boodschappenlijst om af te vinken en tips. Training: weekoverzicht, per training een compacte oefeningenlijst, opbouw in 4 weken en herstel.
- Alles als PDF: elk schema, alleen de boodschappenlijst, of alle schema's van een periode in één bestand. Het trainingsschema bevat een logboek om gewichten bij te houden. De PDF's worden op de server gemaakt (`src/lib/pdf/`), in het lettertype van de site.
- **Vast weekritme** (`src/lib/schedule.ts`): elke periode start op maandag en duurt 4 weken. De eerste periode start direct na de aankoop en loopt tot de maandag die het dichtst bij 4 weken later ligt (25 tot 31 dagen). De check-in opent op de donderdag ervoor; vult de klant hem uiterlijk zaterdag in, dan staat het nieuwe schema met boodschappenlijst op tijd klaar voor de boodschappen in het weekend. Eerder maken we het bewust niet, zodat het aansluit op de laatste voortgang. Het nieuwe schema staat binnen 2 uur na de check-in klaar ("start maandag 12 mei", met een knop naar de boodschappenlijst) en wordt op die maandag vanzelf het huidige schema. Is de check-in te laat, dan start het nieuwe schema meteen en sluit de periode daarna weer aan op maandag. De weegmomenten openen op zaterdag, zodat een bijsturing op tijd is voor de boodschappen van de week erna. Startdag en tijden staan in `periodStartWeekday` en `checkin` in `src/config/site.ts`; de start van elke periode staat in `plans.starts_at`.
- **Verplichte check-in**: uitnodiging op donderdag, herinneringen op zaterdag ("vandaag invullen, dan ben je klaar voor maandag"), op maandag (de nieuwe periode is begonnen) en een week later. Pas na de check-in maakt Claude het nieuwe schema, op basis van de antwoorden: gewicht en taille, hoe goed het schema lukte, honger, energie, slaap, wat de klant lekker vond, hoe zwaar de trainingen waren, aantal trainingsdagen en nieuwe klachten. Het caloriedoel wordt in stappen van 100 kcal bijgesteld als het gewicht anders verloopt dan gepland (maximaal 300 kcal in totaal). Bovenaan elk vervolgschema staat wat er is aangepast en waarom.
- **Wekelijks weegmoment** (rond de maandagen in elke periode, open vanaf de zaterdag ervoor, ook bij een los schema): gewicht en een paar korte vragen. Vaste regels beslissen of het lopende schema wordt bijgestuurd: ±100 kcal per dag als het gewicht anders verloopt dan gepland (pas na ongeveer 2 weken, of meteen bij veel honger en weinig energie), en zwaarder, lichter of eenvoudiger trainen. Claude zet dat om in concrete aanpassingen binnen het bestaande schema (met een vaste tekst als terugval). De bijsturing staat bovenaan het schema en in de PDF, en telt mee in het volgende schema. Herinnering per e-mail (uit te zetten door de klant). Logica: `src/lib/weekly.ts`.
- Is het streefgewicht bereikt, dan schakelt het schema automatisch over naar een onderhoudsplan ("afblijven").

**Campagnes en landingspagina's**
- Voor advertenties zijn er drie landingspagina's zonder afleidend menu, in het Nederlands en Engels (`/en/lp`, ...). Kies de pagina die past bij de belofte in je advertentie:
  - `/lp`: afvallen met voeding én training (de klant kiest zelf het plan);
  - `/lp/voeding`: voedingsschema (de vragenlijst begint met het voedingsschema);
  - `/lp/training`: trainingsschema, thuis of in de sportschool.
- Bovenaan kiest de bezoeker meteen een doel; de vragenlijst begint dan bij de tweede vraag (`/start?doel=afvallen`). Verder: wat je krijgt, herkenbare problemen met de oplossing, een echt voorbeeld uit een schema, de wekelijkse bijsturing met een voorbeeldgrafiek, een vergelijking, de prijzen, garantie, veelgestelde vragen en een vaste startknop op mobiel. Een actie verschijnt vanzelf zolang die loopt.
- De pagina's staan niet in zoekmachines (noindex) en niet in de sitemap; de gewone pagina's zijn voor SEO.
- Zet utm-parameters in je advertentielinks, bijvoorbeeld `https://afvallenenafblijven.nl/lp/voeding?utm_source=meta&utm_medium=paid_social&utm_campaign=lancering-januari&utm_content=video-1`. De parameters gaan mee naar de vragenlijst en worden bij de bestelling opgeslagen (er wordt niets in de browser bewaard). In het beheer zie je per campagne hoeveel mensen de betaalstap startten, hoeveel er bestelden en wat dat opleverde; bij elke bestelling staat de bron.
- Meting (na cookietoestemming): `view_promotion` bij het openen, `select_promotion` bij een klik op een startknop of doel, daarna de bestaande gebeurtenissen (`quiz_start` = Meta Lead, `begin_checkout`, `purchase`).
- Teksten per variant: `src/content/landing.ts`; opbouw: `src/components/campaign/CampaignLanding.tsx`.

**Twee talen: Nederlands en Engels**
- Nederlands staat zonder voorvoegsel (`/prijzen`), Engels onder `/en` (`/en/prijzen`). De taalwisselaar staat in de kopbalk, het mobiele menu en de footer en houdt je op dezelfde pagina. Zoekmachines krijgen per pagina beide versies door (hreflang en sitemap).
- Alles is vertaald: pagina's, vragenlijst, prijzen, FAQ, Mijn schema's, voorbeelden, PDF's en e-mails. De juridische teksten zijn ook in het Engels, met de vermelding dat de Nederlandse versie voorgaat.
- De taal van de klant wordt bij de bestelling opgeslagen (`customers.locale`) en bijgewerkt als de klant een check-in of weegmoment in een andere taal invult. E-mails, de schema's van Claude en de PDF's volgen die taal.
- Werking: `src/proxy.ts` herschrijft Nederlandse adressen intern naar `/nl/...`; alle pagina's staan in `src/app/[lang]/`. Hulpfuncties staan in `src/i18n/`: `getLocale()` (Server Components), `useLocale()` (Client Components), `requestLocale()` (Server Actions en Route Handlers) en `Link` (zet vanzelf `/en` voor interne links). Teksten staan per bestand in `defineCopy({ nl, en })`.
- De beheeromgeving blijft Nederlands.

**Koppelingen met gezondheidsapps (optioneel)**
- Klanten koppelen in Mijn schema's → Mijn gegevens hun app of horloge, met een apart toestemmingsvinkje (gezondheidsgegevens, art. 9 AVG). We halen alleen stappen, actieve minuten en calorieën, trainingen (soort, duur) en gewicht op.
- **Withings** (weegschalen, Health Mate): rechtstreekse koppeling via de eigen login van Withings. Geen contract nodig.
- **Apple Health (iPhone/Apple Watch), Garmin, Fitbit, Oura, Polar** en meer: via het platform [Junction](https://junction.com) (EU-regio). Apple Health kan alleen op de iPhone zelf worden uitgelezen; de klant installeert daarom de Junction-app en vult een koppelcode in die de website maakt.
- **Niet mogelijk zonder eigen app**: Android Health Connect en Samsung Health zonder horloge (die gegevens staan alleen op de telefoon). **Strava** koppelen we bewust niet: de API-voorwaarden verbieden gebruik van de data voor AI.
- Wat we ermee doen:
  - Voortgang: stappen per dag, trainingen per week tegenover het schema, actieve minuten, laatste weging, en "wat levert het op": de gewichtsverandering in weken waarin het schema gehaald werd tegenover de andere weken.
  - Overzicht: trainingen en stappen van deze week.
  - Weegmoment en check-in worden alvast ingevuld met de laatste weging en het aantal geregistreerde trainingen (de klant kan het aanpassen).
  - Nieuw schema: het activiteitsniveau volgt de gemeten stappen (hooguit één stap per periode, pas vanaf 10 dagen met metingen), en Claude krijgt de gemeten trainingen en stappen als extra context.
- Ontkoppelen stopt het ophalen direct en wist alle gegevens van die koppeling. Toegangstokens worden versleuteld opgeslagen. Code: `src/lib/health/`.

**Beheer (`/beheer`)**
- Inloggen met één wachtwoord (`ADMIN_PASSWORD`, minimaal 12 tekens).
- **Overzicht**: terugkerende omzet per maand, nieuwe bestellingen, conversie, een samenvatting van de funnel, bestellingen per dag, actieve abonnementen per plan en campagnes. Alles wat aandacht nodig heeft (goed te keuren of mislukte schema's, herroepingen, garantie-aanvragen) staat bovenaan.
- **Kansen**: tips en verbeteringen, berekend uit alle cijfers (funnel, bezoekers, omzet en behoud, feedback, e-mails, kortingscodes). Per kans: wat de cijfers laten zien, wat je kunt doen, waarop het is gebaseerd en een link naar de juiste pagina. Gesorteerd op impact, te filteren op onderwerp en 30 dagen te verbergen. Een kans verschijnt pas als er genoeg gegevens zijn. Met de knop "Vraag advies" denkt Claude mee met dezelfde cijfers (alleen opgetelde cijfers, geen namen, e-mailadressen of opmerkingen van klanten; maximaal één keer per 10 minuten). De top 3 staat ook op het Overzicht.
- **Bezoekers**: bezoeken, paginaweergaven, pagina's per bezoek, bouncepercentage, bezoekduur, conversie en mobiel, steeds vergeleken met de periode ervoor. Live: bezoekers in de laatste 30 minuten. Per pagina weergaven, tijd op de pagina, instap en uitstap; kanalen (campagnes, zoekmachines, social, e-mail, andere websites, direct), verwijzende websites, campagnes, apparaten, taal en een heatmap per weekdag en uur. Periode 7, 30 of 90 dagen.
- **Funnel**: van bezoek tot betaling in 9 stappen, met per stap hoeveel bezoekers afhaken en het grootste afhaakmoment gemarkeerd. Per vraag van de vragenlijst zie je hoeveel mensen er stopten. Uitsplitsing naar bron, apparaat, landingspagina en plan; bezoeken en bestellingen per dag; heatmaps van wanneer mensen komen en bestellen (weekdag × uur); en een lijst van niet-afgeronde betalingen, met een knop om één herinnering te sturen (alleen met toestemming voor e-mail). Filters: 7, 30 of 90 dagen, bron en apparaat.
  - De meting werkt zonder cookies: een willekeurig bezoeknummer in sessionStorage (`afb_bezoek`), geen IP-adres, en niets als Do Not Track of Global Privacy Control aanstaat. Gemeten worden de pagina's en stappen, de tijd dat een pagina zichtbaar openstaat, het apparaat, de taal, de utm-gegevens en de domeinnaam van de verwijzende website. Bots worden eruit gefilterd. Bewaard 13 maanden. In de demo-modus en zonder database staat de meting uit.
- **Analyse**: omzet per maand (uit de echte betalingen van Stripe, of geschat voor maanden van vóór de betaalregistratie), terugkerende omzet, nieuwe en beëindigde abonnementen, klantwaarde, opzegpercentage, cohorten (hoeveel klanten na 1, 2, 3… maanden nog klant zijn), plan- en looptijdmix, opzegredenen, betrokkenheid (check-ins en weegmomenten op tijd), resultaten (gewichtsverandering), schema's (tijd tot levering, mislukt), e-mails en kortingscodes.
- **Klanten**: zoeken, gegevens aanpassen (naam, e-mail, taal, nieuwsbrief, herinneringen), antwoorden uit de vragenlijst bekijken en aanpassen, interne notities, de klantreis (hoe de klant binnenkwam), alle verstuurde e-mails, check-ins en weegmomenten, bestellingen en schema's. Acties: inloglink sturen, nieuwe periode starten zonder check-in, abonnement opzeggen namens de klant (met reden), eerste betaling terugbetalen via Stripe (met of zonder direct beëindigen), klant volledig verwijderen (AVG). Export naar CSV (klanten en de nieuwsbrieflijst).
- **Bestellingen** met filters, kortingscode, terugbetaald bedrag en opzegreden, en export naar CSV.
- **Schema's** met filters (ook "Nog niet bij klant" en "Goedkeuren"). Je bekijkt ze zoals de klant ze ziet, ook als PDF, met de allergieën erbij. Goedkeuren, meteen naar de klant sturen, opnieuw laten maken **met een aanwijzing** (bijv. "meer warme lunches"; die gaat mee naar Claude), de mail opnieuw sturen en een **beoordeling** (1-5 met toelichting) geven.
- Mislukt een schema, dan wordt het automatisch opnieuw geprobeerd, steeds iets later (na 5, 10, 20 en 40 minuten). Na 5 pogingen krijg je een e-mail met een link naar het schema; los de oorzaak op (meestal de API-sleutel of het tegoed bij Anthropic) en klik op "Opnieuw maken".
- **Feedback**: de antwoorden uit de check-ins (verdeling per vraag, met aandachtspunten in oranje), opmerkingen uit check-ins en weegmomenten, opzegredenen met toelichting, garantie-aanvragen en je eigen beoordelingen van schema's.
- **Kortingscodes**: percentage of vast bedrag, voor de eerste betaling, de eerste maanden of altijd, beperkt tot producten of looptijden, met een maximum aantal keer en een geldigheidsperiode. Per code zie je hoe vaak hij is gebruikt, hoe vaak de betaalpagina ermee werd geopend en de eerste betalingen. Klanten vullen de code in bij het afrekenen, of je deelt een link (`/start?code=ZOMER10`, werkt ook achter een landingspagina). Een code vervangt de actiekorting. De Stripe-coupon wordt automatisch aangemaakt.
- **E-mails**: van elke klantmail pas je het onderwerp, de tekst en de knop aan, in het Nederlands en het Engels, met invulvelden zoals `{naam}`. Met een voorbeeld, testmail en "terug naar standaard". Daarnaast een log van alle verstuurde e-mails (12 maanden), te filteren op status en soort.
- **Herinnering bij niet-afgeronde betaling** (staat standaard uit, aanzetten in Instellingen): één mail na een in te stellen aantal uren, alleen met toestemming voor e-mail, tussen 08:00 en 21:00, en niet als de persoon intussen heeft besteld. De link opent de vragenlijst met de antwoorden al ingevuld.
- **Herroepingen en garantie-aanvragen** afhandelen, met een knop die de eerste betaling via Stripe terugbetaalt, het abonnement direct beëindigt en de aanvraag afhandelt.
- **Logboek**: alles wat in het beheer is gedaan (24 maanden bewaard).
- **Instellingen**: levertijd van schema's (minimum en maximum, ook na een check-in of niet), schema's eerst zelf goedkeuren, de herinnering bij niet-afgeronde betaling, exports (klanten, bestellingen, betalingen, nieuwsbrief, kortingscodes) en de status van alle koppelingen (met testmail).
- Klanten kunnen bij het opzeggen optioneel een reden kiezen; die zie je terug bij Analyse en Feedback.
- `BEHEER_DEMO=1` toont het beheer met fictieve voorbeelddata en zonder wachtwoord. Alleen voor een demo; zet dit nooit aan op de live site.

**Juridisch (Nederland)**
- Algemene voorwaarden, privacybeleid, cookiebeleid en disclaimer.
- Herroepingsfunctie in twee stappen (`/herroepen`) met ontvangstbevestiging per e-mail. Deze functie is verplicht sinds 19 juni 2026.
- Online opzeggen (`/abonnement-opzeggen`).
- Cookiebanner volgens de richtlijnen van de Autoriteit Persoonsgegevens: weigeren is even makkelijk als accepteren, en scripts laden pas na toestemming.
- Uitdrukkelijke toestemming voor het verwerken van gezondheidsgegevens (art. 9 AVG).
- Instemming met directe levering, waardoor het herroepingsrecht voor digitale inhoud vervalt.
- De klant bevestigt bij het afrekenen dat de vragen naar waarheid en volledig zijn ingevuld, ook over gezondheid en allergieën. De voorwaarden (art. 5 en 12/13) en de disclaimer leggen vast dat de veiligheidscheck een eenvoudige eerste selectie is en geen medische beoordeling, dat we alleen rekening houden met de opgegeven allergieën en dat de klant zelf de ingrediënten en etiketten controleert.
- Abonnementen worden **per maand** afgeschreven via SEPA-incasso. De eerste maand betaalt de klant met iDEAL | Wero, Bancontact of IBAN; daarmee ontstaat de incassomachtiging. Na de minimale looptijd lopen abonnementen door tegen dezelfde maandprijs en zijn ze maandelijks opzegbaar. Opzeggen binnen de minimale looptijd laat het abonnement aan het einde daarvan stoppen.
- Veiligheidscheck: geen schema bij zwangerschap of borstvoeding, een eetstoornis, ondergewicht of een ongezond streefgewicht. Bij medische aandoeningen moet de klant eerst bevestigen dat er met een arts is overlegd.
- Automatisch opschonen van gegevens volgens de bewaartermijnen uit het privacybeleid.

## Techniek

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Stripe · Anthropic SDK (Claude Opus 5.5, structured outputs) · PostgreSQL · SMTP (nodemailer).

Belangrijke bestanden:

| Bestand | Wat |
| --- | --- |
| `src/config/site.ts` | Bedrijfsgegevens, garantie, acties |
| `src/config/pricing.ts` | Producten, looptijden en **alle prijzen** |
| `src/lib/ai/prompts.ts` | Instructies voor Claude (kwaliteit van de schema's) |
| `src/lib/ai/generate.ts` | Generatie en automatische kwaliteitscontrole |
| `src/lib/calculations.ts` | Berekening van calorieën en macro's |
| `src/lib/safety.ts` | Veiligheidscheck vóór betaling |
| `src/app/[lang]/(site)/` | Alle publieke pagina's (Nederlands en Engels), inclusief de juridische |
| `src/i18n/` | Talen: adressen, taalwisselaar, vertaalde antwoordopties |
| `src/lib/health/` | Koppelingen met gezondheidsapps en de berekeningen daarop |
| `src/app/beheer/` | De beheeromgeving |

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul in wat je hebt; de site werkt ook zonder
npm run dev                  # http://localhost:3000
```

Zonder Stripe en database werkt de hele website, inclusief de vragenlijst. De betaalstap meldt dan dat betalen nog niet is geactiveerd.

### Kwaliteit van de schema's testen

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run schema:test          # voeding + training
ANTHROPIC_API_KEY=sk-ant-... npm run schema:test voeding
```

Het resultaat komt in `schema-test/`, met per dag een overzicht van kcal en eiwit. Elke run kost API-tegoed: enkele tientallen eurocenten per schema met Claude Opus 5.5. Wil je de instructies verbeteren, pas dan `src/lib/ai/prompts.ts` aan en test opnieuw.

## Live zetten met Vimexx, Vercel en Neon (stap voor stap)

De domeinnaam en de e-mail blijven bij Vimexx. De website draait op Vercel (Pro), de database bij Neon. Alle drie in Europa: Vercel draait de website in Frankfurt (`"regions": ["fra1"]` in `vercel.json`), kies bij Neon ook Frankfurt.

**1. Database (Neon)**
1. Maak een account op [neon.tech](https://neon.tech) en een nieuw project. Kies als regio **AWS Europe Central 1 (Frankfurt)**.
2. Kopieer de connection string (de "pooled" variant is prima). Die wordt `DATABASE_URL`. De tabellen worden bij de eerste aanvraag automatisch aangemaakt.
3. Sluit de verwerkersovereenkomst (DPA) van Neon af.

**2. E-mailadres voor de website (Vimexx)**
1. Maak in DirectAdmin een mailbox aan, bijv. `info@jouwdomein.nl` (Vimexx-hulp: "Hoe kan ik een e-mail account aanmaken in DirectAdmin?").
2. De SMTP-gegevens voor de website:
   - `SMTP_HOST=mail.jouwdomein.nl`
   - `SMTP_PORT=465` (SSL; lukt dat niet, gebruik dan `587`)
   - `SMTP_USER=info@jouwdomein.nl`
   - `SMTP_PASS=` het wachtwoord van die mailbox
   - `EMAIL_FROM="Afvallen & Afblijven <info@jouwdomein.nl>"` en `ADMIN_EMAIL=` het adres waar jij de meldingen wilt ontvangen
3. Controleer in DirectAdmin (DNS-beheer) dat er een SPF-record is en dat DKIM aanstaat, zodat de mails niet in de spam belanden. Bij een Vimexx-pakket staat dit meestal al goed.
4. Vraag bij Vimexx na hoeveel mails per uur je mag versturen. Voor de start is dat ruim genoeg; worden het er veel, stap dan over op een maildienst zoals Brevo of Postmark (alleen de SMTP-gegevens veranderen).

**3. Website (Vercel)**
1. Maak een account op [vercel.com](https://vercel.com) en kies **Pro** (nodig voor een commerciële site en voor de taak die elke 5 minuten draait).
2. Kies "Add New → Project" en importeer de GitHub-repository. Vercel herkent Next.js vanzelf.
3. Zet bij Settings → Environment Variables alle waarden uit `.env.example`: de database, de SMTP-gegevens hierboven, Stripe, `ANTHROPIC_API_KEY`, `CRON_SECRET` (een lange willekeurige tekst), `ADMIN_PASSWORD` en `NEXT_PUBLIC_SITE_URL=https://jouwdomein.nl`.
4. Deploy. Controleer bij Settings → Functions dat de regio Frankfurt (`fra1`) is.
5. Open `/beheer/instellingen` op het `.vercel.app`-adres en stuur een testmail. Alle koppelingen moeten groen zijn.

**4. Domeinnaam naar Vercel laten wijzen (Vimexx)**
1. Voeg bij Vercel → Settings → Domains `jouwdomein.nl` en `www.jouwdomein.nl` toe. Vercel laat zien welke records je moet zetten: meestal een **A-record** voor het hoofddomein (`76.76.21.21`) en een **CNAME** voor `www` (de waarde die Vercel toont).
2. Ga bij Vimexx naar het DNS-beheer van je domein (in Mijn Vimexx of in DirectAdmin onder DNS Management):
   - Verwijder de bestaande A-records voor `@` en `www` die naar de Vimexx-hosting wijzen. Een bestaand record kun je in DirectAdmin niet bewerken: verwijderen en opnieuw toevoegen.
   - Voeg toe: A-record, naam `@`, waarde `76.76.21.21` (of wat Vercel toont).
   - Voeg toe: CNAME, naam `www`, waarde van Vercel **met een punt aan het eind** (anders plakt Vimexx je eigen domein erachter).
   - **Laat de MX-, SPF- en DKIM-records en `mail.jouwdomein.nl` staan**: daarmee blijft je e-mail bij Vimexx werken.
3. Het duurt 2 tot 6 uur voordat de wijziging overal zichtbaar is. Vercel regelt daarna zelf het HTTPS-certificaat.
4. Staat er nu een oude website op je Vimexx-pakket, dan zien bezoekers die niet meer zodra de DNS is aangepast. Het pakket zelf blijft nodig voor je e-mail.

**5. Daarna**: werk de checklist hieronder af (Stripe-webhook naar `https://jouwdomein.nl/api/webhooks/stripe`, bedrijfsgegevens, testen in Stripe-testmodus).

## Live zetten (checklist)

1. **Bedrijfsgegevens** controleren in `src/config/site.ts`: naam, adres, KvK, btw en e-mailadressen (zijn ingevuld). Naam, KvK en btw verschijnen in de footer en de e-mails. Het adres is een woonadres en staat alleen in de algemene voorwaarden (artikel 2 en het modelformulier voor herroeping); de contactpagina en de herroepingspagina verwijzen ernaar.
2. **Hosting**: zet het project op [Vercel](https://vercel.com), op het **Pro**-abonnement (zie het stappenplan hierboven). De website draait in Frankfurt (`regions` in `vercel.json`). De geplande taak in `vercel.json` draait elke 5 minuten (schema's vrijgeven en mailen, mislukte schema's opnieuw proberen); de herinneringen en het opruimen gebeuren één keer per dag vanaf 08:00. Op het gratis Hobby-abonnement mag een geplande taak maar één keer per dag draaien en mislukt de deploy met deze instelling; Hobby is bovendien alleen voor niet-commercieel gebruik. Wil je toch Hobby gebruiken, zet dan in `vercel.json` een dagelijkse planning en laat een externe dienst (bijv. cron-job.org) elke 5 minuten `GET /api/cron` aanroepen met de header `Authorization: Bearer <CRON_SECRET>`. Zet de omgevingsvariabelen uit `.env.example`.
3. **Database**: maak een PostgreSQL-database aan in een EU-regio (bijv. Neon of Supabase) en zet `DATABASE_URL`. De tabellen worden automatisch aangemaakt.
4. **Stripe**
   - Zet in het dashboard de betaalmethoden aan: iDEAL | Wero, Bancontact en SEPA-incasso (voor abonnementen) en kaart (voor losse schema's). Stripe zet iDEAL en Bancontact bij abonnementen automatisch om in een SEPA-machtiging.
   - Zet bij Settings → Billing → Customer emails de e-mails voor mislukte betalingen aan, zodat klanten bericht krijgen als een incasso niet lukt.
   - Maak een webhook naar `https://jouwdomein.nl/api/webhooks/stripe` met deze events:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid` (voor de omzetcijfers in het beheer: elke maandelijkse betaling)
   - Zet het signing secret in `STRIPE_WEBHOOK_SECRET`.
   - Terugbetalen doe je bij voorkeur vanuit het beheer; dan staat het ook in de omzetcijfers. Betaal je terug in het Stripe-dashboard, dan zie je dat niet terug in het beheer.
   - Sla het **klantportaal** (Settings → Billing → Customer portal) één keer op. Zet daarin betaalmethode wijzigen en factuurhistorie aan. Zet **opzeggen in het portaal uit**: de website regelt opzeggen zelf, zodat de minimale looptijd klopt.
   - Producten, prijzen en de actiecoupons worden automatisch aangemaakt bij de eerste bestelling.
   - Btw: de prijzen zijn inclusief 21%. Verkoop je ook aan België, overweeg dan Stripe Tax (OSS-regeling).
5. **E-mail**: zet de SMTP-gegevens van je e-mailaanbieder en stel SPF/DKIM in voor je domein, zodat mails niet in de spam belanden.
6. **Claude**: maak een API-sleutel aan op platform.claude.com, zet `ANTHROPIC_API_KEY` en draai `npm run schema:test` om de kwaliteit te beoordelen.
7. **Cron en beheer**: zet `CRON_SECRET` en een sterk `ADMIN_PASSWORD`. Kijk daarna op `/beheer/instellingen` of alle koppelingen groen zijn.
8. **Test** de hele flow in Stripe-testmodus: bestellen, schema ontvangen, check-in, opzeggen, opzegging intrekken en herroepen.
9. **Gezondheidsapps (optioneel)**
   - Zet `HEALTH_ENCRYPTION_KEY` (64 hextekens, bijv. `openssl rand -hex 32`).
   - **Withings**: maak een app aan op [developer.withings.com](https://developer.withings.com) met callback-URL `https://jouwdomein.nl/api/koppelingen/withings/callback` en zet `WITHINGS_CLIENT_ID` en `WITHINGS_CLIENT_SECRET`. Meldingen van nieuwe metingen komen binnen op `/api/koppelingen/withings/notify` (wordt automatisch aangemeld). Testen zonder weegschaal: `WITHINGS_DEMO=1`.
   - **Junction**: maak een account op junction.com (kies de EU-regio), zet `JUNCTION_API_KEY` en voeg een webhook toe naar `https://jouwdomein.nl/api/koppelingen/junction/webhook`; zet het signing secret in `JUNCTION_WEBHOOK_SECRET`. Welke apps de klant kan kiezen staat in `JUNCTION_PROVIDERS` (standaard `garmin,fitbit,oura,polar`). Apple Health via de Junction-app vraagt een Grow- of Scale-abonnement bij Junction; zet daarna `JUNCTION_APPLE_HEALTH=1`. Sluit een verwerkersovereenkomst af met Junction.
   - Fitbit: de oude Fitbit Web API stopt op 30 oktober 2026; Junction gebruikt daarna de Google Health API. Kies bij Junction voor Fitbit dus de nieuwe koppeling.
10. **Juridische controle**: laat de voorwaarden, het privacybeleid en de disclaimer controleren door een jurist. Sluit verwerkersovereenkomsten af met Anthropic, je hosting-, database- en e-mailpartij. Voeg de algemene voorwaarden eventueel als PDF toe aan de orderbevestiging.

## Prijzen, actie en garantie aanpassen

- **Prijzen**: `monthlyPrices` in `src/config/pricing.ts`, per maand, in centen en inclusief btw. Een gewijzigde prijs maakt automatisch een nieuwe Stripe-prijs aan voor nieuwe klanten; bestaande abonnees houden hun prijs.
- **Acties**: `promotions` in `src/config/site.ts`. Per actie stel je de naam, de start- en einddatum en het kortingspercentage per looptijd in (0 = geen korting), of zet je de actie uit. De korting geldt op de eerste betaling en verschijnt vanzelf in de aankondigingsbalk, de prijstabellen, de landingspagina's en bij het afrekenen. Lopen er twee acties tegelijk, dan geldt de eerste in de lijst. Kondig een korting alleen aan ten opzichte van een prijs die je echt hebt gevraagd (ACM).
- **Garantie**: `guarantee` in `src/config/site.ts` (standaard 14 dagen). Zet je deze uit, dan verdwijnt de garantie overal, ook uit de voorwaarden en Mijn schema's. De termijn loopt tot en met de 14e dag na de besteldag (Nederlandse tijd); de garantie geldt één keer per klant, voor de eerste bestelling.

## Reviews en social proof

Er staan bewust **geen verzonnen reviews** op de site; nep-reviews zijn verboden onder de Europese consumentenregels. Verzamel na de lancering echte reviews, bijvoorbeeld via Trustpilot of Kiyoh, en voeg die toe.

## Foto's

De foto's staan in `public/images` en komen van [Unsplash](https://unsplash.com/license). Ze zijn gratis te gebruiken, ook commercieel, en naamsvermelding is niet verplicht.
