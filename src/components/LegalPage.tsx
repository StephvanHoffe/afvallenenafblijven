import { site } from "@/config/site";

export function LegalPage({ title, intro, children }: { title: string; intro?: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="heading-lg">{title}</h1>
        <p className="mt-2 text-sm text-muted">Laatst bijgewerkt: {site.legalUpdated}</p>
        {intro && <p className="mt-6 text-lg leading-relaxed text-muted">{intro}</p>}
        <div className="prose-legal mt-6">{children}</div>
      </div>
    </article>
  );
}
