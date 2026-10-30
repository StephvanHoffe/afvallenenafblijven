/** Advertenties op Facebook en Instagram: overzichten, cijfers en wijzigingen. */
import { adAccount, fromMinor, graph, imageBytes, instagramId, money, page, toMinor, type Json, type Params } from "./client";
import { confirmed, date, dump, heading, list, need, num, period, periodLabel, str, table, unixTime, type Args } from "./util";

// Meta telt dezelfde conversie soms onder meerdere namen; we nemen de eerste die er is.
const ACTIONS = {
  lpv: ["landing_page_view", "omni_landing_page_view"],
  lead: ["lead", "offsite_conversion.fb_pixel_lead", "onsite_conversion.lead_grouped"],
  checkout: ["initiate_checkout", "offsite_conversion.fb_pixel_initiate_checkout", "omni_initiated_checkout"],
  purchase: ["purchase", "offsite_conversion.fb_pixel_purchase", "omni_purchase"],
} as const;

function action(values: Json[] | undefined, kind: keyof typeof ACTIONS): number {
  for (const type of ACTIONS[kind]) {
    const hit = values?.find((a) => a.action_type === type);
    if (hit) return Number(hit.value);
  }
  return 0;
}

/** Kerncijfers uit één insights-rij. */
function metrics(row: Json = {}) {
  const spend = Number(row.spend ?? 0);
  const leads = action(row.actions, "lead");
  const purchases = action(row.actions, "purchase");
  const revenue = action(row.action_values, "purchase");
  return {
    spend,
    impressions: Number(row.impressions ?? 0),
    reach: Number(row.reach ?? 0),
    clicks: Number(row.inline_link_clicks ?? 0),
    ctr: row.inline_link_click_ctr ? `${Number(row.inline_link_click_ctr).toFixed(2)}%` : "-",
    cpc: row.cost_per_inline_link_click,
    lpv: action(row.actions, "lpv"),
    leads,
    checkouts: action(row.actions, "checkout"),
    purchases,
    revenue,
    cpl: leads ? spend / leads : undefined,
    cpa: purchases ? spend / purchases : undefined,
    roas: spend && revenue ? (revenue / spend).toFixed(2) : "-",
  };
}

const INSIGHT_FIELDS = "spend,impressions,reach,frequency,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,cpm,actions,action_values";

function insightsModifier(p: Params): string {
  return p.time_range ? `time_range(${JSON.stringify(p.time_range)})` : `date_preset(${p.date_preset})`;
}

function metricColumns(cur: string): [string, (row: Json) => unknown][] {
  return [
    ["uitgegeven", (r) => money(metrics(r.insights?.data?.[0] ?? r).spend, cur)],
    ["vertoningen", (r) => metrics(r.insights?.data?.[0] ?? r).impressions],
    ["klikken", (r) => metrics(r.insights?.data?.[0] ?? r).clicks],
    ["ctr", (r) => metrics(r.insights?.data?.[0] ?? r).ctr],
    ["leads", (r) => metrics(r.insights?.data?.[0] ?? r).leads],
    ["€/lead", (r) => money(metrics(r.insights?.data?.[0] ?? r).cpl, cur)],
    ["checkouts", (r) => metrics(r.insights?.data?.[0] ?? r).checkouts],
    ["aankopen", (r) => metrics(r.insights?.data?.[0] ?? r).purchases],
    ["roas", (r) => metrics(r.insights?.data?.[0] ?? r).roas],
  ];
}

function budget(row: Json, cur: string): string {
  if (row.daily_budget) return `${money(fromMinor(row.daily_budget, cur), cur)}/dag`;
  if (row.lifetime_budget) return `${money(fromMinor(row.lifetime_budget, cur), cur)} totaal`;
  return "via campagne";
}

const HIDDEN = new Set(["DELETED", "ARCHIVED"]);

// --- Lezen -------------------------------------------------------------------

