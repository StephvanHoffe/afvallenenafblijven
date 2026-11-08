import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { ExerciseList, Paragraphs, SafetyNote, type Exercise } from "@/components/content/ExerciseList";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/krachttraining-thuis";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const exercises = (items: Exercise[]) => items;

const copy = defineCopy({
  nl: {
    metaTitle: "Krachttraining thuis: schema voor beginners (ook vrouwen)",
    metaDescription:
      "Krachttraining thuis, met of zonder materiaal: een full body schema voor beginners, 2 tot 3 keer per week. Met sets, herhalingen, opbouw en uitleg voor vrouwen.",
    eyebrow: "Bewegen en trainen",
    h1: "Krachttraining thuis:",
    h1Accent: "een schema voor beginners",
    intro:
      "Je hebt geen sportschool nodig om sterker te worden. Met je eigen lichaamsgewicht, een rugzak of een paar dumbbells kun je thuis prima trainen. Hieronder vind je een compleet beginnersschema, uitleg per oefening en hoe je het elke week een stapje zwaarder maakt.",
    short:
      "Train thuis 2 tot 3 keer per week je hele lichaam, met minstens een dag rust ertussen. Doe 7 basisoefeningen, zoals squats, lunges, push-ups, een glute bridge, roeien met een rugzak, een plank en de dead bug, elk 2 tot 3 sets van 8 tot 15 herhalingen met 60 tot 90 seconden rust. Zo ben je in 30 tot 40 minuten klaar, inclusief 5 minuten warming-up. Wordt het makkelijk, doe dan eerst meer herhalingen, daarna een zwaardere variant en pas dan meer gewicht.",
    equipment: {
      title: "Wat heb je nodig voor krachttraining thuis?",
      paragraphs: ["Weinig. Begin gerust zonder materiaal en koop pas iets als de oefeningen te makkelijk worden."],
      bullets: [
        "Niets: met je eigen lichaamsgewicht, een stevige stoel of bank en een rugzak met boeken of flessen water kun je alle oefeningen uit dit schema doen.",
        "Weerstandsbanden: goedkoop, licht en makkelijk op te bergen. Neem een set met verschillende sterktes; een band met handvatten is handig voor roeien.",
        "Dumbbells: handig om zwaarder te trainen. Verstelbare dumbbells groeien mee als je sterker wordt. Kies een gewicht waarmee je 10 tot 12 herhalingen haalt en er nog 2 à 3 over hebt.",
        "Een matje: voor de oefeningen op de grond, zoals de plank en de dead bug.",
      ],
    },
    plan: {
      title: "Beginnersschema: full body krachttraining thuis",
      paragraphs: [
        "Dit schema traint je hele lichaam in één keer: benen, billen, borst, rug, schouders en romp. Doe de oefeningen in deze volgorde en rust tussen de sets. Begin de eerste 2 weken met 2 sets per oefening en ga daarna naar 3.",
        "Begin altijd met een warming-up van 5 minuten: een paar minuten marcheren op de plek of traplopen, armcirkels, 10 rustige ondiepe squats en 5 push-ups tegen de muur. Zo worden je spieren en gewrichten warm en voel je meteen hoe je lichaam er die dag bij staat.",
      ],
      head: ["Oefening", "Sets", "Herhalingen", "Rust"],
      rows: [
        ["Squat of stoelsquat", "2–3", "10–15", "60–90 sec"],
        ["Split squat of lunge", "2–3", "8–12 per been", "60–90 sec"],
        ["Push-up (aanrecht, knieën of vloer)", "2–3", "6–15", "60–90 sec"],
        ["Glute bridge of hip thrust", "2–3", "12–15", "60 sec"],
        ["Roeien met rugzak, dumbbell of band", "2–3", "10–15", "60–90 sec"],
        ["Plank", "2–3", "20–45 sec", "45–60 sec"],
        ["Dead bug", "2–3", "6–10 per kant", "45–60 sec"],
      ],
      note: "Totale duur: zo'n 30 tot 40 minuten, inclusief warming-up.",
    },
    exercises: {
      title: "De oefeningen: zo doe je ze",
      paragraphs: ["Neem de tijd om de techniek goed te leren. Een rustige, gecontroleerde herhaling is meer waard dan een snelle met een rukje."],
      items: exercises([
        {
          name: "Squat (of stoelsquat)",
          focus: "bovenbenen, billen en romp",
          steps: [
            "Ga staan met je voeten iets breder dan je heupen, tenen licht naar buiten.",
            "Duw je heupen naar achteren en buig je knieën, alsof je op een stoel gaat zitten. Houd je borst omhoog.",
            "Zak zo diep als je kunt met een rechte rug en je hielen op de grond.",
            "Duw jezelf via je hele voet weer omhoog.",
          ],
          dose: "2–3 sets van 10–15 herhalingen",
          mistake: "Je knieën vallen naar binnen. Duw ze bewust in de richting van je tenen.",
          variation:
            "Makkelijker: ga echt even zitten op een stoel en sta weer op (stoelsquat). Zwaarder: houd een dumbbell of gevulde rugzak voor je borst (goblet squat).",
        },
        {
          name: "Split squat of lunge",
          focus: "bovenbenen en billen, één been tegelijk",
          steps: [
            "Zet één voet een grote stap naar voren en de andere naar achteren, op je tenen.",
            "Zak recht naar beneden tot je achterste knie net boven de grond is.",
            "Houd je romp rechtop en je voorste knie boven je voet.",
            "Duw je omhoog via je voorste hiel. Doe alle herhalingen en wissel dan van been.",
          ],
          dose: "2–3 sets van 8–12 herhalingen per been",
          mistake: "Je stap is te kort, waardoor je voorste hiel loskomt. Maak de stap groter, zodat je hele voet blijft staan.",
          variation: "Makkelijker: houd je vast aan een stoel of muur. Zwaarder: neem dumbbells in je handen, of stap bij elke herhaling naar voren (lunge).",
        },
        {
          name: "Push-up (tegen het aanrecht of op je knieën)",
          focus: "borst, schouders, armen en romp",
          steps: [
            "Zet je handen iets breder dan je schouders op het aanrecht, een bank of de vloer.",
            "Maak een rechte lijn van hoofd tot hielen (of knieën) en span je buik en billen aan.",
            "Zak gecontroleerd tot je borst bijna het steunpunt raakt, met je ellebogen schuin naar achteren (zo'n 45 graden).",
            "Duw jezelf weer omhoog tot je armen gestrekt zijn.",
          ],
          dose: "2–3 sets van 6–15 herhalingen",
          mistake: "Je heupen zakken door of steken omhoog. Span je buik en billen aan en kies zo nodig een hoger steunpunt.",
          variation: "Hoe hoger je handen staan, hoe makkelijker. Bouw op van aanrecht naar bank, dan op je knieën op de vloer en daarna op je tenen.",
        },
        {
          name: "Glute bridge of hip thrust",
          focus: "billen en achterkant bovenbenen",
          steps: [
            "Ga op je rug liggen met gebogen knieën en je voeten plat op de grond, op heupbreedte.",
            "Duw via je hielen je heupen omhoog tot je een rechte lijn hebt van knieën tot schouders.",
            "Knijp bovenaan 1 seconde je billen samen.",
            "Laat je heupen rustig zakken.",
          ],
          dose: "2–3 sets van 12–15 herhalingen",
          mistake: "Je duwt je onderrug hol in plaats van je heupen omhoog. Stop als je lichaam een rechte lijn is en span je billen aan.",
          variation: "Zwaarder: leg een dumbbell of rugzak op je heupen, doe hem op één been, of leg je schouders op de bank (hip thrust).",
        },
        {
          name: "Roeien met rugzak, dumbbell of weerstandsband",
          focus: "rug, achterkant schouders en biceps",
          steps: [
            "Buig vanuit je heupen voorover met een rechte rug en licht gebogen knieën. Steun eventueel met één hand op een stoel.",
            "Houd een gevulde rugzak of dumbbell vast, of de uiteinden van een band die om een stevig punt of onder je voeten zit.",
            "Trek je elleboog langs je lichaam naar achteren, richting je heup, en knijp je schouderblad naar achteren.",
            "Laat rustig zakken tot je arm weer gestrekt is.",
          ],
          dose: "2–3 sets van 10–15 herhalingen (per arm als je één arm gebruikt)",
          mistake: "Je trekt met een ronde rug en een rukje. Houd je rug recht en beweeg rustig; neem liever iets minder gewicht.",
          variation: "Zwaarder: meer gewicht in de rugzak, een zwaardere dumbbell of een sterkere band.",
        },
        {
          name: "Plank",
          focus: "buikspieren en romp",
          steps: [
            "Steun op je onderarmen en tenen, ellebogen onder je schouders.",
            "Maak een rechte lijn van hoofd tot hielen.",
            "Span je buik en billen aan en adem rustig door.",
          ],
          dose: "2–3 keer 20–45 seconden",
          mistake: "Je heupen hangen door, waardoor je onderrug hol wordt. Span je billen aan of ga op je knieën.",
          variation: "Makkelijker: op je knieën of met je handen op een bank. Zwaarder: houd langer vol (tot 60 seconden) of til afwisselend een voet op.",
        },
        {
          name: "Dead bug",
          focus: "diepe buikspieren en rompstabiliteit",
          steps: [
            "Lig op je rug met je armen recht omhoog en je heupen en knieën 90 graden gebogen.",
            "Druk je onderrug zacht tegen de vloer.",
            "Strek langzaam je rechterarm naar achteren en je linkerbeen naar voren, tot net boven de grond.",
            "Kom terug en wissel van kant.",
          ],
          dose: "2–3 sets van 6–10 herhalingen per kant",
          mistake: "Je onderrug komt los van de vloer. Strek je arm en been dan minder ver en ga langzamer.",
        },
      ]),
      more: "Meer oefeningen voor je romp",
    },
    week: {
      title: "Hoe vaak per week en hoe lang?",
      paragraphs: [
        "Train 2 tot 3 keer per week, met steeds minstens een dag rust tussen twee trainingen. Op die rustdagen herstellen je spieren, en daar word je sterker van. Wandelen of fietsen kan op die dagen gewoon.",
      ],
      head: ["Dag", "3 keer per week", "2 keer per week"],
      rows: [
        ["Maandag", "Training", "Training"],
        ["Dinsdag", "Wandelen of rust", "Wandelen of rust"],
        ["Woensdag", "Training", "Wandelen of rust"],
        ["Donderdag", "Wandelen of rust", "Training"],
        ["Vrijdag", "Training", "Wandelen of rust"],
        ["Zaterdag", "Actief: wandelen, fietsen", "Actief: wandelen, fietsen"],
        ["Zondag", "Rust", "Rust"],
      ],
      note: "Een training duurt 30 tot 40 minuten. Weinig tijd? Doe dan 2 sets per oefening.",
    },
    rpe: {
      title: "Hoe zwaar moet het voelen? RPE uitgelegd",
      paragraphs: [
        "RPE staat voor rate of perceived exertion: hoe zwaar een set voelt, op een schaal van 1 tot 10. Bij krachttraining let je vooral op hoeveel herhalingen je nog had kunnen doen met goede techniek.",
      ],
      head: ["RPE", "Zo voelt het", "Herhalingen over"],
      rows: [
        ["5–6", "Pittig, maar je kunt nog veel meer", "4 of meer"],
        ["7", "Zwaar, je techniek blijft goed", "3"],
        ["8", "Heel zwaar", "2"],
        ["9", "Bijna niets meer over", "1"],
        ["10", "Echt alles gegeven", "0"],
      ],
      after: [
        "Als beginner richt je je de eerste weken op RPE 6 tot 7: je stopt terwijl je er nog 3 à 4 had gekund. Daarna werk je naar RPE 7 tot 8. Tot het uiterste gaan (RPE 10) is niet nodig en vergroot de kans op slordige herhalingen.",
      ],
    },
    progress: {
      title: "Zo maak je het zwaarder: progressie in 3 stappen",
      paragraphs: [
        "Je spieren worden alleen sterker als je ze steeds iets meer laat doen dan ze gewend zijn. Dat heet progressie (of progressive overload). Thuis doe je dat in deze volgorde:",
      ],
      bullets: [
        "Eerst meer herhalingen: haal je bij alle sets de bovenkant van het bereik met goede techniek, bijvoorbeeld 15 squats? Dan is het tijd voor de volgende stap.",
        "Dan een zwaardere variant: van stoelsquat naar squat en dan naar split squat, of van push-ups tegen het aanrecht naar push-ups op je knieën en dan op je tenen. Begin weer onderaan het bereik.",
        "Daarna meer gewicht: meer boeken in je rugzak, zwaardere dumbbells of een sterkere band.",
        "Ook mogelijk: een extra set, langzamer zakken (3 seconden) of een pauze van 1 seconde onderin.",
      ],
      after: [
        "Probeer elke week 1 of 2 herhalingen meer te doen dan de week ervoor. Schrijf op wat je doet, in een notitieboekje of op je telefoon, zodat je ziet dat je vooruitgaat.",
      ],
    },
    women: {
      title: "Krachttraining voor vrouwen",
      paragraphs: [
        "Krachttraining is net zo goed voor vrouwen als voor mannen. Je doet dezelfde oefeningen, sets en herhalingen; alleen het gewicht stem je af op jouw kracht. Waarom het de moeite waard is:",
      ],
      bullets: [
        "Sterkere spieren: vanaf ongeveer je dertigste neemt je spiermassa langzaam af als je hem niet gebruikt. Met krachttraining houd je die vast of bouw je juist op.",
        "Sterkere botten: krachttraining belast je botten, en die prikkel helpt ze sterk te houden. Dat is extra belangrijk rond en na de overgang, als je botdichtheid sneller afneemt.",
        "Makkelijker in het dagelijks leven: tillen, traplopen, kinderen optillen en boodschappen sjouwen gaan makkelijker.",
        "Hulp bij afvallen: krachttraining helpt je spieren te behouden terwijl je afvalt, zodat je vooral vet verliest.",
      ],
      after: [
        "En die angst om 'bulky' of breed te worden? Die is voor bijna iedereen onterecht. Veel spiermassa opbouwen kost jaren van zwaar en gericht trainen, met bewust extra eten. Vrouwen hebben bovendien veel minder testosteron dan mannen, waardoor spieren minder snel in omvang groeien. Wat je wel merkt: je wordt sterker en je lichaam voelt steviger aan.",
        "Ben je zwanger of ben je net bevallen? Overleg dan eerst met je verloskundige, huisarts of een (bekken)fysiotherapeut welke oefeningen voor jou veilig zijn.",
      ],
      link: "Lees meer over afvallen in de overgang",
    },
    weightLoss: {
      title: "Krachttraining thuis om af te vallen",
      paragraphs: [
        "Tijdens een krachttraining verbrand je minder calorieën dan je misschien denkt. Afvallen doe je vooral met je eten: een klein calorietekort van zo'n 300 tot 500 kcal per dag.",
        "Toch is krachttraining belangrijk als je afvalt. Zonder die prikkel verlies je naast vet ook spiermassa. Met 2 tot 3 keer per week trainen en genoeg eiwit geef je je lichaam een reden om je spieren te houden. Veel wandelen zorgt daarnaast voor extra verbruik.",
      ],
      link: "Bereken je caloriebehoefte",
    },
    safety: {
      title: "Veilig trainen: warming-up, pijn en wanneer eerst naar de huisarts",
      paragraphs: ["Krachttraining thuis is voor de meeste mensen goed te doen, zeker als je rustig opbouwt. Let wel op deze punten:"],
      noteTitle: "Let op",
      note: [
        "Doe altijd eerst een warming-up van 5 minuten.",
        "Pijn is een signaal om te stoppen. Spierpijn een dag of twee later is normaal; scherpe pijn of pijn in een gewricht tijdens een oefening niet.",
        "Houd je adem niet in: adem uit als je duwt of omhoogkomt, adem in als je zakt.",
        "Heb je een blessure, pijnklachten of hartproblemen, ben je zwanger of net bevallen, of ben je 65 of ouder en begin je met een nieuw trainingsprogramma? Overleg dan eerst met je huisarts of fysiotherapeut.",
      ],
    },
    planTitle: "Liever een schema dat met je meegroeit?",
    planText:
      "Je persoonlijke trainingsschema wordt samengesteld op basis van je antwoorden: je niveau, je materiaal (thuis zonder of met materiaal, of de sportschool) en hoeveel tijd je hebt. Met sets, herhalingen en RPE per oefening, techniektips en 4 weken opbouw.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Kun je thuis spieren opbouwen zonder sportschool?",
        a: "Ja. Je spieren reageren op de belasting, niet op de plek. Zolang je het steeds iets zwaarder maakt, met meer herhalingen, een moeilijkere variant of meer gewicht, kun je thuis ook sterker worden. Met dumbbells of weerstandsbanden kun je langer blijven opbouwen dan met alleen je lichaamsgewicht.",
      },
      {
        q: "Hoe vaak per week moet je krachttraining doen?",
        a: "Voor beginners is 2 tot 3 keer per week een full body training een goede basis, met minstens een dag rust ertussen. Met twee keer per week kun je al goed vooruitgaan; met drie keer train je elke spiergroep wat vaker.",
      },
      {
        q: "Hoe lang duurt een krachttraining thuis?",
        a: "Met 7 oefeningen van 2 tot 3 sets ben je zo'n 30 tot 40 minuten bezig, inclusief warming-up. Heb je minder tijd? Doe dan 2 sets, of kies 5 oefeningen: squat, push-up, roeien, glute bridge en plank.",
      },
      {
        q: "Word je als vrouw breed van krachttraining?",
        a: "Nee, dat gebeurt niet zomaar. Veel spiermassa opbouwen kost jaren gericht trainen en bewust extra eten, en vrouwen hebben veel minder testosteron dan mannen. Wat je wel merkt: je wordt sterker en je lichaam voelt steviger.",
      },
      {
        q: "Welke dumbbells moet ik kopen als beginner?",
        a: "Kies een gewicht waarmee je 10 tot 12 herhalingen haalt en er nog 2 à 3 over hebt. Voor benen en rug kun je meestal zwaarder dan voor schouders en armen. Verstelbare dumbbells zijn handig, omdat je het gewicht kunt verhogen als je sterker wordt.",
      },
      {
        q: "Mag je elke dag krachttraining doen?",
        a: "Je hele lichaam elke dag zwaar trainen is niet nodig en geeft je spieren te weinig tijd om te herstellen. Houd minstens een dag rust tussen twee full body trainingen. Op de dagen ertussen kun je wel gewoon wandelen of fietsen.",
      },
    ],
  },
  en: {
    metaTitle: "Strength training at home: a beginner plan (women too)",
    metaDescription:
      "Strength training at home, with or without equipment: a full-body beginner plan, 2 to 3 times a week. With sets, reps, progression and advice for women.",
    eyebrow: "Exercise and training",
    h1: "Strength training at home:",
    h1Accent: "a plan for beginners",
    intro:
      "You don't need a gym to get stronger. With your own body weight, a backpack or a pair of dumbbells, you can train perfectly well at home. Below you'll find a complete beginner plan, instructions for every exercise and how to make it a little harder every week.",
    short:
      "Train your whole body at home 2 to 3 times a week, with at least one rest day in between. Do 7 basic exercises, such as squats, lunges, push-ups, a glute bridge, rows with a backpack, a plank and the dead bug, each for 2 to 3 sets of 8 to 15 reps with 60 to 90 seconds' rest. That takes 30 to 40 minutes, including a 5-minute warm-up. Once it feels easy, first do more reps, then a harder variation and only then add weight.",
    equipment: {
      title: "What do you need for strength training at home?",
      paragraphs: ["Very little. Feel free to start without any equipment and only buy something once the exercises get too easy."],
      bullets: [
        "Nothing: with your own body weight, a sturdy chair or sofa and a backpack filled with books or water bottles, you can do every exercise in this plan.",
        "Resistance bands: cheap, light and easy to store. Get a set with different strengths; a band with handles is handy for rows.",
        "Dumbbells: useful for training heavier. Adjustable dumbbells grow with you as you get stronger. Choose a weight with which you can do 10 to 12 reps and still have 2 or 3 left.",
        "A mat: for the floor exercises, such as the plank and the dead bug.",
      ],
    },
    plan: {
      title: "Beginner plan: full-body strength training at home",
      paragraphs: [
        "This plan trains your whole body in one go: legs, glutes, chest, back, shoulders and core. Do the exercises in this order and rest between sets. Start with 2 sets per exercise for the first 2 weeks, then move up to 3.",
        "Always start with a 5-minute warm-up: a few minutes of marching on the spot or walking up and down the stairs, arm circles, 10 easy shallow squats and 5 push-ups against the wall. That warms up your muscles and joints, and you'll immediately notice how your body feels that day.",
      ],
      head: ["Exercise", "Sets", "Reps", "Rest"],
      rows: [
        ["Squat or chair squat", "2–3", "10–15", "60–90 sec"],
        ["Split squat or lunge", "2–3", "8–12 per leg", "60–90 sec"],
        ["Push-up (worktop, knees or floor)", "2–3", "6–15", "60–90 sec"],
        ["Glute bridge or hip thrust", "2–3", "12–15", "60 sec"],
        ["Row with backpack, dumbbell or band", "2–3", "10–15", "60–90 sec"],
        ["Plank", "2–3", "20–45 sec", "45–60 sec"],
        ["Dead bug", "2–3", "6–10 per side", "45–60 sec"],
      ],
      note: "Total time: around 30 to 40 minutes, including the warm-up.",
    },
    exercises: {
      title: "The exercises: how to do them",
      paragraphs: ["Take your time to learn good technique. A slow, controlled rep is worth more than a quick, jerky one."],
      items: exercises([
        {
          name: "Squat (or chair squat)",
          focus: "thighs, glutes and core",
          steps: [
            "Stand with your feet slightly wider than your hips, toes turned out a little.",
            "Push your hips back and bend your knees, as if you're sitting down on a chair. Keep your chest up.",
            "Lower yourself as far as you can with a straight back and your heels on the floor.",
            "Push yourself back up through your whole foot.",
          ],
          dose: "2–3 sets of 10–15 reps",
          mistake: "Your knees cave inwards. Consciously push them out in the direction of your toes.",
          variation:
            "Easier: actually sit down on a chair for a moment and stand up again (chair squat). Harder: hold a dumbbell or a filled backpack in front of your chest (goblet squat).",
        },
        {
          name: "Split squat or lunge",
          focus: "thighs and glutes, one leg at a time",
          steps: [
            "Take a big step forwards with one foot and put the other foot behind you, on your toes.",
            "Lower straight down until your back knee is just above the floor.",
            "Keep your upper body upright and your front knee over your foot.",
            "Push back up through your front heel. Do all your reps, then switch legs.",
          ],
          dose: "2–3 sets of 8–12 reps per leg",
          mistake: "Your step is too short, so your front heel lifts. Take a bigger step so your whole foot stays on the floor.",
          variation: "Easier: hold on to a chair or the wall. Harder: hold dumbbells, or step forwards with every rep (lunge).",
        },
        {
          name: "Push-up (against the worktop or on your knees)",
          focus: "chest, shoulders, arms and core",
          steps: [
            "Place your hands slightly wider than your shoulders on the kitchen worktop, a bench or the floor.",
            "Make a straight line from head to heels (or knees) and brace your stomach and glutes.",
            "Lower yourself under control until your chest almost touches the surface, elbows angled back (about 45 degrees).",
            "Push yourself back up until your arms are straight.",
          ],
          dose: "2–3 sets of 6–15 reps",
          mistake: "Your hips sag or stick up. Brace your stomach and glutes, and use a higher surface if needed.",
          variation: "The higher your hands, the easier it is. Progress from the worktop to a bench, then to your knees on the floor and then to your toes.",
        },
        {
          name: "Glute bridge or hip thrust",
          focus: "glutes and hamstrings",
          steps: [
            "Lie on your back with your knees bent and your feet flat on the floor, hip-width apart.",
            "Push through your heels to lift your hips until you form a straight line from knees to shoulders.",
            "Squeeze your glutes for 1 second at the top.",
            "Lower your hips slowly.",
          ],
          dose: "2–3 sets of 12–15 reps",
          mistake: "You arch your lower back instead of lifting your hips. Stop when your body forms a straight line and squeeze your glutes.",
          variation: "Harder: rest a dumbbell or backpack on your hips, do it on one leg, or rest your shoulders on the sofa (hip thrust).",
        },
        {
          name: "Row with a backpack, dumbbell or resistance band",
          focus: "back, rear shoulders and biceps",
          steps: [
            "Hinge forwards from your hips with a straight back and slightly bent knees. Support yourself with one hand on a chair if you like.",
            "Hold a filled backpack or a dumbbell, or the ends of a band anchored to something sturdy or under your feet.",
            "Pull your elbow back along your body towards your hip and squeeze your shoulder blade back.",
            "Lower slowly until your arm is straight again.",
          ],
          dose: "2–3 sets of 10–15 reps (per arm if you use one arm)",
          mistake: "You pull with a rounded back and a jerk. Keep your back straight and move slowly; rather use a little less weight.",
          variation: "Harder: more weight in the backpack, a heavier dumbbell or a stronger band.",
        },
        {
          name: "Plank",
          focus: "abs and core",
          steps: [
            "Rest on your forearms and toes, elbows under your shoulders.",
            "Make a straight line from head to heels.",
            "Brace your stomach and glutes and keep breathing calmly.",
          ],
          dose: "2–3 holds of 20–45 seconds",
          mistake: "Your hips sag, so your lower back arches. Squeeze your glutes or drop to your knees.",
          variation: "Easier: on your knees or with your hands on a bench. Harder: hold it longer (up to 60 seconds) or lift one foot at a time.",
        },
        {
          name: "Dead bug",
          focus: "deep abdominal muscles and core stability",
          steps: [
            "Lie on your back with your arms pointing straight up and your hips and knees bent at 90 degrees.",
            "Gently press your lower back into the floor.",
            "Slowly extend your right arm back and your left leg forwards, until just above the floor.",
            "Come back and switch sides.",
          ],
          dose: "2–3 sets of 6–10 reps per side",
          mistake: "Your lower back lifts off the floor. Extend your arm and leg less far and go more slowly.",
        },
      ]),
      more: "More exercises for your core",
    },
    week: {
      title: "How often a week, and for how long?",
      paragraphs: [
        "Train 2 to 3 times a week, always with at least one rest day between two workouts. Your muscles recover on those rest days, and that's what makes you stronger. Walking or cycling on those days is absolutely fine.",
      ],
      head: ["Day", "3 times a week", "2 times a week"],
      rows: [
        ["Monday", "Workout", "Workout"],
        ["Tuesday", "Walk or rest", "Walk or rest"],
        ["Wednesday", "Workout", "Walk or rest"],
        ["Thursday", "Walk or rest", "Workout"],
        ["Friday", "Workout", "Walk or rest"],
        ["Saturday", "Active: walking, cycling", "Active: walking, cycling"],
        ["Sunday", "Rest", "Rest"],
      ],
      note: "A workout takes 30 to 40 minutes. Short on time? Do 2 sets per exercise.",
    },
    rpe: {
      title: "How hard should it feel? RPE explained",
      paragraphs: [
        "RPE stands for rate of perceived exertion: how hard a set feels, on a scale of 1 to 10. In strength training, you mainly look at how many more reps you could have done with good technique.",
      ],
      head: ["RPE", "How it feels", "Reps left"],
      rows: [
        ["5–6", "Challenging, but you could do plenty more", "4 or more"],
        ["7", "Hard, your technique stays good", "3"],
        ["8", "Very hard", "2"],
        ["9", "Almost nothing left", "1"],
        ["10", "Absolutely everything", "0"],
      ],
      after: [
        "As a beginner, aim for RPE 6 to 7 in the first few weeks: you stop while you could still have done 3 or 4 more. After that, work towards RPE 7 to 8. Going all out (RPE 10) isn't necessary and makes sloppy reps more likely.",
      ],
    },
    progress: {
      title: "How to make it harder: progression in 3 steps",
      paragraphs: [
        "Your muscles only get stronger if you keep asking a little more of them than they're used to. That's called progression (or progressive overload). At home, you do it in this order:",
      ],
      bullets: [
        "First, more reps: can you reach the top of the range in every set with good technique, say 15 squats? Then it's time for the next step.",
        "Then a harder variation: from chair squat to squat and then to split squat, or from push-ups against the worktop to push-ups on your knees and then on your toes. Start again at the bottom of the range.",
        "After that, more weight: more books in your backpack, heavier dumbbells or a stronger band.",
        "Also possible: an extra set, lowering more slowly (3 seconds) or a 1-second pause at the bottom.",
      ],
      after: [
        "Try to do 1 or 2 more reps each week than the week before. Write down what you do, in a notebook or on your phone, so you can see your progress.",
      ],
    },
    women: {
      title: "Strength training for women",
      paragraphs: [
        "Strength training is just as good for women as it is for men. You do the same exercises, sets and reps; you simply match the weight to your own strength. Why it's worth it:",
      ],
      bullets: [
        "Stronger muscles: from around your thirties, your muscle mass slowly declines if you don't use it. Strength training helps you keep it, or even build more.",
        "Stronger bones: strength training puts load on your bones, and that stimulus helps keep them strong. That's especially important around and after menopause, when bone density declines faster.",
        "Easier everyday life: lifting, climbing stairs, picking up children and carrying shopping all get easier.",
        "Help with weight loss: strength training helps you keep your muscle while you lose weight, so you mainly lose fat.",
      ],
      after: [
        "And that fear of getting 'bulky'? For almost everyone, it's unfounded. Building a lot of muscle takes years of heavy, focused training, combined with deliberately eating more. Women also have much less testosterone than men, so their muscles grow in size more slowly. What you will notice: you get stronger and your body feels firmer.",
        "Are you pregnant or have you recently given birth? Check with your midwife, GP or a (pelvic floor) physiotherapist first which exercises are safe for you.",
      ],
      link: "Read more about losing weight during menopause",
    },
    weightLoss: {
      title: "Strength training at home to lose weight",
      paragraphs: [
        "A strength workout burns fewer calories than you might think. You mainly lose weight through what you eat: a small calorie deficit of around 300 to 500 kcal a day.",
        "Even so, strength training matters when you're losing weight. Without that stimulus, you lose muscle as well as fat. Training 2 to 3 times a week and eating enough protein gives your body a reason to hold on to your muscle. Plenty of walking adds extra energy use on top.",
      ],
      link: "Calculate your calorie needs",
    },
    safety: {
      title: "Training safely: warm-up, pain and when to see your GP first",
      paragraphs: ["Strength training at home is manageable for most people, especially if you build up gradually. Do keep these points in mind:"],
      noteTitle: "Please note",
      note: [
        "Always do a 5-minute warm-up first.",
        "Pain is a signal to stop. Muscle soreness a day or two later is normal; sharp pain or pain in a joint during an exercise is not.",
        "Don't hold your breath: breathe out as you push or come up, and breathe in as you lower.",
        "Do you have an injury, pain or heart problems, are you pregnant or have you recently given birth, or are you 65 or older and starting a new exercise programme? Check with your GP or physiotherapist first.",
      ],
    },
    planTitle: "Prefer a plan that grows with you?",
    planText:
      "Your personal workout plan is put together based on your answers: your level, your equipment (at home with or without equipment, or at the gym) and how much time you have. With sets, reps and RPE for every exercise, technique tips and 4 weeks of progression.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "Can you build muscle at home without a gym?",
        a: "Yes. Your muscles respond to the load, not the location. As long as you keep making it a little harder, with more reps, a harder variation or more weight, you can get stronger at home too. With dumbbells or resistance bands, you can keep progressing for longer than with body weight alone.",
      },
      {
        q: "How often a week should you do strength training?",
        a: "For beginners, a full-body workout 2 to 3 times a week is a good foundation, with at least one rest day in between. Twice a week already lets you make good progress; three times means you train each muscle group a little more often.",
      },
      {
        q: "How long does a strength workout at home take?",
        a: "With 7 exercises of 2 to 3 sets, it takes around 30 to 40 minutes, including the warm-up. Less time? Do 2 sets, or pick 5 exercises: squat, push-up, row, glute bridge and plank.",
      },
      {
        q: "Will strength training make women bulky?",
        a: "No, that doesn't just happen. Building a lot of muscle takes years of focused training and deliberately eating more, and women have much less testosterone than men. What you will notice: you get stronger and your body feels firmer.",
      },
      {
        q: "Which dumbbells should I buy as a beginner?",
        a: "Choose a weight with which you can do 10 to 12 reps and still have 2 or 3 left. You can usually go heavier for legs and back than for shoulders and arms. Adjustable dumbbells are handy, because you can increase the weight as you get stronger.",
      },
      {
        q: "Can you do strength training every day?",
        a: "Training your whole body hard every day isn't necessary and gives your muscles too little time to recover. Leave at least one rest day between two full-body workouts. On the days in between, walking or cycling is absolutely fine.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function KrachttrainingThuisPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.equipment.title} paragraphs={c.equipment.paragraphs} bullets={c.equipment.bullets} />

        <Section title={c.plan.title} paragraphs={c.plan.paragraphs}>
          <DataTable head={c.plan.head} rows={c.plan.rows} note={c.plan.note} minWidth="32rem" />
        </Section>

        <Section title={c.exercises.title} paragraphs={c.exercises.paragraphs}>
          <ExerciseList l={l} items={c.exercises.items} />
          <ArrowLink href="/buikspieroefeningen">{c.exercises.more}</ArrowLink>
        </Section>

        <Section title={c.week.title} paragraphs={c.week.paragraphs}>
          <DataTable head={c.week.head} rows={c.week.rows} note={c.week.note} minWidth="30rem" />
        </Section>

        <Section title={c.rpe.title} paragraphs={c.rpe.paragraphs}>
          <DataTable head={c.rpe.head} rows={c.rpe.rows} minWidth="26rem" />
          <Paragraphs items={c.rpe.after} />
        </Section>

        <Section title={c.progress.title} paragraphs={c.progress.paragraphs} bullets={c.progress.bullets}>
          <Paragraphs items={c.progress.after} />
        </Section>

        <Section title={c.women.title} paragraphs={c.women.paragraphs} bullets={c.women.bullets}>
          <Paragraphs items={c.women.after} />
          <ArrowLink href="/afvallen-in-de-overgang">{c.women.link}</ArrowLink>
        </Section>

        <Section title={c.weightLoss.title} paragraphs={c.weightLoss.paragraphs}>
          <ArrowLink href="/caloriebehoefte-berekenen">{c.weightLoss.link}</ArrowLink>
        </Section>

        <Section title={c.safety.title} paragraphs={c.safety.paragraphs}>
          <SafetyNote title={c.safety.noteTitle} items={c.safety.note} />
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/start?doel=sterker" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/full-body-workout", "/buikspieroefeningen", "/eiwitten-per-dag", "/hiit-training"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}
