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

The remediation passed a local production-image smoke test under the same read-only, memory, CPU, PID, and temporary-filesystem constraints used in production. Boundary years 1971 and 2100 and a non-acquisition year all returned HTTP 200 without cache-write errors. The remediation was deployed, and the production container was healthy during the August 14 review.

## Follow-up checkpoints

### August 10, 2026

- Review completed August 14. Search Console indexing data was last updated August 6; performance data was current through August 12.
- Indexed pages: 1,345 indexed; 2,064 not indexed.
- Search impressions/clicks: 16,418 impressions and 19 clicks, 0.1% CTR, average position 19.4. The available property history covered August 2–12.
- Sitemap status: `/sitemap.xml` succeeded, was submitted August 4, was last read August 9, and reported 1,939 discovered URLs before the August 14 route additions.
- Crawl or page-indexing issues: 1,057 discovered but not indexed; 275 crawled but not indexed; 727 alternate pages with a proper canonical; three API URLs blocked by `robots.txt`; two customized pages excluded by `noindex`. The alternate and noindex groups match intentional URL-state handling. Home, August 2026 calendar, 2026 U.S. holidays, and 2026 moon phases all passed URL inspection as indexed HTTPS pages; the three structured pages each had one valid breadcrumb item.
- GA4 users, sessions, and exports: last seven days showed 73 active users, 76 new users, 82 sessions, 332 events, and zero key events. The available 28-day/property-lifetime event report showed 137 users, 147 sessions, 576 events, one `calendar_export`, and one `calendar_share`.
- Acquisition signal: GA4 attributed 25 sessions to organic search in the last seven days. Search Console's leading page was `/today` with 442 impressions; date-guide pages produced most recorded clicks.
- Growth decision: hold new sitemap families through August 28 while measuring the CTR and activation changes to Today, date guides, and days-between pages. The success criteria are recorded in `docs/product-roadmap.md`.
- Analytics configuration: `calendar_export` and `calendar_share` were marked as GA4 key events. `calendar_print` was predeclared as a code-generated key event with no default monetary value so it will be counted when the instrumented action first arrives.
- Growth instrumentation prepared in the current worktree: privacy-safe `date_guide_action` and `calculator_result` events, with only allowlisted action/surface labels and no date values, query strings, titles, or user-entered content.

### August 17, 2026

- Indexed pages:
- Search impressions/clicks:
- Sitemap status:
- Crawl or page-indexing issues:
- GA4 users, sessions, and exports:
