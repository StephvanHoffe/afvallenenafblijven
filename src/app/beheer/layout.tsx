import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Beheer", template: "%s | Beheer" },
  robots: { index: false, follow: false },
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 bg-[#f2f3ef]">{children}</div>;
}
