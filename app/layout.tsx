import type { Metadata } from "next";
import { PerformanceReporter } from "@/components/performance-reporter";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Calendar Forge — Make space for what matters", template: "%s · Calendar Forge" },
  description: "Create clean, printable monthly and yearly calendars. Customize, share, print, and export without an account.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <PerformanceReporter />
      </body>
    </html>
  );
}
