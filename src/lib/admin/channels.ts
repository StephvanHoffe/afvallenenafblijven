/**
 * Waar een bezoek vandaan kwam, ingedeeld in kanalen: eerst de campagne uit de
 * link (utm), anders de website waarvandaan het bezoek kwam, anders direct.
 */

export type Channel = "campagne" | "zoekmachine" | "social" | "email" | "verwijzing" | "direct";

export const CHANNELS: Channel[] = ["campagne", "zoekmachine", "social", "email", "verwijzing", "direct"];

export const CHANNEL_LABELS: Record<Channel, string> = {
  campagne: "Campagnes (utm-links)",
  zoekmachine: "Zoekmachines",
  social: "Social media",
  email: "E-mail",
  verwijzing: "Andere websites",
  direct: "Direct of onbekend",
};

const SEARCH = /(^|\.)(google|bing|duckduckgo|ecosia|yahoo|startpage|qwant|baidu|yandex|brave)\./;
const SOCIAL = /(^|\.)(facebook|fb|instagram|tiktok|pinterest|linkedin|lnkd|youtube|youtu|snapchat|reddit|threads|whatsapp|telegram)\.|(^|\.)(t\.co|x\.com|twitter\.com)$/;
const MAIL = /(^|\.)(mail\.google|outlook\.(live|office)|webmail|mail\.yahoo|mail\.proton|ziggo\.nl|kpnmail)/;

export function channelFor(utmSource: string | null | undefined, referrer: string | null | undefined): Channel {
  if (utmSource) return /mail|nieuwsbrief|newsletter/i.test(utmSource) ? "email" : "campagne";
  if (!referrer) return "direct";
  if (SEARCH.test(referrer)) return "zoekmachine";
  if (SOCIAL.test(referrer)) return "social";
  if (MAIL.test(referrer)) return "email";
  return "verwijzing";
}
