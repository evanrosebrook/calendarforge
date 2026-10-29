"use client";

import Link from "next/link";
import type { ComponentProps, FormEvent } from "react";
import { markCalculatorIntent, type CalculatorSurface } from "@/lib/calculator-intent";

type FormProps = Omit<ComponentProps<"form">, "onSubmit" | "method"> & { surface: CalculatorSurface };

export function CalculatorForm({ surface, ...props }: FormProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    if (!event.nativeEvent.isTrusted || event.defaultPrevented) return;
    const form = event.currentTarget;
    const target = new URL(form.action, location.href);
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      if (typeof value === "string") query.append(key, value);
    }
    target.search = query.toString();
    markCalculatorIntent(surface, target.href, "form");
  }

  return <form {...props} method="get" onSubmit={submit} />;
}

type ShortcutProps = Omit<ComponentProps<typeof Link>, "href" | "onClick"> & { href: string; surface: CalculatorSurface };

export function CalculatorShortcut({ surface, href, ...props }: ShortcutProps) {
  return <Link {...props} href={href} onClick={(event) => {
    if (!event.nativeEvent.isTrusted || event.defaultPrevented || event.button !== 0
      || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (props.target && props.target !== "_self")) return;
    markCalculatorIntent(surface, href, "shortcut");
  }} />;
}
