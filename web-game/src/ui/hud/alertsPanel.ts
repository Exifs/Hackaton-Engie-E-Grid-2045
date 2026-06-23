import { t } from "../../i18n";
import type { Alert } from "../../sim";
import { escapeHtml } from "./format";
import { ALERT_LOCALIZATION_KEYS } from "./types";

interface AlertsPanelContext {
  alertFirstSeen: ReadonlyMap<string, number>;
  localizedAlertRegionName: (alert: Alert, fallback?: string) => string;
  tooltipAttrs: (title: string, body: string, meta?: string) => string;
}

export function renderAlertsPanel(alerts: Alert[], ctx: AlertsPanelContext): string {
  return `
    <section class="alerts-panel" aria-label="${escapeHtml(t("hud.aria.alerts"))}" data-onboarding-target="alerts.panel">
      ${alerts.length === 0 ? `<span class="alert-empty">${escapeHtml(t("hud.alerts.noActive"))}</span>` : alerts.map((alert) => `
        ${alertCard(alert, ctx)}
      `).join("")}
      ${alerts.length > 0 ? `<button class="alerts-collapse" type="button" data-action="dismiss-all-alerts" title="${escapeHtml(t("hud.alerts.hide"))}">v</button>` : ""}
    </section>
  `;
}

function alertCard(alert: Alert, ctx: AlertsPanelContext): string {
  const elapsed = ctx.alertFirstSeen.has(alert.id) ? Math.max(0, Date.now() - (ctx.alertFirstSeen.get(alert.id) ?? Date.now())) : 0;
  const progress = alert.autoDismissMs > 0
    ? `<i class="alert-life" style="--alert-life:${alert.autoDismissMs}ms; --alert-elapsed:${elapsed}ms"></i>`
    : "";
  const localized = localizedAlert(alert, ctx);
  return `
    <article class="alert-item alert-${alert.state} alert-kind-${alertKind(alert)} ${alert.actionable ? "is-actionable" : "is-info"}" data-alert="${escapeHtml(alert.id)}">
      <span class="alert-icon" aria-hidden="true"></span>
      <button class="alert-main" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} ${ctx.tooltipAttrs(localized.title, localized.body, alert.actionable ? t("hud.alerts.focusRegion") : t("hud.alerts.systemInfo"))}>
        <strong>${escapeHtml(localized.title)}</strong>
        <span>${escapeHtml(localized.body)}</span>
      </button>
      <button class="alert-action" type="button" ${alert.region_id ? `data-region="${escapeHtml(alert.region_id)}"` : ""} title="${escapeHtml(alertActionTitle(alert, ctx))}">${escapeHtml(alertActionLabel(alert))}</button>
      <button class="alert-dismiss" type="button" data-dismiss-alert="${escapeHtml(alert.id)}" title="${escapeHtml(t("hud.alerts.close"))}">x</button>
      ${progress}
    </article>
  `;
}

function alertKind(alert: Alert): string {
  const text = `${alert.id} ${alert.title} ${alert.body}`.toLowerCase();
  if (text.includes("research")) {
    return "research";
  }
  if (text.includes("cooling") || text.includes("froid")) {
    return "cooling";
  }
  if (text.includes("network") || text.includes("grid") || text.includes("saturated")) {
    return "network";
  }
  if (text.includes("market") || text.includes("budget")) {
    return "market";
  }
  return "warning";
}

function alertActionLabel(alert: Alert): string {
  const kind = alertKind(alert);
  if (kind === "research") {
    return t("hud.alerts.claim");
  }
  return alert.actionable ? t("hud.alerts.view") : t("hud.alerts.info");
}

function alertActionTitle(alert: Alert, ctx: AlertsPanelContext): string {
  const title = localizedAlert(alert, ctx).title;
  return alertActionLabel(alert) === t("hud.alerts.view") ? t("hud.alerts.viewTitle", { title }) : title;
}

function localizedAlert(alert: Alert, ctx: AlertsPanelContext): { title: string; body: string } {
  const [, rawRegionName] = alert.title.split(" - ");
  const keys = ALERT_LOCALIZATION_KEYS[alert.id.split(":")[0] ?? ""];
  if (!keys) {
    return { title: alert.title, body: alert.body };
  }
  const regionName = ctx.localizedAlertRegionName(alert, rawRegionName);
  const title = [t(keys.title), regionName].filter(Boolean).join(" - ");
  const body = `${t(keys.body)} -> ${t(keys.action)}`;
  return { title, body };
}
