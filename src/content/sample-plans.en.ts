import type { NutritionPlan, TrainingPlan } from "@/lib/ai/schemas";

/**
 * Engelse versies van de voorbeeldschema's (zie sample-plans.ts). Zelfde
 * fictieve klant, zelfde opbouw en dezelfde getallen; alleen de tekst is
 * Engels. De dagdoelen (sampleTargets) bevatten geen tekst en zijn gedeeld.
 */

export const sampleNutritionPlanEn: NutritionPlan = {
  title: "Your nutrition plan – period 1",
  intro:
    "Hi Sanne! This plan will help you work steadily towards 68 kilos without going hungry. We keep weekdays simple, with dishes you can have on the table in 15 to 30 minutes, and we make sure every meal contains plenty of protein, so you stay full for longer and hold on to your muscle.",
  changes: [],
  principles: [
    "Include a source of protein at every meal: quark, chicken, fish, eggs or pulses.",
    "Fill half your plate with vegetables; that way you'll get your 250 grams a day.",
    "Drink water, tea or coffee without sugar; about 2.5 litres a day.",
    "Weigh yourself once a week, on the same day and at the same time.",
    "One treat a week outside the plan is fine; enjoy it and simply pick up where you left off.",
  ],
  days: [
    {
      day: "Monday",
      tip: "Cook 2 portions of baby potatoes tonight: you'll use half of them in Wednesday's lunch.",
      meals: [
        {
          moment: "Breakfast",
          name: "Quark bowl with blueberries and walnuts",
          prepMinutes: 5,
          ingredients: [
            { item: "Fat-free quark", amount: "250 g" },
            { item: "Rolled oats", amount: "40 g" },
            { item: "Blueberries (fresh or frozen)", amount: "100 g" },
            { item: "Walnuts, unsalted", amount: "15 g" },
            { item: "Cinnamon", amount: "pinch" },
          ],
          instructions: [
            "Spoon the quark into a bowl and stir in the cinnamon.",
            "Sprinkle the oats and blueberries on top.",
            "Roughly chop the walnuts and scatter them over the bowl.",
          ],
          kcal: 445,
          proteinG: 31,
          carbsG: 47,
          fatG: 13,
          swap: "Plain skyr (200 g) with 1 banana and 15 g almonds.",
        },
        {
          moment: "Lunch",
          name: "Wholemeal wrap with chicken, hummus and crunchy veg",
          prepMinutes: 10,
          ingredients: [
            { item: "Wholemeal wrap", amount: "1 (60 g)" },
            { item: "Chicken breast", amount: "125 g" },
            { item: "Plain hummus", amount: "40 g" },
            { item: "Lettuce, cucumber and grated carrot", amount: "100 g" },
            { item: "Paprika, black pepper", amount: "to taste" },
          ],
          instructions: [
            "Cut the chicken breast into strips, season with paprika and pepper and cook for 6-8 minutes in a non-stick pan until cooked through.",
            "Spread the wrap with hummus and top with the veg and chicken.",
            "Roll up tightly and cut in half. Also great cold, to take with you.",
          ],
          kcal: 437,
          proteinG: 38,
          carbsG: 37,
          fatG: 13,
          swap: "2 slices of wholemeal bread with 100 g sliced chicken, 1 tbsp hummus and a tub of cherry tomatoes.",
        },
        {
          moment: "Snack",
          name: "Skyr with apple",
          prepMinutes: 2,
          ingredients: [
            { item: "Plain skyr", amount: "150 g" },
            { item: "Apple", amount: "1" },
          ],
          instructions: ["Cut the apple into wedges and eat with the skyr."],
          kcal: 165,
          proteinG: 16,
          carbsG: 22,
          fatG: 1,
          swap: "1 tin of tuna in spring water with cucumber and 2 wholegrain crackers.",
        },
        {
          moment: "Dinner",
          name: "Oven-baked salmon with baby potatoes and lemony green beans",
          prepMinutes: 25,
          ingredients: [
            { item: "Salmon fillet", amount: "140 g" },
            { item: "Baby potatoes", amount: "200 g" },
            { item: "Green beans", amount: "200 g" },
            { item: "Olive oil", amount: "1 tsp (5 ml)" },
            { item: "Lemon", amount: "½" },
            { item: "Fresh dill", amount: "a few sprigs" },
          ],
          instructions: [
            "Preheat the oven to 200 °C. Halve the baby potatoes, toss with the olive oil, pepper and a pinch of salt and roast for 25 minutes.",
            "After 12 minutes, add the salmon to the tray and bake until just cooked.",
            "Meanwhile, boil the green beans for 6-8 minutes and drizzle with lemon juice.",
            "Serve with dill and a wedge of lemon.",
          ],
          kcal: 535,
          proteinG: 36,
          carbsG: 38,
          fatG: 24,
          swap: "Cod fillet (175 g) with 1 extra tsp olive oil; everything else stays the same.",
        },
      ],
    },
    {
      day: "Tuesday",
      tip: "Workout day! Your dinner is your protein-rich recovery meal; eat it within 2 hours of your workout.",
      meals: [
        {
          moment: "Breakfast",
          name: "Scrambled eggs on wholemeal toast with tomato",
          prepMinutes: 8,
          ingredients: [
            { item: "Eggs", amount: "2" },
            { item: "Wholemeal bread", amount: "2 slices" },
            { item: "Tomato", amount: "1" },
            { item: "Semi-skimmed milk", amount: "1 glass (200 ml)" },
            { item: "Chives, black pepper", amount: "to taste" },
          ],
          instructions: [
            "Beat the eggs with some pepper and scramble them in a non-stick pan, stirring all the time.",
            "Toast the bread and spoon the scrambled eggs on top.",
            "Serve with sliced tomato, chives and a glass of milk.",
          ],
          kcal: 420,
          proteinG: 28,
          carbsG: 41,
          fatG: 15,
          swap: "Overnight oats: 40 g rolled oats, 200 ml semi-skimmed milk and 100 g fat-free quark.",
        },
        {
          moment: "Lunch",
          name: "Lentil salad with tuna and a wholemeal pitta",
          prepMinutes: 10,
          ingredients: [
            { item: "Lentils, from a jar or tin (drained)", amount: "100 g" },
            { item: "Tuna in spring water (drained)", amount: "1 tin (112 g)" },
            { item: "Cherry tomatoes", amount: "100 g" },
            { item: "Cucumber", amount: "50 g" },
            { item: "Rocket", amount: "a handful" },
            { item: "Olive oil", amount: "1 tsp (5 ml)" },
            { item: "Wholemeal pitta bread", amount: "1" },
          ],
          instructions: [
            "Rinse the lentils and leave to drain.",
            "Halve the tomatoes, dice the cucumber and mix everything with the rocket, tuna and olive oil.",
            "Season with pepper and a squeeze of lemon. Eat with the toasted pitta.",
          ],
          kcal: 465,
          proteinG: 43,
          carbsG: 51,
          fatG: 8,
          swap: "Vegetarian: swap the tuna for 2 boiled eggs and 30 g light feta.",
        },
        {
          moment: "Snack",
          name: "Banana with almonds",
          prepMinutes: 1,
          ingredients: [
            { item: "Banana (small)", amount: "1" },
            { item: "Almonds, unsalted", amount: "20 g" },
          ],
          instructions: ["Easy to take to work or the gym."],
          kcal: 210,
          proteinG: 5,
          carbsG: 21,
          fatG: 11,
          swap: "A pot of fat-free yoghurt (200 g) with 1 tbsp no-added-sugar muesli.",
        },
        {
          moment: "Dinner",
          name: "Chicken teriyaki stir-fry with brown rice",
          prepMinutes: 25,
          ingredients: [
            { item: "Chicken breast", amount: "125 g" },
            { item: "Brown rice (uncooked)", amount: "60 g" },
            { item: "Stir-fry vegetables (e.g. pak choi, pepper, bean sprouts)", amount: "250 g" },
            { item: "Teriyaki sauce", amount: "1 tbsp (15 ml)" },
            { item: "Sesame oil", amount: "1 tsp (5 ml)" },
            { item: "Garlic and ginger", amount: "1 clove + 1 cm" },
          ],
          instructions: [
            "Cook the rice according to the packet instructions.",
            "Dice the chicken and stir-fry in the sesame oil with the garlic and ginger for 5 minutes until cooked through.",
            "Add the stir-fry vegetables and stir-fry for 4 minutes over a high heat.",
            "Stir in the teriyaki sauce and serve with the rice.",
          ],
          kcal: 492,
          proteinG: 38,
          carbsG: 59,
          fatG: 9,
          swap: "Vegetarian: swap the chicken for 150 g tempeh or tofu (and use 1 tsp less oil).",
        },
      ],
    },
  ],
  snackIdeas: [
    { name: "Fat-free quark with a teaspoon of peanut butter", kcal: 150, proteinG: 18 },
    { name: "Rice cake with reduced-fat cheese and cucumber", kcal: 110, proteinG: 8 },
    { name: "Edamame (100 g, from the freezer)", kcal: 125, proteinG: 11 },
    { name: "A punnet of strawberries with 150 g skyr", kcal: 130, proteinG: 16 },
  ],
  shoppingList: [
    {
      category: "Fruit & veg",
      items: [
        { item: "Blueberries", amount: "250 g" },
        { item: "Green beans", amount: "200 g" },
        { item: "Stir-fry vegetables", amount: "1 bag (400 g)" },
        { item: "Cucumber", amount: "1" },
        { item: "Cherry tomatoes", amount: "250 g" },
      ],
    },
    {
      category: "Dairy & eggs",
      items: [
        { item: "Fat-free quark", amount: "1 kg" },
        { item: "Plain skyr", amount: "450 g" },
        { item: "Eggs", amount: "6" },
      ],
    },
    {
      category: "Meat, fish & vegetarian",
      items: [
        { item: "Chicken breast", amount: "500 g" },
        { item: "Salmon fillet", amount: "2 fillets" },
        { item: "Tuna in spring water", amount: "2 tins" },
      ],
    },
  ],
  mealPrepTips: [
    "On Sunday, cook 500 g chicken breast in one go; it keeps for 3 days in the fridge.",
    "Cook a double portion of brown rice and use the rest in a lunch bowl.",
    "Portion out quark and oats into tubs ahead of time for 3 breakfasts.",
  ],
  eatingOutTips: [
    "Choose grilled fish or chicken with vegetables and ask for the sauce on the side.",
    "At an Italian restaurant: pasta with tomato sauce and a salad to start, instead of a creamy sauce.",
  ],
  adjustmentGuide:
    "Is your weight not going down after 2 weeks? Then leave out the walnuts at breakfast and have 50 g less potato or rice with your dinner (about 150 kcal less in total). Are you losing more than 1 kilo a week, or are you very hungry? Then add an extra snack from the list of snack ideas.",
};