export async function campaigns(args: Args) {
  const acc = await adAccount();
  const p = period(args);
  const rows = await graph.all(`${acc.id}/campaigns`, {
    fields: `id,name,effective_status,objective,daily_budget,lifetime_budget,start_time,stop_time,insights.${insightsModifier(p)}{${INSIGHT_FIELDS}}`,
  });
  const visible = args.all ? rows : rows.filter((r) => !HIDDEN.has(r.effective_status));
  if (args.json) return dump(visible);
  heading(`Campagnes in ${acc.name} (${acc.id}), cijfers ${periodLabel(args)}`);
  table(visible, [
    ["id", (r) => r.id],
    ["naam", (r) => r.name],
    ["status", (r) => r.effective_status],
    ["doel", (r) => r.objective?.replace("OUTCOME_", "").toLowerCase()],
    ["budget", (r) => budget(r, acc.currency)],
    ...metricColumns(acc.currency),
  ]);
}

export async function adsets(args: Args) {
  const acc = await adAccount();
  const p = period(args);
  const parent = str(args, "campaign") ?? acc.id;
  const rows = await graph.all(`${parent}/adsets`, {
    fields: `id,name,campaign_id,effective_status,daily_budget,lifetime_budget,optimization_goal,targeting,insights.${insightsModifier(p)}{${INSIGHT_FIELDS}}`,
  });
  const visible = args.all ? rows : rows.filter((r) => !HIDDEN.has(r.effective_status));
  if (args.json) return dump(visible);
  heading(`Advertentiesets, cijfers ${periodLabel(args)}`);
  table(visible, [
    ["id", (r) => r.id],
    ["naam", (r) => r.name],
    ["campagne", (r) => r.campaign_id],
    ["status", (r) => r.effective_status],
    ["optimaliseert op", (r) => r.optimization_goal],
    ["budget", (r) => budget(r, acc.currency)],
    ["doelgroep", (r) => audience(r.targeting)],
    ...metricColumns(acc.currency),
  ]);
}

function audience(t: Json): string {
  if (!t) return "-";
  const places = [...(t.geo_locations?.countries ?? []), ...(t.geo_locations?.cities ?? []).map((c: Json) => c.name)];
  const gender = t.genders?.length === 1 ? (t.genders[0] === 1 ? "mannen" : "vrouwen") : "iedereen";
  const interests = (t.flexible_spec ?? []).flatMap((f: Json) => f.interests ?? []).map((i: Json) => i.name ?? i.id);
  const auto = t.targeting_automation?.advantage_audience ? " +Advantage" : "";
  return `${places.join(",")} ${t.age_min ?? 18}-${t.age_max ?? 65} ${gender}${interests.length ? ` [${interests.join(", ")}]` : ""}${auto}`;
}

export async function ads(args: Args) {
  const acc = await adAccount();
  const p = period(args);
  const parent = str(args, "adset") ?? str(args, "campaign") ?? acc.id;
  const rows = await graph.all(`${parent}/ads`, {
    fields: `id,name,adset_id,effective_status,ad_review_feedback,creative{id,title,body,call_to_action_type,object_story_spec,thumbnail_url},insights.${insightsModifier(p)}{${INSIGHT_FIELDS}}`,
  });
  const visible = args.all ? rows : rows.filter((r) => !HIDDEN.has(r.effective_status));
  if (args.json) return dump(visible);
  heading(`Advertenties, cijfers ${periodLabel(args)}`);
  table(visible, [
    ["id", (r) => r.id],
    ["naam", (r) => r.name],
    ["set", (r) => r.adset_id],
    ["status", (r) => r.effective_status],
    ["tekst", (r) => r.creative?.body ?? r.creative?.object_story_spec?.link_data?.message],
    ["kop", (r) => r.creative?.title ?? r.creative?.object_story_spec?.link_data?.name],
    ...metricColumns(acc.currency),
  ]);
  const rejected = visible.filter((r) => r.ad_review_feedback);
  for (const r of rejected) {
    console.log(`\nAfgekeurd of beperkt: ${r.name} (${r.id})`);
    console.log(`  ${JSON.stringify(r.ad_review_feedback)}`);
  }
}

