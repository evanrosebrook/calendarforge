# Calendar Forge launch status

This file records time-sensitive launch checks separately from the durable deployment procedure.

## Baseline — August 3, 2026

### Search discovery

- Production serves an indexable `robots.txt` and a sitemap containing 74 URLs at `https://calendarforge.net/sitemap.xml`.
- Google Search Console ownership is verified for the `https://calendarforge.net/` URL-prefix property through the existing Google Analytics tag.
- Search Console is processing initial performance and indexing data; the first reports may take a day or more to populate.
- A Google `site:calendarforge.net` check returned no results at the time of the baseline. Treat this as a discovery snapshot, not a definitive coverage report.
- Sitemap submission: pending final confirmation in the August 3 launch session.
- Bing Webmaster Tools: pending authorization to link the current Google identity and import the Search Console property.
- Feedback email is not launch-ready: `calendarforge.net` had no MX, SPF, or DMARC records at verification time, so `hello@calendarforge.net` cannot receive mail yet. DNS is hosted by Cloudflare; choose a mailbox or forwarding destination before adding records.

Review Search Console and Bing coverage after 7 days (August 10) and 14 days (August 17). Record indexed-page counts, impressions, clicks, crawl failures, and sitemap status below this baseline.

### Analytics

- GA4 property and web stream: CalendarForge.
- Seven-day baseline at verification time: 13 active users, 52 events, 13 new users, and 0 key events.
- Realtime production session confirmed `page_view`, `calendar_export`, `calendar_share`, and `ad_viewable` in GA4.
- Application logs confirmed `page_view`, LCP, share, PDF export, ad viewability, and print telemetry from the same smoke-test route without exposing query strings or calendar content.

### Production smoke test

The following checks passed against `https://calendarforge.net`:

- 15 representative product, calendar, calculator, holiday, privacy, robot, and sitemap routes returned HTTP 200.
- Calendar PDF, ICS, CSV, and XLSX exports downloaded successfully.
- Builder PDF, SVG, ICS, CSV, and XLSX exports downloaded successfully for a three-month Canadian Monday-start configuration.
- Holiday CSV and ICS exports downloaded successfully.
- Both XLSX files passed ZIP integrity checks.
- The calendar PDF contained one Letter page; the builder PDF contained three Letter pages.
- ICS files contained complete VCALENDAR envelopes, CSV files contained the expected headers, and the SVG contained the configured title.
- The production container reported healthy during the test.

### Launch defect and remediation

The smoke test found runtime prerender-cache write failures for supported holiday years that were not generated during the build. The production container is intentionally read-only, so those writes cannot succeed. The remediation prebuilds every supported U.S. and Canadian holiday year (1971–2100) and disables ungenerated dynamic parameters for that route. This preserves the read-only deployment model and keeps acquisition limited through the sitemap rather than runtime route availability.

The remediation passed a local production-image smoke test under the same read-only, memory, CPU, PID, and temporary-filesystem constraints used in production. Boundary years 1971 and 2100 and a non-acquisition year all returned HTTP 200 without cache-write errors. Production deployment is pending approval.

## Follow-up checkpoints

### August 10, 2026

- Indexed pages:
- Search impressions/clicks:
- Sitemap status:
- Crawl or page-indexing issues:
- GA4 users, sessions, and exports:

### August 17, 2026

- Indexed pages:
- Search impressions/clicks:
- Sitemap status:
- Crawl or page-indexing issues:
- GA4 users, sessions, and exports:
