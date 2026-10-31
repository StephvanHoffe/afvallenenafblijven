import "server-only";
import { lookup } from "node:dns/promises";
import { site } from "@/config/site";
import { STORED_CONFIG_KEYS, STORED_CONFIG_SETTING, type StoredConfigKey } from "@/lib/config-keys";
import { db, hostingValue, loadStoredConfig } from "@/lib/db";
import { anthropic, claudeModel } from "@/lib/ai/generate";
import { transport } from "@/lib/email";
import { listMethods, mollieMode } from "@/lib/mollie";
import { instagramAccount, publishingLimit } from "@/lib/instagram/api";

/**
 * Beheer → Koppelingen: de gegevens waarmee de website betaalt (Mollie), schema's
 * maakt (Claude), mailt (SMTP) en op Instagram plaatst. Ze staan in de database
 * (tabel settings) en gaan voor op dezelfde variabelen bij de hosting. Geheime
 * waarden worden na het opslaan nooit meer volledig getoond.
 */

export type ConfigGroupId = "mollie" | "claude" | "email" | "instagram";

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
  /** Niet nodig voor de webwinkel zelf (telt niet mee in "x van y werken"). */
  optional?: boolean;
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
  {
    id: "instagram",
    title: "Instagram: posts plaatsen",
    intro:
      "Optioneel. Nodig om de posts die Claude maakt (Beheer → Instagram) automatisch op je Instagram te zetten. Je account moet een zakelijk of creator-account zijn; het stappenplan staat in de README.",
    required: ["INSTAGRAM_ACCESS_TOKEN"],
    optional: true,
    fields: [
      {
        key: "INSTAGRAM_ACCESS_TOKEN",
        label: "Toegangstoken",
        hint: "In je Meta-app: Instagram → API-instellingen met Instagram-login → Toegangstokens genereren. Begint met IG. De website verlengt het token zelf.",
        placeholder: "IGAA…",
        secret: true,
      },
      {
        key: "INSTAGRAM_ACCOUNT_ID",
        label: "Instagram-account-ID (mag leeg blijven)",
        hint: "Alleen nodig bij een token via Facebook (begint met EAA). Leeg laten = automatisch.",
        inputMode: "numeric",
      },
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

/** Van een API-sleutel of token de laatste vier tekens (herkenbaar), van een wachtwoord niets. */
const mask = (value: string, key: StoredConfigKey) => (/_(API_KEY|TOKEN)$/.test(key) ? `••••${value.slice(-4)}` : "••••••••");

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

export type SaveProblem = "mollie-sleutel" | "poort" | "e-mail" | "instagram-account";

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
  if (next.INSTAGRAM_ACCOUNT_ID && !/^\d{5,25}$/.test(next.INSTAGRAM_ACCOUNT_ID)) return "instagram-account";
  const clean = Object.fromEntries(Object.entries(next).filter(([k]) => (STORED_CONFIG_KEYS as readonly string[]).includes(k)));
  const sql = await db();
  await sql`
    insert into settings (key, value) values (${STORED_CONFIG_SETTING}, ${sql.json(clean)}::jsonb)
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await loadStoredConfig({ force: true });
  return null;
}

/** Zet één waarde in de instellingen uit het beheer (bijv. een automatisch verlengd token) en laadt ze opnieuw. */
export async function storeConfigValue(key: StoredConfigKey, value: string): Promise<void> {
  const sql = await db();
  await sql`
    insert into settings (key, value) values (${STORED_CONFIG_SETTING}, ${sql.json({ [key]: value })}::jsonb)
    on conflict (key) do update set value = settings.value || excluded.value, updated_at = now()`;
  await loadStoredConfig({ force: true });
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err)).replace(/\s+/g, " ").slice(0, 220);

/** Adressen van Vercel: wijst de mailserver hierheen, dan staat de DNS van je domein (ook voor mail) bij Vercel. */
const VERCEL_IP = /^(76\.76\.21\.|216\.150\.|216\.198\.79\.)/;

/** Wat er mis is met de mailserver, in gewone taal, met de technische melding erachter. */
async function smtpProblem(err: unknown): Promise<string> {
  const host = process.env.SMTP_HOST ?? "";
  const e = err as { code?: string; message?: string };
  const raw = errorText(err);
  const address = await lookup(host).then((r) => r.address).catch(() => null);
  let advice: string;
  if (address && VERCEL_IP.test(address)) {
    advice = `${host} wijst naar Vercel (${address}) in plaats van naar je mailserver. Waarschijnlijk staan de nameservers van je domein bij Vercel, waardoor ook de mailrecords (MX, SPF, DKIM) weg zijn. Zet de nameservers terug naar je domeinprovider en wijs daar alleen de website naar Vercel.`;
  } else if (!address || e.code === "EDNS" || /ENOTFOUND|EAI_AGAIN/.test(raw)) {
    advice = `De mailserver ${host || "(leeg)"} bestaat niet. Controleer de naam; bij Vimexx is dat mail. plus je domeinnaam.`;
  } else if (e.code === "EAUTH") {
    advice = "De mailserver weigert het inloggen. Controleer de gebruikersnaam (het volledige e-mailadres) en het wachtwoord van de mailbox.";
  } else if (/certificate|altnames|self.signed|CERT_/i.test(raw)) {
    advice = "Het beveiligingscertificaat van de mailserver past niet bij deze naam. Gebruik de mailservernaam uit de mailinstellingen van je provider.";
  } else if (/wrong version number|ssl3_get_record|packet length/i.test(raw)) {
    advice = "Poort en beveiliging passen niet bij elkaar. Gebruik 465 (beveiligd) of 587.";
  } else if (/ECONNREFUSED/.test(raw)) {
    advice = "De mailserver weigert verbindingen op deze poort. Probeer 465 of 587.";
  } else if (e.code === "ETIMEDOUT" || /Greeting never received|timeout/i.test(raw)) {
    advice =
      "De mailserver antwoordt niet. Probeer de andere poort (465 of 587). Lukt het met beide niet, dan laat de mailserver de servers van Vercel waarschijnlijk niet toe: vraag het je provider of gebruik een maildienst zoals Brevo.";
  } else {
    advice = "Verbinden lukt niet.";
  }
  return `${advice} (Melding: ${raw})`;
}

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
      } else if (groupId === "instagram") {
        const account = await instagramAccount();
        const limit = await publishingLimit(account.id).catch(() => null);
        result = {
          ok: true,
          detail:
            `Verbonden met ${account.username ? `@${account.username}` : `account ${account.id}`}.` +
            (limit ? ` Afgelopen 24 uur via de website geplaatst: ${limit.used} van maximaal ${limit.total}.` : "") +
            (process.env.INSTAGRAM_ACCESS_TOKEN?.startsWith("EAA") ? "" : " Het token wordt automatisch verlengd."),
        };
      } else {
        try {
          await transport().verify();
        } catch (err) {
          throw new Error(await smtpProblem(err));
        }
        result = { ok: true, detail: `Verbonden met ${process.env.SMTP_HOST}. Stuur bij Instellingen een testmail om het helemaal te controleren.` };
      }
    } catch (err) {
      result = {
        ok: false,
        detail: groupId === "email" || groupId === "instagram" ? (err instanceof Error ? err.message : String(err)) : `Verbinden lukt niet: ${errorText(err)}`,
      };
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