export async function insights(args: Args) {
  const acc = await adAccount();
  const level = str(args, "level") ?? "campaign";
  const breakdowns = str(args, "breakdown");
  const params: Params = {
    level,
    fields: `${level === "account" ? "" : `${level}_id,${level}_name,`}${INSIGHT_FIELDS}`,
    ...period(args),
    breakdowns,
    time_increment: args.daily ? 1 : undefined,
  };
  const rows = await graph.all(`${str(args, "id") ?? acc.id}/insights`, params, 1000);
  if (args.json) return dump(rows);
  heading(`Cijfers per ${level}${breakdowns ? `, uitgesplitst naar ${breakdowns}` : ""} (${periodLabel(args)})`);
  const extra: [string, (r: Json) => unknown][] = [];
  if (args.daily) extra.push(["dag", (r) => r.date_start]);
  if (level !== "account") extra.push(["naam", (r) => r[`${level}_name`]]);
  for (const b of breakdowns?.split(",") ?? []) extra.push([b, (r) => r[b]]);
  table(rows, [...extra, ["bereik", (r) => r.reach], ["€ cpm", (r) => money(r.cpm, acc.currency)], ...metricColumns(acc.currency)]);
}

/** Overzicht zoals een dashboard: totaal, per campagne en per dag. */
export async function report(args: Args) {
  const acc = await adAccount();
  const p = period(args);
  const [total, perCampaign, daily] = await Promise.all([
    graph.get(`${acc.id}/insights`, { level: "account", fields: INSIGHT_FIELDS, ...p }),
    graph.all(`${acc.id}/insights`, { level: "campaign", fields: `campaign_id,campaign_name,${INSIGHT_FIELDS}`, ...p }),
    graph.all(`${acc.id}/insights`, { level: "account", fields: INSIGHT_FIELDS, time_increment: 1, ...p }, 400),
  ]);
  if (args.json) return dump({ total, perCampaign, daily });
  const m = metrics(total.data?.[0]);
  const cur = acc.currency;
  heading(`Rapport ${acc.name}, ${periodLabel(args)}`);
  console.log(`Uitgegeven     ${money(m.spend, cur)}`);
  console.log(`Bereik         ${m.reach} mensen, ${m.impressions} vertoningen`);
  console.log(`Linkklikken    ${m.clicks} (ctr ${m.ctr}, ${money(m.cpc, cur)} per klik)`);
  console.log(`Paginabezoeken ${m.lpv}`);
  console.log(`Leads (quiz)   ${m.leads}${m.cpl ? `, ${money(m.cpl, cur)} per lead` : ""}`);
  console.log(`Checkouts      ${m.checkouts}`);
  console.log(`Aankopen       ${m.purchases}${m.cpa ? `, ${money(m.cpa, cur)} per aankoop` : ""}, omzet ${money(m.revenue, cur)}, roas ${m.roas}`);
  heading("Per campagne");
  table(perCampaign, [["id", (r) => r.campaign_id], ["naam", (r) => r.campaign_name], ...metricColumns(cur)]);
  heading("Per dag");
  table(daily, [["dag", (r) => r.date_start], ...metricColumns(cur)]);
}

export async function targeting(args: Args) {
  const q = args._.join(" ");
  if (!q) throw new Error('Geef een zoekterm, bijv. targeting "fitness"');
  const type = str(args, "type") ?? "adinterest";
  const rows = (await graph.get("search", { type, q, limit: 25, locale: "nl_NL" })).data ?? [];
  if (args.json) return dump(rows);
  table(rows, [
    ["id", (r) => r.id],
    ["naam", (r) => r.name],
    ["omvang", (r) => (r.audience_size_lower_bound ? `${r.audience_size_lower_bound}-${r.audience_size_upper_bound}` : "-")],
    ["pad", (r) => r.path?.join(" > ")],
  ]);
}

