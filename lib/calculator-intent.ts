import type { SearchParams } from "./settings";

const calculatorPaths = {
  add_subtract: "/date-calculator/add-subtract",
  age: "/date-calculator/age",
  business_days: "/date-calculator/business-days",
  days_between: "/date-calculator/days-between",
  days_until: "/date-calculator/days-until",
  pay_period: "/pay-period-calendar",
  shift_calendar: "/shift-calendar",
} as const;

export type CalculatorSurface = keyof typeof calculatorPaths;
export type CalculatorInteraction = "form" | "shortcut" | "settings";
export type IntentStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const CALCULATOR_INTENT_EVENT = "calendarforge:calculator-intent";
export const CALCULATOR_INTENT_KEY = "calendarforge:calculator-intent:v1";
const intentLifetimeMs = 60_000;
const interactions = new Set<CalculatorInteraction>(["form", "shortcut", "settings"]);

// This fingerprint only matches a navigation to its result. It is not an
// authentication token. Neither it nor calculator inputs are included in telemetry.
function queryKey(params: URLSearchParams): string {
  const sorted = new URLSearchParams(params);
  sorted.sort();
  let hash = 2166136261;
  for (const character of sorted.toString()) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(36);
}

export function calculatorResultKey(params: SearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) value.forEach((item) => query.append(key, item));
    else if (value !== undefined) query.append(key, value);
  }
  return queryKey(query);
}

function targetKey(url: URL): string {
  return `${url.pathname}?${queryKey(url.searchParams)}`;
}

export function storeCalculatorIntent(
  storage: IntentStorage,
  surface: CalculatorSurface,
  target: URL,
  origin: string,
  interaction: CalculatorInteraction,
  now = Date.now(),
): boolean {
  if (target.origin !== origin || target.pathname !== calculatorPaths[surface]) return false;
  try {
    storage.setItem(CALCULATOR_INTENT_KEY, JSON.stringify({ surface, target: targetKey(target), interaction, createdAt: now }));
    return true;
  } catch {
    // Unavailable storage must never interfere with a calculation.
    return false;
  }
}

export function consumeCalculatorIntent(
  storage: IntentStorage,
  surface: CalculatorSurface,
  result: URL,
  now = Date.now(),
): CalculatorInteraction | null {
  try {
    const raw = storage.getItem(CALCULATOR_INTENT_KEY);
    if (!raw) return null;
    const intent = JSON.parse(raw);
    if (!intent || typeof intent.createdAt !== "number" || now < intent.createdAt || now - intent.createdAt > intentLifetimeMs
      || !interactions.has(intent.interaction)) {
      storage.removeItem(CALCULATOR_INTENT_KEY);
      return null;
    }
    // A click is recorded before navigation, while the previous result can still
    // be mounted. Leave the marker for the matching destination to consume.
    if (intent.surface !== surface || result.pathname !== calculatorPaths[surface] || intent.target !== targetKey(result)) return null;
    storage.removeItem(CALCULATOR_INTENT_KEY);
    return intent.interaction;
  } catch {
    return null;
  }
}

export function markCalculatorIntent(surface: CalculatorSurface, href: string, interaction: CalculatorInteraction) {
  try {
    const target = new URL(href, location.href);
    if (storeCalculatorIntent(sessionStorage, surface, target, location.origin, interaction)) {
      window.dispatchEvent(new Event(CALCULATOR_INTENT_EVENT));
    }
  } catch {
    // Analytics is optional, including when browser storage is disabled.
  }
}
