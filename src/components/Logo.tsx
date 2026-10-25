import Link from "@/i18n/Link";
import { site } from "@/config/site";

export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" className="fill-brand-600" />
      <path
        d="M11 27c0-8.5 6.2-15 17-16-1 10.8-7.5 17-16 17"
        fill="none"
        stroke="#c8f169"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 28l8-8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} – home`}>
      <LogoMark />
      <span className={`text-lg leading-none font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Afvallen <span className={light ? "text-lime-glow" : "text-brand-600"}>&amp;</span> Afblijven
      </span>
    </Link>
  );
}
