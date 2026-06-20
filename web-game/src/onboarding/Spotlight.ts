import type { ResolvedOnboardingTarget } from "./targetResolver";

export function renderSpotlight(target: ResolvedOnboardingTarget): string {
  const rect = target.rect ?? fallbackRect();
  const attached = target.found ? "is-attached" : "is-fallback";
  return `
    <div class="onboarding-scrim" aria-hidden="true"></div>
    <div
      class="onboarding-spotlight ${attached}"
      aria-hidden="true"
      style="left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px"
    ></div>
  `;
}

function fallbackRect(): DOMRectReadOnly {
  const width = typeof window === "undefined" ? 1024 : window.innerWidth;
  const height = typeof window === "undefined" ? 768 : window.innerHeight;
  return {
    x: Math.max(24, width * 0.5 - 150),
    y: Math.max(120, height * 0.42 - 90),
    width: 300,
    height: 180,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({})
  };
}
