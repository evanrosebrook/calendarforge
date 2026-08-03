const LOCAL_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  const candidate = configured || (vercelHost ? `https://${vercelHost}` : LOCAL_SITE_URL);
  const url = new URL(candidate);

  if (!(["http:", "https:"] as const).includes(url.protocol as "http:" | "https:") || url.username || url.password) {
    throw new Error("The site URL must be an HTTP(S) origin without credentials.");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("The site URL must contain only an origin, such as https://calendarforge.net.");
  }

  return new URL(url.origin);
}

export function absoluteSiteUrl(pathname = "/"): string {
  return new URL(pathname, getSiteUrl()).toString();
}