export async function pixels(args: Args) {
  const acc = await adAccount();
  const rows = await graph.all(`${acc.id}/adspixels`, { fields: "id,name,last_fired_time,is_unavailable" });
  if (args.json) return dump(rows);
  table(rows, [["id", (r) => r.id], ["naam", (r) => r.name], ["laatst actief", (r) => date(r.last_fired_time)]]);
}

export async function audiences(args: Args) {
  const acc = await adAccount();
  const rows = await graph.all(`${acc.id}/customaudiences`, {
    fields: "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,time_updated",
  });
  if (args.json) return dump(rows);
  table(rows, [
    ["id", (r) => r.id],
    ["naam", (r) => r.name],
    ["soort", (r) => r.subtype],
    ["omvang", (r) => (r.approximate_count_lower_bound > 0 ? `${r.approximate_count_lower_bound}-${r.approximate_count_upper_bound}` : "klein")],
    ["status", (r) => r.delivery_status?.description],
  ]);
}

export async function leadforms(args: Args) {
  const p = await page();
  const rows = await graph.all(`${p.id}/leadgen_forms`, { fields: "id,name,status,leads_count,created_time" }, 200, p.access_token);
  if (args.json) return dump(rows);
  table(rows, [["id", (r) => r.id], ["naam", (r) => r.name], ["status", (r) => r.status], ["leads", (r) => r.leads_count], ["gemaakt", (r) => date(r.created_time)]]);
}

export async function leads(args: Args) {
  const form = args._[0];
  if (!form) throw new Error("Geef het id van het leadformulier (zie leadforms)");
  const p = await page();
  const rows = await graph.all(`${form}/leads`, { fields: "id,created_time,field_data,ad_name,campaign_name" }, 500, p.access_token);
  if (args.json) return dump(rows);
  table(rows, [
    ["datum", (r) => date(r.created_time)],
    ["campagne", (r) => r.campaign_name],
    ["gegevens", (r) => r.field_data?.map((f: Json) => `${f.name}: ${f.values?.join("/")}`).join(" | ")],
  ]);
}

// --- Wijzigen ----------------------------------------------------------------

async function describeObject(id: string) {
  const info = await graph.get(id, { metadata: 1, fields: "name,status" });
  const type: string = info.metadata?.type ?? "object";
  const label = { campaign: "campagne", adset: "advertentieset", ad: "advertentie" }[type] ?? type;
  return { name: info.name as string, status: info.status as string, label };
}

async function setStatus(args: Args, status: "PAUSED" | "ACTIVE") {
  const id = args._[0];
  if (!id) throw new Error("Geef het id van de campagne, set of advertentie");
  const obj = await describeObject(id);
  const verb = status === "PAUSED" ? "pauzeren" : "aanzetten (dit kost geld)";
  if (!confirmed(args, [`${obj.label} "${obj.name}" (${id}) ${verb}; nu ${obj.status}`])) return;
  await graph.post(id, { status });
  console.log(`Klaar: ${obj.label} "${obj.name}" staat nu op ${status}.`);
}

export const pause = (args: Args) => setStatus(args, "PAUSED");
export const resume = (args: Args) => setStatus(args, "ACTIVE");

