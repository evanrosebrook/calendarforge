"use client";

import { useState } from "react";
import { reportTelemetry } from "@/lib/telemetry-client";
import { Check, Copy, Printer } from "./icons";

export function PageActions() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(location.href);
    reportTelemetry("share", { surface: "page_actions" });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  function print() {
    reportTelemetry("print", { surface: "page_actions" });
    window.print();
  }
  return (
    <div className="page-title-actions no-print">
      <button className="button button-small button-ghost" onClick={copy} type="button">{copied ? <Check size={14} /> : <Copy size={14} />} <span>{copied ? "Copied" : "Copy link"}</span></button>
      <button className="button button-small button-accent" onClick={print} type="button"><Printer size={14} /> <span>Print</span></button>
    </div>
  );
}
