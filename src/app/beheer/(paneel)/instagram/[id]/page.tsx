import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowLeft, CalendarClock, ExternalLink, Loader2, Maximize2, RotateCw, Save, Send, Trash2, Undo2 } from "lucide-react";
import {
  deleteInstagramPost,
  publishInstagramPostNow,
  regenerateInstagramPost,
  saveInstagramPost,
  scheduleInstagramPost,
  unscheduleInstagramPost,
} from "@/app/beheer/actions";
import { AutoRefresh } from "@/components/beheer/AutoRefresh";
import { InstagramStatusBadge, instagramBusy } from "@/components/beheer/instagram";
import { NeedsDatabase, Notice, Panel } from "@/components/beheer/ui";
import { SubmitButton } from "@/components/forms/SubmitButton";
import Link from "@/i18n/Link";
import { adminDataAvailable } from "@/lib/admin/data";
import { isDemoMode, requireAdmin } from "@/lib/admin/auth";
import { toAmsterdamLocalInput } from "@/lib/dates";
import { loadStoredConfig } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { instagramConfigured } from "@/lib/instagram/api";
import { PHOTOS, PHOTO_IDS, SLIDE_KINDS, formatLabels, fullCaption, slideKindLabels } from "@/lib/instagram/content";
import { MAX_POST_ATTEMPTS, getInstagramPost, slideUrl } from "@/lib/instagram/posts";

export const metadata: Metadata = { title: "Instagram-post" };
// "Nu plaatsen" en "Opnieuw maken" gebeuren direct, op de achtergrond van deze pagina.
export const maxDuration = 800;

const BUSY_NOTICES = ["instagram-wordt-gemaakt", "instagram-wordt-geplaatst", "instagram-opnieuw"];

