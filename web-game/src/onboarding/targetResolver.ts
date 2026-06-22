export interface ResolvedOnboardingTarget {
  found: boolean;
  selector: string;
  rect?: DOMRectReadOnly;
}

interface TargetResolverOptions {
  document?: Pick<Document, "querySelector" | "querySelectorAll">;
  regionPoint?: (regionId: string) => { x: number; y: number } | undefined;
}

export class TargetResolver {
  private readonly document?: Pick<Document, "querySelector" | "querySelectorAll">;
  private readonly regionPoint?: (regionId: string) => { x: number; y: number } | undefined;

  constructor(options: TargetResolverOptions = {}) {
    this.document = options.document ?? (typeof document === "undefined" ? undefined : document);
    this.regionPoint = options.regionPoint;
  }

  resolve(target = ""): ResolvedOnboardingTarget {
    if (target.startsWith("region.")) {
      return this.resolveRegion(target);
    }

    const selector = `[data-onboarding-target="${cssEscape(target)}"]`;
    const element = this.findVisibleElement(selector);
    if (!element) {
      return { found: false, selector };
    }
    const rect = inflateRect(element.getBoundingClientRect(), 8);
    return { found: true, selector, rect };
  }

  private findVisibleElement(selector: string): HTMLElement | null {
    const elements = this.document?.querySelectorAll
      ? Array.from(this.document.querySelectorAll(selector) as Iterable<HTMLElement>)
      : singleElement(this.document?.querySelector(selector) as HTMLElement | null | undefined);
    return elements.find((element) => isVisibleElement(element)) ?? null;
  }

  private resolveRegion(target: string): ResolvedOnboardingTarget {
    const regionId = target.slice("region.".length);
    const point = this.regionPoint?.(regionId);
    const selector = `region:${regionId}`;
    if (!point) {
      return { found: false, selector };
    }
    return {
      found: true,
      selector,
      rect: toRect(point.x - 42, point.y - 42, 84, 84)
    };
  }
}

function singleElement(element: HTMLElement | null | undefined): HTMLElement[] {
  return element ? [element] : [];
}

function isVisibleElement(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }
  if (typeof window === "undefined" || !window.getComputedStyle) {
    return true;
  }
  const style = window.getComputedStyle(element);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function inflateRect(rect: DOMRectReadOnly, padding: number): DOMRectReadOnly {
  return toRect(rect.x - padding, rect.y - padding, rect.width + padding * 2, rect.height + padding * 2);
}

function toRect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({ x, y, width, height })
  };
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && CSS.escape) {
    return CSS.escape(value);
  }
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}