export const sampleTrainingPlanEn: TrainingPlan = {
  title: "Your workout plan – period 1",
  intro:
    "Hi Sanne! You'll be training at home 3 times a week with a set of dumbbells. We'll build up gradually with full-body workouts, so you get stronger, keep your muscle while you lose weight, and really get the hang of good technique.",
  changes: [],
  weekSchedule: [
    { day: "Monday", activity: "Workout A – full body (45 min)" },
    { day: "Tuesday", activity: "Walk 30-45 min" },
    { day: "Wednesday", activity: "Workout B – full body (45 min)" },
    { day: "Thursday", activity: "Rest or easy cycling" },
    { day: "Friday", activity: "Workout A – full body (45 min)" },
    { day: "Saturday", activity: "Long walk (60 min)" },
    { day: "Sunday", activity: "Rest" },
  ],
  warmup: {
    minutes: 6,
    steps: [
      "1 minute of high knees on the spot",
      "10 hip circles each way",
      "10 bodyweight squats",
      "10 arm circles forwards and backwards",
      "1 light set of the first exercise",
    ],
  },
  workouts: [
    {
      name: "Workout A – Full body",
      focus: "Legs, back and chest",
      minutes: 45,
      exercises: [
        {
          name: "Goblet squat",
          muscleGroups: "Thighs, glutes",
          sets: 3,
          reps: "10-12",
          restSeconds: 90,
          intensity: "RPE 7 (3 reps left in the tank)",
          cues: ["Hold the dumbbell against your chest", "Knees track over your toes", "Chest up, back straight"],
          alternative: "Squat to a chair: sit down and stand back up with control.",
        },
        {
          name: "One-arm dumbbell row",
          muscleGroups: "Back, biceps",
          sets: 3,
          reps: "10-12 per side",
          restSeconds: 75,
          intensity: "RPE 7",
          cues: ["Support yourself with one hand on a chair", "Pull your elbow towards your hip", "Don't twist your torso"],
          alternative: "Resistance band row, with the band looped around a door handle.",
        },
        {
          name: "Incline push-up",
          muscleGroups: "Chest, shoulders, triceps",
          sets: 3,
          reps: "8-12",
          restSeconds: 75,
          intensity: "RPE 7-8",
          cues: ["Hands on a sturdy table or bench", "Body in one straight line", "Elbows at about 45° from your body"],
          alternative: "Wall push-up.",
        },
        {
          name: "Dumbbell Romanian deadlift",
          muscleGroups: "Hamstrings, glutes, lower back",
          sets: 3,
          reps: "10-12",
          restSeconds: 90,
          intensity: "RPE 7",
          cues: ["Push your hips back", "Keep the dumbbells close to your legs", "Keep your back neutral"],
          alternative: "Glute bridge on the floor.",
        },
        {
          name: "Dead bug",
          muscleGroups: "Core",
          sets: 3,
          reps: "8 per side",
          restSeconds: 45,
          intensity: "Controlled tempo",
          cues: ["Keep your lower back on the floor", "Breathe out slowly as you extend"],
          alternative: "Move only your legs; keep your arms pointing up.",
        },
      ],
      finisher: "Farmer's walk: 3 x 40 seconds walking with a dumbbell in each hand.",
    },
    {
      name: "Workout B – Full body",
      focus: "Glutes, shoulders and core",
      minutes: 45,
      exercises: [
        {
          name: "Reverse lunge",
          muscleGroups: "Thighs, glutes",
          sets: 3,
          reps: "8-10 per leg",
          restSeconds: 90,
          intensity: "RPE 7",
          cues: ["Take a big step backwards", "Front knee stays over your ankle", "Drive back up through your heel"],
          alternative: "Split squat without stepping, holding on to a chair.",
        },
        {
          name: "Standing dumbbell shoulder press",
          muscleGroups: "Shoulders, triceps",
          sets: 3,
          reps: "8-10",
          restSeconds: 75,
          intensity: "RPE 7",
          cues: ["Brace your abs and squeeze your glutes", "Press straight up", "Don't arch your lower back"],
          alternative: "Seated on a chair with a backrest.",
        },
        {
          name: "Hip thrust against the sofa",
          muscleGroups: "Glutes, hamstrings",
          sets: 3,
          reps: "12-15",
          restSeconds: 75,
          intensity: "RPE 7-8",
          cues: ["Upper back against the sofa", "Chin slightly tucked towards your chest", "Squeeze your glutes for 1 second at the top"],
          alternative: "Glute bridge on the floor.",
        },
        {
          name: "Side plank",
          muscleGroups: "Core (obliques)",
          sets: 3,
          reps: "20-30 sec per side",
          restSeconds: 45,
          intensity: "Controlled",
          cues: ["Elbow under your shoulder", "Hips up, body in a straight line"],
          alternative: "Side plank with your knees on the floor.",
        },
      ],
      finisher: "",
    },
  ],
  cooldown: ["2 minutes of easy walking", "Stretch your hip flexors and hamstrings, 30 seconds per side"],
  progression: [
    { week: 1, focus: "Learn the technique", instructions: "Choose a weight that lets you reach the bottom of the rep range with good technique." },
    { week: 2, focus: "Build up the reps", instructions: "Try to do 1-2 more reps per set than in week 1." },
    { week: 3, focus: "Go heavier", instructions: "Reaching the top of the range? Then pick up a heavier weight or a harder variation." },
    { week: 4, focus: "Consolidate", instructions: "Repeat week 3 and write down your weights; your next plan builds on this." },
  ],
  cardioAndSteps:
    "Aim for at least 8,000 steps a day. It's one of the most effective ways to burn extra energy without making you hungrier.",
  recoveryTips: [
    "Sleep 7-9 hours a night; poor sleep increases your cravings for snacks.",
    "Sore muscles? Gentle movement helps more than sitting still.",
  ],
  safetyNotes: ["Stop if you feel sharp pain or dizziness, and see a (sports) physiotherapist if symptoms persist."],
};

export const sampleNutritionPlanFollowUpEn: NutritionPlan = {
  ...sampleNutritionPlanEn,
  title: "Your nutrition plan – period 4",
  intro:
    "Great work, Sanne! You've lost 5.7 kilos since you started and you're following the plan really well. We're keeping the basics the same and adding some variety to your lunches.",
  changes: [
    "You lost 1.7 kg this period, nicely in line with the planned pace. Because you're lighter now, your daily target goes down slightly to 1,540 kcal.",
    "You were hardly ever hungry, so we're keeping the protein-rich snacks.",
    "You enjoyed the quark bowl and the stir-fry: they're back, with new lunches for variety.",
  ],
};

export const sampleTrainingPlanFollowUpEn: TrainingPlan = {
  ...sampleTrainingPlanEn,
  title: "Your workout plan – period 4",
  intro:
    "Strong work, Sanne! You've been training for three months now and you're noticeably stronger. This period, we'll keep building up steadily.",
  changes: [
    "You did most of your workouts and they felt just right: for the goblet squat and the row, you'll pick up a slightly heavier weight.",
    "Your knee was bothering you after walking: we're keeping the reverse lunge, which is kinder to your knees.",
    "New: workout A finishes with the farmer's walk, for your grip and core.",
  ],
};
