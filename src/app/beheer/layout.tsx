import type { Metadata, Viewport } from "next";
import "../globals.css";
import { jakarta } from "@/app/fonts";

export const metadata: Metadata = {
  title: { default: "Beheer", template: "%s | Beheer" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#123f29",
};

export default function BeheerLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <div className="flex-1 bg-[#f2f3ef]">{children}</div>
      </body>
    </html>
  );
}
