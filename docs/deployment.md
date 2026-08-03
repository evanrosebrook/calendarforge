# Deployment checklist

## Required configuration

Set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin, without a path or trailing application route:

```text
NEXT_PUBLIC_SITE_URL=https://calendarforge.net
```

Calendar Forge falls back to the production hostname supplied by Vercel and then to `http://localhost:3000` for local development. The configured origin is used for canonical URLs, `robots.txt`, and `sitemap.xml`.

## Before announcing the site

1. Connect the chosen domain to the hosting provider and confirm HTTPS is active.
2. Set `NEXT_PUBLIC_SITE_URL` in the production environment and rebuild.
3. Confirm `/robots.txt` and `/sitemap.xml` use the public origin.
4. Verify the site in Google Search Console and Bing Webmaster Tools, then submit `/sitemap.xml`.
5. Confirm `hello@calendarforge.net` can receive feedback.
6. Smoke-test calendar PDF, ICS, CSV, XLSX, and builder SVG downloads against the production deployment.

## Container deployment

Run the complete deployment pipeline from the repository root:

```bash
npm run deploy:droplet
```

The script runs tests and lint, builds an AMD64 image with the public origin embedded, runs a
constrained local smoke test, streams the versioned image over SSH, validates the Compose file on
the droplet, and waits for production health and export probes. It records both the active version
and the immediately previous deployment. If rollout validation fails, it restores the previous
Compose definition and image automatically.

By default, versions combine a UTC timestamp, the Git revision, and a `-dirty` suffix when the
working tree is not clean. Dirty deployments emit a warning because the image cannot be recreated
from Git alone. To provide a release version explicitly:

```bash
CALENDARFORGE_VERSION=2026.08.03-1 npm run deploy:droplet
```

Roll back to the immediately previous successful deployment with:

```bash
npm run rollback:droplet
```

The deploy and rollback commands use the `calendarforge-droplet` SSH alias by default. Override it
with `CALENDARFORGE_SSH_HOST` when needed. Production images are built away from the 2 GB droplet
and transferred without a registry.

The production Compose service binds only to `127.0.0.1:3000`; the host web server must terminate
HTTPS and reverse proxy the Calendar Forge hostname to that loopback port. The container is limited
to 512 MiB of memory and 0.75 CPU so it cannot exhaust resources needed by WordPress and MySQL.

The production Apache configurations live in `deploy/apache`. Enable the bootstrap HTTP virtual
host only while obtaining the first certificate. After Certbot creates the certificate, replace it
with `calendarforge.net.conf`, which redirects HTTP and `www` to the canonical HTTPS origin and
proxies the apex hostname to the loopback container.

## Telemetry storage

The application emits privacy-conscious structured events named `calendar_forge_metric`. Events include page views, print, share, export, performance, and ad-viewability signals. Paths never include query strings, and external attribution is reduced to the referring hostname.

The default telemetry endpoint writes these events to application logs. Hosting logs are not guaranteed durable storage. Before relying on telemetry for reporting, configure the hosting provider's log drain to a retained destination or replace the body of `app/api/telemetry/route.ts` with a database or analytics-provider write. Do not send custom calendar titles, notes, full URLs, or query strings.

## Advertising

The current ad placement is a first-party house placement. Before adding a third-party advertising provider, add the provider's required privacy disclosures and consent behavior, and keep ads excluded from print and export output.