export async function setBudget(args: Args) {
  const id = args._[0];
  if (!id) throw new Error("Geef het id van de campagne of set");
  const daily = num(args, "daily");
  const lifetime = num(args, "lifetime");
  if (daily === undefined && lifetime === undefined) throw new Error("Geef --daily <bedrag> of --lifetime <bedrag>");
  const acc = await adAccount();
  const cur = acc.currency;
  const now = await graph.get(id, { fields: "name,daily_budget,lifetime_budget" });
  if (!now.daily_budget && !now.lifetime_budget) {
    throw new Error(`"${now.name}" heeft geen eigen budget; het budget staat op de campagne. Pas dat id aan.`);
  }
  const params: Params = daily !== undefined ? { daily_budget: toMinor(daily, cur) } : { lifetime_budget: toMinor(lifetime!, cur) };
  const newText = daily !== undefined ? `${money(daily, cur)}/dag` : `${money(lifetime, cur)} totaal`;
  if (!confirmed(args, [`budget van "${now.name}" (${id}): ${budget(now, cur)} → ${newText}`])) return;
  await graph.post(id, params);
  console.log(`Klaar: budget van "${now.name}" is nu ${newText}.`);
}

export async function rename(args: Args) {
  const id = args._[0];
  const name = need(args, "name");
  if (!id) throw new Error("Geef het id");
  const obj = await describeObject(id);
  if (!confirmed(args, [`${obj.label} "${obj.name}" hernoemen naar "${name}"`])) return;
  await graph.post(id, { name });
  console.log("Klaar.");
}

export async function duplicate(args: Args) {
  const id = args._[0];
  if (!id) throw new Error("Geef het id van de campagne");
  const obj = await describeObject(id);
  if (!confirmed(args, [`${obj.label} "${obj.name}" kopiëren met alle sets en advertenties; de kopie staat op pauze`])) return;
  const res = await graph.post(`${id}/copies`, { deep_copy: true, status_option: "PAUSED", rename_options: { rename_suffix: " (kopie)" } });
  console.log(`Klaar: kopie ${res.copied_campaign_id ?? res.copied_adset_id ?? res.ad_object_ids?.[0]?.copied_id ?? JSON.stringify(res)}`);
}

export async function remove(args: Args) {
  const id = args._[0];
  if (!id) throw new Error("Geef het id");
  const obj = await describeObject(id);
  if (!confirmed(args, [`${obj.label} "${obj.name}" (${id}) VERWIJDEREN; dit kan niet ongedaan worden`])) return;
  await graph.delete(id);
  console.log("Verwijderd.");
}

// --- Nieuwe advertentie ------------------------------------------------------

const OBJECTIVES: Record<string, { objective: string; goal: string; event?: string; web?: boolean }> = {
  verkeer: { objective: "OUTCOME_TRAFFIC", goal: "LANDING_PAGE_VIEWS", web: true },
  leads: { objective: "OUTCOME_LEADS", goal: "OFFSITE_CONVERSIONS", event: "LEAD", web: true },
  verkoop: { objective: "OUTCOME_SALES", goal: "OFFSITE_CONVERSIONS", event: "PURCHASE", web: true },
  bereik: { objective: "OUTCOME_AWARENESS", goal: "REACH" },
};
const OBJECTIVE_ALIASES: Record<string, string> = { traffic: "verkeer", sales: "verkoop", awareness: "bereik", lead: "leads" };

// Zo ziet het beheer van de website per campagne en advertentie waar een bestelling vandaan komt.
const URL_TAGS = "utm_source=meta&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}";

async function pixelId(): Promise<string> {
  const configured = process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (configured) return configured;
  const acc = await adAccount();
  const rows = await graph.all(`${acc.id}/adspixels`, { fields: "id,name" });
  if (rows.length !== 1) throw new Error(`Kies een pixel met META_PIXEL_ID. Gevonden: ${rows.map((r) => `${r.id} (${r.name})`).join(", ") || "geen"}`);
  return rows[0].id;
}

