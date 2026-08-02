"use client";

import { useEffect } from "react";

type Metric = { name: string; value: number; path: string };

function report(metric: Metric) {
  const body = JSON.stringify(metric);
  if (navigator.sendBeacon) navigator.sendBeacon("/api/telemetry", body);
}

export function PerformanceReporter() {
  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;
    let cls = 0;
    const observers: PerformanceObserver[] = [];
    try {
      const paint = new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) report({ name: "lcp", value: Math.round(last.startTime), path: location.pathname });
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
    const flush = () => report({ name: "cls", value: Number(cls.toFixed(4)), path: location.pathname });
    addEventListener("pagehide", flush);
    return () => {
      removeEventListener("pagehide", flush);
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);
  return null;
}
