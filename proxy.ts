import { type NextRequest, NextResponse } from "next/server";
import { isAcquisitionYear } from "@/lib/acquisition";
import { getTrainingCrawler } from "@/lib/bot-detection";
import { consumeTrainingCrawlerRequest } from "@/lib/crawler-rate-limit";

const trainingCrawlerStaticPaths = new Set([
  "/",
  "/date-calculator",
  "/date-calculator/add-subtract",
  "/date-calculator/age",
  "/date-calculator/business-days",
  "/date-calculator/days-between",
  "/date-calculator/days-until",
  "/days-until/christmas",
  "/days-until/easter",
  "/fiscal-calendar",
  "/holidays",
  "/make-calendar",
  "/privacy",
  "/shift-calendar",
  "/sitemap.xml",
  "/sitemaps/calendars.xml",
  "/sitemaps/dates.xml",
  "/sitemaps/holidays.xml",
  "/sitemaps/static.xml",
  "/today",
]);

export function isTrainingCrawlerPathAllowed(pathname: string): boolean {
  if (trainingCrawlerStaticPaths.has(pathname)) return true;
  if (/^\/holidays\/(?:us|canada)\/holiday\/[a-z0-9-]+$/.test(pathname)) return true;

  const date = pathname.match(/^\/date\/(\d{4})-\d{2}-\d{2}$/);
  if (date) return isAcquisitionYear(Number(date[1]));

  const calendar = pathname.match(/^\/calendar\/(?:monday-start\/)?(\d{4})(?:\/(?:[1-9]|1[0-2]))?$/);
  if (calendar) return isAcquisitionYear(Number(calendar[1]));

  const holidayYear = pathname.match(/^\/holidays\/(?:us|canada)\/(\d{4})$/);
  if (holidayYear) return isAcquisitionYear(Number(holidayYear[1]));

  const moonPhases = pathname.match(/^\/moon-phases\/(\d{4})$/);
  return moonPhases ? isAcquisitionYear(Number(moonPhases[1])) : false;
}

export function proxy(request: NextRequest) {
  const crawler = getTrainingCrawler(request.headers.get("user-agent") ?? "");
  if (!crawler) return NextResponse.next();

  if (request.nextUrl.search || !isTrainingCrawlerPathAllowed(request.nextUrl.pathname)) {
    return new NextResponse(null, {
      status: 403,
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  const rateLimit = consumeTrainingCrawlerRequest(crawler);
  if (rateLimit.allowed) return NextResponse.next();

  return new NextResponse(null, {
    status: 429,
    headers: {
      "Cache-Control": "no-store",
      "Retry-After": String(rateLimit.retryAfterSeconds),
    },
  });
}

export const config = {
  matcher: ["/((?!robots\\.txt|_next/static|_next/image|favicon\\.svg).*)"],
};
