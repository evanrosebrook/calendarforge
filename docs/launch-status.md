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

- Review completed August 17. Search Console page-indexing data was last updated August 13; performance and GA4 data were current through August 16.
- Indexed pages: 2,294 indexed and 2,086 not indexed. The indexed total increased by 949 from the August 14 review, indicating that Google is absorbing the existing route footprint.
- Search impressions/clicks: the August 2–12 baseline had 19 clicks from 16,573 impressions, 0.11% CTR, and average position 19.68. The August 14–16 early post-change period had 5 clicks from 6,599 impressions, 0.08% CTR, and average position 27.88. Impressions per day increased by roughly 46%, but clicks per day were effectively flat and the sample remains too short for a route-expansion decision.
- Sitemap status: `/sitemap.xml` succeeded, was last read August 16, and reported 2,001 discovered URLs.
- Crawl or page-indexing issues: 821 discovered but not indexed; two crawled but not indexed; 1,228 alternate pages with a proper canonical; nine API URLs blocked by `robots.txt`; and 26 customized pages excluded by `noindex`. The alternate, blocked, and noindex groups continue to match intentional URL-state handling.
- GA4 users, sessions, and exports: the last seven days showed 80 active users, 91 sessions, 577 events, and two key events. Organic search accounted for 39 sessions: 32 from Google and seven from Bing. The 28-day event report showed five `calculator_result` events, three `date_guide_action` events, two `calendar_print` events, one `calendar_export`, and one `calendar_share`. Both early post-change key events were prints.
- Traffic-quality caveat: GA4 recorded an August 16 spike of 176 page views, almost entirely Chrome traffic attributed to the United Kingdom, versus an expected 16. Production access logs for August 17 also showed more than 1.2 million Meta ExternalAgent requests, about 50,000 ClaudeBot requests, and 142,995 telemetry requests. Treat raw engagement totals as contaminated until crawler filtering is live.
- Maintenance release deployed: generic automation exclusion from first-party telemetry and GA4; supported-year guards for date-guide holiday links; a focused date-guide title and description CTR experiment; and the patched `nanoid` dependency. The initial emergency block for Meta ExternalAgent and ClaudeBot was then replaced with controlled access so public content remains available for model training and AI discovery: explicit robots permission with a one-second crawl delay plus an application limit of 60 requests per minute and a burst of 10 per crawler family. APIs remain unavailable to those crawlers.
- Growth decision: retain the August 28 measurement gate. Index absorption is strong and the first activation signals are encouraging, but CTR has not improved yet and the early analytics window is both short and bot-contaminated.

### August 24, 2026

- Search Console performance for August 16–22: 6 clicks from 8,665 impressions, 0.07% CTR, and average position 33.1. Impressions fell from 4,306 on August 16 and 3,921 on August 17 to 230, 136, 56, 13, and 3 over the next five days.
- Indexing data last updated August 20: 1,225 indexed and 3,217 not indexed. The crawled-currently-not-indexed group increased from 2 to 1,140 while the sitemap remained successful with 2,001 discovered URLs.
- Twenty date-guide pages averaged position 10 or better but generated only 2 clicks from 1,440 impressions (0.14% CTR). This supports improving product utility and crawl quality before adding another programmatic route family.
- Product telemetry since the previous release contained 63 human page views and no calculator, export, print, share, or date-guide action events. Human p75 LCP was 1,824 ms. Treat the low activation count as directional because the sample is small.
- Production access logs showed healthy Googlebot access (1,264 successful responses among 1,282 requests, primarily date guides), but Meta and Claude crawlers generated more than 1.2 million requests from August 18–24 and followed arbitrary-year and query-state URLs.
- Crawl repair shipped August 24: acquisition sitemaps are bounded to the current year plus two years; out-of-window generated pages carry noindex/nofollow and stop boundary navigation; training crawlers are restricted to query-free canonical routes with lower minute and daily caps. The production sitemap now contains 78 calendar URLs and 1,096 date URLs.
- Growth decision: build one differentiated, canonical shift-calendar generator rather than a year-specific route family. Measure generator activations and export/print/share events before considering related landing pages.

### August 28, 2026

