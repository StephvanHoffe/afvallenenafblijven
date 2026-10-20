import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/app/[lang]/(site)/inloggen/LoginForm";
import { defineCopy, type Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    metaTitle: "Inloggen",
    metaDescription: "Log in op Mijn schema's met een persoonlijke inloglink.",
    title: "Inloggen op Mijn schema's",
    intro: "Geen wachtwoord nodig. Vul je e-mailadres in en je ontvangt een persoonlijke inloglink.",
    expired: "Deze inloglink is verlopen of ongeldig. Vraag hieronder een nieuwe aan.",
  },
  en: {
    metaTitle: "Log in",
    metaDescription: "Log in to My plans with a personal login link.",
    title: "Log in to My plans",
    intro: "No password needed. Enter your email address and you'll receive a personal login link.",
    expired: "This login link has expired or is invalid. Request a new one below.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return {
    title: copy[l].metaTitle,
    description: copy[l].metaDescription,
    robots: { index: false },
  };
}

export default async function LoginPage({ searchParams }: PageProps<"/[lang]/inloggen">) {
  const l = await getLocale();
  const c = copy[l];
  return (
    <section className="container-page py-14 sm:py-20">
      <div className="mx-auto max-w-md">
        <h1 className="heading-lg">{c.title}</h1>
        <p className="mt-3 text-muted">{c.intro}</p>
        <Suspense>
          <ExpiredNotice searchParams={searchParams} l={l} />
        </Suspense>
        <div className="card mt-6 p-6">
          <LoginForm />
        </div>
      </div>
    </section>
  );
}

async function ExpiredNotice({ searchParams, l }: Pick<PageProps<"/[lang]/inloggen">, "searchParams"> & { l: Locale }) {
  const sp = await searchParams;
  if (sp.verlopen !== "1") return null;
  return (
    <p role="alert" className="mt-4 rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
      {copy[l].expired}
    </p>
  );
}
