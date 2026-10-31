/**
 * Facebook en Instagram beheren vanaf de opdrachtregel (of vanuit een chat met Claude).
 *
 *   npm run meta -- help
 *   npm run meta -- report --period last_7d
 *   npm run meta -- pause 1234567890 --confirm
 *
 * Alles wat iets verandert, toont eerst een voorbeeld en gebeurt pas met --confirm.
 * Uitleg en het instellen van het token: scripts/meta/README.md.
 */
import * as ads from "./ads";
import { ConfigError, GraphError, graph, type Params } from "./client";
import * as organic from "./organic";
import { confirmed, dump, parseArgs, splitPair, type Args } from "./util";

const HELP = `
Facebook en Instagram beheren                     npm run meta -- <opdracht> [opties]

Algemeen
  status                         token, rechten, advertentieaccounts, pagina's en Instagram
  api <GET|POST|DELETE> <pad> [veld=waarde ...]
                                 elke andere Graph API-aanroep (POST/DELETE alleen met --confirm)

Advertenties bekijken            periode: --period last_7d|last_30d|this_month|... of --since/--until JJJJ-MM-DD
  report                         dashboard: totaal, per campagne en per dag (leads, checkouts, aankopen, roas)
  campaigns [--all]              campagnes met budget en cijfers (--all toont ook gearchiveerde)
  adsets [--campaign ID]         advertentiesets met doelgroep en cijfers
  ads [--campaign ID|--adset ID] advertenties met tekst, cijfers en afkeuringen
  insights [--level account|campaign|adset|ad] [--breakdown age,gender|publisher_platform,platform_position|region]
           [--daily] [--id ID]   cijfers uitgesplitst
  targeting <zoekterm>           interesses zoeken voor de doelgroep (id's voor --interests)
  pixels | audiences | leadforms | leads <formulier-id>

Advertenties wijzigen            (voorbeeld; met --confirm voer je het uit)
  pause <id> | resume <id>       campagne, set of advertentie pauzeren of aanzetten
  budget <id> --daily 15 | --lifetime 300
  rename <id> --name "..."
  duplicate <campagne-id>        kopie op pauze, met alle sets en advertenties
  delete <id>
  create-ad --name "..." --goal leads|verkoop|verkeer|bereik --daily 10
            --url <landingspagina> --image <bestand|url> --text "..." --headline "..."
            [--description "..."] [--cta LEARN_MORE|SIGN_UP|GET_OFFER|SUBSCRIBE|ORDER_NOW]
            [--countries NL,BE] [--age-min 25] [--age-max 55] [--gender vrouw|man]
            [--interests id1,id2] [--platforms facebook,instagram] [--advantage]
            [--start "2026-11-23 06:00"] [--end "2026-11-30 23:59"] [--active]
                                 campagne + set + advertentie; standaard op pauze
  add-ad --adset ID --url ... --image ... --text ... --headline ... [--name ...] [--active]
                                 extra variant in een bestaande set

Facebook-pagina
  posts [--limit 10]             recente berichten met reacties en shares
  scheduled                      ingeplande berichten
  post --message "..." [--link URL] [--image bestand|url] [--schedule "2026-11-23 08:00"]
  page-stats [--days 28]

Instagram                        (media als openbare https-url, afbeeldingen als JPEG)
  ig-posts [--limit 10]          recente berichten met likes, bereik, bewaard en gedeeld
  ig-post --image URL [--caption "..."]       losse afbeelding
  ig-post --images URL1,URL2,... [--caption]  carrousel
  ig-post --video URL [--caption "..."]       reel
  ig-post --image URL --story                 story
  ig-stats [--days 28]

Reacties (Facebook en Instagram)
  comments [--open] [--posts 10] [--fb|--ig]  recente reacties; --open alleen onbeantwoorde
  reply <reactie-id> --message "..."
  hide <reactie-id> [--show]

Overal: --json voor de ruwe gegevens.
`;

async function api(args: Args) {
  const [method = "GET", path] = args._;
  if (!path) throw new Error("Gebruik: api GET act_123/campaigns fields=id,name");
  const params: Params = {};
  for (const pair of args._.slice(2)) {
    const [key, value] = splitPair(pair);
    params[key] = value?.startsWith("{") || value?.startsWith("[") ? JSON.parse(value) : value;
  }
  const verb = method.toUpperCase();
  if (verb === "GET") return dump(await graph.get(path, params));
  if (verb !== "POST" && verb !== "DELETE") throw new Error(`Onbekende methode ${method}`);
  if (!confirmed(args, [`${verb} ${path} ${JSON.stringify(params)}`])) return;
  dump(verb === "POST" ? await graph.post(path, params) : await graph.delete(path, params));
}

const COMMANDS: Record<string, (args: Args) => Promise<unknown>> = {
  status: organic.status,
  api,
  report: ads.report,
  campaigns: ads.campaigns,
  adsets: ads.adsets,
  ads: ads.ads,
  insights: ads.insights,
  targeting: ads.targeting,
  pixels: ads.pixels,
  audiences: ads.audiences,
  leadforms: ads.leadforms,
  leads: ads.leads,
  pause: ads.pause,
  resume: ads.resume,
  budget: ads.setBudget,
  rename: ads.rename,
  duplicate: ads.duplicate,
  delete: ads.remove,
  "create-ad": ads.createAd,
  "add-ad": ads.addAd,
  posts: organic.posts,
  scheduled: organic.scheduled,
  post: organic.post,
  "page-stats": organic.pageStats,
  "ig-posts": organic.igPosts,
  "ig-post": organic.igPost,
  "ig-stats": organic.igStats,
  comments: organic.comments,
  reply: organic.reply,
  hide: organic.hide,
};

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const run = command ? COMMANDS[command] : undefined;
  if (!run) {
    console.log(HELP);
    if (command && command !== "help") process.exitCode = 1;
    return;
  }
  await run(parseArgs(rest));
}

main().catch((error) => {
  if (error instanceof GraphError) console.error(`Meta gaf een fout: ${error.message}`);
  else if (error instanceof ConfigError) console.error(error.message);
  else console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
