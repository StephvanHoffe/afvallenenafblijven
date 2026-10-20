import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/(site)/inloggen/LoginForm";

export const metadata: Metadata = {
  title: "Inloggen",
  description: "Log in op Mijn schema's met een persoonlijke inloglink.",
  robots: { index: false },
};

export default function LoginPage({ searchParams }: PageProps<"/inloggen">) {
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="heading-lg">Inloggen op Mijn schema&apos;s</h1>
        <p className="mt-3 text-muted">
          Geen wachtwoord nodig. Vul je e-mailadres in en je ontvangt een persoonlijke inloglink.
        </p>
        <Suspense>
          <ExpiredNotice searchParams={searchParams} />
        </Suspense>
        <div className="card mt-6 p-6">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}

async function ExpiredNotice({ searchParams }: Pick<PageProps<"/inloggen">, "searchParams">) {
  const sp = await searchParams;
  if (sp.verlopen !== "1") return null;
  return (
    <p role="alert" className="mt-4 rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
      Deze inloglink is verlopen of ongeldig. Vraag hieronder een nieuwe aan.
    </p>
  );
}
