import { describe, expect, it } from "vitest";
import { CALCULATOR_INTENT_KEY, calculatorResultKey, consumeCalculatorIntent, storeCalculatorIntent, type IntentStorage } from "./calculator-intent";

const origin = "https://calendarforge.net";
const destination = new URL(`${origin}/date-calculator/days-between?start=2027-01-01&end=2027-01-08`);
const now = 1_000_000;

function storage(): IntentStorage {
  const items = new Map<string, string>();
  return {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => { items.set(key, value); },
    removeItem: (key) => { items.delete(key); },
  };
}

describe("deliberate calculator completion", () => {
  it("does not count a shared link without an action in this tab", () => {
    expect(consumeCalculatorIntent(storage(), "days_between", destination, now)).toBeNull();
  });

  it.each(["form", "shortcut", "settings"] as const)("consumes a %s action once, so refreshes do not complete again", (interaction) => {
    const tab = storage();
    expect(storeCalculatorIntent(tab, "days_between", destination, origin, interaction, now)).toBe(true);
    expect(consumeCalculatorIntent(tab, "days_between", destination, now + 1000)).toBe(interaction);
    expect(consumeCalculatorIntent(tab, "days_between", destination, now + 2000)).toBeNull();
  });

  it("matches query order but never a different calculation or surface", () => {
    const tab = storage();
    storeCalculatorIntent(tab, "days_between", destination, origin, "form", now);
    expect(consumeCalculatorIntent(tab, "days_between", new URL(`${origin}/date-calculator/days-between?start=2027-01-01&end=2027-01-09`), now)).toBeNull();
    expect(consumeCalculatorIntent(tab, "age", new URL(`${origin}/date-calculator/age?birth=2027-01-01`), now)).toBeNull();
    expect(consumeCalculatorIntent(tab, "days_between", new URL(`${origin}/date-calculator/days-between?end=2027-01-08&start=2027-01-01`), now)).toBe("form");
  });

  it("leaves a new action for its destination while the old result is mounted", () => {
    const tab = storage();
    storeCalculatorIntent(tab, "days_between", destination, origin, "shortcut", now);
    expect(consumeCalculatorIntent(tab, "days_between", new URL(`${origin}/date-calculator/days-between?start=2026-01-01&end=2026-01-08`), now)).toBeNull();
    expect(consumeCalculatorIntent(tab, "days_between", destination, now + 100)).toBe("shortcut");
    // A later intentional selection of the same shortcut can complete again.
    storeCalculatorIntent(tab, "days_between", destination, origin, "shortcut", now + 200);
    expect(consumeCalculatorIntent(tab, "days_between", destination, now + 200)).toBe("shortcut");
  });

  it("expires abandoned actions and rejects future timestamps", () => {
    const tab = storage();
    storeCalculatorIntent(tab, "days_between", destination, origin, "form", now);
    expect(consumeCalculatorIntent(tab, "days_between", destination, now + 60_001)).toBeNull();
    expect(tab.getItem(CALCULATOR_INTENT_KEY)).toBeNull();
    storeCalculatorIntent(tab, "days_between", destination, origin, "form", now);
    expect(consumeCalculatorIntent(tab, "days_between", destination, now - 1)).toBeNull();
  });

  it("does not store raw calculator inputs or accept unrelated destinations", () => {
    const tab = storage();
    storeCalculatorIntent(tab, "days_between", destination, origin, "form", now);
    expect(tab.getItem(CALCULATOR_INTENT_KEY)).not.toContain("2027-01");
    expect(tab.getItem(CALCULATOR_INTENT_KEY)).not.toContain("start=");
    expect(storeCalculatorIntent(tab, "days_between", new URL("https://example.com/date-calculator/days-between"), origin, "form", now)).toBe(false);
    expect(storeCalculatorIntent(tab, "days_between", new URL(`${origin}/make-calendar`), origin, "form", now)).toBe(false);
  });

  it("continues safely when storage is disabled or corrupt", () => {
    const blocked: IntentStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    };
    expect(storeCalculatorIntent(blocked, "days_between", destination, origin, "form", now)).toBe(false);
    expect(consumeCalculatorIntent(blocked, "days_between", destination, now)).toBeNull();
    const corrupt = storage();
    corrupt.setItem(CALCULATOR_INTENT_KEY, "not json");
    expect(consumeCalculatorIntent(corrupt, "days_between", destination, now)).toBeNull();
  });

  it("updates the result identity for changed inputs without serializing them", () => {
    expect(calculatorResultKey({ end: "2027-01-08", start: "2027-01-01" })).toBe(calculatorResultKey({ start: "2027-01-01", end: "2027-01-08" }));
    expect(calculatorResultKey({ start: "2027-01-01", end: "2027-01-08" })).not.toBe(calculatorResultKey({ start: "2027-01-01", end: "2027-01-09" }));
    expect(calculatorResultKey({ birth: "1990-01-01" })).not.toContain("1990");
  });
});
