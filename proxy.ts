import { type NextRequest, NextResponse } from "next/server";
import { getTrainingCrawler } from "@/lib/bot-detection";
import { consumeTrainingCrawlerRequest } from "@/lib/crawler-rate-limit";

export function proxy(request: NextRequest) {
  const crawler = getTrainingCrawler(request.headers.get("user-agent") ?? "");
  if (!crawler) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return new NextResponse(null, {
      status: 403,
      headers: { "Cache-Control": "no-store" },
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
