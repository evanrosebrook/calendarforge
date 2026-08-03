# Calendar Forge

Calendar Forge is a fast, customizable calendar and date-utility platform. It creates clean monthly, yearly, academic, fiscal, payroll, and rotating-shift calendars that users can print or export without creating an account. It also provides focused date calculators and automatically maintains useful year-, month-, and format-specific pages.

The product has two jobs:

1. Give visitors an immediately useful calendar or date answer.
2. Provide high-quality first-party inventory for developing and measuring our advertising platform.

## Product

Calendar Forge provides:

- Monthly and yearly calendars for arbitrary years.
- Sunday- and Monday-start layouts.
- Week numbers and configurable weekends.
- Country and regional holiday overlays.
- Academic-year and fiscal-year calendars.
- Biweekly and semimonthly payroll calendars.
- Rotating-shift calendars, including 4-on/4-off schedules.
- A custom calendar builder with shareable URL state.
- Print-optimized layouts and PDF, ICS, CSV, and XLSX exports.
- Age, date-difference, business-day, and add/subtract-date calculators.
- Fast, indexable landing pages whose calendar output stays current automatically.

Calendar Forge is deliberately useful without an account. Saved presets, synchronization, and collaboration can be added later, but the public tool and export experience remain the primary product.

## Research reference

