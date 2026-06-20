export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}

export function numberFrom(raw: unknown, fallback: number): number {
  if (raw === null || raw === undefined) {
    return fallback;
  }
  const value = Number(String(raw).trim());
  return Number.isFinite(value) ? value : fallback;
}

export function numberOrInfinity(raw: unknown): number {
  const text = String(raw ?? "").trim();
  if (!text) {
    return Number.POSITIVE_INFINITY;
  }
  return numberFrom(text, Number.POSITIVE_INFINITY);
}

export function splitList(raw: unknown): string[] {
  const text = String(raw ?? "").trim();
  if (!text) {
    return [];
  }
  return text
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function stableHash(text: string): number {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function cloneRecord<T>(value: T): T {
  return structuredClone(value);
}
