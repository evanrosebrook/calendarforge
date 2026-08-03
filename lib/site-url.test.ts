import { afterEach, describe, expect, it } from "vitest";
import { absoluteSiteUrl, getSiteUrl } from "./site-url";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const originalVercelUrl = process.env.VERCEL_URL;

afterEach(() => {
  restore("NEXT_PUBLIC_SITE_URL", originalSiteUrl);
  restore("VERCEL_PROJECT_PRODUCTION_URL", originalProductionUrl);
  restore("VERCEL_URL", originalVercelUrl);
});

describe("site URL configuration", () => {
  it("uses localhost during unconfigured local development", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
    expect(getSiteUrl().toString()).toBe("http://localhost:3000/");
  });

  it("normalizes the configured origin and resolves absolute URLs", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://calendarforge.net/";
    expect(getSiteUrl().toString()).toBe("https://calendarforge.net/");
    expect(absoluteSiteUrl("/calendar/2027/1")).toBe("https://calendarforge.net/calendar/2027/1");
  });

  it("uses the production deployment hostname when an explicit origin is absent", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "calendarforge.example";
    expect(getSiteUrl().toString()).toBe("https://calendarforge.example/");
  });

  it("rejects a URL containing a path", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://calendarforge.net/tools";
    expect(() => getSiteUrl()).toThrow(/only an origin/);
  });
});

function restore(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
