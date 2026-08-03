import type { Metadata } from "next";
import { PerformanceReporter } from "@/components/performance-reporter";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "Calendar Forge — Make space for what matters", template: "%s · Calendar Forge" },
  description: "Create clean, printable monthly and yearly calendars. Customize, share, print, and export without an account.",
  alternates: { canonical: "/" },
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
