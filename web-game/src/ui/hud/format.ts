import { t } from "../../i18n";

export function fmt(value: number, digits = 0): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return value.toFixed(digits);
}

export function moneyBillions(valueInMillions: number): string {
  const value = Number.isFinite(valueInMillions) ? (valueInMillions / 1000).toFixed(1) : "0.0";
  return t("common.units.billionCurrency", { value });
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function clampPctFloat(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}

export function clampRatio(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
}

export function parseProgressValue(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? clampPctFloat(parsed) : undefined;
}

export function miniCoordX(value: number): number {
  return miniCoordAxis(value, 12, 76);
}

export function miniCoordY(value: number): number {
  return miniCoordAxis(value, 4, 92);
}

export function miniRoutePath(
  source: { x: number; y: number },
  target: { x: number; y: number },
  key: string,
  strength: number
): string {
  const sx = miniCoordX(source.x);
  const sy = miniCoordY(source.y);
  const tx = miniCoordX(target.x);
  const ty = miniCoordY(target.y);
  const dx = tx - sx;
  const dy = ty - sy;
  const distance = Math.hypot(dx, dy) || 1;
  const hash = miniHashString(key);
  const sign = hash % 2 === 0 ? 1 : -1;
  const jitter = ((hash % 9) - 4) * 0.36;
  const curve = Math.min(20, Math.max(5, distance * 0.14 + strength + jitter));
  const cx = miniClampCoord((sx + tx) / 2 - (dy / distance) * curve * sign);
  const cy = miniClampCoord((sy + ty) / 2 + (dx / distance) * curve * sign);
  return `M ${fmt(sx, 1)} ${fmt(sy, 1)} Q ${fmt(cx, 1)} ${fmt(cy, 1)} ${fmt(tx, 1)} ${fmt(ty, 1)}`;
}

function miniCoordAxis(value: number, offset: number, scale: number): number {
  if (!Number.isFinite(value)) {
    return 50;
  }
  return Math.max(4, Math.min(96, Math.round((offset + value * scale) * 10) / 10));
}

function miniClampCoord(value: number): number {
  return Math.max(2, Math.min(98, value));
}

function miniHashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
