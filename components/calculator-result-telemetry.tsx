"use client";

import { useEffect, useRef } from "react";
import { CALCULATOR_INTENT_EVENT, consumeCalculatorIntent, type CalculatorSurface } from "@/lib/calculator-intent";
import { reportTelemetry } from "@/lib/telemetry-client";

export function CalculatorResultTelemetry({ surface, resultKey }: { surface: CalculatorSurface; resultKey: string }) {
  const reported = useRef<string | null>(null);

  useEffect(() => {
    const viewKey = `${surface}:${resultKey}`;
    if (reported.current !== viewKey) {
      reported.current = viewKey;
      reportTelemetry("calculator_result_view", { surface });
    }
    const complete = () => {
      try {
        const interaction = consumeCalculatorIntent(sessionStorage, surface, new URL(location.href));
        if (interaction) reportTelemetry("calculator_complete", { surface, interaction });
      } catch {
        // Storage restrictions affect measurement only.
      }
    };
    complete();
    // Also handles selecting a shortcut whose result is already displayed.
    window.addEventListener(CALCULATOR_INTENT_EVENT, complete);
    return () => window.removeEventListener(CALCULATOR_INTENT_EVENT, complete);
  }, [surface, resultKey]);

  return null;
}
