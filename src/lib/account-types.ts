import type { DurationId, PlanType, ProductId } from "@/config/pricing";
import type { CheckinData, CheckinWindow } from "@/lib/checkin";
import type { Intake } from "@/lib/intake";
import type { OrderStatus, PlanStatus } from "@/lib/repo";

/** Wat Mijn schema's van een bestelling toont. */
export interface DashboardOrder {
  id: string;
  reference: string;
  product: ProductId;
  duration: DurationId;
  status: OrderStatus;
  cancelAt: Date | null;
  createdAt: Date;
  /** Heeft een lopend Stripe-abonnement dat de klant kan beheren. */
  manageable: boolean;
  commitmentEndsAt: Date | null;
  /** De verplichte check-in voor de volgende periode (null als die er niet is). */
  checkin: CheckinWindow | null;
  lastWeightKg: number | null;
}

export interface DashboardPlan {
  id: string;
  type: PlanType;
  seq: number;
  status: PlanStatus;
  generatedAt: Date | null;
  failed: boolean;
  href: string;
  pdfHref: string;
}

/** Alles wat de persoonlijke omgeving (alle tabbladen) van een klant toont. */
export interface AccountView {
  name: string;
  orders: DashboardOrder[];
  plans: DashboardPlan[];
  /** Antwoorden uit de vragenlijst bij de start. */
  intake: Intake | null;
  /** Moment van de eerste bestelling: het startpunt van de voortgang. */
  startedAt: Date | null;
  /** Ingevulde check-ins, oudste eerst. */
  checkins: { seq: number | null; date: Date; data: CheckinData }[];
  /** Dagdoelen van elk voedingsschema, oudste eerst. */
  targets: { seq: number; date: Date | null; calories: number; proteinG: number; carbsG: number; fatG: number }[];
}

export type AccountTab = "overzicht" | "schemas" | "voortgang" | "check-in" | "gegevens" | "abonnement";

export type AccountNotice = "opgezegd" | "opzeggen" | "checkin" | null;
