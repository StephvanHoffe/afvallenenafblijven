import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { connection } from "next/server";
import { CircleAlert, CircleCheck, ImageIcon, Sparkles } from "lucide-react";
import { requestInstagramPost } from "@/app/beheer/actions";
import { AutoRefresh } from "@/components/beheer/AutoRefresh";
import { InstagramStatusBadge, instagramBusy, instagramWhen } from "@/components/beheer/instagram";
import { NeedsDatabase, Notice, PageTitle, Panel } from "@/components/beheer/ui";
import { SubmitButton } from "@/components/forms/SubmitButton";
import Link from "@/i18n/Link";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { loadStoredConfig } from "@/lib/db";
import { instagramConfigured } from "@/lib/instagram/api";
import { POST_FORMATS, formatLabels } from "@/lib/instagram/content";
import { listInstagramPosts, slideUrl, type InstagramPost } from "@/lib/instagram/posts";

export const metadata: Metadata = { title: "Instagram" };
// Claude maakt de post direct na het versturen (op de achtergrond, meestal 1-2 minuten) en plaatst hem eventueel meteen.
export const maxDuration = 800;

const HERE = "/beheer/instagram";

const EXAMPLES = [
  "Carrousel met 5 eiwitrijke ontbijtjes onder de 400 kcal voor mensen die 's ochtends weinig tijd hebben",
  "Waarom je niet hoeft te stoppen met brood om af te vallen",
  "3 fouten die mensen maken als ze na de zomer weer gaan sporten",
  "Een korte, motiverende post voor maandagochtend: opnieuw beginnen hoeft niet perfect",
  "Aankondiging van de Black Friday-actie, voor de eerste dag van de actie",
];

export default function InstagramPage({ searchParams }: PageProps<"/beheer/instagram">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <Instagram searchParams={searchParams} />
    </Suspense>
  );
}

async function Instagram({ searchParams }: Pick<PageProps<"/beheer/instagram">, "searchParams">) {
  const demo = isDemoMode();
  if (!demo) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  const sp = await searchParams;
  if (!demo) await loadStoredConfig();
  const connected = !demo && instagramConfigured();
  const posts: InstagramPost[] = demo ? [] : await listInstagramPosts();

  return (
    <>
      {posts.some(instagramBusy) && <AutoRefresh />}
      <Notice code={typeof sp.melding === "string" ? sp.melding : undefined} />
      <PageTitle
        title="Instagram"
        intro="Schrijf waar een post over moet gaan. Claude maakt de afbeelding(en) in je huisstijl, het bijschrift en de hashtags, en de website zet de post op je Instagram."
      >
        {connected ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <CircleCheck className="size-4" aria-hidden /> Instagram is gekoppeld
          </p>
        ) : (
          <Link href="/beheer/koppelingen#instagram" className="flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:underline">
            <CircleAlert className="size-4" aria-hidden /> Koppel Instagram om automatisch te plaatsen
          </Link>
        )}
      </PageTitle>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Panel title="Nieuwe post">
          <form action={requestInstagramPost} className="space-y-5 px-5 py-4">
            <input type="hidden" name="terug" value={HERE} />
            <label className="block">
              <span className="label">Waar gaat de post over?</span>
              <textarea
                name="opdracht"
                required
                minLength={5}
                maxLength={4000}
                rows={4}
                className="input"
                placeholder="Bijv. een carrousel met 5 tips om minder te snaaien in de avond, voor mensen met een drukke baan"
              />
            </label>
            <fieldset>
              <legend className="label">Vorm</legend>
              <div className="flex flex-wrap gap-2">
                {POST_FORMATS.map((f) => (
                  <label key={f} className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-3.5 py-2 text-sm font-semibold has-checked:border-brand-500 has-checked:bg-brand-50">
                    <input type="radio" name="vorm" value={f} defaultChecked={f === "auto"} className="accent-brand-600" />
                    {formatLabels[f]}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Wanneer plaatsen?</legend>
              <div className="space-y-2 text-sm">
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="radio" name="wanneer" value="nu" defaultChecked={connected} disabled={!connected && !demo} className="mt-0.5 accent-brand-600" />
                  <span>
                    <span className="font-semibold">Direct na het maken</span>
                    <span className="block text-muted">Claude maakt de post en hij staat binnen een paar minuten op Instagram.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="radio" name="wanneer" value="moment" disabled={!connected && !demo} className="mt-0.5 accent-brand-600" />
                  <span className="min-w-0">
                    <span className="font-semibold">Op een moment</span>
                    <span className="block text-muted">Automatisch geplaatst op de datum en tijd die je kiest (Nederlandse tijd).</span>
                    <input type="datetime-local" name="moment" className="input mt-2 !w-auto !py-2 text-sm" aria-label="Datum en tijd" />
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2.5">
                  <input type="radio" name="wanneer" value="concept" defaultChecked={!connected} className="mt-0.5 accent-brand-600" />
                  <span>
                    <span className="font-semibold">Eerst bekijken</span>
                    <span className="block text-muted">Je krijgt een concept te zien en plaatst of plant hem zelf.</span>
                  </span>
                </label>
              </div>
            </fieldset>
            <SubmitButton className="btn-primary !px-5 !py-2.5 text-sm">
              <Sparkles className="size-4" aria-hidden /> Post maken
            </SubmitButton>
          </form>
        </Panel>

        <Panel title="Zo werkt het">
          <div className="space-y-3 px-5 py-4 text-sm text-muted">
            <p>
              Claude schrijft de tekst op de afbeeldingen, het bijschrift (met een sterke eerste zin) en 3 tot 5 hashtags, en kiest een passende foto. De
              afbeeldingen worden getekend in de kleuren en het lettertype van de website.
            </p>
            <p>
              Claude houdt zich aan dezelfde regels als de rest van de site: geen beloftes over resultaat, geen verzonnen klantverhalen en geen crashdiëten. Een
              actie of prijs noemt Claude alleen als die in de instellingen of in je opdracht staat.
            </p>
            <p>Met &quot;Eerst bekijken&quot; pas je de tekst zelf aan of laat je een nieuwe versie maken voordat je plaatst.</p>
            <div>
              <p className="font-semibold text-ink">Voorbeelden van opdrachten</p>
              <ul className="mt-1 list-disc space-y-1 pl-5">
                {EXAMPLES.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Posts" className="mt-6">
        {posts.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">Nog geen posts. Schrijf hierboven je eerste opdracht.</p>
        ) : (
          <ul className="divide-y divide-line">
            {posts.map((post) => (
              <li key={post.id}>
                <Link href={`/beheer/instagram/${post.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-sand/60">
                  <span className="relative block aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg bg-sand">
                    {post.content ? (
                      <Image src={slideUrl(post, 0, "")} alt="" fill sizes="56px" unoptimized className="object-cover" />
                    ) : (
                      <ImageIcon className="absolute inset-0 m-auto size-5 text-muted" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{post.content?.slides[0]?.title || post.prompt}</span>
                    <span className="block truncate text-sm text-muted">{post.prompt}</span>
                  </span>
                  <span className="hidden shrink-0 text-right text-xs text-muted sm:block">
                    {post.content && `${post.content.slides.length === 1 ? "1 afbeelding" : `${post.content.slides.length} slides`} · `}
                    {instagramWhen(post)}
                  </span>
                  <InstagramStatusBadge post={post} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
