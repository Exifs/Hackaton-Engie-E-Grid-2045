export interface MapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapViewportTransform {
  zoom: number;
  panX: number;
  panY: number;
}

interface MapViewportSize {
  width: number;
  height: number;
}

interface MapTextureSize {
  width: number;
  height: number;
}

interface MapFocusPoint {
  x: number;
  y: number;
}

export interface ViewportOccluder {
  x: number;
  y: number;
  width: number;
  height: number;
}

const MIN_MAP_ZOOM = 0.8;
const MAX_MAP_ZOOM = 2;

export function clampMapZoom(value: number): number {
  return clamp(value, MIN_MAP_ZOOM, MAX_MAP_ZOOM);
}

export function applyMapViewport(base: MapRect, safe: MapRect, transform: MapViewportTransform): MapRect {
  const zoom = clampMapZoom(transform.zoom);
  const width = base.width * zoom;
  const height = base.height * zoom;
  const x = base.x + (base.width - width) / 2 + transform.panX;
  const y = base.y + (base.height - height) / 2 + transform.panY;
  return clampMapRectToSafe({ x, y, width, height }, safe);
}

export function panMapViewport(
  base: MapRect,
  safe: MapRect,
  transform: MapViewportTransform,
  delta: { x: number; y: number }
): MapViewportTransform {
  return constrainMapViewport(base, safe, {
    zoom: transform.zoom,
    panX: transform.panX + delta.x,
    panY: transform.panY + delta.y
  });
}

export function zoomMapViewportAtPoint(
  base: MapRect,
  safe: MapRect,
  transform: MapViewportTransform,
  point: { x: number; y: number },
  nextZoom: number
): MapViewportTransform {
  const before = applyMapViewport(base, safe, transform);
  const zoom = clampMapZoom(nextZoom);
  const nextWidth = base.width * zoom;
  const nextHeight = base.height * zoom;
  const baseX = base.x + (base.width - nextWidth) / 2;
  const baseY = base.y + (base.height - nextHeight) / 2;
  const ratioX = before.width > 0 ? clamp((point.x - before.x) / before.width, 0, 1) : 0.5;
  const ratioY = before.height > 0 ? clamp((point.y - before.y) / before.height, 0, 1) : 0.5;

  return constrainMapViewport(base, safe, {
    zoom,
    panX: point.x - ratioX * nextWidth - baseX,
    panY: point.y - ratioY * nextHeight - baseY
  });
}

export function constrainMapViewport(
  base: MapRect,
  safe: MapRect,
  transform: MapViewportTransform
): MapViewportTransform {
  const zoom = clampMapZoom(transform.zoom);
  const width = base.width * zoom;
  const height = base.height * zoom;
  const baseX = base.x + (base.width - width) / 2;
  const baseY = base.y + (base.height - height) / 2;
  const rect = clampMapRectToSafe(
    {
      x: baseX + transform.panX,
      y: baseY + transform.panY,
      width,
      height
    },
    safe
  );

  return {
    zoom,
    panX: rect.x - baseX,
    panY: rect.y - baseY
  };
}

export function computeBaseMapRect(
  viewport: MapViewportSize,
  texture: MapTextureSize,
  safe: MapRect,
  focusActive: boolean,
  focusPoint?: MapFocusPoint
): MapRect {
  const imageRatio = texture.width / texture.height || 16 / 9;
  const desktopConceptFrame = viewport.width >= 1180 && viewport.height >= 760;
  const baseScale = desktopConceptFrame
    ? Math.max(safe.width / texture.width, safe.height / texture.height)
    : Math.min(safe.width / texture.width, safe.height / texture.height);
  const focusScale = focusActive ? baseScale * (desktopConceptFrame ? 1.04 : 1.14) : baseScale;
  const scale = Math.max(baseScale, focusScale);
  const mapWidth = texture.width * scale;
  const mapHeight = texture.height * scale;

  let x = safe.x + (safe.width - mapWidth) / 2;
  let y = safe.y + (safe.height - mapHeight) / 2;

  if (focusPoint) {
    const margin = Math.min(84, Math.max(36, Math.min(safe.width, safe.height) * 0.12));
    const point = { x: x + focusPoint.x * mapWidth, y: y + focusPoint.y * mapHeight };
    if (point.x < safe.x + margin) {
      x += safe.x + margin - point.x;
    } else if (point.x > safe.x + safe.width - margin) {
      x -= point.x - (safe.x + safe.width - margin);
    }
    if (point.y < safe.y + margin) {
      y += safe.y + margin - point.y;
    } else if (point.y > safe.y + safe.height - margin) {
      y -= point.y - (safe.y + safe.height - margin);
    }
  }

  if (mapWidth > safe.width) {
    x = clamp(x, safe.x + safe.width - mapWidth, safe.x);
  } else {
    x = safe.x + (safe.width - mapWidth) / 2;
  }
  if (mapHeight > safe.height) {
    y = clamp(y, safe.y + safe.height - mapHeight, safe.y);
  } else {
    y = safe.y + (safe.height - mapHeight) / 2;
  }

  if (mapWidth / mapHeight > imageRatio + 0.001) {
    return { x, y, width: mapWidth, height: mapWidth / imageRatio };
  }
  return { x, y, width: mapWidth, height: mapHeight };
}

export function computeSafeViewportRect(viewport: MapViewportSize, occluders: ViewportOccluder[]): MapRect {
  const { width, height } = viewport;
  let top = 0;
  let right = 0;
  let bottom = 0;
  let left = 0;

  for (const rect of occluders) {
    if (rect.width < 2 || rect.height < 2) {
      continue;
    }

    const spansHorizontal = rect.width > width * 0.5;
    const spansVertical = rect.height > height * 0.18;
    if (spansHorizontal && rect.y < height * 0.35) {
      top = Math.max(top, rect.y + rect.height + 12);
    }
    if (spansHorizontal && rect.y + rect.height > height * 0.58) {
      bottom = Math.max(bottom, height - rect.y + 12);
    }
    if (!spansHorizontal && spansVertical && rect.x < width * 0.22) {
      left = Math.max(left, rect.x + rect.width + 12);
    }
    if (!spansHorizontal && spansVertical && rect.x + rect.width > width * 0.78) {
      right = Math.max(right, width - rect.x + 12);
    }
  }

  const minWidth = Math.max(280, width * 0.36);
  const minHeight = Math.max(220, height * 0.32);
  if (width - left - right < minWidth) {
    left = 0;
    right = 0;
  }
  if (height - top - bottom < minHeight) {
    top = Math.min(top, height * 0.18);
    bottom = Math.min(bottom, height * 0.22);
  }

  return {
    x: left,
    y: top,
    width: Math.max(minWidth, width - left - right),
    height: Math.max(minHeight, height - top - bottom)
  };
}

function clampMapRectToSafe(rect: MapRect, safe: MapRect): MapRect {
  return {
    ...rect,
    x: clampAxis(rect.x, rect.width, safe.x, safe.width),
    y: clampAxis(rect.y, rect.height, safe.y, safe.height)
  };
}

function clampAxis(value: number, size: number, safeStart: number, safeSize: number): number {
  if (size > safeSize) {
    return clamp(value, safeStart + safeSize - size, safeStart);
  }
  return clamp(value, safeStart, safeStart + safeSize - size);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
