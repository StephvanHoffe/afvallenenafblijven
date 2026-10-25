/** Stappen van de funnel, gedeeld door het rapport en de demo. */

/** De vragen in de volgorde van de vragenlijst. */
export const QUIZ_STEPS: { step: string; label: string }[] = [
  { step: "doel", label: "Doel" },
  { step: "hulp", label: "Waarmee helpen we je" },
  { step: "over-jou", label: "Over jou" },
  { step: "lichaam", label: "Lengte en gewicht" },
  { step: "tempo", label: "Tempo" },
  { step: "activiteit", label: "Activiteit" },
  { step: "eetstijl", label: "Eetstijl en allergieën" },
  { step: "maaltijden", label: "Eetmomenten en keuken" },
  { step: "training-plek", label: "Trainingsplek" },
  { step: "training-tijd", label: "Trainingstijd" },
  { step: "gezondheid", label: "Gezondheid" },
  { step: "resultaat", label: "Persoonlijk resultaat" },
  { step: "plan", label: "Plannen en afrekenen" },
];

export const STAGE_DEFS: { key: string; label: string; hint: string }[] = [
  { key: "visits", label: "Bezoeken", hint: "Bezoeken aan de website (per tabblad)" },
  { key: "quiz", label: "Vragenlijst geopend", hint: "Kwam op /start" },
  { key: "started", label: "Eerste vraag beantwoord", hint: "Ging verder dan de eerste vraag" },
  { key: "result", label: "Resultaat gezien", hint: "Zag het persoonlijke calorie- en eiwitdoel" },
  { key: "plan", label: "Plannen bekeken", hint: "Kwam bij de plankeuze" },
  { key: "selected", label: "Plan gekozen", hint: "Koos een plan en looptijd" },
  { key: "submitted", label: "Op betalen geklikt", hint: "Vinkjes gezet en op betalen geklikt" },
  { key: "checkout", label: "Betaalpagina geopend", hint: "Doorgestuurd naar Mollie" },
  { key: "purchase", label: "Betaald", hint: "Betaling afgerond" },
];
