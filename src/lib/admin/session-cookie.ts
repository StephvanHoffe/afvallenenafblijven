/**
 * Het sessiecookie van het beheer, los van de rest van auth.ts zodat de proxy
 * het kan gebruiken zonder de database mee te laden.
 */
export const ADMIN_COOKIE = "afb_beheer";

export function isDemoMode(): boolean {
  return process.env.BEHEER_DEMO === "1";
}

/**
 * Snelle controle voor de proxy: is er een (nog niet verlopen) sessiecookie?
 * De handtekening controleert elke beheerpagina en -actie zelf (dat vraagt de database).
 */
export function looksLikeAdminCookie(value: string | undefined): boolean {
  const [exp, sig] = (value ?? "").split(".");
  return Boolean(sig) && Number(exp) > Date.now();
}
