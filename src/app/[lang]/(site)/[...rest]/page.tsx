import { notFound } from "next/navigation";

/** Vangt onbekende adressen op, zodat de 404-pagina binnen de site-opmaak verschijnt. */
export default function CatchAll() {
  notFound();
}
