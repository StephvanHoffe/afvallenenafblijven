/** Gewone (niet-betaalde) berichten, reacties en statistieken op Facebook en Instagram. */
import { readFileSync } from "node:fs";
import { API_VERSION, graph, instagramId, page, token, type Json, type Params } from "./client";
import { confirmed, date, dump, heading, list, need, num, str, table, unixTime, type Args } from "./util";

function short(text: string | undefined, length = 60): string {
  if (!text) return "-";
  const flat = text.replace(/\s+/g, " ");
  return flat.length > length ? `${flat.slice(0, length - 1)}…` : flat;
}

function days(args: Args, fallback = 28): { since: string; until: string } {
  const until = new Date();
  const since = new Date(until.getTime() - (num(args, "days") ?? fallback) * 86400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { since: str(args, "since") ?? iso(since), until: str(args, "until") ?? iso(until) };
}

// --- Facebook-pagina ---------------------------------------------------------

export async function posts(args: Args) {
  const p = await page();
  const rows = await graph.all(
    `${p.id}/posts`,
    { fields: "id,message,created_time,permalink_url,shares,reactions.summary(total_count).limit(0),comments.summary(total_count).limit(0)" },
    num(args, "limit") ?? 10,
    p.access_token,
  );
  if (args.json) return dump(rows);
  heading(`Berichten op ${p.name}`);
  table(rows, [
    ["id", (r) => r.id],
    ["datum", (r) => date(r.created_time)],
    ["tekst", (r) => short(r.message)],
    ["reacties", (r) => r.reactions?.summary?.total_count],
    ["comments", (r) => r.comments?.summary?.total_count],
    ["gedeeld", (r) => r.shares?.count ?? 0],
    ["link", (r) => r.permalink_url],
  ]);
}

export async function scheduled(args: Args) {
  const p = await page();
  const rows = await graph.all(`${p.id}/scheduled_posts`, { fields: "id,message,scheduled_publish_time,created_time" }, 100, p.access_token);
  if (args.json) return dump(rows);
  heading(`Ingeplande berichten op ${p.name}`);
  table(rows, [
    ["id", (r) => r.id],
    ["gepland", (r) => date(new Date(Number(r.scheduled_publish_time) * 1000).toISOString())],
    ["tekst", (r) => short(r.message, 80)],
  ]);
}

/** Bericht op de Facebook-pagina: tekst, met link of afbeelding, nu of ingepland. */
export async function post(args: Args) {
  const p = await page();
  const message = need(args, "message");
  const link = str(args, "link");
  const image = str(args, "image");
  const at = str(args, "schedule");
  const when = at ? unixTime(at) : undefined;
  if (when && (when < Date.now() / 1000 + 600 || when > Date.now() / 1000 + 75 * 86400)) {
    throw new Error("Inplannen kan van 10 minuten tot 75 dagen vooruit");
  }
  const timing: Params = when ? { published: false, scheduled_publish_time: when } : {};
  const preview = [
    `pagina: ${p.name}`,
    `tekst: ${message}`,
    ...(link ? [`link: ${link}`] : []),
    ...(image ? [`afbeelding: ${image}`] : []),
    when ? `ingepland: ${new Date(when * 1000).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}` : "direct plaatsen",
  ];
  if (!confirmed(args, preview)) return;

  let res: Json;
  if (image && /^https?:\/\//.test(image)) {
    res = await graph.post(`${p.id}/photos`, { url: image, caption: message, ...timing }, p.access_token);
  } else if (image) {
    // lokaal bestand: als formulier met het bestand erin
    const form = new FormData();
    form.set("source", new Blob([readFileSync(image)]), image.split("/").pop());
    form.set("caption", message);
    for (const [key, value] of Object.entries(timing)) form.set(key, String(value));
    res = await graph.form(`${p.id}/photos`, form, p.access_token);
  } else {
    res = await graph.post(`${p.id}/feed`, { message, link, ...timing }, p.access_token);
  }
  console.log(`Klaar: ${when ? "ingepland" : "geplaatst"} (${res.post_id ?? res.id})`);
}

// --- Instagram ---------------------------------------------------------------

export async function igPosts(args: Args) {
  const ig = await instagramId();
  const rows = await graph.all(
    `${ig}/media`,
    { fields: "id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count" },
    num(args, "limit") ?? 10,
  );
  // statistieken per bericht; niet elke maatstaf bestaat voor elk soort bericht
  await Promise.all(
    rows.map(async (r) => {
      for (const metric of ["reach,saved,shares,views", "reach,saved,shares", "reach"]) {
        try {
          const res = await graph.get(`${r.id}/insights`, { metric });
          r.stats = Object.fromEntries((res.data ?? []).map((m: Json) => [m.name, m.values?.[0]?.value ?? m.total_value?.value]));
          return;
        } catch {
          // probeer een kleinere set
        }
      }
    }),
  );
  if (args.json) return dump(rows);
  heading("Instagram-berichten");
  table(rows, [
    ["id", (r) => r.id],
    ["datum", (r) => date(r.timestamp)],
    ["soort", (r) => (r.media_product_type === "REELS" ? "reel" : r.media_type?.toLowerCase())],
    ["tekst", (r) => short(r.caption, 50)],
    ["likes", (r) => r.like_count],
    ["comments", (r) => r.comments_count],
    ["bereik", (r) => r.stats?.reach],
    ["weergaven", (r) => r.stats?.views],
    ["bewaard", (r) => r.stats?.saved],
    ["gedeeld", (r) => r.stats?.shares],
    ["link", (r) => r.permalink],
  ]);
}

async function waitUntilReady(container: string) {
  // video's (reels) worden eerst door Instagram verwerkt; afbeeldingen zijn meestal meteen klaar
  for (let i = 0; i < 60; i++) {
    const { status_code: status } = await graph.get(container, { fields: "status_code" });
    if (status === "FINISHED" || status === "PUBLISHED") return;
    if (status === "ERROR" || status === "EXPIRED") throw new Error(`Instagram kon de media niet verwerken (${status})`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error("Instagram is na 5 minuten nog bezig met verwerken; probeer het later opnieuw");
}

/**
 * Bericht, carrousel, reel of story op Instagram. Instagram haalt de media zelf op,
 * dus het moeten openbare url's zijn (afbeeldingen als JPEG).
 */
export async function igPost(args: Args) {
  const ig = await instagramId();
  const caption = str(args, "caption");
  const images = list(args, "images") ?? (str(args, "image") ? [str(args, "image")!] : []);
  const video = str(args, "video");
  const story = Boolean(args.story);
  for (const url of [...images, ...(video ? [video] : [])]) {
    if (!/^https:\/\//.test(url)) throw new Error(`Instagram heeft een openbare https-url nodig, geen bestand: ${url}`);
  }
  if (!images.length && !video) throw new Error("Geef --image <url>, --images <url1,url2,...> of --video <url>");
  const kind = story ? "story" : video ? "reel" : images.length > 1 ? `carrousel van ${images.length} afbeeldingen` : "afbeelding";
  if (!confirmed(args, [`Instagram ${kind}`, ...(caption ? [`tekst: ${caption}`] : []), ...images.map((u) => `media: ${u}`), ...(video ? [`video: ${video}`] : [])])) return;

  let container: string;
  if (images.length > 1 && !story) {
    const children: string[] = [];
    for (const image_url of images) {
      const child = await graph.post(`${ig}/media`, { image_url, is_carousel_item: true });
      await waitUntilReady(child.id);
      children.push(child.id);
    }
    container = (await graph.post(`${ig}/media`, { media_type: "CAROUSEL", children: children.join(","), caption })).id;
  } else if (video) {
    container = (await graph.post(`${ig}/media`, { media_type: story ? "STORIES" : "REELS", video_url: video, caption: story ? undefined : caption, share_to_feed: story ? undefined : true })).id;
  } else {
    container = (await graph.post(`${ig}/media`, { image_url: images[0], ...(story ? { media_type: "STORIES" } : { caption }) })).id;
  }
  await waitUntilReady(container);
  const published = await graph.post(`${ig}/media_publish`, { creation_id: container });
  const info = await graph.get(published.id, { fields: "permalink" }).catch(() => ({}) as Json);
  console.log(`Klaar: geplaatst (${published.id}) ${info.permalink ?? ""}`);
}

// --- Reacties ----------------------------------------------------------------

/** Recente reacties op Facebook en Instagram, met of er al op is gereageerd. */
export async function comments(args: Args) {
  const limit = num(args, "posts") ?? 10;
  const rows: Json[] = [];
  const p = await page();

  if (!args.ig) {
    const fbPosts = await graph.all(`${p.id}/posts`, { fields: "id,message" }, limit, p.access_token);
    for (const fbPost of fbPosts) {
      const items = await graph.all(
        `${fbPost.id}/comments`,
        { fields: "id,from{id,name},message,created_time,comments.limit(25){from{id}}", filter: "toplevel", order: "reverse_chronological" },
        50,
        p.access_token,
      );
      for (const c of items) {
        rows.push({
          platform: "facebook",
          id: c.id,
          time: c.created_time,
          who: c.from?.name,
          text: c.message,
          answered: (c.comments?.data ?? []).some((r: Json) => r.from?.id === p.id),
          post: fbPost.message,
        });
      }
    }
  }

  if (!args.fb) {
    const ig = await instagramId(false);
    if (ig) {
      const own = (await graph.get(ig, { fields: "username" })).username;
      const media = await graph.all(`${ig}/media`, { fields: "id,caption,comments_count" }, limit);
      for (const m of media.filter((m) => m.comments_count > 0)) {
        const items = await graph.all(`${m.id}/comments`, { fields: "id,text,username,timestamp,replies{username}" }, 50);
        for (const c of items) {
          if (c.username === own) continue;
          rows.push({
            platform: "instagram",
            id: c.id,
            time: c.timestamp,
            who: c.username,
            text: c.text,
            answered: (c.replies?.data ?? []).some((r: Json) => r.username === own),
            post: m.caption,
          });
        }
      }
    }
  }

  rows.sort((a, b) => String(b.time).localeCompare(String(a.time)));
  const visible = args.open ? rows.filter((r) => !r.answered) : rows;
  if (args.json) return dump(visible);
  heading(`Reacties (${visible.filter((r) => !r.answered).length} nog niet beantwoord)`);
  table(visible, [
    ["platform", (r) => r.platform],
    ["id", (r) => r.id],
    ["datum", (r) => date(r.time)],
    ["van", (r) => r.who],
    ["reactie", (r) => short(r.text, 70)],
    ["beantwoord", (r) => (r.answered ? "ja" : "NEE")],
    ["bij bericht", (r) => short(r.post, 30)],
  ]);
}

function isFacebookComment(id: string, args: Args): boolean {
  if (args.fb) return true;
  if (args.ig) return false;
  // Facebook-id's zijn <bericht>_<reactie>; Instagram-id's zijn alleen cijfers
  return id.includes("_");
}

export async function reply(args: Args) {
  const id = args._[0];
  const message = need(args, "message");
  if (!id) throw new Error("Geef het id van de reactie (zie comments)");
  const fb = isFacebookComment(id, args);
  if (!confirmed(args, [`antwoord op ${fb ? "Facebook" : "Instagram"}-reactie ${id}: ${message}`])) return;
  if (fb) {
    const p = await page();
    await graph.post(`${id}/comments`, { message }, p.access_token);
  } else {
    await graph.post(`${id}/replies`, { message });
  }
  console.log("Klaar: antwoord geplaatst.");
}

export async function hide(args: Args) {
  const id = args._[0];
  if (!id) throw new Error("Geef het id van de reactie");
  const fb = isFacebookComment(id, args);
  const show = Boolean(args.show);
  if (!confirmed(args, [`${fb ? "Facebook" : "Instagram"}-reactie ${id} ${show ? "weer tonen" : "verbergen"}`])) return;
  if (fb) {
    const p = await page();
    await graph.post(id, { is_hidden: !show }, p.access_token);
  } else {
    await graph.post(id, { hide: !show });
  }
  console.log("Klaar.");
}

// --- Statistieken ------------------------------------------------------------

/** Vraagt maatstaven één voor één op, zodat één verdwenen maatstaf de rest niet blokkeert. */
async function collect(path: string, metrics: string[], params: Params, accessToken?: string) {
  const result: Record<string, number | string> = {};
  await Promise.all(
    metrics.map(async (metric) => {
      try {
        const res = await graph.get(path, { metric, ...params }, accessToken);
        const series = res.data?.[0];
        result[metric] = series?.total_value?.value ?? (series?.values ?? []).reduce((sum: number, v: Json) => sum + (typeof v.value === "number" ? v.value : 0), 0);
      } catch {
        result[metric] = "niet beschikbaar";
      }
    }),
  );
  return result;
}

export async function pageStats(args: Args) {
  const p = await page();
  const range = days(args);
  const info = await graph.get(p.id, { fields: "name,followers_count,fan_count" }, p.access_token);
  const metrics = list(args, "metrics") ?? ["page_impressions_unique", "page_post_engagements", "page_views_total", "page_daily_follows_unique", "page_media_view", "page_total_media_view_unique"];
  const stats = await collect(`${p.id}/insights`, metrics, { period: "day", since: range.since, until: range.until }, p.access_token);
  if (args.json) return dump({ info, stats });
  heading(`Facebook-pagina ${info.name}, ${range.since} t/m ${range.until}`);
  console.log(`volgers: ${info.followers_count ?? "-"}  (vind-ik-leuks: ${info.fan_count ?? "-"})`);
  for (const [metric, value] of Object.entries(stats)) console.log(`${metric.padEnd(32)} ${value}`);
}

export async function igStats(args: Args) {
  const ig = await instagramId();
  const range = days(args);
  const info = await graph.get(ig!, { fields: "username,followers_count,follows_count,media_count" });
  const metrics = list(args, "metrics") ?? ["reach", "views", "accounts_engaged", "total_interactions", "likes", "comments", "shares", "saves", "profile_links_taps", "follows_and_unfollows"];
  const stats = await collect(`${ig}/insights`, metrics, { period: "day", metric_type: "total_value", since: range.since, until: range.until });
  if (args.json) return dump({ info, stats });
  heading(`Instagram @${info.username}, ${range.since} t/m ${range.until}`);
  console.log(`volgers: ${info.followers_count}  volgend: ${info.follows_count}  berichten: ${info.media_count}`);
  for (const [metric, value] of Object.entries(stats)) console.log(`${metric.padEnd(24)} ${value}`);
}

// --- Overzicht van het token -------------------------------------------------

export async function status(args: Args) {
  token();
  const [me, permissions, accounts, pages] = await Promise.all([
    graph.get("me", { fields: "id,name" }),
    graph.all("me/permissions").catch(() => []),
    graph.all("me/adaccounts", { fields: "id,name,currency,account_status,amount_spent" }).catch(() => []),
    graph.all("me/accounts", { fields: "id,name,instagram_business_account{id,username}" }).catch(() => []),
  ]);
  if (args.json) return dump({ me, permissions, accounts, pages });
  heading(`Verbonden als ${me.name} (${me.id}), Graph API ${API_VERSION}`);
  const granted = permissions.filter((x: Json) => x.status === "granted").map((x: Json) => x.permission);
  console.log(`rechten: ${granted.join(", ") || "(onbekend)"}`);
  const wanted = ["ads_management", "ads_read", "pages_manage_posts", "pages_read_engagement", "pages_manage_engagement", "instagram_basic", "instagram_content_publish", "instagram_manage_comments", "instagram_manage_insights", "read_insights"];
  const missing = granted.length ? wanted.filter((w) => !granted.includes(w)) : [];
  if (missing.length) console.log(`ontbreekt (voor alle functies): ${missing.join(", ")}`);
  heading("Advertentieaccounts");
  table(accounts, [["id", (r) => r.id], ["naam", (r) => r.name], ["valuta", (r) => r.currency], ["status", (r) => (r.account_status === 1 ? "actief" : r.account_status)]]);
  heading("Pagina's en Instagram");
  table(pages, [["pagina-id", (r) => r.id], ["pagina", (r) => r.name], ["instagram-id", (r) => r.instagram_business_account?.id], ["instagram", (r) => r.instagram_business_account?.username]]);
}
