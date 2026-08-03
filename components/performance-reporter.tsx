"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { referringSource, reportTelemetry } from "@/lib/telemetry-client";

export function PerformanceReporter() {
  const pathname = usePathname();
  const previousPath = useRef<string | null>(null);

  useEffect(() => {
    reportTelemetry("page_view", { source: previousPath.current ? "internal" : referringSource() });
    previousPath.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    let cls = 0;
    const observers: PerformanceObserver[] = [];
    try {
      const paint = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) reportTelemetry("lcp", { value: Math.round(last.startTime) });
      });
      paint.observe({ type: "largest-contentful-paint", buffered: true });
      observers.push(paint);

      const layout = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const item = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!item.hadRecentInput) cls += item.value;
        }
      });
      layout.observe({ type: "layout-shift", buffered: true });
      observers.push(layout);
    } catch {
      return;
    }
    const flush = () => reportTelemetry("cls", { value: Number(cls.toFixed(4)) });
    addEventListener("pagehide", flush);
    return () => {
      removeEventListener("pagehide", flush);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);
  return null;
}
