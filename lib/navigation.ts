import type { SearchParams } from "./settings";

export function queryString(params: SearchParams): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const item = Array.isArray(value) ? value[0] : value;
    if (item) query.set(key, item);
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}

export function adjacentMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const index = year * 12 + month - 1 + offset;
  return { year: Math.floor(index / 12), month: (index % 12 + 12) % 12 + 1 };
}
