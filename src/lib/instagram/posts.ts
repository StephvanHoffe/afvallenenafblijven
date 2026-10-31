import "server-only";
import { site } from "@/config/site";
import { generateStructured } from "@/lib/ai/generate";
import { db } from "@/lib/db";
import { adminNotificationEmail, sendMail } from "@/lib/email";
import { getSetting, setSetting } from "@/lib/repo";
import { storeConfigValue } from "@/lib/admin/koppelingen";
import {
  INSTAGRAM_SYSTEM_PROMPT,
  fullCaption,
  instagramUserPrompt,
  normalizeContent,
  postContentSchema,
  reviewContent,
  type PostContent,
  type PostFormat,
} from "@/lib/instagram/content";
import {
  InstagramError,
  containerStatus,
  createCarouselContainer,
  createImageContainer,
  instagramAccount,
  instagramConfigured,
  mediaPermalink,
  publishContainer,
  recentMedia,
  refreshAccessToken,
  waitUntilReady,
} from "@/lib/instagram/api";

/**
 * Instagram-posts: Claude maakt ze op basis van jouw opdracht, de website
 * plaatst ze (direct, op een gekozen moment, of pas als jij op "Plaatsen"
 * klikt). Gaat iets mis, dan probeert de geplande taak het later opnieuw,
 * steeds iets later (na 5, 10 en 20 minuten); na 3 pogingen krijg je een mail.
 */

export type InstagramPostStatus = "pending" | "generating" | "draft" | "scheduled" | "publishing" | "published" | "failed";

export interface InstagramPost {
  id: string;
  prompt: string;
  format: PostFormat;
  instruction: string | null;
  status: InstagramPostStatus;
  content: PostContent | null;
  publish_at: Date | null;
  attempts: number;
  error: string | null;
  failed_step: "generate" | "publish" | null;
  started_at: Date | null;
  container_id: string | null;
  media_id: string | null;
  permalink: string | null;
  generated_at: Date | null;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export const MAX_POST_ATTEMPTS = 3;

/** Wat de opdracht wil: concept (zelf plaatsen), direct na het maken, of op een moment. */
export type PublishChoice = { mode: "draft" } | { mode: "now" } | { mode: "at"; at: Date };

export async function createInstagramPost(input: { prompt: string; format: PostFormat; publish: PublishChoice }): Promise<string> {
  const sql = await db();
  const publishAt = input.publish.mode === "now" ? new Date() : input.publish.mode === "at" ? input.publish.at : null;
  const [row] = await sql<{ id: string }[]>`
    insert into instagram_posts (prompt, format, publish_at) values (${input.prompt}, ${input.format}, ${publishAt}) returning id`;
  return row.id;
}

export async function getInstagramPost(id: string): Promise<InstagramPost | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`select * from instagram_posts where id = ${id}`;
  return row ?? null;
}

export async function listInstagramPosts(limit = 100): Promise<InstagramPost[]> {
  const sql = await db();
  return sql<InstagramPost[]>`
    select * from instagram_posts
    order by case when status in ('scheduled', 'pending', 'generating', 'publishing', 'failed') then 0 else 1 end,
      coalesce(publish_at, created_at) desc
    limit ${limit}`;
}

/** Het adres waar Instagram een slide ophaalt; `v` verandert bij elke wijziging van de inhoud. */
export function slideUrl(post: Pick<InstagramPost, "id" | "updated_at">, index: number, base = site.url): string {
  return `${base}/api/instagram/beeld/${post.id}/${index + 1}.jpg?v=${new Date(post.updated_at).getTime()}`;
}

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err)).replace(/\s+/g, " ").slice(0, 2000);

function failedNotification(post: Pick<InstagramPost, "id" | "prompt">, step: "generate" | "publish", message: string) {
  return adminNotificationEmail("instagram-mislukt", step === "generate" ? "Instagram-post kon niet worden gemaakt" : "Instagram-post kon niet worden geplaatst", {
    Opdracht: post.prompt.slice(0, 300),
    Fout: message,
    "Wat te doen":
      step === "generate"
        ? `Controleer de API-sleutel en het tegoed bij Anthropic en klik daarna op "Opnieuw maken": ${site.url}/beheer/instagram/${post.id}`
        : `Controleer de koppeling met Instagram (Beheer → Koppelingen) en klik daarna op "Nu plaatsen": ${site.url}/beheer/instagram/${post.id}`,
  });
}

