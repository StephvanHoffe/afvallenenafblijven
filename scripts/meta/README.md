# Facebook en Instagram beheren (`npm run meta`)

Een eigen koppeling met de Meta Graph API, zodat je advertenties, berichten en reacties op Facebook en Instagram vanuit de opdrachtregel beheert, of samen met Claude in een chat. Het werkt rechtstreeks met je eigen token, dus zonder tussenpartij en zonder limiet op het aantal opdrachten.

```bash
npm run meta -- help                       # alle opdrachten
npm run meta -- status                     # klopt het token? welke accounts en pagina's?
npm run meta -- report --period last_7d    # dashboard: uitgaven, leads, checkouts, aankopen, roas
npm run meta -- comments --open            # onbeantwoorde reacties op Facebook en Instagram
```

## Wat kan het

| Onderdeel | Opdrachten |
| --- | --- |
| Advertenties bekijken | `report`, `campaigns`, `adsets`, `ads` (met afkeuringen), `insights` (uitgesplitst naar leeftijd, geslacht, plaatsing of regio), `targeting`, `pixels`, `audiences`, `leadforms`, `leads` |
| Advertenties wijzigen | `pause`, `resume`, `budget`, `rename`, `duplicate`, `delete`, `create-ad` (campagne + set + advertentie), `add-ad` (extra variant) |
| Facebook-pagina | `posts`, `scheduled`, `post` (tekst, link of foto; nu of ingepland), `page-stats` |
| Instagram | `ig-posts`, `ig-post` (afbeelding, carrousel, reel of story), `ig-stats` |
| Reacties | `comments`, `reply`, `hide` |
| Al het andere | `api GET|POST|DELETE <pad> veld=waarde` |

**Veilig standaard**
- Alles wat iets verandert, toont eerst een voorbeeld. Pas met `--confirm` gebeurt het echt.
- Nieuwe campagnes staan op pauze. Aanzetten doe je met `resume <id> --confirm`.
- Lukt het aanmaken halverwege niet, dan ruimt de koppeling op wat al was aangemaakt.
- Advertenties gaan alleen naar mensen van 18 jaar en ouder (de regel van Meta voor afvallen).
- Elke advertentie krijgt utm-parameters (`utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`), zodat je in het beheer van de website per campagne en advertentie ziet wat ze opleveren.
- Doel `leads` optimaliseert op de Lead-gebeurtenis van de pixel (start van de vragenlijst), `verkoop` op Purchase.

## Eenmalig instellen: het token

De koppeling gebruikt het token van een **systeemgebruiker** in je Meta-bedrijfsportfolio. Zo'n token verloopt niet en hoort bij je bedrijf, niet bij je persoonlijke account.

1. **App maken.** Ga naar [developers.facebook.com](https://developers.facebook.com) → *Mijn apps* → *App maken*. Kies het type *Zakelijk* (of de use cases voor advertenties via de Marketing API, het beheren van een Pagina en Instagram) en koppel de app aan je bedrijfsportfolio. De app mag in de ontwikkelmodus blijven: je gebruikt hem alleen voor je eigen accounts.
2. **Systeemgebruiker maken.** Ga naar [business.facebook.com/settings](https://business.facebook.com/settings) → *Gebruikers* → *Systeemgebruikers* → *Toevoegen*, met de rol *Beheerder*.
3. **Toegang geven.** Kies bij de systeemgebruiker *Middelen toewijzen* en geef volledige controle over:
   - het advertentieaccount (Steph van Hoffe, `act_539508559435242`);
   - de Facebook-pagina;
   - het Instagram-account;
   - de pixel en de app uit stap 1.
4. **Token maken.** Klik bij de systeemgebruiker op *Nieuw token genereren*, kies de app, verloopdatum *Nooit*, en vink deze rechten aan:
   `ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement`, `pages_read_user_content`, `pages_manage_posts`, `pages_manage_engagement`, `read_insights`, `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights`, `leads_retrieval`.
5. **Token bewaren.** Behandel het als een wachtwoord en zet het nooit in de code, in een chat of in git.
   - **Claude Code op het web (aanbevolen):** open het omgevingsmenu in de titelbalk van de sessie → *Edit* → *Network secrets* → *Add secret* en vul in:

     | Veld | Waarde |
     | --- | --- |
     | Host | `graph.facebook.com` |
     | Secret type | *Token* |
     | Header | `Authorization` |
     | Prefix | `Bearer` |
     | Token | het token uit stap 4 (zonder "Bearer") |

     De proxy van de sessie zet het token dan in elk verzoek naar de Graph API. Het token komt zo nooit in de sessie zelf terecht; `META_ACCESS_TOKEN` is dan niet nodig. Een nieuwe sessie pakt het op.
   - **Lokaal:** zet `META_ACCESS_TOKEN=...` in `.env.local` (dat bestand gaat niet mee in git). Staat `META_ACCESS_TOKEN` ingesteld, dan gaat dat token voor.
6. **Controleren.** `npm run meta -- status` toont je accounts, pagina's en Instagram, en welke rechten nog ontbreken.

### Optionele instellingen

| Variabele | Waarvoor |
| --- | --- |
| `META_AD_ACCOUNT_ID` | Nodig als het token bij meer dan één advertentieaccount kan, bijv. `act_539508559435242` |
| `META_PAGE_ID` | Nodig bij meer dan één Facebook-pagina |
| `META_IG_USER_ID` | Ander Instagram-account dan het account dat aan de pagina hangt |
| `META_PIXEL_ID` | Andere pixel dan `NEXT_PUBLIC_META_PIXEL_ID` |
| `META_API_VERSION` | Andere versie van de Graph API (standaard `v26.0`) |

## Goed om te weten

- **Instagram haalt de media zelf op.** Gebruik openbare https-url's; afbeeldingen als JPEG. Bestanden in `public/` staan na het publiceren op `https://afvallenenafblijven.nl/<bestandsnaam>`.
- **Instagram-berichten inplannen** kan niet via de API; Facebook-berichten wel (`--schedule`, 10 minuten tot 75 dagen vooruit).
- **Statistieken** van Meta veranderen regelmatig van naam. Toont `page-stats` of `ig-stats` "niet beschikbaar", kies dan andere maatstaven met `--metrics`.
- **Advertenties over afvallen** keurt Meta streng: geen voor-en-na-foto's, geen nadruk op lichaamsdelen en geen teksten die iemand aanspreken op het eigen lichaam ("Ben jij te zwaar?"). Met `ads` zie je de reden als een advertentie is afgekeurd.