[Blank Calendar Pages](https://blankcalendarpages.com/) validates the broader calendar and date-utility model. Useful areas to study include its [printable calendars](https://blankcalendarpages.com/calendar), [custom calendar experience](https://blankcalendarpages.com/custom-calendar), [holiday index](https://blankcalendarpages.com/holidays), [sunrise and sunset utility](https://blankcalendarpages.com/sunrise-sunset), and [moonrise and moonset utility](https://blankcalendarpages.com/moonrise-moonset).

Use the reference site to understand user intent, information architecture, printing expectations, and feature breadth. Do not copy its prose, source code, visual designs, downloadable files, or proprietary datasets. Calendar Forge should use original UI, original explanations, deterministic calendar calculations, and properly licensed or public factual data.

## Initial technical direction

- Use TypeScript with a server-rendered web framework suited to indexable routes.
- Keep calendar calculations in a framework-independent core package.
- Represent dates as calendar dates rather than local-midnight timestamps wherever possible.
- Keep locale, week-start rule, holidays, and time zone explicit in function inputs.
- Render calendars as semantic HTML first; derive print and export formats from the same normalized calendar model.
- Store user configuration in URL parameters so every useful result can be bookmarked and shared.
- Generate only pages with distinct utility. Do not create empty combinations solely to increase indexed page count.
- Treat accessibility, print fidelity, page speed, and minimal layout shift as product requirements.

## First features to build

### 1. Calendar calculation engine

Build the deterministic domain layer before the interface.

Required inputs:

- Year and optional month.
- Locale.
- First day of week.
- Weekend-day definition.
- Optional week-number system.
- Optional holiday set.

Required output:

- A normalized sequence of weeks and days.
- Leading and trailing days needed to complete the grid.
- Day metadata: in-month status, weekend status, week number, and holidays.
- Stable serialization suitable for HTML, PDF, CSV, XLSX, and ICS exporters.

Acceptance checks:

- Leap years and century boundaries are correct.
- Months beginning on every weekday render correctly.
- Sunday- and Monday-start grids contain the correct dates.
- ISO week numbers are correct around year boundaries.
- Calculations do not change with the server's local time zone.

### 2. Monthly and yearly calendar pages

Create the core public routes:

- `/calendar/[year]`
- `/calendar/[year]/[month]`

Each page includes:

- The usable calendar above the fold.
- Previous/next month and year navigation.
- Sunday/Monday start selection.
- Holiday and week-number toggles.
- Print and download actions.
- A canonical URL and descriptive metadata derived from the selected configuration.

The HTML response must contain the useful calendar without waiting for client-side JavaScript. Client JavaScript enhances customization but is not required to view or print the default result.

### 3. Custom calendar builder

Add a builder that supports:

- Arbitrary date range.
- Portrait and landscape orientation.
- Paper size and margins.
- Compact and writing-space layouts.
- Optional title, notes area, holidays, and week numbers.
- Shareable URL state.

Keep the first design system intentionally restrained: excellent typography, black-and-white printing, and predictable spacing are more important than decorative templates.

### 4. Print and exports

Implement exports from the normalized calendar model:

1. Browser print stylesheet.
2. PDF download.
3. ICS holiday/calendar export.
4. CSV export.
5. XLSX export.

Exports must be generated from the selected configuration, include no advertising, and carry a small Calendar Forge source mark. Add snapshot or structural tests so dates cannot silently move to the wrong cells.

### 5. High-intent calendar formats

After the general calendar works, add these differentiated tools in order:

1. Academic-year calendar.
2. Biweekly payroll calendar.
3. Fiscal-year calendar.
4. Rotating-shift calendar.
5. Business-day and date-difference calculators.

Each tool gets one strong interactive page plus a limited set of useful year-specific landing pages. The generated output—not filler prose—is the primary page content.

### 6. Advertising-platform integration

Create an advertising adapter rather than coupling pages directly to one provider.

The adapter should support:

- Named placements with fixed reserved dimensions.
- Lazy loading outside the initial viewport.
- House ads and an empty-state fallback.
- Provider selection for controlled experiments.
- Consent-aware loading.
- Impression, viewability, fill, latency, and revenue events.
- A session-level experiment assignment that does not change during navigation.

Start with conservative placements that do not interfere with calendar use or printing. Compare the experimental platform with a baseline using page RPM, session RPM, fill rate, viewability, latency, cumulative layout shift, and pages per session.

Do not send exact calendar contents, free-form notes, or exported event data into advertising requests.

## Initial acquisition architecture

The first indexable collection should remain small and useful:

- Current year plus the next two years.
- Twelve monthly pages per supported year.
- Yearly Sunday-start and Monday-start variants.
- Yearly versions with ISO week numbers.
- A small set of academic, payroll, fiscal, and shift templates.

Every indexed page must have a unique purpose, a working tool, appropriate internal links, and an accurate canonical URL. Old years can remain accessible when they have demonstrated demand, but navigation should emphasize current and upcoming years.

Embeddable calendars can provide a second acquisition channel. An embed should be lightweight, responsive, configurable, and include a restrained link to the corresponding editable Calendar Forge page.

## Success measures

The initial business target is $1,000 in monthly publisher revenue. Planning assumptions:

- Target 100,000–200,000 monthly pageviews before depending on advertising income.
- Track revenue per thousand pageviews alongside user-experience metrics.
- Prioritize repeat use, direct traffic, embeds, and exports rather than raw indexed-page count.
- Use Calendar Forge as the first controlled publisher for the advertising platform, not as proof that the platform generalizes to every publisher category.

## Non-goals for the first release

- User accounts or collaborative editing.
- Native mobile applications.
- Photo-calendar fulfillment or physical printing.
- Hundreds of decorative themes.
- Scraping and rewriting competitors' protected content.
- Thousands of thin location, language, or date pages.
- A general-purpose project-management calendar.

## Definition of the first release

The first release is complete when a visitor can open an indexable monthly or yearly page, customize its date presentation, print it cleanly, download it as PDF and ICS, share the configured URL, and use the experience without an account. The site records privacy-conscious performance and advertising events, reserves ad space without layout shift, and excludes ads from all printed and exported output.

## Running the app

Calendar Forge is implemented as a server-rendered Next.js application. It requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Useful routes include `/calendar/2026` and `/calendar/2026/7`.

Production domain, indexing, telemetry retention, and launch checks are documented in [docs/deployment.md](docs/deployment.md).

## Validation

```bash
npm test
npm run lint
npm run build
```

The test suite covers leap years, Gregorian century rules, every possible month-start weekday, Sunday/Monday grids, ISO week boundaries, timezone independence, stable serialization, and PDF/ICS/CSV/XLSX export structure.