async function fail(post: InstagramPost, step: "generate" | "publish", err: unknown): Promise<void> {
  const message = errorText(err);
  console.error(`Instagram-post ${post.id}: ${step === "generate" ? "maken" : "plaatsen"} mislukt`, message);
  const sql = await db();
  const [row] = await sql<{ attempts: number }[]>`
    update instagram_posts set status = 'failed', failed_step = ${step}, error = ${message}
    where id = ${post.id} returning attempts`;
  if (row && row.attempts >= MAX_POST_ATTEMPTS) await sendMail(failedNotification(post, step, message)).catch(() => {});
}

// ---------- Maken ----------

/** Pakt een post om te maken; veilig bij gelijktijdige aanroepen (alleen één proces krijgt hem). */
async function claimGeneration(id: string): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set status = 'generating', attempts = attempts + 1, started_at = now(), error = null
    where id = ${id} and attempts < ${MAX_POST_ATTEMPTS}
      and (status = 'pending'
        or (status = 'generating' and started_at < now() - interval '15 minutes')
        or (status = 'failed' and failed_step = 'generate'
          and started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
    returning *`;
  return row ?? null;
}

/** Laat Claude de post maken en controleert de harde eisen; voldoet hij niet, dan nog één keer met de problemen erbij. */
export async function writePostContent(post: Pick<InstagramPost, "prompt" | "format" | "instruction" | "content" | "publish_at">): Promise<PostContent> {
  const input = { prompt: post.prompt, format: post.format, instruction: post.instruction, previous: post.content, publishAt: post.publish_at };
  const ask = (extra?: string) =>
    generateStructured(postContentSchema, INSTAGRAM_SYSTEM_PROMPT, instagramUserPrompt(input) + (extra ?? ""), { effort: "high", maxTokens: 32000 });
  // Een aanwijzing mag de vorm veranderen ("maak er een carrousel van").
  const format = post.instruction ? "auto" : post.format;
  let content = normalizeContent(await ask());
  let problems = reviewContent(content, format);
  if (problems.length > 0) {
    content = normalizeContent(
      await ask(`\n\n## Let op\nEen eerdere versie voldeed niet:\n- ${problems.join("\n- ")}\nMaak een volledig nieuwe versie waarin dit is opgelost.`),
    );
    problems = reviewContent(content, format);
    if (problems.length > 0) throw new Error(`De post voldoet niet: ${problems.join(" ")}`);
  }
  return content;
}

/** Maakt de post met Claude; staat het plaatsmoment al, dan wordt hij meteen geplaatst. */
export async function generateInstagramPost(id: string): Promise<void> {
  const post = await claimGeneration(id);
  if (!post) return;
  let ready: InstagramPost | undefined;
  try {
    const content = await writePostContent(post);
    const sql = await db();
    // Nieuwe inhoud: een eventuele oude container bij Instagram hoort er niet meer bij.
    [ready] = await sql<InstagramPost[]>`
      update instagram_posts set content = ${sql.json(content as never)},
        status = case when publish_at is null then 'draft' else 'scheduled' end,
        attempts = 0, error = null, failed_step = null, container_id = null,
        generated_at = now(), updated_at = now()
      where id = ${post.id} and status = 'generating' returning *`;
  } catch (err) {
    await fail(post, "generate", err);
    return;
  }
  if (ready?.status === "scheduled" && ready.publish_at && ready.publish_at.getTime() <= Date.now()) await publishInstagramPost(ready.id);
}

// ---------- Plaatsen ----------

