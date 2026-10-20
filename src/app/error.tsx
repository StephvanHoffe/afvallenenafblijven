"use client";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <section className="container-page py-20 text-center">
      <h1 className="heading-lg">Er ging iets mis</h1>
      <p className="mt-3 text-muted">Probeer het opnieuw. Blijft het misgaan? Neem dan contact met ons op.</p>
      <button type="button" onClick={() => retry()} className="btn-primary mt-8">
        Opnieuw proberen
      </button>
    </section>
  );
}