/** Bouwt de creative (afbeelding, tekst, knop) en geeft ook een leesbare samenvatting terug. */
async function creativeSpec(args: Args) {
  const p = await page();
  const ig = await instagramId(false);
  const url = need(args, "url", "landingspagina, bijv. https://afvallenenafblijven.nl/lp/voeding");
  const text = need(args, "text", "hoofdtekst van de advertentie");
  const headline = need(args, "headline", "kop onder de afbeelding");
  const image = need(args, "image", "bestand of url van de afbeelding");
  const cta = str(args, "cta") ?? "LEARN_MORE";
  const spec = {
    page_id: p.id,
    ...(ig ? { instagram_user_id: ig } : {}),
    link_data: {
      link: url,
      message: text,
      name: headline,
      description: str(args, "description"),
      call_to_action: { type: cta, value: { link: url } },
    },
  };
  const summary = [
    `pagina: ${p.name}${ig ? ` + Instagram ${ig}` : " (Instagram via de pagina)"}`,
    `afbeelding: ${image}`,
    `tekst: ${text}`,
    `kop: ${headline}${str(args, "description") ? ` / ${str(args, "description")}` : ""}`,
    `knop: ${cta} → ${url}`,
    `utm: ${URL_TAGS}`,
  ];
  return { spec, image, summary };
}

async function createCreativeAndAd(accId: string, name: string, adsetId: string, built: Awaited<ReturnType<typeof creativeSpec>>, status: string, created: string[]) {
  const { name: filename, base64 } = await imageBytes(built.image);
  const upload = await graph.post(`${accId}/adimages`, { bytes: base64, name: filename });
  const hash = (Object.values(upload.images ?? {})[0] as Json)?.hash;
  if (!hash) throw new Error(`Afbeelding uploaden mislukt: ${JSON.stringify(upload)}`);
  const spec = { ...built.spec, link_data: { ...built.spec.link_data, image_hash: hash } };
  const creative = await graph.post(`${accId}/adcreatives`, { name, object_story_spec: spec, url_tags: URL_TAGS });
  created.push(creative.id);
  const ad = await graph.post(`${accId}/ads`, { name, adset_id: adsetId, creative: { creative_id: creative.id }, status });
  created.push(ad.id);
  return { creativeId: creative.id as string, adId: ad.id as string };
}

async function cleanup(created: string[]) {
  for (const id of created.reverse()) {
    try {
      await graph.delete(id);
      console.error(`  opgeruimd: ${id}`);
    } catch {
      console.error(`  kon ${id} niet opruimen; verwijder het zelf (het staat op pauze)`);
    }
  }
}

