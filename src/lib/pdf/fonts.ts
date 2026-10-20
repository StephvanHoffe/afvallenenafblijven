import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

let family: string | null = null;

/**
 * Registreert het lettertype van de website (Plus Jakarta Sans, OFL-licentie)
 * voor de PDF's. Lukt dat niet, dan valt de PDF terug op Helvetica.
 */
export function pdfFontFamily(): string {
  if (family) return family;
  try {
    const dir = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
    Font.register({
      family: "Jakarta",
      fonts: [400, 600, 700, 800].map((fontWeight) => ({
        src: `data:font/woff;base64,${readFileSync(path.join(dir, `PlusJakartaSans-${fontWeight}.woff`)).toString("base64")}`,
        fontWeight,
      })),
    });
    family = "Jakarta";
  } catch (err) {
    console.error("PDF-lettertype niet gevonden, Helvetica wordt gebruikt", err);
    family = "Helvetica";
  }
  // Geen automatische (Engelse) woordafbreking in Nederlandse tekst.
  Font.registerHyphenationCallback((word) => [word]);
  return family;
}
