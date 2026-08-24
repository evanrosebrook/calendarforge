# Calendar Forge product roadmap

## Purpose

Calendar Forge should adopt the useful product patterns validated by Blank Calendar Pages without copying its prose, branding, source code, visual design, downloadable assets, or proprietary datasets. The priority is to create original, indexable tools that reuse Calendar Forge's deterministic calendar engine and export pipeline.

## Current foundation

Calendar Forge already provides:

- Indexable monthly and yearly calendar routes.
- Sunday- and Monday-start calendars.
- ISO week numbers, weekend highlighting, and US federal holiday overlays.
- Portrait and landscape printing on Letter and A4 paper.
- Custom titles, notes areas, and shareable URL state.
- PDF, ICS, CSV, and XLSX exports.

## Delivery status (August 24, 2026)

The first three roadmap batches are substantially shipped:

- Holiday catalogs, country/year pages, individual holiday pages, calendar controls, and CSV/ICS downloads are live for the United States and Canada.
- The custom calendar builder supports 1-, 3-, 6-, and 12-month ranges, per-day notes, three locales, three original themes, shareable URL state, print/PDF, SVG, ICS, CSV, and XLSX output.
- Today, add/subtract, days-between, days-until, and business-day calculators are live; the age calculator is implemented in the current release.
- Fiscal calendars, annual moon-phase calendars with ICS export, and indexable event countdowns are live.
- A single canonical shift-calendar generator supports preset and custom rotations, printable previews, shareable URL state, and ICS/CSV exports without creating a year-specific route family.
- Monday-start monthly pages are implemented in the current release with dedicated canonical routes, navigation, sitemap coverage, printing, and downloads.
- Privacy-safe first-party telemetry and GA4 measurement are live; Google Search Console ownership was verified on August 3, 2026.

Google Search Console reported 1,345 indexed pages, 16,418 impressions, and 19 clicks during the August 14 review. The next product work should improve click-through and page quality for demonstrated queries while completing only the calendar-format pages with distinct utility.

## Completed batches

### 1. Holiday system and pages — shipped

Build:

- `/holidays`
- `/holidays/[country]/[year]`
- `/holidays/[country]/holiday/[holiday]` (the static `holiday` segment avoids a Next.js conflict with the country/year dynamic route)
- A country selector in calendar settings.
- National-only versus all-observances filtering when a data source supports it.
- Holiday CSV and ICS downloads.

Start with the United States and Canada, then add the United Kingdom and Australia using properly licensed or official data. Do not scrape or reproduce Blank Calendar Pages' holiday dataset or descriptions.

