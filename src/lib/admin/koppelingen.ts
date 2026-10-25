import "server-only";
import { site } from "@/config/site";
import { STORED_CONFIG_KEYS, STORED_CONFIG_SETTING, type StoredConfigKey } from "@/lib/config-keys";
import { db, hostingValue, loadStoredConfig } from "@/lib/db";
import { anthropic, claudeModel } from "@/lib/ai/generate";
import { transport } from "@/lib/email";
import { listMethods, mollieMode } from "@/lib/mollie";

/**
 * Beheer → Koppelingen: de gegevens waarmee de website betaalt (Mollie), schema's
 * maakt (Claude) en mailt (SMTP). Ze staan in de database (tabel settings) en
 * gaan voor op dezelfde variabelen bij de hosting. Geheime waarden worden na het
 * opslaan nooit meer volledig getoond.
 */

export type ConfigGroupId = "mollie" | "claude" | "email";

export interface ConfigField {
  key: StoredConfigKey;
  label: string;
  hint: string;
  placeholder?: string;
  /** Geheim: na opslaan alleen de laatste tekens zichtbaar, leeg laten = niet wijzigen. */
  secret?: boolean;
  /** Voorstel als er nog niets is ingesteld. */
  suggestion?: string;
  inputMode?: "text" | "email" | "numeric" | "url";
}

export interface ConfigGroup {
  id: ConfigGroupId;
  title: string;
  intro: string;
  fields: ConfigField[];
  /** Zonder deze velden werkt het onderdeel niet. */
  required: StoredConfigKey[];
}

const domain = site.domain;

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: "mollie",
    title: "Mollie: betalingen",
    intro: "Nodig om te kunnen afrekenen. Eerst de testsleutel; zodra Mollie je account heeft goedgekeurd de live-sleutel.",
    required: ["MOLLIE_API_KEY"],
    fields: [
      {
        key: "MOLLIE_API_KEY",
        label: "API-sleutel",
        hint: "In Mollie: Developers → API-sleutels. Begint met test_ (testen) of live_ (echte betalingen).",
        placeholder: "test_…",
        secret: true,
      },
    ],
  },
  {
    id: "claude",
    title: "Claude: schema's maken",
    intro: "Nodig om de voedings- en trainingsschema's te maken. Je betaalt per schema bij Anthropic.",
    required: ["ANTHROPIC_API_KEY"],
    fields: [
      {
        key: "ANTHROPIC_API_KEY",
        label: "API-sleutel",
        hint: "Op platform.claude.com: API keys → Create key. Begint met sk-ant-.",
        placeholder: "sk-ant-…",
        secret: true,
      },
      {
        key: "ANTHROPIC_MODEL",
        label: "Model (mag leeg blijven)",
        hint: "Leeg laten = het standaardmodel claude-opus-5-5.",
        placeholder: "claude-opus-5-5",
      },
    ],
  },
  {
    id: "email",
    title: "E-mail: via je Vimexx-mailbox",
    intro: "Nodig voor orderbevestigingen, schema's, inloglinks en meldingen aan jou. De meeste velden staan al goed; vul het wachtwoord van de mailbox in.",
    required: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
    fields: [
      { key: "SMTP_HOST", label: "Mailserver", hint: "Bij Vimexx: mail. plus je domeinnaam.", suggestion: `mail.${domain}`, inputMode: "url" },
      { key: "SMTP_PORT", label: "Poort", hint: "465 (beveiligd). Lukt dat niet, probeer dan 587.", suggestion: "465", inputMode: "numeric" },
      { key: "SMTP_USER", label: "Gebruikersnaam", hint: "Het volledige e-mailadres van de mailbox.", suggestion: `info@${domain}`, inputMode: "email" },
      { key: "SMTP_PASS", label: "Wachtwoord van de mailbox", hint: "Het wachtwoord dat je bij Vimexx voor deze mailbox hebt gekozen.", secret: true },
      {
        key: "EMAIL_FROM",
        label: "Afzender",
        hint: "Naam en adres zoals klanten het zien.",
        suggestion: `${site.name} <info@${domain}>`,
      },
      { key: "ADMIN_EMAIL", label: "Meldingen naar", hint: "Hier krijg jij meldingen (nieuwe garantie-aanvraag, fouten, opzegverzoeken).", suggestion: `info@${domain}`, inputMode: "email" },
    ],
  },
];

export interface FieldState {
  key: StoredConfigKey;
  /** De waarde om in het formulier te tonen (geheimen: leeg). */
  value: string;
  /** "Ingesteld: ••••abcd" bij een geheim (bij een wachtwoord zonder tekens). */
  masked: string | null;
  source: "beheer" | "hosting" | null;
}

export interface TestResult {
  ok: boolean;
  detail: string;
  at: string;
}

export async function storedConfig(): Promise<Partial<Record<StoredConfigKey, string>>> {
  const sql = await db();
  const [row] = await sql<{ value: Partial<Record<StoredConfigKey, string>> }[]>`
    select value from settings where key = ${STORED_CONFIG_SETTING}`;
  return row?.value ?? {};
}

/** Van een API-sleutel de laatste vier tekens (herkenbaar), van een wachtwoord niets. */
const mask = (value: string, key: StoredConfigKey) => (key.endsWith("_API_KEY") ? `••••${value.slice(-4)}` : "••••••••");

