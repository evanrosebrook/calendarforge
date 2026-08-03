"use client";

import { useEffect, useRef } from "react";
import { reportTelemetry } from "@/lib/telemetry-client";

export function AdSlot({ placement = "calendar_after" }: { placement?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        reportTelemetry("ad_viewable", { placement });
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [placement]);
  return <div ref={ref} className="ad-slot no-print" data-placement={placement}><div><span>From Calendar Forge</span><strong>Make time for what matters.</strong></div></div>;
}
