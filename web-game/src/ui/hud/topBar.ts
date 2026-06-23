import type { HeatmapMode } from "../../game/heatmap";
import { t } from "../../i18n";
import type { SimulationCore } from "../../sim";
import { clampPctFloat, escapeHtml, fmt, moneyBillions } from "./format";
import type { DockTab } from "./types";

type Summary = ReturnType<SimulationCore["getSummary"]>;

interface TopBarContext {
  heatmapMode: HeatmapMode;
  activeDockTab: DockTab;
  tooltipAttrs: (title: string, body: string, meta?: string) => string;
}

export function renderTopBar(summary: Summary, ctx: TopBarContext): string {
  return `
    <section class="top-kpi" aria-label="${escapeHtml(t("hud.aria.indicators"))}" data-onboarding-target="kpi.bar">
      ${topBrand(ctx)}
      ${agiDuel(summary.eu_agi_progress, summary.usa_agi_progress, ctx)}
      ${budgetKpi(summary, ctx)}
      ${dateKpi(summary, ctx)}
      ${resourceSummary(summary, ctx)}
      ${timeControls(summary, ctx)}
      ${topMenuCommand(ctx)}
    </section>
  `;
}

export function renderHeatmapSwitch(ctx: TopBarContext): string {
  return `
    <section class="heatmap-switch" aria-label="${escapeHtml(t("hud.aria.heatmaps"))}" data-onboarding-target="overlay.switch">
      ${heatmapButton("energy", ctx)}
      ${heatmapButton("cooling", ctx)}
      ${heatmapButton("network", ctx)}
      ${heatmapButton("compute", ctx)}
      ${heatmapButton("co2", ctx)}
      ${heatmapButton("none", ctx)}
    </section>
  `;
}

export function renderPaletteTab(tab: DockTab, label: string, ctx: TopBarContext): string {
  const active = ctx.activeDockTab === tab;
  return `<button class="palette-tab ${active ? "is-active" : ""}" type="button" data-palette-tab="${tab}" data-onboarding-target="palette.${tab}" role="tab" aria-selected="${active}">${label}</button>`;
}

function resourceSummary(summary: Summary, ctx: TopBarContext): string {
  const energyBalance = summary.energy_produced - summary.energy_consumed;
  const coolingBalance = summary.cooling_available - summary.cooling_used;
  const compute = summary.compute_produced;
  const tooltip = t("hud.resources.tooltip", {
    energyProduced: fmt(summary.energy_produced),
    energyConsumed: fmt(summary.energy_consumed),
    coolingAvailable: fmt(summary.cooling_available),
    coolingUsed: fmt(summary.cooling_used),
    compute: fmt(compute),
    co2Tier: summary.co2_tier
  });
  return `
    <section class="resource-summary" aria-label="${escapeHtml(t("hud.aria.resources"))}" data-onboarding-target="kpi.resources" ${ctx.tooltipAttrs(t("hud.resources.title"), tooltip, t("hud.resources.meta"))}>
      <div class="resource-pill resource-energy">
        <span>${escapeHtml(t("hud.resources.energy"))}</span>
        <strong>${escapeHtml(fmt(energyBalance))}</strong>
        <small>${escapeHtml(fmt(summary.energy_produced))}/${escapeHtml(fmt(summary.energy_consumed))}</small>
      </div>
      <div class="resource-pill resource-cooling">
        <span>${escapeHtml(t("hud.resources.cooling"))}</span>
        <strong>${escapeHtml(fmt(coolingBalance))}</strong>
        <small>${escapeHtml(fmt(summary.cooling_available))}/${escapeHtml(fmt(summary.cooling_used))}</small>
      </div>
      <div class="resource-pill resource-compute">
        <span>${escapeHtml(t("hud.resources.compute"))}</span>
        <strong>${escapeHtml(fmt(compute))}</strong>
        <small>${escapeHtml(t("hud.resources.productionShort"))}</small>
      </div>
      <div class="resource-pill resource-co2">
        <span>${escapeHtml(t("hud.resources.co2"))}</span>
        <strong>${escapeHtml(summary.co2_tier)}</strong>
        <small>${escapeHtml(t("common.units.tier"))}</small>
      </div>
    </section>
  `;
}

function topBrand(ctx: TopBarContext): string {
  return `
    <div class="top-brand" ${ctx.tooltipAttrs(t("hud.brand.title"), t("hud.brand.tooltip"), t("hud.brand.meta"))}>
      <strong>${escapeHtml(t("hud.brand.title"))}</strong>
      <span>${escapeHtml(t("hud.brand.tagline"))}</span>
    </div>
  `;
}

function budgetKpi(summary: Summary, ctx: TopBarContext): string {
  const trend = summary.monthly_income >= 0 ? "+" : "-";
  const body = t("hud.kpi.budgetTooltip", {
    money: moneyBillions(summary.money),
    trend,
    income: moneyBillions(Math.abs(summary.monthly_income))
  });
  return `
    <div class="kpi-chip kpi-budget" data-onboarding-target="kpi.money" ${ctx.tooltipAttrs(t("hud.kpi.budget"), body, t("hud.kpi.budgetMeta"))}>
      <span>${escapeHtml(t("hud.kpi.budget"))}</span>
      <strong>${escapeHtml(moneyBillions(summary.money))}</strong>
      <small>${trend}${escapeHtml(moneyBillions(Math.abs(summary.monthly_income)))} / ${escapeHtml(t("hud.kpi.monthSuffix"))}</small>
    </div>
  `;
}

