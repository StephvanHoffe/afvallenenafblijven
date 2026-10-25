import { Logo } from "@/components/Logo";
import { defineCopy } from "@/i18n/config";
import Link from "@/i18n/Link";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    title: "Deze pagina bestaat niet (meer)",
    text: "Misschien is de link verouderd. Probeer het via de homepage.",
    home: "Naar de homepage",
    start: "Start je plan",
  },
  en: {
    title: "This page doesn't exist (anymore)",
    text: "The link may be out of date. Try starting from the homepage.",
    home: "Go to the homepage",
    start: "Start your plan",
  },
});

export default async function NotFound() {
  const c = copy[await getLocale()];
  return (
    <section className="container-page py-20 text-center">
      <div className="mb-10 flex justify-center">
        <Logo />
      </div>
      <p className="eyebrow mb-3">404</p>
      <h1 className="heading-lg">{c.title}</h1>
      <p className="mt-3 text-muted">{c.text}</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          {c.home}
        </Link>
        <Link href="/start" className="btn-secondary">
          {c.start}
        </Link>
      </div>
    </section>
  );
}
