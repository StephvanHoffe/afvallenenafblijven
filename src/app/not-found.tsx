import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <section className="container-page py-20 text-center">
      <div className="mb-10 flex justify-center">
        <Logo />
      </div>
      <p className="eyebrow mb-3">404</p>
      <h1 className="heading-lg">Deze pagina bestaat niet (meer)</h1>
      <p className="mt-3 text-muted">Misschien is de link verouderd. Probeer het via de homepage.</p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Naar de homepage
        </Link>
        <Link href="/start" className="btn-secondary">
          Start je plan
        </Link>
      </div>
    </section>
  );
}
