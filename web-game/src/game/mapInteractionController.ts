import {
  applyMapViewport,
  computeBaseMapRect,
  computeSafeViewportRect,
  constrainMapViewport,
  panMapViewport,
  zoomMapViewportAtPoint,
  type MapRect,
  type MapViewportTransform,
  type ViewportOccluder
} from "./mapViewport";

interface MapInteractionControllerOptions {
  testMode: boolean;
  viewportSize: () => { width: number; height: number };
  textureSize: () => { width: number; height: number };
  focusPoint: (focusRegionId: string) => { x: number; y: number } | undefined;
  occluders: () => ViewportOccluder[];
}

export class MapInteractionController {
  private currentMapRect?: MapRect;
  private focusRegionId = "";
  private mapZoom = 1;
  private mapPanX = 0;
  private mapPanY = 0;
  private safeViewportCache?: { width: number; height: number; rect: MapRect };

  constructor(private readonly options: MapInteractionControllerOptions) {}

  get zoom(): number {
    return this.mapZoom;
  }

  focusRegion(regionId: string): void {
    this.focusRegionId = regionId;
    this.reset();
  }

  reset(): void {
    this.mapZoom = 1;
    this.mapPanX = 0;
    this.mapPanY = 0;
    this.currentMapRect = undefined;
  }

  clearSafeViewportCache(): void {
    this.safeViewportCache = undefined;
  }

  rect(): MapRect {
    const target = this.targetRect();
    if (this.options.testMode || !this.currentMapRect) {
      this.currentMapRect = target;
      return target;
    }
    const ratio = 0.16;
    this.currentMapRect = {
      x: linear(this.currentMapRect.x, target.x, ratio),
      y: linear(this.currentMapRect.y, target.y, ratio),
      width: linear(this.currentMapRect.width, target.width, ratio),
      height: linear(this.currentMapRect.height, target.height, ratio)
    };
    return this.currentMapRect;
  }

  pan(delta: { x: number; y: number }): void {
    const safe = this.safeViewportRect();
    this.setTransform(panMapViewport(this.baseTargetRect(safe), safe, this.transform(), delta));
  }

  zoomAt(point: { x: number; y: number }, nextZoom: number): void {
    const safe = this.safeViewportRect();
    this.setTransform(
      zoomMapViewportAtPoint(this.baseTargetRect(safe), safe, this.transform(), point, nextZoom)
    );
  }

  constrain(): void {
    const safe = this.safeViewportRect();
    const transform = constrainMapViewport(this.baseTargetRect(safe), safe, this.transform());
    this.mapZoom = transform.zoom;
    this.mapPanX = transform.panX;
    this.mapPanY = transform.panY;
    this.currentMapRect = undefined;
  }

  safeViewportRect(): MapRect {
    const { width, height } = this.options.viewportSize();
    if (this.safeViewportCache?.width === width && this.safeViewportCache.height === height) {
      return this.safeViewportCache.rect;
    }
    const rect = computeSafeViewportRect({ width, height }, this.options.occluders());
    this.safeViewportCache = { width, height, rect };
    return rect;
  }

  private targetRect(): MapRect {
    const safe = this.safeViewportRect();
    return applyMapViewport(this.baseTargetRect(safe), safe, this.transform());
  }

  private baseTargetRect(safe: MapRect): MapRect {
    const viewport = this.options.viewportSize();
    const texture = this.options.textureSize();
    const focusPoint = this.options.focusPoint(this.focusRegionId);
    return computeBaseMapRect(
      viewport,
      texture,
      safe,
      Boolean(this.focusRegionId),
      focusPoint
    );
  }

  private transform(): MapViewportTransform {
    return {
      zoom: this.mapZoom,
      panX: this.mapPanX,
      panY: this.mapPanY
    };
  }

  private setTransform(transform: MapViewportTransform): void {
    this.mapZoom = transform.zoom;
    this.mapPanX = transform.panX;
    this.mapPanY = transform.panY;
    this.currentMapRect = this.targetRect();
  }
}

function linear(start: number, end: number, ratio: number): number {
  return start + (end - start) * ratio;
}
