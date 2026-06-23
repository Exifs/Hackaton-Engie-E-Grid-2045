interface MapPoint {
  x: number;
  y: number;
}

export function clampColor(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function mixColor(start: number, end: number, ratio: number): number {
  const r1 = (start >> 16) & 255;
  const g1 = (start >> 8) & 255;
  const b1 = start & 255;
  const r2 = (end >> 16) & 255;
  const g2 = (end >> 8) & 255;
  const b2 = end & 255;
  const clampedRatio = clampColor(ratio);
  const r = Math.round(r1 + (r2 - r1) * clampedRatio);
  const g = Math.round(g1 + (g2 - g1) * clampedRatio);
  const b = Math.round(b1 + (b2 - b1) * clampedRatio);
  return (r << 16) | (g << 8) | b;
}

export function quadraticPoint(sourcePoint: MapPoint, controlPoint: MapPoint, targetPoint: MapPoint, t: number): MapPoint {
  const clamped = clampColor(t);
  const inverse = 1 - clamped;
  return {
    x: inverse * inverse * sourcePoint.x + 2 * inverse * clamped * controlPoint.x + clamped * clamped * targetPoint.x,
    y: inverse * inverse * sourcePoint.y + 2 * inverse * clamped * controlPoint.y + clamped * clamped * targetPoint.y
  };
}

export function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
