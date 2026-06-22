import { t } from "../../i18n";
import { escapeHtml } from "./format";
import { renderDockBody } from "./dockBody";
import { renderPaletteTab } from "./topBar";
import type { DockTab } from "./types";

interface ConstructionDockOptions {
  paletteOpen: boolean;
  activeDockTab: DockTab;
  filterToggleMarkup: string;
  bodyMarkup: string;
  gridOverviewMarkup: string;
  renderContext: Parameters<typeof renderPaletteTab>[2];
}

export function renderConstructionDock(options: ConstructionDockOptions): string {
  return `
    <section class="build-palette ${options.paletteOpen ? "is-open" : ""}" aria-label="${escapeHtml(t("hud.aria.construction"))}" data-onboarding-target="construction.menu">
      <div class="dock-resize-handle" data-resize-panel="dock" title="${escapeHtml(t("hud.dock.resizeBottom"))}"></div>
      <div class="palette-header">
        <button class="palette-toggle" type="button" data-action="toggle-palette">
          <span>${escapeHtml(options.paletteOpen ? t("hud.dock.close") : t("hud.dock.build"))}</span>
        </button>
        <div class="palette-tabs" role="tablist" aria-label="${escapeHtml(t("hud.dock.panel"))}">
          ${renderPaletteTab("construction", t("hud.panels.construction"), options.renderContext)}
          ${renderPaletteTab("research", t("hud.panels.research"), options.renderContext)}
        </div>
        ${options.paletteOpen ? options.filterToggleMarkup : ""}
      </div>
      ${renderDockBody(options.activeDockTab, options.bodyMarkup)}
      ${options.gridOverviewMarkup}
    </section>
  `;
}
