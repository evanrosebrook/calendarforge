import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Calendar Forge handles calendar contents, analytics, and operational data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="content-page">
      <div className="shell content-shell legal-copy">
        <span className="page-kicker">Privacy</span>
        <h1>Your calendar stays yours.</h1>
        <p className="content-intro">Calendar Forge does not require an account. Calendar titles, day notes, and complete share URLs are excluded from analytics.</p>

        <section>
          <h2>Analytics</h2>
          <p>Calendar Forge uses Google Analytics to understand aggregate traffic and whether visitors use actions such as printing, sharing, and exporting. Analytics may process page paths, referral sources, approximate location, browser and device information, and controlled event details such as export format. Functional calendar query parameters are removed before events are sent.</p>
          <p>Google Analytics may use cookies or similar identifiers depending on your browser, region, and consent settings. You can block these requests with browser privacy controls or extensions.</p>
        </section>

        <section>
          <h2>Operational logs</h2>
          <p>The hosting infrastructure records limited request and performance information for reliability, abuse prevention, and debugging. Calendar Forge does not intentionally log custom calendar titles, day notes, or query strings in its application telemetry.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Questions or privacy requests can be sent to <a href="mailto:hello@calendarforge.net">hello@calendarforge.net</a>.</p>
        </section>
      </div>
    </main>
  );
}