/** Campagne + advertentieset + advertentie in één keer, standaard op pauze. */
export async function createAd(args: Args) {
  const acc = await adAccount();
  const cur = acc.currency;
  const goalName = (str(args, "goal") ?? "leads").toLowerCase();
  const goal = OBJECTIVES[OBJECTIVE_ALIASES[goalName] ?? goalName];
  if (!goal) throw new Error(`Onbekend doel "${goalName}". Kies uit: ${Object.keys(OBJECTIVES).join(", ")}`);
  const name = need(args, "name", "naam van de campagne");
  const daily = num(args, "daily");
  if (!daily) throw new Error("--daily ontbreekt (dagbudget in euro's)");

  const ageMin = num(args, "age-min") ?? 18;
  const ageMax = num(args, "age-max") ?? 65;
  // Meta staat advertenties over afvallen alleen toe voor 18+.
  if (ageMin < 18) throw new Error("Advertenties over afvallen mogen alleen naar mensen van 18 jaar en ouder");
  const gender = str(args, "gender");
  const genders = gender === "vrouw" || gender === "vrouwen" ? [2] : gender === "man" || gender === "mannen" ? [1] : undefined;
  const interests = list(args, "interests");
  const platforms = list(args, "platforms");
  const advantage = Boolean(args.advantage);
  const targetingSpec = {
    geo_locations: { countries: list(args, "countries") ?? ["NL"] },
    age_min: advantage ? Math.min(ageMin, 25) : ageMin,
    ...(advantage ? {} : { age_max: ageMax }),
    ...(genders ? { genders } : {}),
    ...(interests ? { flexible_spec: [{ interests: interests.map((id) => ({ id })) }] } : {}),
    ...(platforms ? { publisher_platforms: platforms } : {}),
    targeting_automation: { advantage_audience: advantage ? 1 : 0 },
  };
  const pixel = goal.event ? await pixelId() : undefined;
  const built = await creativeSpec(args);
  const start = str(args, "start");
  const end = str(args, "end");
  const live = Boolean(args.active);

  const preview = [
    `campagne "${name}": doel ${goal.objective}, ${money(daily, cur)} per dag, ${live ? "DIRECT ACTIEF na goedkeuring" : "op pauze"}`,
    `doelgroep: ${audience(targetingSpec)}${platforms ? `, alleen ${platforms.join("+")}` : ", automatische plaatsingen"}`,
    `optimaliseert op: ${goal.goal}${pixel ? ` (${goal.event} via pixel ${pixel})` : ""}`,
    ...(start || end ? [`looptijd: ${start ?? "nu"} t/m ${end ?? "doorlopend"}`] : []),
    ...built.summary,
  ];
  if (!confirmed(args, preview)) return;

  const created: string[] = [];
  try {
    const campaign = await graph.post(`${acc.id}/campaigns`, {
      name,
      objective: goal.objective,
      status: live ? "ACTIVE" : "PAUSED",
      special_ad_categories: [],
      daily_budget: toMinor(daily, cur),
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    });
    created.push(campaign.id);
    // set en advertentie staan aan; zolang de campagne op pauze staat, loopt er niets
    const adset = await graph.post(`${acc.id}/adsets`, {
      name: `${name} - doelgroep`,
      campaign_id: campaign.id,
      optimization_goal: goal.goal,
      billing_event: "IMPRESSIONS",
      ...(goal.web ? { destination_type: "WEBSITE" } : {}),
      ...(pixel ? { promoted_object: { pixel_id: pixel, custom_event_type: goal.event } } : {}),
      targeting: targetingSpec,
      start_time: start ? unixTime(start) : undefined,
      end_time: end ? unixTime(end) : undefined,
      status: "ACTIVE",
    });
    created.push(adset.id);
    const { adId } = await createCreativeAndAd(acc.id, `${name} - advertentie 1`, adset.id, built, "ACTIVE", created);
    console.log("Klaar:");
    console.log(`  campagne  ${campaign.id}  (${live ? "actief" : "op pauze"})`);
    console.log(`  set       ${adset.id}`);
    console.log(`  advertentie ${adId}  (Meta keurt hem eerst goed)`);
    if (!live) console.log(`\nAanzetten: resume ${campaign.id} --confirm`);
  } catch (error) {
    console.error("Mislukt; wat al was aangemaakt ruim ik op:");
    await cleanup(created);
    throw error;
  }
}

/** Extra advertentie (variant) in een bestaande set; standaard op pauze. */
export async function addAd(args: Args) {
  const acc = await adAccount();
  const adsetId = need(args, "adset", "id van de advertentieset");
  const set = await graph.get(adsetId, { fields: "name,campaign{name}" });
  const name = str(args, "name") ?? `${set.name} - variant`;
  const built = await creativeSpec(args);
  const status = args.active ? "ACTIVE" : "PAUSED";
  if (!confirmed(args, [`nieuwe advertentie "${name}" in set "${set.name}" (${status === "ACTIVE" ? "direct actief" : "op pauze"})`, ...built.summary])) return;
  const created: string[] = [];
  try {
    const { adId } = await createCreativeAndAd(acc.id, name, adsetId, built, status, created);
    console.log(`Klaar: advertentie ${adId}${status === "PAUSED" ? `; aanzetten met resume ${adId} --confirm` : ""}`);
  } catch (error) {
    console.error("Mislukt; wat al was aangemaakt ruim ik op:");
    await cleanup(created);
    throw error;
  }
}
