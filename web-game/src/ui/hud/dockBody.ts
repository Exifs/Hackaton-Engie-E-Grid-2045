import type { DockTab } from "./types";

export function renderDockBody(
  activeDockTab: DockTab,
  bodyMarkup: string
): string {
  return `
    <div class="palette-body palette-body-${activeDockTab}" data-scroll-key="${activeDockTab}">
      ${bodyMarkup}
    </div>
  `;
}
