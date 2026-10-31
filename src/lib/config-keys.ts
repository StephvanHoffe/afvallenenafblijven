/**
 * De instellingen die je in het beheer (Koppelingen) kunt invullen in plaats
 * van bij je hosting. Ze staan in de database en worden over process.env
 * gelegd, zodat de rest van de code ze gewoon als omgevingsvariabele leest.
 * Een waarde uit het beheer gaat voor op dezelfde variabele bij de hosting.
 *
 * Niet hier: DATABASE_URL (nodig om de database te kunnen lezen) en
 * CRON_SECRET (Vercel stuurt alleen de waarde uit zijn eigen instellingen mee
 * met de geplande taak; zonder CRON_SECRET werkt de taak ook, zie /api/cron).
 */
export const STORED_CONFIG_KEYS = [
  "MOLLIE_API_KEY",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_MODEL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
  "INSTAGRAM_ACCESS_TOKEN",
  "INSTAGRAM_ACCOUNT_ID",
] as const;

export type StoredConfigKey = (typeof STORED_CONFIG_KEYS)[number];

/** De sleutel in de tabel settings. */
export const STORED_CONFIG_SETTING = "koppelingen";
