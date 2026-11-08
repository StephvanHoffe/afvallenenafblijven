import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { ExerciseList, Paragraphs, SafetyNote, type Exercise } from "@/components/content/ExerciseList";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/buikspieroefeningen";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const exercises = (items: Exercise[]) => items;

const copy = defineCopy({
  nl: {
    metaTitle: "Buikspieroefeningen: de 10 beste oefeningen met uitleg",
    metaDescription:
      "De 10 beste buikspieroefeningen met uitleg en veelgemaakte fouten, plus een routine van 10 minuten. En waarom een sixpack vooral van je vetpercentage afhangt.",
    eyebrow: "Bewegen en trainen",
    h1: "Buikspieroefeningen:",
    h1Accent: "de 10 beste, met uitleg",
    intro:
      "Een sterke romp helpt je bij tillen, sporten en een goede houding. Hieronder vind je 10 buikspieroefeningen, van makkelijk tot pittig, met uitleg en de fouten die je het vaakst ziet. Plus een routine van 10 minuten en een eerlijk antwoord op de vraag hoe je zichtbare buikspieren krijgt.",
    short:
      "Goede buikspieroefeningen zijn de plank, side plank, dead bug, bird dog, crunch, reverse crunch, Pallof press, mountain climbers, hollow hold en (voorzichtig) leg raises. Train je buik 2 tot 3 keer per week, bijvoorbeeld met een routine van 10 minuten: 5 oefeningen van 40 seconden met 20 seconden rust, 2 rondes. Of je buikspieren zichtbaar worden, hangt vooral af van je vetpercentage: plaatselijk vet verbranden op je buik kan niet.",
    muscles: {
      title: "Welke spieren train je met buikspieroefeningen?",
      paragraphs: ["Je buikspieren bestaan uit meerdere lagen. Samen met je onderrug, billen en heupen vormen ze je romp, ook wel je core genoemd:"],
      bullets: [
        "De rechte buikspier (rectus abdominis) loopt van je borstbeen naar je bekken en buigt je romp. Dit is je 'sixpack'.",
        "De schuine buikspieren (obliques) zitten aan de zijkant. Ze draaien je romp, buigen hem zijwaarts en houden draaien juist tegen.",
        "De dwarse buikspier (transversus abdominis) is de diepste laag. Hij ligt als een korset om je buik en houdt je romp stabiel.",
      ],
      after: [
        "Je buikspieren buigen en draaien je romp, maar hun belangrijkste taak is stabiliseren: je romp stevig houden als je tilt, loopt of iets duwt. Daarom staan er in deze lijst ook oefeningen waarbij je juist niet beweegt, zoals de plank, de dead bug en de Pallof press.",
      ],
    },
    exercises: {
      title: "De 10 beste buikspieroefeningen",
      paragraphs: [
        "De eerste oefeningen zijn het makkelijkst om goed te leren. Kies er per training 4 tot 6, met een mix van stilhouden, buigen en draaien tegenhouden. Werk rustig en gecontroleerd: snelheid maakt een buikspieroefening niet beter.",
      ],
      items: exercises([
        {
          name: "Plank",
          focus: "rechte en dwarse buikspieren, hele romp",
          steps: [
            "Steun op je onderarmen en tenen, met je ellebogen recht onder je schouders.",
            "Maak een rechte lijn van hoofd tot hielen.",
            "Span je buik en billen aan en trek je ribben licht naar je bekken. Adem rustig door.",
          ],
          dose: "3 keer 20–45 seconden",
          mistake: "Je heupen hangen door en je onderrug wordt hol. Span je billen aan of ga op je knieën; liever 20 seconden goed dan 2 minuten met een holle rug.",
          variation: "Makkelijker: op je knieën. Zwaarder: til afwisselend een voet een paar centimeter op.",
        },
        {
          name: "Side plank (zijplank)",
          focus: "schuine buikspieren en de zijkant van je heup",
          steps: [
            "Lig op je zij en steun op je onderarm, met je elleboog onder je schouder.",
            "Leg je voeten op elkaar, of zet je bovenste voet voor je onderste.",
            "Duw je heupen omhoog tot je lichaam een rechte lijn is van hoofd tot voeten.",
            "Houd vast en wissel daarna van kant.",
          ],
          dose: "2–3 keer 15–30 seconden per kant",
          mistake: "Je heupen zakken of draaien naar achteren. Duw je bovenste heup iets naar voren en omhoog.",
          variation: "Makkelijker: met gebogen knieën, steunend op je onderste knie.",
        },
        {
          name: "Dead bug",
          focus: "dwarse en rechte buikspieren, rompstabiliteit",
          steps: [
            "Lig op je rug met je armen recht omhoog en je heupen en knieën 90 graden gebogen.",
            "Druk je onderrug zacht tegen de vloer.",
            "Strek langzaam je rechterarm naar achteren en je linkerbeen naar voren, tot net boven de grond.",
            "Kom terug en wissel van kant.",
          ],
          dose: "2–3 sets van 6–10 herhalingen per kant",
          mistake: "Je onderrug komt los van de vloer. Strek je arm en been minder ver en ga langzamer.",
          variation: "Makkelijker: beweeg alleen je benen en tik met je hiel op de grond. Zwaarder: houd een lichte dumbbell in je handen.",
        },
        {
          name: "Bird dog",
          focus: "rompstabiliteit, onderrug en billen",
          steps: [
            "Zit op handen en knieën, met je handen onder je schouders en je knieën onder je heupen.",
            "Strek tegelijk je rechterarm naar voren en je linkerbeen naar achteren, tot ze in één lijn met je romp zijn.",
            "Houd je heupen recht en je rug stil, alsof er een glas water op staat. Houd 2 seconden vast.",
            "Kom terug en wissel van kant.",
          ],
          dose: "2–3 sets van 6–10 herhalingen per kant",
          mistake: "Je zwaait je been te hoog, waardoor je onderrug hol wordt en je heup kantelt. Strek je been alleen tot heuphoogte.",
        },
        {
          name: "Crunch",
          focus: "rechte buikspier",
          steps: [
            "Lig op je rug met gebogen knieën en je voeten plat op de grond.",
            "Leg je vingertoppen achter je oren of kruis je armen voor je borst.",
            "Adem uit en rol je schouders en bovenrug een paar centimeter van de grond, door je ribben naar je bekken te trekken.",
            "Rol rustig terug.",
          ],
          dose: "2–3 sets van 10–20 herhalingen",
          mistake: "Je trekt aan je hoofd en nek. Houd een vuist ruimte tussen je kin en je borst en laat je buik het werk doen.",
        },
        {
          name: "Reverse crunch",
          focus: "rechte buikspier, met de beweging vanuit je bekken",
          steps: [
            "Lig op je rug met je armen naast je lichaam en je heupen en knieën 90 graden gebogen.",
            "Trek je knieën richting je borst en rol je bekken een paar centimeter van de vloer.",
            "Laat je heupen langzaam terugzakken tot je onderrug weer op de grond ligt.",
          ],
          dose: "2–3 sets van 8–15 herhalingen",
          mistake: "Je zwaait met je benen en gebruikt vaart. Beweeg langzaam en klein: het gaat om het oprollen van je bekken.",
        },
        {
          name: "Pallof press (met een weerstandsband)",
          focus: "schuine en dwarse buikspieren: draaien tegenhouden",
          steps: [
            "Maak een weerstandsband op borsthoogte vast aan iets stevigs, zoals een paal of een deur met een deuranker. Ga er zijwaarts naast staan.",
            "Houd de band met beide handen tegen je borstbeen en stap opzij tot de band strak staat.",
            "Duw je handen recht voor je uit. De band wil je naar zich toe draaien; houd je romp stil.",
            "Houd 2 seconden vast, breng je handen terug en wissel na de set van kant.",
          ],
          dose: "2–3 sets van 8–12 herhalingen per kant",
          mistake: "Je draait mee met de band of leunt weg. Sta stevig met je voeten op heupbreedte en kies een lichtere band of ga dichterbij staan.",
          variation: "In de sportschool kun je deze oefening ook aan de kabel doen.",
        },
        {
          name: "Mountain climbers",
          focus: "buikspieren, schouders en conditie",
          steps: [
            "Begin in de opdrukhouding met je handen onder je schouders en een rechte lijn van hoofd tot hielen.",
            "Trek je rechterknie naar je borst en zet je voet terug.",
            "Doe hetzelfde met links en wissel in een rustig tempo af. Versnel pas als je romp stil blijft.",
          ],
          dose: "2–3 keer 20–40 seconden",
          mistake: "Je billen gaan omhoog en je huppelt met je voeten. Houd je heupen laag en je schouders boven je handen.",
          variation: "Makkelijker: met je handen op een bank of stoel, en stappend in plaats van springend.",
        },
        {
          name: "Hollow hold",
          focus: "rechte en dwarse buikspieren",
          steps: [
            "Lig op je rug en druk je onderrug tegen de vloer.",
            "Til je schouders, armen en benen een stukje van de grond. Je lichaam vormt een flauwe banaan.",
            "Houd vast en adem rustig door, terwijl je onderrug op de grond blijft.",
          ],
          dose: "3 keer 15–30 seconden",
          mistake: "Je onderrug komt los van de vloer. Buig je knieën en houd je armen naast je lichaam; strek pas verder als dat lukt.",
          variation: "Dit is een pittige oefening. Begin met gebogen knieën en je armen langs je lichaam.",
        },
        {
          name: "Leg raises (voorzichtig)",
          focus: "rechte buikspier en heupbuigers",
          steps: [
            "Lig op je rug met gestrekte benen en je handen naast of licht onder je billen.",
            "Druk je onderrug tegen de vloer en til je benen langzaam op tot ze recht omhoog wijzen.",
            "Laat ze heel langzaam zakken, alleen zo ver als je onderrug op de grond blijft.",
          ],
          dose: "2–3 sets van 6–12 herhalingen",
          mistake: "Je laat je benen te ver zakken, waardoor je onderrug hol trekt en je rug zwaar belast wordt. Zak minder ver of buig je knieën.",
          variation: "Heb je last van je onderrug? Kies dan liever de reverse crunch of de dead bug.",
        },
      ]),
    },
    routine: {
      title: "Buikspierroutine van 10 minuten",
      paragraphs: [
        "Deze routine doe je thuis, zonder materiaal. Je doet 5 oefeningen van 40 seconden met 20 seconden rust, en dat 2 rondes. Begin met 2 tot 3 minuten warming-up: marcheer op de plek, maak armcirkels en doe een paar keer de cat-cow (op handen en knieën je rug rustig hol en bol maken).",
      ],
      head: ["Oefening", "Werk", "Rust"],
      rows: [
        ["1. Dead bug", "40 sec", "20 sec"],
        ["2. Plank", "40 sec", "20 sec"],
        ["3. Reverse crunch", "40 sec", "20 sec"],
        ["4. Side plank (20 sec per kant)", "40 sec", "20 sec"],
        ["5. Bird dog", "40 sec", "20 sec"],
      ],
      note: "Doe daarna alle 5 oefeningen nog een keer: in totaal 10 minuten, plus de warming-up.",
      after: [
        "Beginner? Doe 30 seconden werk en 30 seconden rust. Gevorderd? Vervang de plank door een hollow hold en de bird dog door mountain climbers, of voeg een derde ronde toe.",
      ],
    },
    frequency: {
      title: "Hoe vaak moet je buikspieroefeningen doen?",
      paragraphs: [
        "2 tot 3 keer per week is genoeg. Een routine van 10 tot 15 minuten kun je los doen of aan het eind van een krachttraining plakken. Elke dag trainen hoeft niet: ook je buikspieren hebben herstel nodig om sterker te worden.",
        "Je romp werkt bovendien flink mee bij oefeningen als squats, deadlifts, lunges en push-ups. Train je al 2 tot 3 keer per week je hele lichaam, dan zijn een paar extra buikspieroefeningen een mooie aanvulling, geen must.",
        "Maak het stap voor stap zwaarder: houd een oefening langer vol (tot zo'n 60 seconden), doe meer herhalingen (tot zo'n 20) of kies een moeilijkere variant.",
      ],
    },
    sixpack: {
      title: "Sixpack: waarom buikspieroefeningen alleen niet genoeg zijn",
      paragraphs: [
        "Iedereen heeft buikspieren, maar of je ze ziet, hangt vooral af van de laag vet erboven. Met buikspieroefeningen worden je buikspieren sterker, maar ze verbranden niet het vet op je buik. Plaatselijk vet verbranden (spot reduction) bestaat niet: je lichaam bepaalt zelf waar het vet eerst afgaat, en dat is voor iedereen anders.",
        "Wil je je buikspieren zien, dan moet je vetpercentage omlaag. Bij mannen worden ze vaak zichtbaar rond 10 tot 12 procent, bij vrouwen rond 16 tot 20 procent, maar dat verschilt sterk per persoon. Zo'n laag vetpercentage is niet voor iedereen nodig, en ook niet altijd makkelijk of gezond om vol te houden.",
        "Vet verlies je met een klein calorietekort, genoeg eiwit en krachttraining voor je hele lichaam. Reken daarbij op maanden, niet op weken.",
      ],
      fatLink: "Bereken je vetpercentage",
      kcalLink: "Bereken je caloriebehoefte",
    },
    mistakes: {
      title: "Veelgemaakte fouten bij buikspieroefeningen",
      bullets: [
        "Te snel werken: met vaart doen je heupbuigers en je nek het werk. Langzaam en gecontroleerd is zwaarder voor je buik.",
        "Je adem inhouden: adem uit als je je buik aanspant of oprolt, en adem rustig door bij oefeningen die je vasthoudt.",
        "Een holle onderrug bij de plank, hollow hold of leg raises: kies een makkelijkere variant zodra je rug hol trekt.",
        "Alleen crunches doen: neem ook oefeningen mee waarbij je romp stil blijft, zoals de plank, dead bug en Pallof press.",
        "Eindeloos lang vasthouden: 3 keer 30 seconden met goede techniek is beter dan één plank van 5 minuten waarin je inzakt.",
        "Verwachten dat je buikvet verdwijnt: daarvoor is je eten belangrijker dan het aantal crunches.",
      ],
    },
    pregnancy: {
      title: "Buikspieren trainen na een zwangerschap",
      paragraphs: [
        "Tijdens een zwangerschap rekken je buikspieren flink op. Bij veel vrouwen wijken de rechte buikspieren in het midden uit elkaar; dat heet een diastase. Dat herstelt vaak voor een groot deel vanzelf, maar niet altijd.",
        "Ben je bevallen? Laat dan eerst door je verloskundige, huisarts of een (bekken)fysiotherapeut beoordelen of en wanneer je weer intensief je buikspieren kunt trainen. Een bekkenfysiotherapeut kan je ook oefeningen geven die bij jouw herstel passen. Zie je een bolling midden op je buik als je een crunch doet, of heb je last van je bekkenbodem? Laat dat nakijken voordat je verder gaat.",
        "Ben je zwanger? Overleg dan met je verloskundige welke oefeningen voor jou geschikt zijn.",
      ],
    },
    safety: {
      title: "Veilig je buikspieren trainen",
      noteTitle: "Let op",
      note: [
        "Doe eerst een korte warming-up van 2 tot 5 minuten.",
        "Pijn is een signaal om te stoppen. Een brandend gevoel in je buikspieren is normaal; pijn in je rug, nek of liezen niet.",
        "Heb je rugklachten, een hernia, een liesbreuk of een andere blessure, heb je hartproblemen, ben je zwanger of net bevallen, of ben je 65 of ouder en begin je met een nieuw trainingsprogramma? Overleg dan eerst met je huisarts of fysiotherapeut.",
      ],
    },
    planTitle: "Buikspieren als deel van een compleet schema",
    planText:
      "Losse buikspieroefeningen zijn een mooie aanvulling, maar een schema voor je hele lichaam levert meer op. In je persoonlijke trainingsschema zitten kracht- en rompoefeningen op jouw niveau, met sets, herhalingen, techniektips en 4 weken opbouw. Het wordt samengesteld op basis van je antwoorden.",
    planCta: "Bekijk het trainingsschema",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoe vaak per week moet je buikspieroefeningen doen?",
        a: "2 tot 3 keer per week 10 tot 15 minuten is genoeg. Je buikspieren hebben, net als andere spieren, herstel nodig. Train je al je hele lichaam met oefeningen als squats en deadlifts, dan werkt je romp daar ook flink mee.",
      },
      {
        q: "Kun je buikvet wegtrainen met buikspieroefeningen?",
        a: "Nee. Buikspieroefeningen maken je buikspieren sterker, maar ze verbranden niet specifiek het vet op je buik. Vet verlies je over je hele lichaam, met een calorietekort. Waar het eerst verdwijnt, verschilt per persoon.",
      },
      {
        q: "Wat is de beste buikspieroefening?",
        a: "Er is niet één beste oefening. Een goede mix bestaat uit een oefening waarbij je stilhoudt (plank of dead bug), een oefening waarbij je draaien tegenhoudt (side plank of Pallof press) en een oefening waarbij je buigt (crunch of reverse crunch). Voor beginners zijn de dead bug en de plank een fijne start.",
      },
      {
        q: "Hoe lang moet je een plank volhouden?",
        a: "Zo lang als je hem met goede techniek kunt vasthouden: voor de meeste mensen 20 tot 60 seconden. Doe liever 3 keer 30 seconden goed dan één keer heel lang met een doorhangende rug. Gaat 60 seconden makkelijk? Kies dan een zwaardere variant.",
      },
      {
        q: "Zijn crunches slecht voor je rug?",
        a: "Voor de meeste mensen zonder rugklachten zijn rustige, kleine crunches prima. Heb je rugklachten, kies dan eerst oefeningen als de dead bug en bird dog, en overleg met je huisarts of fysiotherapeut welke oefeningen bij jou passen.",
      },
      {
        q: "Kun je elke dag buikspieroefeningen doen?",
        a: "Het kan als je het licht houdt, maar het is niet nodig. Met 2 tot 3 keer per week een korte, pittige routine train je je buikspieren goed en houd je tijd over voor herstel.",
      },
    ],
  },
  en: {
    metaTitle: "Ab exercises: the 10 best exercises, explained",
    metaDescription:
      "The 10 best ab exercises with instructions and common mistakes, plus a 10-minute routine. And why visible abs are mainly about your body fat percentage.",
    eyebrow: "Exercise and training",
    h1: "Ab exercises:",
    h1Accent: "the 10 best, explained",
    intro:
      "A strong core helps you lift, play sport and keep good posture. Below you'll find 10 ab exercises, from easy to challenging, with instructions and the mistakes you see most often. Plus a 10-minute routine and an honest answer to the question of how to get visible abs.",
    short:
      "Good ab exercises include the plank, side plank, dead bug, bird dog, crunch, reverse crunch, Pallof press, mountain climbers, hollow hold and (carefully) leg raises. Train your abs 2 to 3 times a week, for example with a 10-minute routine: 5 exercises of 40 seconds with 20 seconds' rest, 2 rounds. Whether your abs become visible mainly depends on your body fat percentage: you can't burn fat on your stomach alone.",
    muscles: {
      title: "Which muscles do ab exercises train?",
      paragraphs: ["Your abdominal muscles consist of several layers. Together with your lower back, glutes and hips, they form your trunk, also known as your core:"],
      bullets: [
        "The rectus abdominis runs from your breastbone to your pelvis and bends your trunk. This is your 'six-pack'.",
        "The obliques sit at the sides. They rotate your trunk, bend it sideways and also resist rotation.",
        "The transversus abdominis is the deepest layer. It wraps around your stomach like a corset and keeps your trunk stable.",
      ],
      after: [
        "Your abs bend and rotate your trunk, but their most important job is stabilising: keeping your trunk firm when you lift, walk or push something. That's why this list also includes exercises in which you deliberately don't move, such as the plank, the dead bug and the Pallof press.",
      ],
    },
    exercises: {
      title: "The 10 best ab exercises",
      paragraphs: [
        "The first exercises are the easiest to learn properly. Choose 4 to 6 per workout, with a mix of holding still, bending and resisting rotation. Work slowly and under control: speed doesn't make an ab exercise better.",
      ],
      items: exercises([
        {
          name: "Plank",
          focus: "rectus abdominis, transversus abdominis and the whole core",
          steps: [
            "Rest on your forearms and toes, with your elbows directly under your shoulders.",
            "Make a straight line from head to heels.",
            "Brace your stomach and glutes and draw your ribs slightly towards your pelvis. Keep breathing calmly.",
          ],
          dose: "3 holds of 20–45 seconds",
          mistake: "Your hips sag and your lower back arches. Squeeze your glutes or drop to your knees; 20 good seconds beat 2 minutes with an arched back.",
          variation: "Easier: on your knees. Harder: lift one foot a few centimetres at a time.",
        },
        {
          name: "Side plank",
          focus: "obliques and the side of your hip",
          steps: [
            "Lie on your side and rest on your forearm, with your elbow under your shoulder.",
            "Stack your feet, or place your top foot in front of the bottom one.",
            "Push your hips up until your body forms a straight line from head to feet.",
            "Hold, then switch sides.",
          ],
          dose: "2–3 holds of 15–30 seconds per side",
          mistake: "Your hips drop or rotate backwards. Push your top hip slightly forwards and up.",
          variation: "Easier: with your knees bent, resting on your bottom knee.",
        },
        {
          name: "Dead bug",
          focus: "transversus and rectus abdominis, core stability",
          steps: [
            "Lie on your back with your arms pointing straight up and your hips and knees bent at 90 degrees.",
            "Gently press your lower back into the floor.",
            "Slowly extend your right arm back and your left leg forwards, until just above the floor.",
            "Come back and switch sides.",
          ],
          dose: "2–3 sets of 6–10 reps per side",
          mistake: "Your lower back lifts off the floor. Extend your arm and leg less far and go more slowly.",
          variation: "Easier: move only your legs and tap your heel on the floor. Harder: hold a light dumbbell in your hands.",
        },
        {
          name: "Bird dog",
          focus: "core stability, lower back and glutes",
          steps: [
            "Get on your hands and knees, with your hands under your shoulders and your knees under your hips.",
            "At the same time, extend your right arm forwards and your left leg back, until they're in line with your trunk.",
            "Keep your hips level and your back still, as if there's a glass of water on it. Hold for 2 seconds.",
            "Come back and switch sides.",
          ],
          dose: "2–3 sets of 6–10 reps per side",
          mistake: "You swing your leg too high, so your lower back arches and your hip tilts. Only extend your leg to hip height.",
        },
        {
          name: "Crunch",
          focus: "rectus abdominis",
          steps: [
            "Lie on your back with your knees bent and your feet flat on the floor.",
            "Place your fingertips behind your ears or cross your arms over your chest.",
            "Breathe out and curl your shoulders and upper back a few centimetres off the floor, by drawing your ribs towards your pelvis.",
            "Roll back down slowly.",
          ],
          dose: "2–3 sets of 10–20 reps",
          mistake: "You pull on your head and neck. Keep a fist's width between your chin and your chest and let your abs do the work.",
        },
        {
          name: "Reverse crunch",
          focus: "rectus abdominis, with the movement starting from your pelvis",
          steps: [
            "Lie on your back with your arms by your sides and your hips and knees bent at 90 degrees.",
            "Draw your knees towards your chest and curl your pelvis a few centimetres off the floor.",
            "Slowly lower your hips until your lower back is back on the floor.",
          ],
          dose: "2–3 sets of 8–15 reps",
          mistake: "You swing your legs and use momentum. Keep the movement slow and small: it's all about curling your pelvis up.",
        },
        {
          name: "Pallof press (with a resistance band)",
          focus: "obliques and transversus abdominis: resisting rotation",
          steps: [
            "Anchor a resistance band at chest height to something sturdy, such as a post or a door with a door anchor. Stand side-on to it.",
            "Hold the band against your breastbone with both hands and step sideways until the band is taut.",
            "Press your hands straight out in front of you. The band wants to rotate you towards it; keep your trunk still.",
            "Hold for 2 seconds, bring your hands back and switch sides after the set.",
          ],
          dose: "2–3 sets of 8–12 reps per side",
          mistake: "You rotate with the band or lean away. Stand firmly with your feet hip-width apart and choose a lighter band or stand closer.",
          variation: "At the gym, you can also do this exercise on the cable machine.",
        },
        {
          name: "Mountain climbers",
          focus: "abs, shoulders and fitness",
          steps: [
            "Start in a push-up position with your hands under your shoulders and a straight line from head to heels.",
            "Draw your right knee towards your chest and put your foot back.",
            "Do the same with your left and alternate at a steady pace. Only speed up if your trunk stays still.",
          ],
          dose: "2–3 rounds of 20–40 seconds",
          mistake: "Your hips rise and your feet bounce. Keep your hips low and your shoulders over your hands.",
          variation: "Easier: with your hands on a bench or chair, stepping instead of jumping.",
        },
        {
          name: "Hollow hold",
          focus: "rectus and transversus abdominis",
          steps: [
            "Lie on your back and press your lower back into the floor.",
            "Lift your shoulders, arms and legs slightly off the floor. Your body forms a gentle banana shape.",
            "Hold and keep breathing calmly, while your lower back stays on the floor.",
          ],
          dose: "3 holds of 15–30 seconds",
          mistake: "Your lower back lifts off the floor. Bend your knees and keep your arms by your sides; only extend further once you can.",
          variation: "This is a challenging exercise. Start with your knees bent and your arms by your sides.",
        },
        {
          name: "Leg raises (carefully)",
          focus: "rectus abdominis and hip flexors",
          steps: [
            "Lie on your back with your legs straight and your hands beside or slightly under your glutes.",
            "Press your lower back into the floor and slowly lift your legs until they point straight up.",
            "Lower them very slowly, only as far as your lower back stays on the floor.",
          ],
          dose: "2–3 sets of 6–12 reps",
          mistake: "You lower your legs too far, so your lower back arches and takes a lot of strain. Lower them less far or bend your knees.",
          variation: "Lower back trouble? Choose the reverse crunch or the dead bug instead.",
        },
      ]),
    },
    routine: {
      title: "A 10-minute ab routine",
      paragraphs: [
        "You can do this routine at home, without equipment. You do 5 exercises of 40 seconds with 20 seconds' rest, for 2 rounds. Start with a 2 to 3-minute warm-up: march on the spot, do some arm circles and a few cat-cows (on your hands and knees, slowly arching and rounding your back).",
      ],
      head: ["Exercise", "Work", "Rest"],
      rows: [
        ["1. Dead bug", "40 sec", "20 sec"],
        ["2. Plank", "40 sec", "20 sec"],
        ["3. Reverse crunch", "40 sec", "20 sec"],
        ["4. Side plank (20 sec per side)", "40 sec", "20 sec"],
        ["5. Bird dog", "40 sec", "20 sec"],
      ],
      note: "Then do all 5 exercises once more: 10 minutes in total, plus the warm-up.",
      after: [
        "Beginner? Do 30 seconds of work and 30 seconds of rest. More experienced? Swap the plank for a hollow hold and the bird dog for mountain climbers, or add a third round.",
      ],
    },
    frequency: {
      title: "How often should you do ab exercises?",
      paragraphs: [
        "2 to 3 times a week is enough. You can do a 10 to 15-minute routine on its own or tack it onto the end of a strength workout. You don't need to train every day: your abs also need recovery to get stronger.",
        "Your core also works hard in exercises such as squats, deadlifts, lunges and push-ups. If you already train your whole body 2 to 3 times a week, a few extra ab exercises are a nice addition, not a must.",
        "Make it harder step by step: hold an exercise for longer (up to around 60 seconds), do more reps (up to around 20) or choose a harder variation.",
      ],
    },
    sixpack: {
      title: "Six-pack: why ab exercises alone aren't enough",
      paragraphs: [
        "Everyone has abs, but whether you can see them mainly depends on the layer of fat on top. Ab exercises make your abs stronger, but they don't burn the fat on your stomach. Spot reduction doesn't exist: your body decides where it loses fat first, and that's different for everyone.",
        "If you want to see your abs, your body fat percentage needs to come down. For men, they often become visible at around 10 to 12 per cent, for women at around 16 to 20 per cent, but that varies a lot from person to person. Body fat that low isn't necessary for everyone, nor always easy or healthy to maintain.",
        "You lose fat with a small calorie deficit, enough protein and strength training for your whole body. Think in months, not weeks.",
      ],
      fatLink: "Calculate your body fat percentage",
      kcalLink: "Calculate your calorie needs",
    },
    mistakes: {
      title: "Common mistakes with ab exercises",
      bullets: [
        "Going too fast: with momentum, your hip flexors and neck do the work. Slow and controlled is harder for your abs.",
        "Holding your breath: breathe out as you brace or curl up, and keep breathing calmly in exercises you hold.",
        "An arched lower back in the plank, hollow hold or leg raises: switch to an easier variation as soon as your back starts to arch.",
        "Only doing crunches: also include exercises in which your trunk stays still, such as the plank, dead bug and Pallof press.",
        "Holding on endlessly: 3 holds of 30 seconds with good technique beat one 5-minute plank in which you sag.",
        "Expecting your belly fat to disappear: for that, what you eat matters more than the number of crunches.",
      ],
    },
    pregnancy: {
      title: "Training your abs after pregnancy",
      paragraphs: [
        "During pregnancy, your abdominal muscles stretch a lot. In many women, the two sides of the rectus abdominis separate in the middle; this is called diastasis recti. It often largely recovers by itself, but not always.",
        "Have you given birth? Have your midwife, GP or a (pelvic floor) physiotherapist assess first whether and when you can train your abs intensively again. A pelvic floor physiotherapist can also give you exercises that suit your recovery. Do you see a bulge down the middle of your stomach when you do a crunch, or do you have pelvic floor problems? Have it checked before you carry on.",
        "Are you pregnant? Check with your midwife which exercises are suitable for you.",
      ],
    },
    safety: {
      title: "Training your abs safely",
      noteTitle: "Please note",
      note: [
        "Do a short warm-up of 2 to 5 minutes first.",
        "Pain is a signal to stop. A burning feeling in your abs is normal; pain in your back, neck or groin is not.",
        "Do you have back problems, a herniated disc, a hernia or another injury, do you have heart problems, are you pregnant or have you recently given birth, or are you 65 or older and starting a new exercise programme? Check with your GP or physiotherapist first.",
      ],
    },
    planTitle: "Abs as part of a complete plan",
    planText:
      "Separate ab exercises are a nice addition, but a plan for your whole body gets you further. Your personal workout plan includes strength and core exercises at your level, with sets, reps, technique tips and 4 weeks of progression. It's put together based on your answers.",
    planCta: "See the workout plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How often a week should you do ab exercises?",
        a: "2 to 3 times a week for 10 to 15 minutes is enough. Like other muscles, your abs need recovery. If you already train your whole body with exercises such as squats and deadlifts, your core works hard there too.",
      },
      {
        q: "Can you get rid of belly fat with ab exercises?",
        a: "No. Ab exercises make your abs stronger, but they don't specifically burn the fat on your stomach. You lose fat across your whole body, with a calorie deficit. Where it goes first varies from person to person.",
      },
      {
        q: "What is the best ab exercise?",
        a: "There isn't one best exercise. A good mix includes an exercise in which you hold still (plank or dead bug), one in which you resist rotation (side plank or Pallof press) and one in which you bend (crunch or reverse crunch). For beginners, the dead bug and the plank are a great start.",
      },
      {
        q: "How long should you hold a plank?",
        a: "As long as you can hold it with good technique: for most people, 20 to 60 seconds. Rather do 3 good holds of 30 seconds than one very long one with a sagging back. Is 60 seconds easy? Then choose a harder variation.",
      },
      {
        q: "Are crunches bad for your back?",
        a: "For most people without back problems, slow, small crunches are fine. If you have back problems, start with exercises such as the dead bug and bird dog, and check with your GP or physiotherapist which exercises suit you.",
      },
      {
        q: "Can you do ab exercises every day?",
        a: "You can if you keep it light, but it isn't necessary. A short, challenging routine 2 to 3 times a week trains your abs well and leaves time for recovery.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function BuikspieroefeningenPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.muscles.title} paragraphs={c.muscles.paragraphs} bullets={c.muscles.bullets}>
          <Paragraphs items={c.muscles.after} />
        </Section>

        <Section title={c.exercises.title} paragraphs={c.exercises.paragraphs}>
          <ExerciseList l={l} items={c.exercises.items} />
        </Section>

        <Section title={c.routine.title} paragraphs={c.routine.paragraphs}>
          <DataTable head={c.routine.head} rows={c.routine.rows} note={c.routine.note} minWidth="22rem" />
          <Paragraphs items={c.routine.after} />
        </Section>

        <Section title={c.frequency.title} paragraphs={c.frequency.paragraphs} />

        <Section title={c.sixpack.title} paragraphs={c.sixpack.paragraphs}>
          <div className="flex flex-col items-start gap-3">
            <ArrowLink href="/vetpercentage-berekenen">{c.sixpack.fatLink}</ArrowLink>
            <ArrowLink href="/caloriebehoefte-berekenen">{c.sixpack.kcalLink}</ArrowLink>
          </div>
        </Section>

        <Section title={c.mistakes.title} bullets={c.mistakes.bullets} />

        <Section title={c.pregnancy.title} paragraphs={c.pregnancy.paragraphs} />

        <Section title={c.safety.title}>
          <SafetyNote title={c.safety.noteTitle} items={c.safety.note} />
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/trainingsschema" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/vetpercentage-berekenen", "/krachttraining-thuis", "/full-body-workout", "/hiit-training"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}
