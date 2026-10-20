/**
 * Het lettertype in de PDF bevat (net als de website) alleen de gangbare
 * West-Europese tekens. Tekens die er niet in zitten, zoals pijltjes of emoji,
 * vervangen we door een leesbaar alternatief of laten we weg, zodat er nooit
 * lege vakjes in een schema staan.
 */

const REPLACEMENTS: Record<string, string> = {
  "→": "->",
  "⇒": "->",
  "➜": "->",
  "←": "<-",
  "≥": ">=",
  "≤": "<=",
  "≈": "±",
  "✓": "",
  "✔": "",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
  "­": "",
  "‑": "-",
  "‒": "-",
  "―": "—",
  "−": "-",
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  " ": " ",
  "Ł": "L",
  "ł": "l",
  "Đ": "D",
  "đ": "d",
  "ß": "ss",
};

// Tekens die in alle gebruikte gewichten van Plus Jakarta Sans (latin) zitten.
const SUPPORTED =
  /[\n\r\t -~ -¬®-ÿĂıŒœˆ˚˜  ​–—‘-‚“-„•…′″‹›⁄€™↑↓∕]/u;

export function pdfText(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return "";
  let out = "";
  for (const ch of String(input)) {
    if (SUPPORTED.test(ch)) {
      out += ch;
      continue;
    }
    if (ch in REPLACEMENTS) {
      out += REPLACEMENTS[ch];
      continue;
    }
    // Letters met accenten die het lettertype niet kent: zonder accent tonen.
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && [...base].every((c) => SUPPORTED.test(c))) out += base;
  }
  return out.replace(/ {2,}/g, " ");
}