/** Hoe elk veld er nu voor staat (uit het beheer, van de hosting, of nog niet ingevuld). */
export async function fieldStates(): Promise<Record<StoredConfigKey, FieldState>> {
  const stored = await storedConfig();
  const out = {} as Record<StoredConfigKey, FieldState>;
  for (const group of CONFIG_GROUPS) {
    for (const f of group.fields) {
      const fromAdmin = stored[f.key] || undefined;
      const fromHosting = hostingValue(f.key);
      const current = fromAdmin ?? fromHosting;
      out[f.key] = {
        key: f.key,
        value: f.secret ? "" : (current ?? f.suggestion ?? ""),
        masked: f.secret && current ? mask(current, f.key) : null,
        source: fromAdmin ? "beheer" : fromHosting ? "hosting" : null,
      };
    }
  }
  return out;
}

/** Is een onderdeel compleet ingevuld (in het beheer of bij de hosting)? */
export function groupComplete(group: ConfigGroup): boolean {
  return group.required.every((k) => Boolean(process.env[k]));
}

export type SaveProblem = "mollie-sleutel" | "poort" | "e-mail";

/**
 * Slaat de velden van één onderdeel op. Een leeg geheim veld betekent "niet
 * wijzigen", tenzij "wissen" is aangevinkt; een leeg gewoon veld wist de waarde.
 */
export async function saveGroup(groupId: ConfigGroupId, input: (name: string) => string, wipe: (name: string) => boolean): Promise<SaveProblem | null> {
  const group = CONFIG_GROUPS.find((g) => g.id === groupId);
  if (!group) return null;
  const stored = await storedConfig();
  const next: Partial<Record<StoredConfigKey, string>> = { ...stored };
  for (const f of group.fields) {
    const value = input(f.key).trim();
    if (f.secret) {
      if (wipe(f.key)) delete next[f.key];
      else if (value) next[f.key] = value;
    } else if (value) next[f.key] = value;
    else delete next[f.key];
  }
  if (next.MOLLIE_API_KEY && !/^(test|live)_[A-Za-z0-9]+$/.test(next.MOLLIE_API_KEY)) return "mollie-sleutel";
  if (next.SMTP_PORT && !/^\d{2,5}$/.test(next.SMTP_PORT)) return "poort";
  if (next.ADMIN_EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.ADMIN_EMAIL)) return "e-mail";
  const clean = Object.fromEntries(Object.entries(next).filter(([k]) => (STORED_CONFIG_KEYS as readonly string[]).includes(k)));
  const sql = await db();
  await sql`
    insert into settings (key, value) values (${STORED_CONFIG_SETTING}, ${sql.json(clean)}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await loadStoredConfig({ force: true });
  return null;
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err)).replace(/\s+/g, " ").slice(0, 220);

/** Controleert de verbinding van een onderdeel en bewaart de uitkomst (voor de status op de pagina). */
export async function testGroup(groupId: ConfigGroupId): Promise<TestResult> {
  await loadStoredConfig({ force: true });
  let result: Omit<TestResult, "at">;
  const group = CONFIG_GROUPS.find((g) => g.id === groupId)!;
  if (!groupComplete(group)) {
    result = { ok: false, detail: "Nog niet alles ingevuld." };
  } else {
    try {
      if (groupId === "mollie") {
        const [first, recurring] = await Promise.all([listMethods("first"), listMethods("recurring")]);
        const names = first.map((m) => m.description);
        const directDebit = recurring.some((m) => m.id === "directdebit");
        const firstOk = first.some((m) => m.id === "ideal" || m.id === "bancontact");
        result = {
          ok: firstOk && directDebit,
          detail:
            `Verbonden (${mollieMode() === "live" ? "live" : "testmodus"}). Aan voor de eerste betaling: ${names.join(", ") || "geen"}.` +
            (directDebit ? " SEPA-incasso staat aan." : " Let op: zet SEPA-incasso aan in Mollie, anders werkt de maandelijkse afschrijving niet.") +
            (firstOk ? "" : " Let op: zet iDEAL | Wero of Bancontact aan."),
        };
      } else if (groupId === "claude") {
        await (await anthropic()).models.list({ limit: 1 });
        result = { ok: true, detail: `Verbonden. Schema's worden gemaakt met ${claudeModel()}.` };
      } else {
        await transport().verify();
        result = { ok: true, detail: `Verbonden met ${process.env.SMTP_HOST}. Stuur bij Instellingen een testmail om het helemaal te controleren.` };
      }
    } catch (err) {
      result = { ok: false, detail: `Verbinden lukt niet: ${errorText(err)}` };
    }
  }
  const at = new Date().toISOString();
  const sql = await db();
  await sql`
    insert into settings (key, value) values ('koppelingen_test', ${sql.json({ [groupId]: { ...result, at } })}::jsonb)
    on conflict (key) do update set value = settings.value || excluded.value, updated_at = now()`;
  return { ...result, at };
}

export async function lastTests(): Promise<Partial<Record<ConfigGroupId, TestResult>>> {
  const sql = await db();
  const [row] = await sql<{ value: Partial<Record<ConfigGroupId, TestResult>> }[]>`select value from settings where key = 'koppelingen_test'`;
  return row?.value ?? {};
}

/** Wanneer de geplande taak voor het laatst draaide (null = nog nooit). */
export async function lastCronRun(): Promise<Date | null> {
  const sql = await db();
  const [row] = await sql<{ updated_at: Date }[]>`select updated_at from settings where key = 'cron_last_run'`;
  return row?.updated_at ?? null;
}
