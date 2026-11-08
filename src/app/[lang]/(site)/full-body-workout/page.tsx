import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { Bullets, ExerciseList, Paragraphs, SafetyNote, type Exercise } from "@/components/content/ExerciseList";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/full-body-workout";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const exercises = (items: Exercise[]) => items;

const copy = defineCopy({
  nl: {
    metaTitle: "Full body workout: schema voor de sportschool en thuis",
    metaDescription:
      "Full body workout voor beginners: train je hele lichaam 2 tot 3 keer per week, in de sportschool of thuis. Met oefeningen, sets, een voorbeeldweek en opbouw.",
    eyebrow: "Bewegen en trainen",
    h1: "Full body workout:",
    h1Accent: "je hele lichaam in één training",
    intro:
      "Weinig tijd, maar wel sterker en fitter worden? Met een full body workout train je in één keer al je grote spiergroepen. Ideaal als je 2 of 3 keer per week traint. Hieronder vind je een versie voor de sportschool, een versie voor thuis, een voorbeeldweek en hoe je elke week een stap verder komt.",
    short:
      "Bij een full body workout train je in één training benen, billen, rug, borst, schouders en romp. Doe hem 2 tot 3 keer per week met steeds een rustdag ertussen, bijvoorbeeld op maandag, woensdag en vrijdag. Kies 5 tot 7 oefeningen van 2 tot 4 sets van 6 tot 12 herhalingen met 1 tot 2 minuten rust; dan ben je in 45 tot 60 minuten klaar. Maak het elke week een beetje zwaarder: eerst meer herhalingen, dan meer gewicht.",
    what: {
      title: "Wat is een full body workout?",
      paragraphs: [
        "Een full body workout is een training waarin je je hele lichaam traint, in plaats van één of twee spiergroepen per dag (een split). Je doet per training een paar basisoefeningen die veel spieren tegelijk gebruiken: een squat, een heupbeweging, een duw- en een trekoefening voor je bovenlichaam, iets voor je schouders en een oefening voor je romp.",
        "Omdat je elke spiergroep 2 tot 3 keer per week traint, past een full body schema goed als je niet vaker kunt of wilt trainen. Het is ook een fijne start voor beginners: je oefent de belangrijkste bewegingen vaak, en daardoor gaat je techniek snel vooruit.",
      ],
      head: ["Kenmerk", "Full body", "Split"],
      rows: [
        ["Trainingsdagen per week", "2–3", "4–6"],
        ["Elke spiergroep per week", "2–3 keer", "Meestal 1–2 keer"],
        ["Duur per training", "45–60 min", "45–75 min"],
        ["Training gemist?", "Weinig verlies", "Spiergroep slaat een week over"],
        ["Geschikt voor", "Beginners, weinig tijd", "Gevorderden, meer tijd"],
      ],
    },
    gym: {
      title: "Full body workout in de sportschool",
      paragraphs: [
        "Dit is een complete full body workout met vrije gewichten en de bekendste apparaten. Twijfel je over een oefening? Kies dan de variant aan een apparaat; die is makkelijker om te leren.",
      ],
      head: ["Oefening", "Sets", "Herhalingen", "Rust"],
      rows: [
        ["Squat of leg press", "3", "8–10", "2 min"],
        ["Romanian deadlift", "3", "8–10", "2 min"],
        ["Bankdrukken of dumbbell press", "3", "8–12", "1,5–2 min"],
        ["Lat pulldown of roeien", "3", "10–12", "1,5 min"],
        ["Shoulder press", "2–3", "10–12", "1,5 min"],
        ["Plank", "2–3", "30–45 sec", "1 min"],
      ],
      note: "Eerste 2 tot 4 weken: 2 sets per oefening. Totaal zo'n 45 tot 60 minuten, inclusief warming-up.",
      items: exercises([
        {
          name: "Squat of leg press",
          focus: "bovenbenen, billen en romp",
          steps: [
            "Squat: leg de stang op je bovenrug (niet op je nek), met je voeten op schouderbreedte en je tenen iets naar buiten.",
            "Zak gecontroleerd door je heupen naar achteren te duwen en je knieën te buigen, met je borst omhoog.",
            "Ga zo diep als je kunt met een rechte rug en duw je omhoog via je hele voet.",
            "Leg press: zet je voeten op heupbreedte midden op het plateau en zak tot je knieën ongeveer 90 graden gebogen zijn. Strek je benen zonder je knieën op slot te zetten.",
          ],
          dose: "3 sets van 8–10 herhalingen",
          mistake: "Je knieën vallen naar binnen of je onderrug rondt onderin. Ga minder diep en neem minder gewicht tot je techniek goed is.",
          variation: "Nieuw met squatten? Begin met een goblet squat met één dumbbell voor je borst; die is makkelijker te leren.",
        },
        {
          name: "Romanian deadlift",
          focus: "achterkant bovenbenen, billen en onderrug",
          steps: [
            "Sta rechtop met een stang of twee dumbbells voor je bovenbenen, voeten op heupbreedte en knieën licht gebogen.",
            "Duw je heupen naar achteren en laat het gewicht langs je benen zakken. Houd je rug recht.",
            "Zak tot je een flinke rek voelt achter in je bovenbenen, meestal net onder je knieën.",
            "Duw je heupen naar voren en kom weer rechtop.",
          ],
          dose: "3 sets van 8–10 herhalingen",
          mistake: "Je rug wordt rond en het gewicht komt los van je benen. Houd het gewicht dicht tegen je benen en stop zodra je rug wil krommen.",
        },
        {
          name: "Bankdrukken of dumbbell press",
          focus: "borst, schouders en triceps",
          steps: [
            "Lig op de bank met je voeten plat op de grond en je schouderbladen licht naar achteren en omlaag.",
            "Pak de stang iets breder dan je schouders, of houd twee dumbbells boven je borst.",
            "Laat het gewicht gecontroleerd zakken naar je onderste borst, met je ellebogen schuin (zo'n 45 graden) van je lichaam.",
            "Duw het gewicht weer omhoog tot je armen gestrekt zijn.",
          ],
          dose: "3 sets van 8–12 herhalingen",
          mistake:
            "Je laat de stang op je borst stuiteren of je billen komen van de bank. Zak rustig en houd contact met de bank. Train je zwaar met een stang, gebruik dan een rek met veiligheidssteunen of laat iemand je spotten.",
        },
        {
          name: "Lat pulldown of roeien",
          focus: "rug en biceps",
          steps: [
            "Lat pulldown: pak de stang iets breder dan je schouders en zet je bovenbenen vast onder de rol.",
            "Trek de stang naar je bovenste borst door je ellebogen naar beneden en naar achteren te bewegen.",
            "Laat de stang gecontroleerd terugkomen tot je armen gestrekt zijn.",
            "Roeien aan de kabel of met een dumbbell: trek de handgreep of dumbbell naar je buik of heup en knijp je schouderbladen naar elkaar.",
          ],
          dose: "3 sets van 10–12 herhalingen",
          mistake: "Je leunt ver naar achteren en trekt met een zwaai. Zit rechtop met een lichte leuning naar achteren en beweeg rustig.",
        },
        {
          name: "Shoulder press",
          focus: "schouders en triceps",
          steps: [
            "Zit of sta rechtop met een dumbbell in elke hand op schouderhoogte, of gebruik het apparaat.",
            "Span je buik en billen aan, zodat je onderrug niet hol trekt.",
            "Duw de gewichten omhoog tot je armen bijna gestrekt zijn.",
            "Laat ze gecontroleerd zakken tot schouderhoogte.",
          ],
          dose: "2–3 sets van 10–12 herhalingen",
          mistake: "Je trekt je onderrug hol om het gewicht omhoog te krijgen. Neem minder gewicht of ga zitten met rugsteun.",
        },
        {
          name: "Plank",
          focus: "buikspieren en romp",
          steps: [
            "Steun op je onderarmen en tenen, ellebogen onder je schouders.",
            "Maak een rechte lijn van hoofd tot hielen en span je buik en billen aan.",
            "Adem rustig door en houd de positie vast.",
          ],
          dose: "2–3 keer 30–45 seconden",
          mistake: "Je heupen hangen door. Span je billen aan; lukt dat niet meer, stop de set dan.",
        },
      ]),
      more: "Meer oefeningen voor je buik en romp",
    },
    home: {
      title: "Full body workout thuis",
      paragraphs: [
        "Geen sportschool? Dezelfde bewegingen kun je thuis doen, met dumbbells of een weerstandsband, of met alleen je eigen lichaamsgewicht. Doe 2 tot 3 sets van 10 tot 15 herhalingen; zonder gewicht heb je meestal wat meer herhalingen nodig om het zwaar genoeg te maken.",
      ],
      head: ["Beweging", "Met dumbbells of band", "Zonder materiaal"],
      rows: [
        ["Squat", "Goblet squat", "Squat of stoelsquat"],
        ["Heup", "Romanian deadlift met dumbbells", "Glute bridge"],
        ["Duwen", "Floor press met dumbbells", "Push-up (aanrecht, knieën of vloer)"],
        ["Trekken", "Roeien met dumbbell of band", "Roeien met een gevulde rugzak"],
        ["Schouders", "Shoulder press met dumbbells", "Pike push-up of extra push-ups"],
        ["Romp", "Plank of dead bug", "Plank of dead bug"],
      ],
      link: "Bekijk het schema voor thuis, met uitleg per oefening",
    },
    week: {
      title: "Voorbeeldweek: full body workout 2 of 3 keer per week",
      paragraphs: [
        "Plan je trainingen met steeds een dag rust ertussen. Op die rustdagen herstellen je spieren, en daar word je sterker van. Wandelen of rustig fietsen kan gewoon.",
      ],
      head: ["Dag", "3 keer per week", "2 keer per week"],
      rows: [
        ["Maandag", "Training A", "Training A"],
        ["Dinsdag", "Rust of wandelen", "Rust of wandelen"],
        ["Woensdag", "Training B", "Rust of wandelen"],
        ["Donderdag", "Rust of wandelen", "Training B"],
        ["Vrijdag", "Training A", "Rust of wandelen"],
        ["Zaterdag", "Actief: wandelen, fietsen", "Actief: wandelen, fietsen"],
        ["Zondag", "Rust", "Rust"],
      ],
      after: ["Training A en B zijn twee varianten van dezelfde full body workout. Zo wissel je wat af zonder dat je schema ingewikkeld wordt:"],
      bullets: [
        "Training A: squat, bankdrukken, roeien, shoulder press en plank.",
        "Training B: Romanian deadlift, leg press of lunges, dumbbell press, lat pulldown en dead bug.",
      ],
      end: "Train je 3 keer per week, dan begin je de week erna met training B. Vind je afwisselen lastig? Dan kun je ook elke keer dezelfde training doen.",
    },
    intensity: {
      title: "Hoe zwaar moet het zijn? Sets, herhalingen en rust",
      paragraphs: [
        "Kies een gewicht waarmee je het aantal herhalingen haalt met goede techniek, en waarbij je aan het eind van de set nog 2 à 3 herhalingen over hebt. Dat heet RPE 7 tot 8, op een schaal van 1 tot 10. Als beginner blijf je de eerste weken rond RPE 6 tot 7, zodat je eerst de techniek leert.",
        "Rust 1 tot 2 minuten tussen de sets. Bij zware oefeningen zoals de squat en de Romanian deadlift mag het ook 2 tot 3 minuten zijn. Doe bij je eerste oefening eerst 1 of 2 lichte sets om warm te worden.",
        "Begin met 2 sets per oefening. Gaat dat goed, ga dan na 2 tot 4 weken naar 3 sets.",
      ],
    },
    progress: {
      title: "Progressive overload: zo word je sterker",
      paragraphs: [
        "Progressive overload betekent dat je je spieren elke paar trainingen iets meer laat doen dan ze gewend zijn. Doe je steeds precies hetzelfde, dan heeft je lichaam geen reden meer om zich aan te passen. Een eenvoudige manier is de dubbele progressie:",
      ],
      bullets: [
        "Kies een bereik, bijvoorbeeld 8 tot 12 herhalingen, en een gewicht waarmee je er minstens 8 haalt.",
        "Probeer elke training één herhaling meer te doen, met hetzelfde gewicht.",
        "Haal je bij alle sets 12 herhalingen met goede techniek? Verhoog dan het gewicht met de kleinste stap die er is, meestal 1 tot 2,5 kilo, en begin weer bij 8.",
        "Schrijf je gewichten en herhalingen op, zodat je weet waar je de volgende keer begint.",
      ],
      after: [
        "Lukt het een paar weken op rij niet meer om vooruit te gaan? Kijk dan eerst naar je slaap, je eten en je stress. Soms helpt een lichtere week, waarin je de helft van je sets doet.",
      ],
    },
    weightLoss: {
      title: "Full body workout om af te vallen",
      paragraphs: [
        "Een full body workout is een goede keuze als je wilt afvallen. Je verbrandt er niet extreem veel calorieën mee, maar je geeft je spieren een reden om te blijven. Zo verlies je vooral vet en minder spiermassa.",
        "Het afvallen zelf komt vooral uit je eten: een klein calorietekort en genoeg eiwit. Extra stappen en een korte HIIT-training verhogen je verbruik, maar ze zijn geen vervanging voor een eetpatroon dat bij je doel past.",
      ],
      link: "Bereken hoeveel calorieën je nodig hebt",
    },
    safety: {
      title: "Warming-up en veilig trainen",
      paragraphs: [
        "Begin elke training met 5 tot 10 minuten warming-up: rustig op de crosstrainer, fiets of het roeitoestel, en daarna een paar lichte sets van je eerste oefening.",
      ],
      noteTitle: "Let op",
      note: [
        "Pijn is een signaal om te stoppen. Spierpijn een of twee dagen later is normaal; scherpe pijn of pijn in een gewricht tijdens een oefening niet.",
        "Techniek gaat voor gewicht. Twijfel je, neem dan minder gewicht of kies de variant aan een apparaat.",
        "Houd je adem niet in: adem uit als je duwt of trekt, adem in als je terugkomt.",
        "Heb je een blessure, pijnklachten of hartproblemen, ben je zwanger of net bevallen, of ben je 65 of ouder en begin je met een nieuw trainingsprogramma? Overleg dan eerst met je huisarts of fysiotherapeut.",
      ],
    },
    planTitle: "Je eigen full body schema",
    planText:
      "Je persoonlijke trainingsschema wordt samengesteld op basis van je antwoorden. Met 2 of 3 trainingsdagen is dat meestal een full body opbouw, met oefeningen voor jouw niveau en materiaal, sets, herhalingen en RPE per oefening en 4 weken progressie.",
    planCta: "Bekijk het trainingsschema",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoe vaak per week moet je een full body workout doen?",
        a: "2 tot 3 keer per week, met minstens een dag rust tussen twee trainingen. Met twee keer per week kun je al goed vooruitgaan; met drie keer train je elke spiergroep wat vaker.",
      },
      {
        q: "Kun je elke dag een full body workout doen?",
        a: "Elke dag zwaar trainen is niet verstandig: je spieren hebben ongeveer 48 uur nodig om te herstellen. Wil je vaker bewegen, wandel of fiets dan op de dagen ertussen. Train je 4 dagen of meer, dan past een upper/lower schema vaak beter.",
      },
      {
        q: "Hoe lang duurt een full body workout?",
        a: "In de sportschool zo'n 45 tot 60 minuten, inclusief warming-up. Thuis met je eigen lichaamsgewicht ben je vaak in 30 tot 40 minuten klaar. Weinig tijd? Doe 2 sets per oefening of kies 4 oefeningen: een squat, een heupbeweging, een duw- en een trekoefening.",
      },
      {
        q: "Is full body beter dan een split?",
        a: "Niet per se. Allebei werken, zolang je elke spiergroep genoeg traint en het steeds iets zwaarder maakt. Met 2 tot 3 trainingsdagen is full body vaak handiger, omdat je elke spiergroep dan 2 tot 3 keer per week traint. Train je 4 dagen of meer, dan kan een upper/lower schema of een split prettiger zijn.",
      },
      {
        q: "Kun je afvallen met een full body workout?",
        a: "Een full body workout helpt, omdat je je spieren behoudt terwijl je afvalt. Het afvallen zelf komt vooral uit een klein calorietekort. Combineer je trainingen daarom met een eetpatroon dat bij je doel past en veel dagelijkse beweging.",
      },
      {
        q: "Moet ik cardio doen naast een full body workout?",
        a: "Het hoeft niet, maar het is goed voor je conditie. Veel wandelen is voor de meeste mensen een prima basis. Wil je meer, voeg dan 1 tot 2 keer per week een HIIT-training of een langere fietstocht toe, op een andere dag dan je zware beentraining.",
      },
    ],
  },
  en: {
    metaTitle: "Full body workout: a plan for the gym and at home",
    metaDescription:
      "A full body workout for beginners: train your whole body 2 to 3 times a week, at the gym or at home. With exercises, sets, an example week and how to progress.",
    eyebrow: "Exercise and training",
    h1: "Full body workout:",
    h1Accent: "your whole body in one session",
    intro:
      "Short on time, but want to get stronger and fitter? A full body workout trains all your major muscle groups in one go. Ideal if you train 2 or 3 times a week. Below you'll find a gym version, a home version, an example week and how to take a step forward every week.",
    short:
      "A full body workout trains your legs, glutes, back, chest, shoulders and core in a single session. Do it 2 to 3 times a week, always with a rest day in between, for example on Monday, Wednesday and Friday. Choose 5 to 7 exercises of 2 to 4 sets of 6 to 12 reps with 1 to 2 minutes' rest; that takes 45 to 60 minutes. Make it a little harder every week: first more reps, then more weight.",
    what: {
      title: "What is a full body workout?",
      paragraphs: [
        "A full body workout trains your whole body in one session, instead of one or two muscle groups a day (a split). In each workout, you do a few basic exercises that use lots of muscles at once: a squat, a hip hinge, a push and a pull for your upper body, something for your shoulders and an exercise for your core.",
        "Because you train each muscle group 2 to 3 times a week, a full body plan works well if you can't or don't want to train more often. It's also a great start for beginners: you practise the key movements often, so your technique improves quickly.",
      ],
      head: ["Feature", "Full body", "Split"],
      rows: [
        ["Training days a week", "2–3", "4–6"],
        ["Each muscle group a week", "2–3 times", "Usually 1–2 times"],
        ["Length of a workout", "45–60 min", "45–75 min"],
        ["Missed a workout?", "Little lost", "A muscle group skips a week"],
        ["Suits", "Beginners, little time", "Experienced, more time"],
      ],
    },
    gym: {
      title: "Full body workout at the gym",
      paragraphs: [
        "This is a complete full body workout with free weights and the most common machines. Unsure about an exercise? Choose the machine version; it's easier to learn.",
      ],
      head: ["Exercise", "Sets", "Reps", "Rest"],
      rows: [
        ["Squat or leg press", "3", "8–10", "2 min"],
        ["Romanian deadlift", "3", "8–10", "2 min"],
        ["Bench press or dumbbell press", "3", "8–12", "1.5–2 min"],
        ["Lat pulldown or row", "3", "10–12", "1.5 min"],
        ["Shoulder press", "2–3", "10–12", "1.5 min"],
        ["Plank", "2–3", "30–45 sec", "1 min"],
      ],
      note: "First 2 to 4 weeks: 2 sets per exercise. Around 45 to 60 minutes in total, including the warm-up.",
      items: exercises([
        {
          name: "Squat or leg press",
          focus: "thighs, glutes and core",
          steps: [
            "Squat: rest the bar on your upper back (not on your neck), with your feet shoulder-width apart and your toes turned out slightly.",
            "Lower yourself under control by pushing your hips back and bending your knees, chest up.",
            "Go as deep as you can with a straight back and push back up through your whole foot.",
            "Leg press: place your feet hip-width apart in the middle of the platform and lower until your knees are bent at about 90 degrees. Straighten your legs without locking your knees.",
          ],
          dose: "3 sets of 8–10 reps",
          mistake: "Your knees cave inwards or your lower back rounds at the bottom. Go less deep and use less weight until your technique is right.",
          variation: "New to squatting? Start with a goblet squat, holding one dumbbell in front of your chest; it's easier to learn.",
        },
        {
          name: "Romanian deadlift",
          focus: "hamstrings, glutes and lower back",
          steps: [
            "Stand upright holding a bar or two dumbbells in front of your thighs, feet hip-width apart and knees slightly bent.",
            "Push your hips back and lower the weight along your legs. Keep your back straight.",
            "Lower until you feel a good stretch in the back of your thighs, usually just below your knees.",
            "Drive your hips forwards and stand up straight again.",
          ],
          dose: "3 sets of 8–10 reps",
          mistake: "Your back rounds and the weight drifts away from your legs. Keep the weight close to your legs and stop as soon as your back wants to round.",
        },
        {
          name: "Bench press or dumbbell press",
          focus: "chest, shoulders and triceps",
          steps: [
            "Lie on the bench with your feet flat on the floor and your shoulder blades slightly back and down.",
            "Grip the bar slightly wider than your shoulders, or hold two dumbbells above your chest.",
            "Lower the weight under control to your lower chest, with your elbows angled (about 45 degrees) away from your body.",
            "Press the weight back up until your arms are straight.",
          ],
          dose: "3 sets of 8–12 reps",
          mistake:
            "You bounce the bar off your chest or your glutes lift off the bench. Lower slowly and stay in contact with the bench. Lifting heavy with a bar? Use a rack with safety arms or have someone spot you.",
        },
        {
          name: "Lat pulldown or row",
          focus: "back and biceps",
          steps: [
            "Lat pulldown: grip the bar slightly wider than your shoulders and lock your thighs under the pad.",
            "Pull the bar to your upper chest by driving your elbows down and back.",
            "Let the bar return under control until your arms are straight.",
            "Cable or dumbbell row: pull the handle or dumbbell towards your stomach or hip and squeeze your shoulder blades together.",
          ],
          dose: "3 sets of 10–12 reps",
          mistake: "You lean far back and swing the weight. Sit upright with a slight lean back and move slowly.",
        },
        {
          name: "Shoulder press",
          focus: "shoulders and triceps",
          steps: [
            "Sit or stand upright with a dumbbell in each hand at shoulder height, or use the machine.",
            "Brace your stomach and glutes so your lower back doesn't arch.",
            "Press the weights up until your arms are almost straight.",
            "Lower them under control to shoulder height.",
          ],
          dose: "2–3 sets of 10–12 reps",
          mistake: "You arch your lower back to get the weight up. Use less weight or sit down with back support.",
        },
        {
          name: "Plank",
          focus: "abs and core",
          steps: [
            "Rest on your forearms and toes, elbows under your shoulders.",
            "Make a straight line from head to heels and brace your stomach and glutes.",
            "Keep breathing calmly and hold the position.",
          ],
          dose: "2–3 holds of 30–45 seconds",
          mistake: "Your hips sag. Squeeze your glutes; if you can't any more, end the set.",
        },
      ]),
      more: "More exercises for your abs and core",
    },
    home: {
      title: "Full body workout at home",
      paragraphs: [
        "No gym? You can do the same movements at home, with dumbbells or a resistance band, or with just your own body weight. Do 2 to 3 sets of 10 to 15 reps; without weights, you usually need a few more reps to make it hard enough.",
      ],
      head: ["Movement", "With dumbbells or a band", "No equipment"],
      rows: [
        ["Squat", "Goblet squat", "Squat or chair squat"],
        ["Hip hinge", "Romanian deadlift with dumbbells", "Glute bridge"],
        ["Push", "Dumbbell floor press", "Push-up (worktop, knees or floor)"],
        ["Pull", "Dumbbell or band row", "Row with a filled backpack"],
        ["Shoulders", "Dumbbell shoulder press", "Pike push-up or extra push-ups"],
        ["Core", "Plank or dead bug", "Plank or dead bug"],
      ],
      link: "See the home plan, with instructions for every exercise",
    },
    week: {
      title: "Example week: a full body workout 2 or 3 times a week",
      paragraphs: [
        "Plan your workouts with a rest day in between each time. Your muscles recover on those rest days, and that's what makes you stronger. Walking or easy cycling is fine.",
      ],
      head: ["Day", "3 times a week", "2 times a week"],
      rows: [
        ["Monday", "Workout A", "Workout A"],
        ["Tuesday", "Rest or walk", "Rest or walk"],
        ["Wednesday", "Workout B", "Rest or walk"],
        ["Thursday", "Rest or walk", "Workout B"],
        ["Friday", "Workout A", "Rest or walk"],
        ["Saturday", "Active: walking, cycling", "Active: walking, cycling"],
        ["Sunday", "Rest", "Rest"],
      ],
      after: ["Workouts A and B are two versions of the same full body workout. That way you add some variety without making your plan complicated:"],
      bullets: [
        "Workout A: squat, bench press, row, shoulder press and plank.",
        "Workout B: Romanian deadlift, leg press or lunges, dumbbell press, lat pulldown and dead bug.",
      ],
      end: "If you train 3 times a week, start the following week with workout B. Find alternating a hassle? You can also do the same workout every time.",
    },
    intensity: {
      title: "How hard should it be? Sets, reps and rest",
      paragraphs: [
        "Choose a weight with which you can hit your reps with good technique and still have 2 or 3 reps left at the end of the set. That's RPE 7 to 8, on a scale of 1 to 10. As a beginner, stay around RPE 6 to 7 for the first few weeks so you learn the technique first.",
        "Rest 1 to 2 minutes between sets. For heavy exercises such as the squat and the Romanian deadlift, 2 to 3 minutes is fine too. Do 1 or 2 light sets of your first exercise to warm up.",
        "Start with 2 sets per exercise. If that goes well, move up to 3 sets after 2 to 4 weeks.",
      ],
    },
    progress: {
      title: "Progressive overload: how you get stronger",
      paragraphs: [
        "Progressive overload means asking your muscles to do a little more than they're used to every few workouts. If you always do exactly the same, your body has no reason to adapt. A simple way to do it is double progression:",
      ],
      bullets: [
        "Choose a range, for example 8 to 12 reps, and a weight with which you can do at least 8.",
        "Try to do one more rep each workout, with the same weight.",
        "Can you do 12 reps in every set with good technique? Then increase the weight by the smallest step available, usually 1 to 2.5 kilos, and start again at 8.",
        "Write down your weights and reps, so you know where to start next time.",
      ],
      after: [
        "Not making progress for a few weeks in a row? Look at your sleep, food and stress first. Sometimes a lighter week, in which you do half your sets, helps.",
      ],
    },
    weightLoss: {
      title: "A full body workout to lose weight",
      paragraphs: [
        "A full body workout is a good choice if you want to lose weight. It doesn't burn a huge number of calories, but it gives your muscles a reason to stay. That way you mainly lose fat and less muscle.",
        "The weight loss itself mainly comes from what you eat: a small calorie deficit and enough protein. Extra steps and a short HIIT workout increase your energy use, but they're no substitute for an eating pattern that suits your goal.",
      ],
      link: "Calculate how many calories you need",
    },
    safety: {
      title: "Warming up and training safely",
      paragraphs: [
        "Start every workout with a 5 to 10-minute warm-up: easy on the cross-trainer, bike or rowing machine, followed by a few light sets of your first exercise.",
      ],
      noteTitle: "Please note",
      note: [
        "Pain is a signal to stop. Muscle soreness a day or two later is normal; sharp pain or pain in a joint during an exercise is not.",
        "Technique comes before weight. If in doubt, use less weight or choose the machine version.",
        "Don't hold your breath: breathe out as you push or pull, and breathe in as you return.",
        "Do you have an injury, pain or heart problems, are you pregnant or have you recently given birth, or are you 65 or older and starting a new exercise programme? Check with your GP or physiotherapist first.",
      ],
    },
    planTitle: "Your own full body plan",
    planText:
      "Your personal workout plan is put together based on your answers. With 2 or 3 training days, that's usually a full body structure, with exercises for your level and equipment, sets, reps and RPE for every exercise and 4 weeks of progression.",
    planCta: "See the workout plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How often a week should you do a full body workout?",
        a: "2 to 3 times a week, with at least one rest day between two workouts. Twice a week already lets you make good progress; three times means you train each muscle group a little more often.",
      },
      {
        q: "Can you do a full body workout every day?",
        a: "Training hard every day isn't wise: your muscles need around 48 hours to recover. Want to move more? Walk or cycle on the days in between. If you train 4 days or more, an upper/lower plan often works better.",
      },
      {
        q: "How long does a full body workout take?",
        a: "At the gym, around 45 to 60 minutes, including the warm-up. At home with your own body weight, it often takes 30 to 40 minutes. Short on time? Do 2 sets per exercise or choose 4 exercises: a squat, a hip hinge, a push and a pull.",
      },
      {
        q: "Is full body better than a split?",
        a: "Not necessarily. Both work, as long as you train each muscle group enough and keep making it a little harder. With 2 to 3 training days, full body is often more practical, because you then train each muscle group 2 to 3 times a week. If you train 4 days or more, an upper/lower plan or a split may suit you better.",
      },
      {
        q: "Can you lose weight with a full body workout?",
        a: "A full body workout helps, because you keep your muscle while you lose weight. The weight loss itself mainly comes from a small calorie deficit. So combine your workouts with an eating pattern that suits your goal and plenty of everyday movement.",
      },
      {
        q: "Should I do cardio alongside a full body workout?",
        a: "You don't have to, but it's good for your fitness. Plenty of walking is a great foundation for most people. Want more? Add a HIIT workout or a longer bike ride 1 to 2 times a week, on a different day from your heavy leg workout.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function FullBodyWorkoutPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.what.title} paragraphs={c.what.paragraphs}>
          <DataTable head={c.what.head} rows={c.what.rows} minWidth="32rem" />
        </Section>

        <Section title={c.gym.title} paragraphs={c.gym.paragraphs}>
          <DataTable head={c.gym.head} rows={c.gym.rows} note={c.gym.note} minWidth="30rem" />
          <ExerciseList l={l} items={c.gym.items} />
          <ArrowLink href="/buikspieroefeningen">{c.gym.more}</ArrowLink>
        </Section>

        <Section title={c.home.title} paragraphs={c.home.paragraphs}>
          <DataTable head={c.home.head} rows={c.home.rows} minWidth="36rem" />
          <ArrowLink href="/krachttraining-thuis">{c.home.link}</ArrowLink>
        </Section>

        <Section title={c.week.title} paragraphs={c.week.paragraphs}>
          <DataTable head={c.week.head} rows={c.week.rows} minWidth="30rem" />
          <Paragraphs items={c.week.after} />
          <Bullets items={c.week.bullets} />
          <Paragraphs items={[c.week.end]} />
        </Section>

        <Section title={c.intensity.title} paragraphs={c.intensity.paragraphs} />

        <Section title={c.progress.title} paragraphs={c.progress.paragraphs} bullets={c.progress.bullets}>
          <Paragraphs items={c.progress.after} />
        </Section>

        <Section title={c.weightLoss.title} paragraphs={c.weightLoss.paragraphs}>
          <ArrowLink href="/caloriebehoefte-berekenen">{c.weightLoss.link}</ArrowLink>
        </Section>

        <Section title={c.safety.title} paragraphs={c.safety.paragraphs}>
          <SafetyNote title={c.safety.noteTitle} items={c.safety.note} />
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/trainingsschema" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/krachttraining-thuis", "/hiit-training", "/buikspieroefeningen", "/eiwitten-per-dag"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}
