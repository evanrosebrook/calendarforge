"use client";

import { useEffect, useRef } from "react";
import { reportTelemetry } from "@/lib/telemetry-client";

type CalculatorSurface = "add_subtract" | "age" | "business_days" | "days_between" | "days_until" | "shift_calendar";

export function CalculatorResultTelemetry({ surface }: { surface: CalculatorSurface }) {
  const reported = useRef(false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    reportTelemetry("calculator_result", { surface });
  }, [surface]);

  return null;
}
