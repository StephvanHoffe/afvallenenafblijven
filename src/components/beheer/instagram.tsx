import { Badge } from "@/components/beheer/ui";
import { formatDateTime } from "@/lib/format";
import { MAX_POST_ATTEMPTS, type InstagramPost } from "@/lib/instagram/posts";

/** Waar een Instagram-post staat, als label. */
export function InstagramStatusBadge({ post }: { post: Pick<InstagramPost, "status" | "attempts"> }) {
  switch (post.status) {
    case "pending":
      return <Badge tone="muted">In de wachtrij</Badge>;
    case "generating":
      return <Badge tone="info">Wordt gemaakt</Badge>;
    case "draft":
      return <Badge tone="muted">Concept</Badge>;
    case "scheduled":
      return <Badge tone="info">Ingepland</Badge>;
    case "publishing":
      return <Badge tone="info">Wordt geplaatst</Badge>;
    case "published":
      return <Badge tone="ok">Geplaatst</Badge>;
    case "failed":
      return post.attempts >= MAX_POST_ATTEMPTS ? (
        <Badge tone="bad">Mislukt</Badge>
      ) : (
        <Badge tone="warn">
          Nieuwe poging ({post.attempts}/{MAX_POST_ATTEMPTS})
        </Badge>
      );
  }
}

/** Het belangrijkste moment van een post: geplaatst, gepland of gemaakt. */
export function instagramWhen(post: Pick<InstagramPost, "status" | "publish_at" | "published_at" | "created_at">): string {
  if (post.published_at) return `Geplaatst ${formatDateTime(post.published_at)}`;
  if (post.publish_at && post.status !== "draft") {
    return post.publish_at.getTime() <= post.created_at.getTime() + 60_000 ? "Direct na het maken" : `Gepland ${formatDateTime(post.publish_at)}`;
  }
  return `Gemaakt ${formatDateTime(post.created_at)}`;
}

/** Bezig op de achtergrond (dan ververst de pagina vanzelf). */
export const instagramBusy = (post: Pick<InstagramPost, "status">) => post.status === "pending" || post.status === "generating" || post.status === "publishing";