async function claimPublish(id: string): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set status = 'publishing', attempts = attempts + 1, started_at = now(), error = null
    where id = ${id} and content is not null and attempts < ${MAX_POST_ATTEMPTS}
      and ((status = 'scheduled' and publish_at <= now())
        or (status = 'publishing' and started_at < now() - interval '15 minutes')
        or (status = 'failed' and failed_step = 'publish'
          and started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
    returning *`;
  return row ?? null;
}

/**
 * Zet een post op Instagram. Hergebruikt een container van een eerdere poging,
 * en herkent een post die al geplaatst was (bijv. als de vorige poging na het
 * publiceren werd afgebroken), zodat een post nooit twee keer verschijnt.
 */
async function sendToInstagram(post: InstagramPost & { content: PostContent }): Promise<{ mediaId: string | null; permalink: string | null }> {
  const account = await instagramAccount();
  const caption = fullCaption(post.content);
  const sql = await db();

  let containerId = post.container_id;
  if (containerId) {
    const status = await containerStatus(containerId).catch(() => null);
    if (status?.code === "PUBLISHED") {
      const match = (await recentMedia(account.id).catch(() => [])).find((m) => m.caption?.trim() === caption.trim());
      return { mediaId: post.media_id ?? match?.id ?? null, permalink: match?.permalink ?? null };
    }
    if (!status || status.code === "ERROR" || status.code === "EXPIRED") containerId = null;
  }

  if (!containerId) {
    if (!process.env.INSTAGRAM_API_BASE && /\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(site.url)) {
      throw new InstagramError(`Instagram haalt de afbeeldingen op van ${site.url}. Dat kan alleen vanaf de live website, niet lokaal.`);
    }
    const urls = post.content.slides.map((_, i) => slideUrl(post, i));
    if (urls.length === 1) {
      containerId = await createImageContainer(account.id, { imageUrl: urls[0], caption, altText: post.content.altText || undefined });
    } else {
      const children = await Promise.all(urls.map((imageUrl) => createImageContainer(account.id, { imageUrl, carouselItem: true })));
      await Promise.all(children.map((child) => waitUntilReady(child)));
      containerId = await createCarouselContainer(account.id, children, caption);
    }
    await sql`update instagram_posts set container_id = ${containerId} where id = ${post.id}`;
  }

  await waitUntilReady(containerId);
  const mediaId = await publishContainer(account.id, containerId);
  // Direct vastleggen: vanaf hier staat de post op Instagram.
  await sql`update instagram_posts set media_id = ${mediaId} where id = ${post.id}`;
  return { mediaId, permalink: await mediaPermalink(mediaId).catch(() => null) };
}

export async function publishInstagramPost(id: string): Promise<void> {
  const post = await claimPublish(id);
  if (!post?.content) return;
  try {
    const { mediaId, permalink } = await sendToInstagram({ ...post, content: post.content });
    const sql = await db();
    await sql`
      update instagram_posts set status = 'published', media_id = coalesce(${mediaId}, media_id), permalink = ${permalink},
        published_at = now(), error = null, failed_step = null
      where id = ${post.id}`;
  } catch (err) {
    await fail(post, "publish", err);
  }
}

// ---------- Acties uit het beheer ----------

/** Nu plaatsen (ook na een mislukte poging): zet de post klaar en geeft het id terug, of null als dat niet kan. */
export async function schedulePost(id: string, at: Date | null): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set status = 'scheduled', publish_at = ${at ?? new Date()}, attempts = 0, error = null, failed_step = null
    where id = ${id} and content is not null and status in ('draft', 'scheduled', 'failed')
    returning *`;
  return row ?? null;
}

/** Terug naar concept: niet (meer) automatisch plaatsen. */
export async function unschedulePost(id: string): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set status = 'draft', publish_at = null, attempts = 0, error = null, failed_step = null
    where id = ${id} and content is not null and status in ('scheduled', 'failed') returning *`;
  return row ?? null;
}

/** Opnieuw laten maken, eventueel met een aanwijzing ("korter", "meer over eiwit"). De nieuwe versie wordt een concept. */
export async function regeneratePost(id: string, instruction: string | null): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set status = 'pending', instruction = ${instruction}, publish_at = null,
      attempts = 0, error = null, failed_step = null, started_at = null, container_id = null
    where id = ${id} and status in ('draft', 'scheduled', 'failed') returning *`;
  return row ?? null;
}

