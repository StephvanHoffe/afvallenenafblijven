import { activityOptions, paceOptions, type Intake } from "@/lib/intake";

/**
 * Wat iemand in de rekenhulp (/caloriebehoefte-berekenen) invulde, zodat de
 * vragenlijst die antwoorden al klaarzet. Alleen in de browser, in dit
 * tabblad (sessionStorage): het verdwijnt als het tabblad sluit en gaat pas
 * naar ons als iemand een plan bestelt, net als de rest van de vragenlijst.
 */
export const PREFILL_KEY = "afb_rekenhulp";

export interface CalculatorPrefill {
  sex: Intake["sex"];
  age: number;
  heightCm: number;
  weightKg: number;
  activity: Intake["activity"];
  pace: Intake["pace"];
}

export function savePrefill(p: CalculatorPrefill): void {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify(p));
  } catch {
    /* geen opslag: dan vult de bezoeker het opnieuw in */
  }
}

/** De ingevulde waarden uit de rekenhulp, of null als er niets (geldigs) is. */
export function readPrefill(): CalculatorPrefill | null {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CalculatorPrefill>;
    const ok =
      (p.sex === "vrouw" || p.sex === "man") &&
      typeof p.age === "number" &&
      typeof p.heightCm === "number" &&
      typeof p.weightKg === "number" &&
      typeof p.activity === "string" &&
      p.activity in activityOptions &&
      typeof p.pace === "string" &&
      p.pace in paceOptions;
    return ok ? (p as CalculatorPrefill) : null;
  } catch {
    return null;
  }
}
