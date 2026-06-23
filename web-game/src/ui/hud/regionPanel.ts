import { t } from "../../i18n";
import type { BuildingDefinition, RegionSnapshot } from "../../sim";
import { escapeHtml } from "./format";

interface RegionPanelRenderOptions {
  selectedRegion: RegionSnapshot | undefined;
  buildings: Record<string, BuildingDefinition>;
  monthProgress: number;
  renderRegionPanel: (
    region: RegionSnapshot,
    buildings: Record<string, BuildingDefinition>,
    monthProgress: number
  ) => string;
}

export function renderRegionPanelShell(options: RegionPanelRenderOptions): string {
  return `
    <section class="region-panel" aria-label="${escapeHtml(t("hud.aria.selectedRegion"))}" data-onboarding-target="region.panel">
      <div class="region-resize-handle" data-resize-panel="region" title="${escapeHtml(t("hud.region.resizeRight"))}"></div>
      ${options.selectedRegion
        ? options.renderRegionPanel(options.selectedRegion, options.buildings, options.monthProgress)
        : `<div class="panel-title">${escapeHtml(t("hud.panels.selectedRegionFallback"))}</div>`}
    </section>
  `;
}