/** Eigen aanpassingen aan de tekst; daarna opnieuw getekend. Kan tot het plaatsen begint. */
export async function updatePostContent(id: string, content: PostContent): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    update instagram_posts set content = ${sql.json(normalizeContent(content) as never)}, container_id = null, updated_at = now()
    where id = ${id} and content is not null and status in ('draft', 'scheduled', 'failed') returning *`;
  return row ?? null;
}

/** Verwijdert een post uit het beheer (een geplaatste post blijft op Instagram staan). */
export async function deletePost(id: string): Promise<InstagramPost | null> {
  const sql = await db();
  const [row] = await sql<InstagramPost[]>`
    delete from instagram_posts where id = ${id} and status not in ('generating', 'publishing') returning *`;
  return row ?? null;
}

// ---------- Geplande taak ----------

const TOKEN_SETTING = "instagram_token";

export interface TokenState {
  /** Wanneer het token voor het laatst is verlengd. */
  refreshedAt: string;
  /** Tot wanneer het verlengde token geldig is. */
  expiresAt: string;
  /** Laatste tekens van het verlengde token, om een nieuw ingevuld token te herkennen. */
  tail: string;
}

export function tokenState(): Promise<TokenState | null> {
  return getSetting<TokenState>(TOKEN_SETTING).catch(() => null);
}

/**
 * Verlengt het token van Instagram-login ruim op tijd (het verloopt na 60
 * dagen). Een net ingevuld token kan pas na 24 uur worden verlengd; dat lukt
 * dan de volgende dag vanzelf.
 */
async function refreshTokenIfDue(): Promise<boolean> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN?.trim() ?? "";
  if (!token || token.startsWith("EAA")) return false;
  const state = await tokenState();
  const tail = token.slice(-8);
  if (state && state.tail === tail && Date.now() - Date.parse(state.refreshedAt) < 7 * 24 * 60 * 60 * 1000) return false;
  try {
    const fresh = await refreshAccessToken();
    if (!fresh) return false;
    await storeConfigValue("INSTAGRAM_ACCESS_TOKEN", fresh.token);
    await setSetting(TOKEN_SETTING, {
      refreshedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + fresh.expiresInSeconds * 1000).toISOString(),
      tail: fresh.token.slice(-8),
    } satisfies TokenState);
    return true;
  } catch (err) {
    console.error("Instagram-token verlengen mislukt", errorText(err));
    return false;
  }
}

/**
 * Voor de geplande taak (elke 5 minuten): posts plaatsen waarvan het moment is
 * aangebroken, mislukte pogingen opnieuw doen en vastgelopen pogingen oppakken.
 * Eén keer per dag ook het token verlengen.
 */
export async function runInstagramWork({ daily }: { daily: boolean }): Promise<{ generated: number; published: number; tokenRefreshed: boolean }> {
  const sql = await db();
  // Vastgelopen zonder pogingen over: op mislukt zetten en melden.
  const abandoned = await sql<InstagramPost[]>`
    update instagram_posts set status = 'failed',
      failed_step = case when status = 'generating' then 'generate' else 'publish' end,
      error = 'De laatste poging is afgebroken voordat hij klaar was (waarschijnlijk door de tijdslimiet van de server).'
    where status in ('generating', 'publishing') and started_at < now() - interval '15 minutes' and attempts >= ${MAX_POST_ATTEMPTS}
    returning *`;
  for (const post of abandoned) await sendMail(failedNotification(post, post.failed_step ?? "publish", post.error ?? "Afgebroken")).catch(() => {});

  const toGenerate = await sql<{ id: string }[]>`
    select id from instagram_posts
    where attempts < ${MAX_POST_ATTEMPTS}
      and (status = 'pending'
        or (status = 'generating' and started_at < now() - interval '15 minutes')
        or (status = 'failed' and failed_step = 'generate'
          and started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
    order by created_at limit 2`;
  for (const { id } of toGenerate) await generateInstagramPost(id);

  let published = 0;
  if (instagramConfigured()) {
    const due = await sql<{ id: string }[]>`
      select id from instagram_posts
      where content is not null and attempts < ${MAX_POST_ATTEMPTS}
        and ((status = 'scheduled' and publish_at <= now())
          or (status = 'publishing' and started_at < now() - interval '15 minutes')
          or (status = 'failed' and failed_step = 'publish'
            and started_at < now() - interval '5 minutes' * power(2, greatest(attempts - 1, 0))))
      order by publish_at limit 10`;
    for (const { id } of due) {
      await publishInstagramPost(id);
      published++;
    }
  }
  const tokenRefreshed = daily ? await refreshTokenIfDue() : false;
  return { generated: toGenerate.length, published, tokenRefreshed };
}
