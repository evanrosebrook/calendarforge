import { type NextRequest, NextResponse } from "next/server";
import { isAbusiveCrawlerUserAgent } from "@/lib/bot-detection";

export function proxy(request: NextRequest) {
  if (!isAbusiveCrawlerUserAgent(request.headers.get("user-agent") ?? "")) {
    return NextResponse.next();
  }

  return new NextResponse(null, {
    status: 403,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: ["/((?!robots\\.txt|_next/static|_next/image|favicon\\.svg).*)"],
};