function dateKpi(summary: Summary, ctx: TopBarContext): string {
  const week = Math.max(1, Math.min(52, summary.month * 4));
  const body = t("hud.kpi.dateTooltip", { date: summary.date_text, week });
  return `
    <div class="kpi-chip kpi-date" data-onboarding-target="kpi.date" ${ctx.tooltipAttrs(t("hud.kpi.date"), body, t("hud.kpi.dateMeta"))}>
      <span>${escapeHtml(t("hud.kpi.date"))}</span>
      <strong>${escapeHtml(summary.date_text)}</strong>
      <small>${escapeHtml(t("hud.kpi.week", { week }))}</small>
    </div>
  `;
}

function agiDuel(europeProgress: number, usaProgress: number, ctx: TopBarContext): string {
  const eu = clampPctFloat(europeProgress);
  const usa = clampPctFloat(usaProgress);
  const delta = eu - usa;
  const meta = delta >= 0
    ? t("hud.agi.leadMeta", { side: t("hud.agi.europe"), points: fmt(delta) })
    : t("hud.agi.leadMeta", { side: t("hud.agi.usa"), points: fmt(Math.abs(delta)) });
  return `
    <section class="agi-duel" aria-label="${escapeHtml(t("hud.agi.aria"))}" data-onboarding-target="kpi.agi" ${ctx.tooltipAttrs(t("hud.agi.title"), t("hud.agi.body", { eu: fmt(eu), usa: fmt(usa) }), meta)}>
      <div class="agi-side agi-side-europe">
        <span>${escapeHtml(t("hud.agi.progress"))}</span>
        <strong>${escapeHtml(t("hud.agi.europe"))}</strong>
        <i></i>
      </div>
      <div class="agi-ring agi-ring-europe" style="--agi-progress:${eu}">
        <span class="agi-ticks" aria-hidden="true">${agiRingTicks(eu)}</span>
        <b>${fmt(eu)}%</b>
      </div>
      <em>${escapeHtml(t("hud.agi.versus"))}</em>
      <div class="agi-ring agi-ring-usa" style="--agi-progress:${usa}">
        <span class="agi-ticks" aria-hidden="true">${agiRingTicks(usa)}</span>
        <b>${fmt(usa)}%</b>
      </div>
      <div class="agi-side agi-side-usa">
        <span>${escapeHtml(t("hud.agi.rival"))}</span>
        <strong>${escapeHtml(t("hud.agi.usa"))}</strong>
        <i></i>
      </div>
    </section>
  `;
}

function agiRingTicks(progress: number): string {
  const tickCount = 48;
  const activeTicks = Math.round((clampPctFloat(progress) / 100) * tickCount);
  return Array.from({ length: tickCount }, (_, index) => {
    const active = index < activeTicks ? " is-active" : "";
    return `<i class="${active}" style="--tick-angle:${fmt((360 / tickCount) * index, 2)}deg"></i>`;
  }).join("");
}

function timeControls(summary: Summary, ctx: TopBarContext): string {
  return `
    <div class="time-controls time-controls-concept" aria-label="${escapeHtml(t("hud.time.speed"))}" ${ctx.tooltipAttrs(t("hud.time.speed"), t("hud.time.tooltip"), t("hud.time.meta"))}>
      <span class="time-controls-label">${escapeHtml(t("hud.time.speed"))}</span>
      ${conceptSpeedButton(0, summary.simulation_speed === 0, "||", t("common.actions.pause"))}
      ${conceptSpeedButton(1, summary.simulation_speed === 1, "&#9654;", t("common.actions.play"))}
      ${conceptSpeedButton(2, summary.simulation_speed === 2, "&#9654;&#9654;", t("common.actions.fastForward"))}
      ${conceptSpeedButton(4, summary.simulation_speed === 4, "&#9654;&#9654;&#9654;", t("common.actions.maximumSpeed"))}
      ${speedReadout(summary.simulation_speed)}
    </div>
  `;
}

function conceptSpeedButton(speed: number, active: boolean, label: string, title: string): string {
  return `<button class="speed-button ${active ? "is-active" : ""}" type="button" data-speed="${speed}" title="${escapeHtml(title)}">${label}</button>`;
}

function speedReadout(speed: number): string {
  const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 0;
  const speedLabel = t("common.units.speedMultiplier", { value: fmt(safeSpeed, 1) });
  const title = safeSpeed <= 0 ? t("hud.time.paused") : t("hud.time.realSpeed", { speed: speedLabel });
  return `<button class="speed-readout" type="button" data-speed-readout="${fmt(safeSpeed, 1)}" title="${escapeHtml(title)}">${speedLabel}</button>`;
}

function topMenuCommand(ctx: TopBarContext): string {
  return `
    <button class="top-menu-command" type="button" data-action="replay-onboarding" data-onboarding-target="onboarding.replay" ${ctx.tooltipAttrs(t("hud.menu.title"), t("hud.menu.body"), t("hud.menu.meta"))}>
      <span></span><span></span><span></span>
    </button>
  `;
}

function heatmapButton(mode: HeatmapMode, ctx: TopBarContext): string {
  const tooltip = heatmapTooltip(mode);
  return `<button class="heatmap-button ${ctx.heatmapMode === mode ? "is-active" : ""}" type="button" data-heatmap="${mode}" data-onboarding-target="overlay.${mode}" aria-label="${escapeHtml(tooltip.title)}" title="${escapeHtml(tooltip.title)}" ${ctx.tooltipAttrs(tooltip.title, tooltip.body, tooltip.meta)}>${escapeHtml(tooltip.shortLabel)}</button>`;
}

function heatmapTooltip(mode: HeatmapMode): { title: string; body: string; meta: string; shortLabel: string } {
  return {
    title: t(`hud.heatmaps.${mode}.label`),
    body: t(`hud.heatmaps.${mode}.body`),
    meta: t(`hud.heatmaps.${mode}.meta`),
    shortLabel: t(`hud.heatmaps.${mode}.short`)
  };
}