Why first: Calendar Forge already supports holiday overlays, but only generates US federal holidays. Blank Calendar Pages turns country/year tables, individual holiday pages, holiday calendars, and exports into an interconnected acquisition surface. References: [holiday index](https://blankcalendarpages.com/holidays), [US holidays](https://blankcalendarpages.com/holidays/usa), and [Canada holidays](https://blankcalendarpages.com/holidays/canada).

The first implementation increment should include:

- A reusable holiday provider/catalog abstraction.
- Deterministic national holiday calculations for the US and Canada.
- Country/year holiday pages with date, weekday, name, and category.
- Individual holiday pages showing upcoming occurrences.
- Calendar controls that preserve country and holiday type in URL state.
- Tests for fixed, observed, and movable holidays.

### 2. Dedicated custom calendar builder — shipped

Create `/make-calendar` with:

- Arbitrary start and end months.
- One-, three-, six-, and twelve-month output.
- Per-day notes.
- Locale and language selection.
- Country holiday selection.
- A small set of original border and typography themes.
- Portrait/landscape and Letter/A4 controls.
- Shareable URL state and PDF/image export.

The useful competitor pattern is a single place where users can alter calendar content and presentation while previewing the result. Calendar Forge should keep the interface more focused and accessible. Reference: [custom calendar maker](https://blankcalendarpages.com/make-calendar).

### 3. Date-calculator cluster — shipped

Ship these as a linked family:

- `/today`
- `/date-calculator/add-subtract`
- `/date-calculator/days-between`
- `/date-calculator/age`
- `/date-calculator/business-days`
- `/date-calculator/days-until`
- `/days-until/[event]`

Results should be shareable, printable, and explicit about timezone and inclusive/exclusive counting rules. References: [today](https://blankcalendarpages.com/todays-date), [add/subtract](https://blankcalendarpages.com/date-calculator/add-days), [days between](https://blankcalendarpages.com/date-calculator/days-between-dates), and [age calculator](https://blankcalendarpages.com/age-calculator).

## Current acquisition batch

### 4. Indexable calendar-format landing pages

Important user intents should have explicit routes rather than relying only on query strings. The Monday-start family is shipped; the remaining candidates should be added only when the generated layout is materially different:

- ~~`/calendar/monday-start/[year]/[month]`~~
- `/calendar/with-holidays/[country]/[year]/[month]`
- `/calendar/portrait/[year]/[month]`
- `/weekly-calendar/[year]/[month]`
- `/daily-planner`
- `/yearly-calendar/[year]`

Each page should provide useful server-rendered output, adjacent-date navigation, relevant customization, and internal links to related formats. References: [Monday calendar](https://blankcalendarpages.com/monday-calendar), [vertical calendar](https://blankcalendarpages.com/vertical-calendar), [weekly calendar](https://blankcalendarpages.com/weekly-calendar), and [yearly calendar](https://blankcalendarpages.com/yearly-calendar).

## Recommended next work

1. Measure shift-calendar generation, export, print, and share activation alongside the existing Today, date-guide, and date-calculator funnels.
2. Keep the acquisition footprint bounded to the current year plus two years while Google reprocesses the crawl repair and the crawled-currently-not-indexed backlog.
3. Improve titles and on-page utility for date guides already ranking on page one before expanding to another generated route family.
4. Revisit weekly or yearly calendar tools only after indexing stabilizes and a distinct user need is demonstrated.

### Growth measurement gate — August 14–28, 2026

Do not add new sitemap families during this window. At the August 28 review, compare the post-change period with the August 2–12 baseline and record:

- Search Console CTR for date-guide pages already averaging on page one, with a target of at least 1% once a page has enough impressions to be directional.
- Organic landings on `/today`, `/date/[date]`, and `/date-calculator/days-between`, including position and CTR changes by query intent.
- The path from an organic landing to `date_guide_action` or `calculator_result`, then to the `calendar_export`, `calendar_print`, or `calendar_share` key events.
- Indexed and discovered-but-not-indexed totals, confirming that the existing footprint is being absorbed before expansion resumes.

The August 17 early checkpoint showed strong index absorption (2,294 indexed pages, up 949 from the August 14 review) but no CTR improvement yet: the August 14–16 period produced 5 clicks from 6,599 impressions at 0.08% CTR. Keep the gate in place while a focused date-guide title and description experiment accumulates data and the crawler-filtering maintenance release removes known analytics contamination.

Do not optimize the age calculator or Monday-start pages based on the current sample. Revisit them after the gate only if they have accumulated enough impressions or activation events to support a decision.

## Build order

1. ~~Holiday data model plus US and Canada pages.~~
2. ~~Dedicated custom calendar builder.~~
3. ~~Today, days-between, and add/subtract calculators.~~
4. ~~Monday-start monthly landing-page family.~~
5. ~~Age and business-day calculators.~~
6. Search-result CTR and internal-link improvements based on measured queries.
7. ~~Single-page rotating-shift calendar generator.~~
8. Holiday, weekly, yearly, portrait, and daily-planner landing-page families only after the indexing gate.

## Deferred work

Defer these until the core acquisition and customization surfaces are working:

- Photo and quote galleries, because they add licensing and asset-management overhead.
- Dozens of languages, until locale-aware routing and content architecture are established.
- World clocks and city pages, which require dependable geocoding and timezone data.
- Sunrise and moonrise tables, which require tested astronomical calculations and location-aware timezone handling.
- Broad planner/checklist categories that do not directly reuse the calendar engine.

References: [sunrise and sunset](https://blankcalendarpages.com/sunrise-sunset) and [moonrise and moonset](https://blankcalendarpages.com/moonrise-moonset).

## Guardrails

- Use original interface design and original explanatory content.
- Use official, public-domain, or appropriately licensed factual datasets.
- Prefer a small number of genuinely useful pages over thousands of thin combinations.
- Keep important results server-rendered and usable without client-side JavaScript.
- Keep calendar state shareable through URLs.
- Exclude advertising from printed and exported output.
- Test date calculations across leap years, year boundaries, timezones, and observed-holiday rules.