- Review completed August 28. Search Console performance data was current through August 26, but page-indexing data was still last updated August 20 and therefore did not include the August 24 crawl repair.
- Search performance remained collapsed after the August 24 checkpoint. August 23–26 produced zero clicks from 27 impressions, 0% CTR, and average position 9.6; daily impressions were 6, 6, 6, and 9. The surviving top pages were all date guides with only one to six impressions each, so the sample is too small for a responsible CTR experiment.
- Indexing totals remained the stale August 20 values: 1,225 indexed, 3,217 not indexed, 1,140 crawled-currently-not-indexed, and 810 discovered-currently-not-indexed. There is not yet a post-repair coverage report with which to judge recovery.
- Search Console reports that `/sitemap.xml` was submitted and read successfully on August 24, but the sitemap detail currently shows zero discovered URLs and no child sitemaps. Production serves a valid XML sitemap index with four HTTP 200 child sitemaps. The children contain 14 static, 78 calendar, 28 holiday, and 1,096 date URLs (1,216 total), and all five XML documents validate and remain accessible to a Googlebot user agent. Treat the zero-child Search Console state as a processing or reporting failure until the child sitemaps are submitted directly or a later read proves otherwise.
- GA4 for August 21–27 recorded 61 sessions, 13 engaged sessions, a 21.31% engagement rate, and zero key events. Organic Search contributed 11 sessions but only one engaged session. The event report contained one `calculator_result` event and no export, print, or share events.
- First-party telemetry since the shift-calendar deployment recorded three `/shift-calendar` page views and one `calculator_result` with the `shift_calendar` surface. It recorded zero shift-calendar share, print, ICS-export, or CSV-export actions. The sample is too small to justify expanding the shift-calendar acquisition surface.
- Production remained healthy after the crawl repair: access logs contained zero HTTP 5xx responses on August 25–28. Googlebot-labeled traffic was low but unthrottled; 40 of 45 requests succeeded, and the five failures were 404 requests for an environment file, `security.txt`, and source maps rather than product pages.
- The training-crawler controls materially reduced crawl pressure. Meta traffic fell from 64,962 requests on August 24 to 284 total on August 25–28; 235 of those later requests were rejected as out-of-policy routes and 49 canonical requests succeeded. Claude traffic fell from 19,205 requests on August 24 to 1,093 on August 25–28; 967 were rejected and 126 canonical requests succeeded.
- Growth decision: prioritize indexing and crawl recovery, not CTR optimization or another sitemap family. The recovery release removes the 1,096-URL date sitemap, marks generated daily date guides `noindex, nofollow`, removes calendar-wide date links, and limits the submitted sitemap surface to 120 focused static, calendar, moon-phase, and holiday URLs. Submit the three remaining child sitemaps after deployment and wait for a page-indexing update newer than August 24 before evaluating recovery.

### September 3, 2026

- Search Console performance remained near zero. August 23–September 1 produced zero clicks from 39 impressions, 0% CTR, and average position 18.3. Only 12 of those impressions arrived after the August 28 checkpoint (August 27–September 1), with zero-impression days on August 30 and September 1. There is still too little live search demand for CTR optimization to be the next lever.
- Page indexing was last updated August 27: 1,227 pages were indexed and 2,867 were not indexed. Compared with the August 20 report, the discovered-currently-not-indexed group fell from 810 to 462 and the total not-indexed count fell by 350, but indexed pages increased by only two and crawled-currently-not-indexed barely changed, from 1,140 to 1,138.
- The indexing report predates both the August 28 low-value-surface deployment and the August 31 direct child-sitemap submissions, so it is not yet evidence for or against that release. Search Console now reports successful direct submissions for `/sitemaps/static.xml` (14 discovered URLs), `/sitemaps/calendars.xml` (78), and `/sitemaps/holidays.xml` (28). The parent `/sitemap.xml` still reports zero discovered URLs, but production serves those three children successfully and no longer serves `/sitemaps/dates.xml`.
- URL Inspection confirms that processing is lagging beyond the aggregate report. `/calendar/2026/9` is indexed, but its last crawl was August 8 and Search Console detects no referring sitemap. The new `/shift-calendar` route is still unknown to Google, has never been crawled, and also shows no referring sitemap. A live test on September 3 found that the shift-calendar URL is available to Google and can be indexed, ruling out a current fetch or indexability defect.
- GA4 for August 27–September 2 recorded 70 sessions, 13 engaged sessions, an 18.57% engagement rate, and two key events. AI Assistant traffic contributed eight sessions, seven engaged sessions, and both key events; Organic Search contributed eight sessions, two engaged sessions, and no key events. The two key events were `calendar_export` events from one user.
- First-party telemetry since August 28 identifies those actions as one builder ICS export and one builder XLSX export. It recorded no shift-calendar page views, results, shares, prints, ICS exports, or CSV exports during the period, so there is still no evidence for expanding the shift-calendar acquisition surface.
- Production remained healthy from August 28 through the September 3 review: the container was healthy, representative product and sitemap routes returned HTTP 200, and 60,426 access-log requests contained zero HTTP 5xx responses. Googlebot made 102 requests; 97 returned HTTP 200 and five returned HTTP 404. It fetched sitemap routes 14 times and continued limited recrawling of retired date-guide URLs.
- Training-crawler controls continued to operate. Meta ExternalAgent made no requests in the reviewed logs. ClaudeBot made 1,102 requests, of which 890 out-of-policy requests were rejected and 198 canonical requests succeeded; Claude-SearchBot made 496 requests, of which 466 succeeded.
- Growth decision: remain in indexing/crawl recovery rather than switching to CTR work. Do not make another crawl-surface change from the stale August 27 coverage report. Wait for the first page-indexing update that reflects the August 28 deployment and August 31 child-sitemap reads; if indexed pages still do not recover after that update, inspect representative canonical URLs and internal-link signals before considering any new acquisition surface.