export default function InstagramPostPage({ params, searchParams }: PageProps<"/beheer/instagram/[id]">) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-white" aria-hidden />}>
      <PostDetail params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function PostDetail({ params, searchParams }: PageProps<"/beheer/instagram/[id]">) {
  const demo = isDemoMode();
  if (!demo) await connection();
  await requireAdmin();
  if (!adminDataAvailable()) return <NeedsDatabase />;
  if (demo) notFound();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const post = await getInstagramPost(id);
  if (!post) notFound();
  await loadStoredConfig();
  const connected = instagramConfigured();
  const here = `/beheer/instagram/${post.id}`;
  const content = post.content;
  const busy = instagramBusy(post);
  // "Wordt gemaakt/geplaatst" staat al in het blok hieronder (en klopt niet meer als het klaar is).
  const notice = typeof sp.melding === "string" && !BUSY_NOTICES.includes(sp.melding) ? sp.melding : undefined;
  const editable = Boolean(content) && (post.status === "draft" || post.status === "scheduled" || post.status === "failed");
  const hidden = (
    <>
      <input type="hidden" name="post" value={post.id} />
      <input type="hidden" name="terug" value={here} />
    </>
  );

  return (
    <>
      {busy && <AutoRefresh />}
      <Link href="/beheer/instagram" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Instagram
      </Link>
      <Notice code={notice} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{content?.slides[0]?.title || "Instagram-post"}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <InstagramStatusBadge post={post} />
            {post.status === "scheduled" && post.publish_at && <span>Wordt geplaatst op {formatDateTime(post.publish_at)}</span>}
            {post.published_at && <span>Geplaatst op {formatDateTime(post.published_at)}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.permalink && (
            <a href={post.permalink} target="_blank" rel="noopener" className="btn-secondary !px-3.5 !py-2 text-sm">
              <ExternalLink className="size-4" aria-hidden /> Bekijk op Instagram
            </a>
          )}
          {editable && (
            <form action={publishInstagramPostNow}>
              {hidden}
              <SubmitButton className="btn-primary !px-3.5 !py-2 text-sm">
                <Send className="size-4" aria-hidden /> Nu plaatsen
              </SubmitButton>
            </form>
          )}
        </div>
      </div>

      {busy && (
        <section className="mb-6 flex items-start gap-3 rounded-2xl bg-sky-50 px-5 py-4 text-sm text-sky-900">
          <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin" aria-hidden />
          <p>
            {post.status === "publishing" ? (
              <>De post wordt nu op Instagram geplaatst. Dat duurt meestal minder dan een minuut.</>
            ) : (
              <>
                Claude {content ? "maakt een nieuwe versie" : "maakt de post"}. Dat duurt meestal één tot twee minuten; deze pagina ververst vanzelf.
                {post.publish_at && " Daarna wordt hij automatisch geplaatst."}
              </>
            )}
          </p>
        </section>
      )}

      {post.status === "failed" && post.error && (
        <section className="mb-6 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <p className="font-bold">{post.failed_step === "generate" ? "Maken is mislukt" : "Plaatsen is mislukt"}</p>
          <p className="mt-1 break-words">{post.error}</p>
          <p className="mt-2 text-xs">
            {post.attempts < MAX_POST_ATTEMPTS
              ? `Poging ${post.attempts} van ${MAX_POST_ATTEMPTS}. De website probeert het vanzelf opnieuw, steeds iets later.`
              : `Alle ${MAX_POST_ATTEMPTS} pogingen zijn mislukt. Los de oorzaak op en klik op ${post.failed_step === "generate" ? '"Opnieuw maken"' : '"Nu plaatsen"'}.`}
          </p>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-6">
          {content ? (
            <>
              <Panel title={content.slides.length === 1 ? "Afbeelding" : `Carrousel · ${content.slides.length} slides`}>
                <ol className="flex snap-x gap-3 overflow-x-auto px-5 py-4">
                  {content.slides.map((slide, i) => (
                    <li key={i} className="w-60 shrink-0 snap-start sm:w-72">
                      <a href={slideUrl(post, i, "")} target="_blank" rel="noopener" className="relative block aspect-[4/5] overflow-hidden rounded-xl border border-line bg-sand">
                        <Image src={slideUrl(post, i, "")} alt={i === 0 ? content.altText : slide.title} fill sizes="288px" unoptimized className="object-cover" />
                      </a>
                      <p className="mt-1.5 text-xs text-muted">
                        {i + 1}. {slideKindLabels[slide.kind]}
                      </p>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel title="Bijschrift">
                <p className="px-5 py-4 text-sm leading-relaxed break-words whitespace-pre-wrap">{fullCaption(content)}</p>
                {content.altText && (
                  <p className="border-t border-line px-5 py-3 text-xs text-muted">
                    <span className="font-semibold text-ink">Beschrijving voor slechtzienden:</span> {content.altText}
                  </p>
                )}
              </Panel>
            </>
          ) : (
            !busy && (
              <Panel>
                <p className="px-5 py-10 text-center text-sm text-muted">Er is nog geen inhoud. Klik op &quot;Opnieuw maken&quot;.</p>
              </Panel>
            )
          )}

          {editable && content && (
            <Panel title="Zelf aanpassen">
              <form action={saveInstagramPost} className="space-y-5 px-5 py-4">
                {hidden}
                <input type="hidden" name="slides" value={content.slides.length} />
                <label className="block">
                  <span className="label">Bijschrift (zonder hashtags)</span>
                  <textarea name="bijschrift" defaultValue={content.caption} rows={8} maxLength={2200} className="input text-sm" />
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Hashtags (hooguit 5)</span>
                    <input name="hashtags" defaultValue={content.hashtags.map((t) => `#${t}`).join(" ")} className="input !py-2.5 text-sm" />
                  </label>
                  <label className="block">
                    <span className="label">Beschrijving voor slechtzienden</span>
                    <input name="alt" defaultValue={content.altText} maxLength={1000} className="input !py-2.5 text-sm" />
                  </label>
                </div>
                {content.slides.map((slide, i) => (
                  <fieldset key={i} className="space-y-3 rounded-2xl border border-line p-4">
                    <legend className="px-1 text-sm font-bold">Slide {i + 1}</legend>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="label">Soort</span>
                        <select name={`slide-${i}-soort`} defaultValue={slide.kind} className="input !py-2.5 text-sm">
                          {SLIDE_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {slideKindLabels[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="label">Label</span>
                        <input name={`slide-${i}-label`} defaultValue={slide.kicker} maxLength={40} className="input !py-2.5 text-sm" />
                      </label>
                      <label className="block">
                        <span className="label">Foto (cover en uitspraak)</span>
                        <select name={`slide-${i}-foto`} defaultValue={slide.photo} className="input !py-2.5 text-sm">
                          <option value="geen">Geen foto</option>
                          {PHOTO_IDS.map((p) => (
                            <option key={p} value={p}>
                              {PHOTOS[p]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="block">
                      <span className="label">Kop</span>
                      <input name={`slide-${i}-kop`} defaultValue={slide.title} required maxLength={120} className="input !py-2.5 text-sm" />
                    </label>
                    <label className="block">
                      <span className="label">Tekst</span>
                      <textarea name={`slide-${i}-tekst`} defaultValue={slide.body} rows={2} maxLength={320} className="input text-sm" />
                    </label>
                    <label className="block">
                      <span className="label">Punten (bij een lijst, één per regel)</span>
                      <textarea name={`slide-${i}-punten`} defaultValue={slide.bullets.join("\n")} rows={slide.kind === "list" ? 4 : 1} className="input text-sm" />
                    </label>
                    {content.slides.length > 1 && (
                      <label className="flex items-center gap-2 text-sm text-muted">
                        <input type="checkbox" name={`slide-${i}-weg`} value="1" className="accent-brand-600" /> Deze slide weghalen
                      </label>
                    )}
                  </fieldset>
                ))}
                <SubmitButton className="btn-primary !px-4 !py-2.5 text-sm">
                  <Save className="size-4" aria-hidden /> Opslaan en opnieuw tekenen
                </SubmitButton>
              </form>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          {editable && (
            <Panel title="Inplannen">
              <div className="space-y-3 px-5 py-4 text-sm">
                {!connected && (
                  <p className="text-accent-600">
                    Instagram is nog niet gekoppeld.{" "}
                    <Link href="/beheer/koppelingen#instagram" className="font-semibold underline">
                      Naar Koppelingen
                    </Link>
                  </p>
                )}
                <form action={scheduleInstagramPost} className="space-y-2">
                  {hidden}
                  <label className="block">
                    <span className="label">Datum en tijd (Nederlandse tijd)</span>
                    <input
                      type="datetime-local"
                      name="moment"
                      required
                      defaultValue={post.status === "scheduled" && post.publish_at ? toAmsterdamLocalInput(post.publish_at) : undefined}
                      className="input !py-2.5 text-sm"
                    />
                  </label>
                  <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                    <CalendarClock className="size-4" aria-hidden /> {post.status === "scheduled" ? "Ander moment" : "Inplannen"}
                  </SubmitButton>
                </form>
                {(post.status === "scheduled" || (post.status === "failed" && post.failed_step === "publish")) && (
                  <form action={unscheduleInstagramPost} className="border-t border-line pt-3">
                    {hidden}
                    <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                      <Undo2 className="size-4" aria-hidden /> Niet plaatsen (concept)
                    </SubmitButton>
                  </form>
                )}
              </div>
            </Panel>
          )}

          {(editable || (post.status === "failed" && !content)) && (
            <Panel title="Opnieuw maken">
              <form action={regenerateInstagramPost} className="space-y-3 px-5 py-4 text-sm">
                {hidden}
                <label className="block">
                  <span className="label">Aanwijzing voor Claude (mag leeg blijven)</span>
                  <textarea name="aanwijzing" rows={3} maxLength={1000} className="input text-sm" placeholder="Bijv. korter, meer humor, of maak er een carrousel van" />
                </label>
                <SubmitButton className="btn-secondary !px-3.5 !py-2 text-sm">
                  <RotateCw className="size-4" aria-hidden /> Opnieuw maken
                </SubmitButton>
                <p className="text-xs text-muted">De nieuwe versie wordt een concept; je plaatst of plant hem daarna zelf.</p>
              </form>
            </Panel>
          )}

          <Panel title="Opdracht">
            <dl className="divide-y divide-line text-sm">
              <div className="px-5 py-3">
                <dt className="text-xs font-semibold text-muted">Waar gaat de post over?</dt>
                <dd className="mt-0.5 break-words whitespace-pre-wrap">{post.prompt}</dd>
              </div>
              {post.instruction && (
                <div className="px-5 py-3">
                  <dt className="text-xs font-semibold text-muted">Laatste aanwijzing</dt>
                  <dd className="mt-0.5 break-words">{post.instruction}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 px-5 py-3">
                <dt className="text-muted">Vorm</dt>
                <dd>{formatLabels[post.format]}</dd>
              </div>
              <div className="flex justify-between gap-3 px-5 py-3">
                <dt className="text-muted">Aangevraagd</dt>
                <dd>{formatDateTime(post.created_at)}</dd>
              </div>
              {post.generated_at && (
                <div className="flex justify-between gap-3 px-5 py-3">
                  <dt className="text-muted">Gemaakt</dt>
                  <dd>{formatDateTime(post.generated_at)}</dd>
                </div>
              )}
            </dl>
          </Panel>

          {!busy && (
            <form action={deleteInstagramPost}>
              {hidden}
              <SubmitButton className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 hover:underline">
                <Trash2 className="size-4" aria-hidden /> Verwijderen uit het beheer
              </SubmitButton>
              {post.status === "published" && <p className="mt-1 text-xs text-muted">De post blijft op Instagram staan.</p>}
            </form>
          )}
          {editable && (
            <p className="flex items-start gap-1.5 text-xs text-muted">
              <Maximize2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              Klik op een slide om hem op ware grootte te bekijken.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
