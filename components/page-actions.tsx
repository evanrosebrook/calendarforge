"use client";

import { useState } from "react";
import { Check, Copy, Printer } from "./icons";

export function PageActions() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="page-title-actions no-print">
      <button className="button button-small button-ghost" onClick={copy} type="button">{copied ? <Check size={14} /> : <Copy size={14} />} <span>{copied ? "Copied" : "Copy link"}</span></button>
      <button className="button button-small button-accent" onClick={() => window.print()} type="button"><Printer size={14} /> <span>Print</span></button>
    </div>
  );
}
