import type { Metadata } from "next";
import { ArrowLink, ArticleBody, ArticleSchema, ContentHero, DataTable, FaqAndClose, PlanBox, RelatedPages, Section } from "@/components/content/ContentPage";
import { ExerciseList, Paragraphs, SafetyNote, type Exercise } from "@/components/content/ExerciseList";
import { defineCopy } from "@/i18n/config";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const PATH = "/hiit-training";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

const exercises = (items: Exercise[]) => items;

const copy = defineCopy({
  nl: {
    metaTitle: "HIIT training: wat het is, voorbeelden en hoe vaak per week",
    metaDescription:
      "HIIT training uitgelegd: wat het is, schema's als 30/30, 40/20 en Tabata, een voorbeeld thuis en op de fiets, hoe vaak per week en wat het echt oplevert.",
    eyebrow: "Bewegen en trainen",
    h1: "HIIT-training:",
    h1Accent: "wat het is en hoe je begint",
    intro:
      "Weinig tijd en toch je conditie verbeteren? Bij HIIT wissel je korte, zware blokken af met rust. Het is pittig, maar je bent snel klaar. Hier lees je hoe het werkt, welke schema's er zijn, twee voorbeeldtrainingen en wat HIIT wel en niet doet als je wilt afvallen.",
    short:
      "Bij HIIT (high intensity interval training) wissel je korte, zware blokken af met rust, bijvoorbeeld 30 seconden hard en 30 seconden rustig, of Tabata: 8 keer 20 seconden voluit met 10 seconden rust. Een training duurt 15 tot 25 minuten, inclusief 5 minuten warming-up en 5 minuten cooling-down. Doe het 1 tot 3 keer per week, met een rustdag ertussen. Per minuut verbrand je meer dan bij rustige cardio, maar in totaal niet per se meer dan bij een langere, rustige training.",
    what: {
      title: "Wat is HIIT-training?",
      paragraphs: [
        "HIIT staat voor high intensity interval training. Je wisselt korte blokken waarin je bijna alles geeft af met blokken waarin je rust of heel rustig beweegt. In de zware blokken zit je op zo'n 8 tot 9 op een schaal van 10 (RPE): praten lukt niet meer en je ademt zwaar.",
        "Je kunt HIIT doen met je eigen lichaamsgewicht, op een hometrainer of spinningfiets, een roeitoestel of crosstrainer, of door hard te lopen. Het gaat niet om de oefening, maar om de afwisseling tussen echt zwaar en rust.",
        "Let op: veel groepslessen die 'HIIT' heten, zijn eigenlijk circuittraining in een stevig maar constant tempo. Dat is ook prima training, maar het is iets anders dan echte intervallen.",
      ],
    },
    formats: {
      title: "HIIT-schema's: 30/30, 40/20 en Tabata",
      paragraphs: ["Een HIIT-schema schrijf je op als werk/rust in seconden. Hoe korter de rust in verhouding tot het werk, hoe zwaarder het is."],
      head: ["Schema", "Werk", "Rust", "Rondes", "Duur", "Geschikt voor"],
      rows: [
        ["20/40", "20 sec", "40 sec", "6–8", "6–8 min", "Starters"],
        ["30/30", "30 sec", "30 sec", "8–10", "8–10 min", "Beginners"],
        ["40/20", "40 sec", "20 sec", "8–12", "8–12 min", "Gevorderden"],
        ["Tabata 20/10", "20 sec", "10 sec", "8", "4 min", "Ervaren sporters"],
      ],
      note: "Duur zonder warming-up en cooling-down; reken daar samen zo'n 10 minuten bij.",
      after: [
        "Tabata is genoemd naar de Japanse onderzoeker Izumi Tabata. In zijn bekende onderzoek uit 1996 fietsten sportieve jonge mannen zo'n 8 keer 20 seconden voluit, met 10 seconden rust ertussen. Echte Tabata is dus extreem zwaar, en maar 4 minuten lang. Veel trainingen die 'Tabata' heten, zijn een stuk rustiger.",
      ],
    },
    home: {
      title: "Voorbeeld 1: HIIT thuis zonder materiaal (zo'n 20 minuten)",
      paragraphs: [
        "Deze training doe je in de woonkamer, met het 30/30-schema: 30 seconden zo hard als je met goede techniek kunt, 30 seconden rust. Je doet 4 oefeningen achter elkaar en herhaalt dat 2 keer (beginner) of 3 keer (gevorderd).",
      ],
      bullets: [
        "Warming-up (5 minuten): marcheren op de plek, armcirkels, 10 rustige squats, rustig knieheffen en een paar keer langzaam naar voren stappen en terug.",
        "Kern (9 tot 14 minuten): de 4 oefeningen hieronder, elk 30 seconden met 30 seconden rust, 2 tot 3 rondes. Rust 1 minuut tussen de rondes.",
        "Cooling-down (5 minuten): rustig wandelen door het huis en je benen, billen en borst losmaken.",
      ],
      items: exercises([
        {
          name: "Squat jumps (of snelle squats)",
          focus: "benen, billen en conditie",
          steps: [
            "Sta met je voeten op schouderbreedte.",
            "Zak in een squat, met je heupen naar achteren en je borst omhoog.",
            "Spring krachtig omhoog en land zacht op je voorvoeten, met licht gebogen knieën.",
            "Zak meteen door naar de volgende squat.",
          ],
          dose: "30 seconden werk, 30 seconden rust",
          mistake: "Je landt hard met gestrekte benen. Land zacht en stil, alsof je geen geluid mag maken.",
          variation: "Low impact: snelle squats zonder sprong, en bovenaan even op je tenen.",
        },
        {
          name: "Mountain climbers",
          focus: "buik, schouders en conditie",
          steps: [
            "Begin in de opdrukhouding met je handen onder je schouders.",
            "Trek afwisselend en snel je knieën naar je borst.",
            "Houd je heupen laag en je romp stil.",
          ],
          dose: "30 seconden werk, 30 seconden rust",
          mistake: "Je billen gaan steeds hoger. Houd een rechte lijn van hoofd tot hielen, ook als je moe wordt.",
          variation: "Low impact: met je handen op een bank of stoel, en stappend in plaats van springend.",
        },
        {
          name: "High knees (knieheffen)",
          focus: "conditie, heupen en kuiten",
          steps: [
            "Ren op de plek en trek je knieën om de beurt tot heuphoogte.",
            "Blijf op je voorvoeten en zwaai actief mee met je armen.",
            "Houd je romp rechtop en kijk recht vooruit.",
          ],
          dose: "30 seconden werk, 30 seconden rust",
          mistake: "Je leunt achterover en je knieën komen nauwelijks omhoog. Ga liever iets langzamer, met hoge knieën en een rechte romp.",
          variation: "Low impact: snel marcheren met hoge knieën, zonder te springen.",
        },
        {
          name: "Burpees",
          focus: "hele lichaam en conditie",
          steps: [
            "Zak door je knieën en zet je handen op de grond.",
            "Spring of stap met je voeten naar achteren tot je in de opdrukhouding staat.",
            "Spring of stap je voeten terug naar je handen.",
            "Kom omhoog en spring met je armen boven je hoofd.",
          ],
          dose: "30 seconden werk, 30 seconden rust",
          mistake: "Je rug zakt door in de opdrukhouding of je landt hard. Ga iets langzamer en stap in plaats van te springen.",
          variation: "Low impact: stap je voeten één voor één naar achteren en terug, zonder sprong, of zet je handen op een bank.",
        },
      ]),
    },
    bike: {
      title: "Voorbeeld 2: HIIT op de fiets of het roeitoestel (zo'n 25 minuten)",
      paragraphs: [
        "Op een hometrainer, spinningfiets of roeitoestel is HIIT minder belastend voor je gewrichten dan springen. Stel de weerstand zo in dat je in de zware blokken echt moet werken.",
      ],
      head: ["Onderdeel", "Tijd", "Intensiteit (RPE)"],
      rows: [
        ["Warming-up", "5 min", "Rustig opbouwen van 3 naar 5"],
        ["Interval: hard", "30 sec", "8–9: praten lukt niet"],
        ["Interval: rustig", "90 sec", "3–4: rustig doortrappen of -roeien"],
        ["Herhaal het interval", "6–8 keer", "Samen 12–16 min"],
        ["Cooling-down", "5 min", "Rustig afbouwen naar 2–3"],
      ],
      note: "Gaat het goed? Maak de rustige blokken korter (60 seconden) of doe er een interval bij. Eén stapje per week is genoeg.",
    },
    frequency: {
      title: "Hoe vaak per week HIIT?",
      paragraphs: [
        "1 tot 3 keer per week is genoeg, met minstens een dag rust of rustige beweging ertussen. HIIT is zwaar voor je lichaam. Vaker is niet beter: je herstelt minder goed en je intervallen worden minder sterk.",
        "Begin met 1 keer per week en bouw na een paar weken op naar 2. Doe je ook krachttraining? Plan HIIT dan niet vlak voor een zware beentraining, maar op een andere dag.",
      ],
      head: ["Dag", "Voorbeeldweek"],
      rows: [
        ["Maandag", "Krachttraining (full body)"],
        ["Dinsdag", "HIIT, 20 minuten"],
        ["Woensdag", "Wandelen"],
        ["Donderdag", "Krachttraining (full body)"],
        ["Vrijdag", "Rust"],
        ["Zaterdag", "HIIT of een lange wandeling"],
        ["Zondag", "Rust of rustig fietsen"],
      ],
    },
    beginners: {
      title: "HIIT voor beginners: begin met low impact",
      paragraphs: [
        "Je hoeft niet meteen te springen. Low impact betekent dat er steeds minstens één voet op de grond blijft, of dat je op een fiets, roeitoestel of crosstrainer traint. Dat is minder belastend voor je knieën, enkels en bekkenbodem, en het is nog steeds een goede conditietraining.",
      ],
      bullets: [
        "Begin met het 20/40- of 30/30-schema en 4 tot 6 intervallen.",
        "Ga in de zware blokken naar RPE 7, nog niet naar het uiterste.",
        "Kies oefeningen zonder sprong: snelle squats, snel marcheren met hoge knieën, mountain climbers met je handen op een bank of burpees zonder sprong.",
        "Of kies een hometrainer, roeitoestel, crosstrainer of zwemmen.",
        "Doe elke week 1 of 2 intervallen meer, tot je er 8 tot 10 doet.",
      ],
    },
    honest: {
      title: "Verbrand je meer vet met HIIT? Een eerlijk verhaal",
      paragraphs: [
        "HIIT verbrandt per minuut meer calorieën dan rustig wandelen of fietsen, omdat je harder werkt. Maar een HIIT-training is kort, en een groot deel van de tijd rust je. Daardoor kost een training van 20 minuten in totaal niet per se meer energie dan een langere, rustige training. Vaak is het grofweg evenveel als 30 tot 45 minuten stevig wandelen, afhankelijk van je gewicht en hoe hard je gaat.",
        "En het naverbrandingseffect, waarbij je na de training extra calorieën verbrandt? Dat bestaat, maar het is klein: een klein deel van wat je tijdens de training zelf verbruikt, geen honderden calorieën extra.",
        "HIIT is vooral een efficiënte manier om je conditie te verbeteren in weinig tijd. Voor afvallen telt vooral een klein calorietekort, samen met krachttraining om je spieren te behouden en veel dagelijkse beweging. Wandelen is daarbij een onderschatte basis: het kost weinig herstel en je kunt het elke dag doen.",
      ],
      walkLink: "Hoeveel verbrand je met wandelen?",
      kcalLink: "Bereken je caloriebehoefte",
    },
    safety: {
      title: "Veilig HIIT doen: warming-up, pijn en je hart",
      paragraphs: ["HIIT vraagt veel van je hart, longen en gewrichten. Bouw daarom rustig op en let op deze punten:"],
      noteTitle: "Let op",
      note: [
        "Sla de warming-up en cooling-down nooit over: 5 minuten rustig opbouwen en 5 minuten afbouwen.",
        "Pijn is een signaal om te stoppen. Krijg je pijn op je borst, word je duizelig of raak je heel erg benauwd? Stop meteen en laat je nakijken door een arts.",
        "Heb je hartproblemen of een hoge bloeddruk, gebruik je medicijnen voor je hart, of ben je 65 of ouder en begin je met een nieuw trainingsprogramma? Overleg dan eerst met je huisarts.",
        "Heb je een blessure of pijn in je gewrichten, of ben je zwanger of net bevallen? Overleg dan eerst met je huisarts, verloskundige of fysiotherapeut welke training bij je past.",
        "Train niet als je ziek bent of koorts hebt.",
      ],
    },
    planTitle: "Kracht, cardio en rust in balans",
    planText:
      "In je persoonlijke trainingsschema staat per dag wat je doet: krachttraining, rust en actief herstel, plus stappen- en cardioadvies dat bij je doel past. Het schema wordt samengesteld op basis van je antwoorden over je niveau, je materiaal en je tijd.",
    planCta: "Bekijk het trainingsschema",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faq: [
      {
        q: "Hoe vaak per week moet je HIIT doen?",
        a: "1 tot 3 keer per week, met minstens een dag rust of rustige beweging ertussen. Begin met 1 keer per week en bouw op naar 2 als je goed herstelt. Vaker is meestal niet beter, omdat je dan minder hard kunt in je intervallen.",
      },
      {
        q: "Hoe lang moet een HIIT-training duren?",
        a: "Het zware deel duurt meestal 4 tot 15 minuten, afhankelijk van het schema. Met 5 minuten warming-up en 5 minuten cooling-down ben je in totaal zo'n 15 tot 25 minuten bezig.",
      },
      {
        q: "Is HIIT beter dan gewone cardio om af te vallen?",
        a: "Niet per se. HIIT verbrandt per minuut meer, maar een langere rustige training kan in totaal evenveel of meer kosten. Kies wat je het best volhoudt, of combineer ze. Afvallen komt vooral uit een klein calorietekort.",
      },
      {
        q: "Kun je elke dag HIIT doen?",
        a: "Dat is niet verstandig. HIIT is zwaar, en je lichaam heeft tijd nodig om te herstellen. Doe het hooguit 3 keer per week en wandel of fiets rustig op de dagen ertussen.",
      },
      {
        q: "Is HIIT geschikt voor beginners?",
        a: "Ja, als je rustig begint: met een low-impact variant, langere rust (20/40 of 30/30) en een paar intervallen. Heb je hartproblemen of een hoge bloeddruk, of ben je 65 of ouder en begin je net, overleg dan eerst met je huisarts.",
      },
      {
        q: "Wat is Tabata?",
        a: "Tabata is een vorm van HIIT met 8 rondes van 20 seconden voluit en 10 seconden rust: in totaal 4 minuten. Het is genoemd naar de onderzoeker Izumi Tabata. Echte Tabata is extreem zwaar en vooral geschikt voor ervaren sporters.",
      },
    ],
  },
  en: {
    metaTitle: "HIIT training: what it is, examples and how often a week",
    metaDescription:
      "HIIT training explained: what it is, formats such as 30/30, 40/20 and Tabata, a home and an exercise bike workout, how often a week and what it really does.",
    eyebrow: "Exercise and training",
    h1: "HIIT training:",
    h1Accent: "what it is and how to start",
    intro:
      "Short on time but want to improve your fitness? With HIIT, you alternate short, hard bursts with rest. It's tough, but it's over quickly. Here you'll read how it works, which formats there are, two example workouts and what HIIT does and doesn't do if you want to lose weight.",
    short:
      "With HIIT (high-intensity interval training), you alternate short, hard bursts with rest, for example 30 seconds hard and 30 seconds easy, or Tabata: 8 rounds of 20 seconds flat out with 10 seconds' rest. A session takes 15 to 25 minutes, including a 5-minute warm-up and a 5-minute cool-down. Do it 1 to 3 times a week, with a rest day in between. Per minute you burn more than with steady cardio, but in total not necessarily more than with a longer, steady session.",
    what: {
      title: "What is HIIT training?",
      paragraphs: [
        "HIIT stands for high-intensity interval training. You alternate short bursts in which you give almost everything with periods in which you rest or move very gently. In the hard bursts, you're at around 8 to 9 on a scale of 10 (RPE): you can no longer talk and you're breathing hard.",
        "You can do HIIT with your own body weight, on an exercise bike or spin bike, a rowing machine or cross-trainer, or by running fast. It's not about the exercise, but about switching between truly hard and rest.",
        "Note: many group classes called 'HIIT' are really circuit training at a brisk but steady pace. That's good training too, but it's not the same as real intervals.",
      ],
    },
    formats: {
      title: "HIIT formats: 30/30, 40/20 and Tabata",
      paragraphs: ["A HIIT format is written as work/rest in seconds. The shorter the rest compared with the work, the harder it is."],
      head: ["Format", "Work", "Rest", "Rounds", "Duration", "Suits"],
      rows: [
        ["20/40", "20 sec", "40 sec", "6–8", "6–8 min", "Complete beginners"],
        ["30/30", "30 sec", "30 sec", "8–10", "8–10 min", "Beginners"],
        ["40/20", "40 sec", "20 sec", "8–12", "8–12 min", "Intermediate"],
        ["Tabata 20/10", "20 sec", "10 sec", "8", "4 min", "Experienced athletes"],
      ],
      note: "Duration excluding warm-up and cool-down; add around 10 minutes for those together.",
      after: [
        "Tabata is named after the Japanese researcher Izumi Tabata. In his well-known 1996 study, active young men cycled around 8 rounds of 20 seconds flat out, with 10 seconds' rest in between. Real Tabata is therefore extremely hard, and only 4 minutes long. Many workouts called 'Tabata' are a lot gentler.",
      ],
    },
    home: {
      title: "Example 1: HIIT at home without equipment (about 20 minutes)",
      paragraphs: [
        "You can do this workout in your living room, using the 30/30 format: 30 seconds as hard as you can with good technique, 30 seconds' rest. You do 4 exercises in a row and repeat that 2 times (beginner) or 3 times (more experienced).",
      ],
      bullets: [
        "Warm-up (5 minutes): marching on the spot, arm circles, 10 easy squats, gentle knee raises and a few slow steps forwards and back.",
        "Main part (9 to 14 minutes): the 4 exercises below, each for 30 seconds with 30 seconds' rest, 2 to 3 rounds. Rest for 1 minute between rounds.",
        "Cool-down (5 minutes): walk slowly around the house and loosen up your legs, glutes and chest.",
      ],
      items: exercises([
        {
          name: "Squat jumps (or fast squats)",
          focus: "legs, glutes and fitness",
          steps: [
            "Stand with your feet shoulder-width apart.",
            "Lower into a squat, with your hips back and your chest up.",
            "Jump up powerfully and land softly on the balls of your feet, with your knees slightly bent.",
            "Go straight into the next squat.",
          ],
          dose: "30 seconds of work, 30 seconds' rest",
          mistake: "You land hard with straight legs. Land softly and quietly, as if you're not allowed to make a sound.",
          variation: "Low impact: fast squats without the jump, rising onto your toes at the top.",
        },
        {
          name: "Mountain climbers",
          focus: "abs, shoulders and fitness",
          steps: [
            "Start in a push-up position with your hands under your shoulders.",
            "Quickly draw your knees towards your chest, one at a time.",
            "Keep your hips low and your trunk still.",
          ],
          dose: "30 seconds of work, 30 seconds' rest",
          mistake: "Your hips keep rising. Keep a straight line from head to heels, even when you get tired.",
          variation: "Low impact: with your hands on a bench or chair, stepping instead of jumping.",
        },
        {
          name: "High knees",
          focus: "fitness, hips and calves",
          steps: [
            "Run on the spot, lifting your knees to hip height one at a time.",
            "Stay on the balls of your feet and drive your arms.",
            "Keep your upper body upright and look straight ahead.",
          ],
          dose: "30 seconds of work, 30 seconds' rest",
          mistake: "You lean back and your knees hardly come up. Go a little slower, with high knees and an upright trunk.",
          variation: "Low impact: fast marching with high knees, without jumping.",
        },
        {
          name: "Burpees",
          focus: "whole body and fitness",
          steps: [
            "Bend your knees and put your hands on the floor.",
            "Jump or step your feet back into a push-up position.",
            "Jump or step your feet back towards your hands.",
            "Stand up and jump with your arms above your head.",
          ],
          dose: "30 seconds of work, 30 seconds' rest",
          mistake: "Your back sags in the push-up position or you land hard. Go a little slower and step instead of jumping.",
          variation: "Low impact: step your feet back and forwards one at a time, without the jump, or put your hands on a bench.",
        },
      ]),
    },
    bike: {
      title: "Example 2: HIIT on a bike or rowing machine (about 25 minutes)",
      paragraphs: [
        "On an exercise bike, spin bike or rowing machine, HIIT is easier on your joints than jumping. Set the resistance so that you really have to work in the hard bursts.",
      ],
      head: ["Part", "Time", "Intensity (RPE)"],
      rows: [
        ["Warm-up", "5 min", "Build up gently from 3 to 5"],
        ["Interval: hard", "30 sec", "8–9: you can't talk"],
        ["Interval: easy", "90 sec", "3–4: easy pedalling or rowing"],
        ["Repeat the interval", "6–8 times", "12–16 min in total"],
        ["Cool-down", "5 min", "Ease down to 2–3"],
      ],
      note: "Going well? Shorten the easy periods (to 60 seconds) or add an interval. One small step a week is enough.",
    },
    frequency: {
      title: "How often a week should you do HIIT?",
      paragraphs: [
        "1 to 3 times a week is enough, with at least one day of rest or gentle movement in between. HIIT is hard on your body. More isn't better: you recover less well and your intervals get weaker.",
        "Start with once a week and build up to twice after a few weeks. Doing strength training as well? Then don't schedule HIIT right before a heavy leg workout, but on a different day.",
      ],
      head: ["Day", "Example week"],
      rows: [
        ["Monday", "Strength training (full body)"],
        ["Tuesday", "HIIT, 20 minutes"],
        ["Wednesday", "Walking"],
        ["Thursday", "Strength training (full body)"],
        ["Friday", "Rest"],
        ["Saturday", "HIIT or a long walk"],
        ["Sunday", "Rest or easy cycling"],
      ],
    },
    beginners: {
      title: "HIIT for beginners: start with low impact",
      paragraphs: [
        "You don't have to jump straight away. Low impact means at least one foot stays on the ground at all times, or that you train on a bike, rowing machine or cross-trainer. That's easier on your knees, ankles and pelvic floor, and it's still a good workout for your fitness.",
      ],
      bullets: [
        "Start with the 20/40 or 30/30 format and 4 to 6 intervals.",
        "Go to RPE 7 in the hard bursts, not all out yet.",
        "Choose exercises without jumps: fast squats, fast marching with high knees, mountain climbers with your hands on a bench or burpees without the jump.",
        "Or choose an exercise bike, rowing machine, cross-trainer or swimming.",
        "Add 1 or 2 intervals each week, until you're doing 8 to 10.",
      ],
    },
    honest: {
      title: "Do you burn more fat with HIIT? An honest answer",
      paragraphs: [
        "HIIT burns more calories per minute than easy walking or cycling, because you work harder. But a HIIT session is short, and you spend a large part of it resting. So a 20-minute session doesn't necessarily cost more energy in total than a longer, steady one. It's often roughly the same as 30 to 45 minutes of brisk walking, depending on your weight and how hard you go.",
        "And the afterburn effect, where you burn extra calories after your workout? It exists, but it's small: a small fraction of what you use during the session itself, not hundreds of extra calories.",
        "HIIT is above all an efficient way to improve your fitness in little time. For weight loss, what matters most is a small calorie deficit, together with strength training to keep your muscle and plenty of everyday movement. Walking is an underrated foundation: it needs little recovery and you can do it every day.",
      ],
      walkLink: "How many calories do you burn walking?",
      kcalLink: "Calculate your calorie needs",
    },
    safety: {
      title: "Doing HIIT safely: warm-up, pain and your heart",
      paragraphs: ["HIIT asks a lot of your heart, lungs and joints. So build up gradually and keep these points in mind:"],
      noteTitle: "Please note",
      note: [
        "Never skip the warm-up and cool-down: 5 minutes of building up gently and 5 minutes of easing down.",
        "Pain is a signal to stop. Do you get chest pain, feel dizzy or become very short of breath? Stop immediately and get checked by a doctor.",
        "Do you have heart problems or high blood pressure, do you take heart medication, or are you 65 or older and starting a new exercise programme? Check with your GP first.",
        "Do you have an injury or joint pain, or are you pregnant or have you recently given birth? Check with your GP, midwife or physiotherapist first which kind of training suits you.",
        "Don't train when you're ill or have a fever.",
      ],
    },
    planTitle: "Strength, cardio and rest in balance",
    planText:
      "Your personal workout plan shows what to do each day: strength training, rest and active recovery, plus step and cardio advice that matches your goal. The plan is put together based on your answers about your level, your equipment and your time.",
    planCta: "See the workout plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faq: [
      {
        q: "How often a week should you do HIIT?",
        a: "1 to 3 times a week, with at least one day of rest or gentle movement in between. Start with once a week and build up to twice if you recover well. More often usually isn't better, because you then can't push as hard in your intervals.",
      },
      {
        q: "How long should a HIIT workout be?",
        a: "The hard part usually takes 4 to 15 minutes, depending on the format. With a 5-minute warm-up and a 5-minute cool-down, it takes around 15 to 25 minutes in total.",
      },
      {
        q: "Is HIIT better than regular cardio for weight loss?",
        a: "Not necessarily. HIIT burns more per minute, but a longer, steady session can cost the same or more in total. Choose what you can keep up best, or combine them. Weight loss mainly comes from a small calorie deficit.",
      },
      {
        q: "Can you do HIIT every day?",
        a: "That isn't wise. HIIT is demanding, and your body needs time to recover. Do it no more than 3 times a week and walk or cycle gently on the days in between.",
      },
      {
        q: "Is HIIT suitable for beginners?",
        a: "Yes, if you start gently: with a low-impact version, longer rest (20/40 or 30/30) and a few intervals. If you have heart problems or high blood pressure, or you're 65 or older and just starting out, check with your GP first.",
      },
      {
        q: "What is Tabata?",
        a: "Tabata is a form of HIIT with 8 rounds of 20 seconds flat out and 10 seconds' rest: 4 minutes in total. It's named after the researcher Izumi Tabata. Real Tabata is extremely hard and mainly suitable for experienced athletes.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

export default async function HiitTrainingPage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <ArticleSchema l={l} path={PATH} title={c.metaTitle} description={c.metaDescription} updated={UPDATED} />
      <ContentHero l={l} eyebrow={c.eyebrow} title={c.h1} accent={c.h1Accent} intro={c.intro} updated={UPDATED} short={c.short} />

      <ArticleBody>
        <Section title={c.what.title} paragraphs={c.what.paragraphs} />

        <Section title={c.formats.title} paragraphs={c.formats.paragraphs}>
          <DataTable head={c.formats.head} rows={c.formats.rows} note={c.formats.note} minWidth="36rem" />
          <Paragraphs items={c.formats.after} />
        </Section>

        <Section title={c.home.title} paragraphs={c.home.paragraphs} bullets={c.home.bullets}>
          <ExerciseList l={l} items={c.home.items} />
        </Section>

        <Section title={c.bike.title} paragraphs={c.bike.paragraphs}>
          <DataTable head={c.bike.head} rows={c.bike.rows} note={c.bike.note} minWidth="30rem" />
        </Section>

        <Section title={c.frequency.title} paragraphs={c.frequency.paragraphs}>
          <DataTable head={c.frequency.head} rows={c.frequency.rows} minWidth="22rem" />
        </Section>

        <Section title={c.beginners.title} paragraphs={c.beginners.paragraphs} bullets={c.beginners.bullets} />

        <Section title={c.honest.title} paragraphs={c.honest.paragraphs}>
          <div className="flex flex-col items-start gap-3">
            <ArrowLink href="/afvallen-met-wandelen">{c.honest.walkLink}</ArrowLink>
            <ArrowLink href="/caloriebehoefte-berekenen">{c.honest.kcalLink}</ArrowLink>
          </div>
        </Section>

        <Section title={c.safety.title} paragraphs={c.safety.paragraphs}>
          <SafetyNote title={c.safety.noteTitle} items={c.safety.note} />
        </Section>

        <PlanBox title={c.planTitle} text={c.planText} href="/trainingsschema" cta={c.planCta} note={c.planNote} />

        <RelatedPages l={l} paths={["/afvallen-met-wandelen", "/krachttraining-thuis", "/full-body-workout", "/buikspieroefeningen"]} />
      </ArticleBody>

      <FaqAndClose l={l} items={c.faq} />
    </>
  );
}
