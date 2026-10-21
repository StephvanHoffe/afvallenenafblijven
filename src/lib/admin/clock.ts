import { isDemoMode } from "@/lib/admin/auth";
import { DEMO_NOW } from "@/lib/admin/demo-data";

/** Nu, of de vaste datum van de demo-gegevens (zodat de demo er altijd hetzelfde uitziet). */
export function adminNow(): number {
  return isDemoMode() ? DEMO_NOW : Date.now();
}
