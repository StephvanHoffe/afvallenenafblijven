import "server-only";
import { getSetting, setSetting } from "@/lib/repo";

/**
 * Instellingen die de beheerder in /beheer/instellingen aan- en uitzet.
 *
 * Schema's eerst goedkeuren: een nieuw schema gaat pas naar de klant als de
 * beheerder het heeft goedgekeurd (en het geplande moment is aangebroken).
 * Handig in de eerste weken na de lancering, als steekproef op de kwaliteit.
 */
export async function planApprovalRequired(): Promise<boolean> {
  return (await getSetting<boolean>("plan_approval")) === true;
}

export async function setPlanApproval(on: boolean): Promise<void> {
  await setSetting("plan_approval", on);
}