### September 8, 2026

- Search performance deteriorated further. August 31–September 6 produced zero clicks from eight impressions, 0% CTR, and average position 9.5. Daily impressions ranged from zero to three, leaving no meaningful audience on which to run a CTR experiment.
- Page indexing finally refreshed through September 3 and now partially reflects the August 28 cleanup and August 31 child-sitemap reads. Google reports 1,218 indexed pages and 2,862 not indexed. Compared with the August 27 report, indexed pages fell by nine, crawled-currently-not-indexed remained unchanged at 1,138, discovered-currently-not-indexed fell from 462 to 448, and `noindex` exclusions rose from 26 to 35. Google is processing the cleanup, but indexing has not recovered.
- The current 120-URL submitted surface is materially healthier than the legacy totals but still only 52.5% indexed: 47 of 78 calendar URLs, 12 of 28 holiday URLs, and four of 14 static/product URLs are indexed. The remaining 57 comprise 36 crawled-currently-not-indexed URLs and 21 discovered-currently-not-indexed URLs.
- The ten excluded static/product URLs are the clearest repair target. `/date-calculator/add-subtract`, `/date-calculator/business-days`, `/days-until/christmas`, `/today`, `/date-calculator/days-between`, and `/make-calendar` were crawled August 7–20 but remain unindexed. `/date-calculator/age`, `/date-calculator/days-until`, `/days-until/easter`, and `/shift-calendar` have never been crawled. URL Inspection still reports `/shift-calendar` as unknown to Google despite the successful live eligibility test on September 3.
- Sitemap processing remains internally consistent: all three direct child submissions are successful and report 14 static, 78 calendar, and 28 holiday URLs. Their last read remains August 31. The parent sitemap index still reports zero discovered URLs and has not been reread since August 24.
- GA4 for September 1–7 recorded 48 sessions, eight engaged sessions, a 16.67% engagement rate, 181 events, and zero key events. Organic Search contributed seven sessions and two engaged sessions; AI Assistant contributed two highly engaged sessions but no actions. First-party telemetry from September 1 through the review recorded no calculator results, exports, shares, prints, or shift-calendar page views.
- Production remained healthy. Representative public routes and the sitemap returned HTTP 200 and the container was healthy. September 1–8 access logs contained 50,459 requests and one isolated HTTP 502 response to MJ12bot; there was no broader 5xx pattern. Googlebot made 168 requests, with 162 HTTP 200 responses and six HTTP 404 responses. Seventy-seven requests were the expected recrawling of retired date guides so Google can observe their `noindex` state.
- Growth decision: continue indexing repair, not CTR work. The next external action should be targeted URL Inspection indexing requests for the ten high-value static/product URLs, beginning with the four Google has never crawled. Do not start another broad sitemap or programmatic content expansion. Recheck those URLs and the page-indexing report after Google processes the requests; if the six previously crawled product pages remain excluded, strengthen their differentiated copy and internal-link prominence before requesting another crawl.
- Indexing-request follow-up: on September 8, Search Console accepted `/shift-calendar` and added it to the priority crawl queue. The `/date-calculator/age` attempt did not return a confirmation, and the subsequent `/date-calculator/days-until` attempt returned “We had a problem submitting your indexing request. Please try again later.” Further submissions were stopped to avoid duplicates or worsening the individual-URL request quota. Resume with the remaining URLs after the request tool becomes available again; do not resubmit `/shift-calendar`.
