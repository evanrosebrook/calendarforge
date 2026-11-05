# Calendar search opportunities — November 4, 2026

## Decision

The next bounded on-site improvement should be a genuine **one-page yearly PDF**, offered alongside the existing monthly PDF pack on `/calendar/2027`. Give the existing yearly page explicit download choices and a short, accurate description of each layout. Reuse the yearly route rather than creating another family of landing pages.

Confidence is high that this fills a real product gap, moderate that it better matches the intent visible in the reviewed search results, and low about its eventual traffic impact. This review does not establish keyword volume, ranking difficulty, or likely acquisition gains.

The user does not want to contact or post on other sites. No outreach is part of this recommendation. The homepage's main destination does not need to change for this work.

## Evidence and limits

- Public searches reviewed: `2027 printable calendar pdf blank one page`, `2027 calendar with holidays printable`, `2027 three month calendar printable`, and school-year/Monday-start variants. These are sampled search results, not measured search demand or a Google ranking report.
- [Calendarpedia's 2027 PDF page](https://www.calendarpedia.com/2027-calendar-pdf-templates.html) explicitly distinguishes one-, two-, and four-page layouts; its year-at-a-glance options provide the whole year on one sheet. This supports the existence of a specific download intent, not its search volume.
- [Jocalendars' 2027 quarterly page](https://www.jocalendars.com/2027-three-month-calendar/) explicitly offers three months on one landscape sheet with separate quarter downloads. Its published download counters are unverified and were not used as a demand estimate.
- [Vertex42's school-calendar page](https://www.vertex42.com/calendars/school-calendar.html) offers a school-year calendar template with a configurable starting month. School-calendar searches also return official district calendars; a generic template should not imply it supplies local term dates.
- Production `/calendar/2027` returned HTTP 200, title `2027 Printable Calendar · Calendar Forge`, H1 `2027 calendar`, and the correct canonical on November 4. Its HTML shows the year at a glance and includes the global builder link.
- Production `/api/export/pdf?year=2027` returned HTTP 200 and a **12-page Letter portrait PDF**, confirmed by loading the downloaded file with `pdf-lib`. The first page was rendered and visually inspected: it is January 2027, with a full-page monthly grid. This is not a failed export; it is a monthly pack rather than the yearly screen layout.
- Source confirms the distinction: the yearly page renders a `MiniCalendar` grid; the export route sends twelve months into `calendarsToPdf`, which adds a page for each month. Browser Print / save PDF is a separate path and was not tested in this review; do not claim one-page browser printing is absent or broken.
- Semrush could not return keyword data because the account had no API units. No monthly volumes or keyword-difficulty scores are available from this review.
- A fresh Search Console query breakdown could not be read because browser-control calls failed. Earlier verified checkpoints remain historical context, not new evidence for these specific terms. In particular, October 21–27 had 14 sitewide impressions and zero clicks, with 12 impressions for the pay-period guide; that does not establish demand for the yearly calendar.

## Candidate comparison

| Candidate intent | Existing coverage | Gap and decision |
| --- | --- | --- |
| 2027 calendar on one page / year-at-a-glance PDF | Yearly screen and browser-print route; downloadable 12-page monthly pack | Verified download-layout gap. First priority: one-page PDF and explicit choice between it and the monthly pack. |
| Blank or holiday-marked 2027 calendar | Holiday toggle, US/Canada choice, Sunday/Monday start already available | Improve discoverability on the existing yearly page as part of the first priority. Do not create separate indexable query variants. |
| Three-month / quarterly PDF | Builder supports three consecutive months; PDF renderer still uses one page per month | Plausible second layout improvement. Defer until the smaller yearly export work is verified; do not advertise a single-sheet quarterly PDF before it exists. |
| 2027–2028 school-year template | Builder already supports twelve months starting in an arbitrary month | Useful preset, but weaker immediate case. Local school dates are outside current coverage. Defer a dedicated school-calendar route. |

## Proposed implementation scope

1. Add a distinct year-at-a-glance PDF layout; preserve the monthly pack as an explicitly labeled option. A yearly page must not silently change an existing download's meaning.
2. Expose `Year on one page (PDF)` and `12 monthly pages (PDF)` directly on the existing yearly page. Both should preserve supported week start, holiday country/visibility, paper, orientation, and title settings. Include actual page counts in the labels.
3. Make the 2027 page clearly describe the available printable formats, link to its twelve months and relevant holiday page, and offer a clearly labeled blank-calendar preset. Add a contextual builder link for date notes or a custom range.
4. Surface the existing 2027 yearly page from an appropriate on-site planning link. Keep the current homepage primary action unless evidence supports changing it separately.
5. Keep customized URLs canonical to the clean year URL and preserve the current noindex policy for those variants. No new sitemap family, bulk URL submissions, or external configuration changes are needed.

## Verification and measurement

- Verify that the yearly PDF has exactly one page and includes all twelve months with correct Sunday/Monday alignment. Verify that the monthly pack still has twelve pages.
- Render and inspect Letter/A4 and portrait/landscape output, with and without week numbers and holidays. Keep holiday text readable; use a clear legend rather than crowding small cells if necessary. Check the December 31, 2027 observed-holiday boundary against the existing holiday engine.
- Check desktop and mobile download choices and confirm no duplicate export telemetry is emitted. A downloaded file is an export action, not proof of a physical print.
- If layout attribution is added, document and validate it explicitly. Existing export telemetry distinguishes surface/format but should not be assumed to distinguish a yearly layout from a monthly pack.
- After an approved deployment, compare 14 complete days with the preceding 14 days for the existing yearly page: impressions, clicks, query mix, organic landing visits, and attributable exports/prints. Preserve the October 29 calculator-definition boundary when interpreting broader analytics.
- The immediate success criterion is a correct, clearly labeled downloadable artifact. Search growth remains an experiment; do not promise rankings or infer success from a handful of impressions.

At the end of the initial research review, no application change, deployment, indexing request, or external post had been made.

## Implementation — November 4, 2026

Implemented locally after the user's request. `/calendar/[year]` now offers separate one-page yearly and twelve-page monthly PDF downloads, selected-setting summaries, blank/holiday/Monday presets, and printing/holiday/builder guidance. The homepage has a next-year planning link; its main action is unchanged. Existing monthly export URLs keep their meaning. The new yearly layout is selected explicitly with `layout=year` and uses a distinct filename.

The one-page renderer uses a three-by-four month grid in portrait and four-by-three in landscape, with a dated holiday legend. Letter/A4, both week starts, week numbers, weekend shading, US/Canadian holidays, blank calendars, and custom titles are supported. Custom-title wrapping keeps the complete supported 80 characters. Holiday coverage outside 1971–2100 is identified in the page copy.

Verification: all 216 tests passed; ESLint, TypeScript, and the 313-page production build passed. After the final PDF highlight-size and toolbar-link refinements, the 15 export-specific tests, lint, and build passed again. Eight PDF variants were rendered and visually inspected, covering all four paper/orientation combinations, both holiday countries, both week starts, blank calendars, week numbers, and long/unbroken titles. Tests verify one-versus-twelve-page downloads, settings propagation, canonical/noindex behavior, and the December 31, 2027 adjacent-year observed holiday.

In-app browser checks verified both downloads, Monday and blank presets, Canadian/A4/landscape settings propagation, and the sidebar menu. At 390px the page had no horizontal overflow and both download controls fit. Two deliberate download clicks produced exactly two first-party export events, one per layout; GA4 was disabled in the local preview. Placement tags are documented in `docs/analytics-measurement.md`.

Desktop/mobile screenshots and a rendering of the one-page PDF are saved under `output/screenshots/`; two sample PDFs are under `output/pdf/`. These are local review artifacts. No commit, production deployment, Search Console submission, or external configuration change was made. Start the acquisition comparison only after an approved production deployment, recording its actual date rather than this local implementation date.
