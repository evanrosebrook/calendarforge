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

## Recommended next batch

### 1. Holiday system and pages

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

### 2. Dedicated custom calendar builder

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

### 3. Date-calculator cluster

Ship these as a linked family:

- `/today`
- `/date-calculator/add-subtract`
- `/date-calculator/days-between`
- `/date-calculator/age`
- Later: `/date-calculator/business-days`

Results should be shareable, printable, and explicit about timezone and inclusive/exclusive counting rules. References: [today](https://blankcalendarpages.com/todays-date), [add/subtract](https://blankcalendarpages.com/date-calculator/add-days), [days between](https://blankcalendarpages.com/date-calculator/days-between-dates), and [age calculator](https://blankcalendarpages.com/age-calculator).

### 4. Indexable calendar-format landing pages

Important user intents should have explicit routes rather than relying only on query strings:

- `/calendar/monday-start/[year]/[month]`
- `/calendar/with-holidays/[country]/[year]/[month]`
- `/calendar/portrait/[year]/[month]`
- `/weekly-calendar/[year]/[month]`
- `/daily-planner`
- `/yearly-calendar/[year]`

Each page should provide useful server-rendered output, adjacent-date navigation, relevant customization, and internal links to related formats. References: [Monday calendar](https://blankcalendarpages.com/monday-calendar), [vertical calendar](https://blankcalendarpages.com/vertical-calendar), [weekly calendar](https://blankcalendarpages.com/weekly-calendar), and [yearly calendar](https://blankcalendarpages.com/yearly-calendar).

## Build order

1. Holiday data model plus US and Canada pages.
2. Dedicated custom calendar builder.
3. Today, days-between, and add/subtract calculators.
4. Monday, holiday, portrait, weekly, and yearly landing-page families.
5. Age and business-day calculators.

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
