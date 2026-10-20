import Link from "@/i18n/Link";
import { Info } from "lucide-react";
import { getLocale } from "@/i18n/server";

export async function DemoBanner({ children }: { children: React.ReactNode }) {
  const l = await getLocale();
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-[0.9375rem]">
      <p className="flex items-start gap-2">
        <Info className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
        <span>{children}</span>
      </p>
      <Link href="/start" className="btn-primary !px-5 !py-2.5 text-sm">
        {l === "en" ? "Start your own plan" : "Start je eigen plan"}
      </Link>
    </div>
  );
}
