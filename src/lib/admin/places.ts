/**
 * Namen bij de plaatsgegevens van de bezoekersmeting: Vercel geeft het land als
 * ISO-code (NL) en de regio als het tweede deel van de ISO 3166-2-code (NH).
 */

const countries = new Intl.DisplayNames(["nl"], { type: "region" });

const REGIONS: Record<string, Record<string, string>> = {
  NL: {
    DR: "Drenthe",
    FL: "Flevoland",
    FR: "Friesland",
    GE: "Gelderland",
    GR: "Groningen",
    LI: "Limburg",
    NB: "Noord-Brabant",
    NH: "Noord-Holland",
    OV: "Overijssel",
    UT: "Utrecht",
    ZE: "Zeeland",
    ZH: "Zuid-Holland",
  },
  BE: {
    BRU: "Brussel",
    VAN: "Antwerpen",
    VBR: "Vlaams-Brabant",
    VLI: "Limburg (BE)",
    VOV: "Oost-Vlaanderen",
    VWV: "West-Vlaanderen",
    WBR: "Waals-Brabant",
    WHT: "Henegouwen",
    WLG: "Luik",
    WLX: "Luxemburg (BE)",
    WNA: "Namen",
  },
};

export function countryName(code: string | null | undefined): string {
  if (!code) return "Onbekend";
  try {
    return countries.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "Noord-Holland", of "Bayern (Duitsland)" buiten Nederland en België. */
export function regionName(country: string, region: string): string {
  const known = REGIONS[country]?.[region];
  if (known) return known;
  return `${region} (${countryName(country)})`;
}

/** "Amsterdam", of "Antwerpen (België)" buiten Nederland. */
export function cityName(city: string, country: string | null): string {
  return country && country !== "NL" ? `${city} (${countryName(country)})` : city;
}
