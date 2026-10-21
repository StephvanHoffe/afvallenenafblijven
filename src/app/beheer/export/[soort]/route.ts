import { adminDataAvailable } from "@/lib/admin/data";
import { isAdmin } from "@/lib/admin/auth";
import { buildExport, isExportKind, toCsv } from "@/lib/admin/export";
import { logAdminAction } from "@/lib/admin/log";

/** Beheer: gegevens downloaden als CSV (klanten, bestellingen, betalingen, nieuwsbrief, kortingscodes). */
export async function GET(request: Request, ctx: RouteContext<"/beheer/export/[soort]">) {
  if (!(await isAdmin())) return Response.redirect(new URL("/beheer/inloggen", request.url), 303);
  if (!adminDataAvailable()) return new Response("Geen database", { status: 404 });
  const { soort } = await ctx.params;
  if (!isExportKind(soort)) return new Response("Onbekende export", { status: 404 });
  const { header, rows } = await buildExport(soort, { status: new URL(request.url).searchParams.get("status") ?? undefined });
  await logAdminAction("Export gedownload", `${soort} (${rows.length} regels)`);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(header, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="afvallenenafblijven-${soort}-${date}.csv"`,
      "cache-control": "no-store",
    },
  });
}
