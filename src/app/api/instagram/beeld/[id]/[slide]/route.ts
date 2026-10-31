import { isDatabaseConfigured } from "@/lib/db";
import { renderSlide } from "@/lib/instagram/render";
import { getInstagramPost } from "@/lib/instagram/posts";

export const maxDuration = 60;

/**
 * Een slide van een Instagram-post als JPEG (/api/instagram/beeld/<post>/1.jpg).
 * Openbaar, omdat Instagram de afbeelding zelf ophaalt bij het plaatsen; het
 * adres bevat het willekeurige id van de post. Ook het voorbeeld in het beheer.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/instagram/beeld/[id]/[slide]">) {
  if (!isDatabaseConfigured()) return new Response("Niet gevonden", { status: 404 });
  const { id, slide } = await ctx.params;
  const index = Number(/^(\d{1,2})\.jpg$/.exec(slide)?.[1] ?? 0) - 1;
  const post = await getInstagramPost(id);
  if (!post?.content || index < 0 || index >= post.content.slides.length) return new Response("Niet gevonden", { status: 404 });
  const jpeg = await renderSlide(post.content, index);
  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      // Het adres verandert (?v=) zodra de inhoud wijzigt.
      "Cache-Control": "public, max-age=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
