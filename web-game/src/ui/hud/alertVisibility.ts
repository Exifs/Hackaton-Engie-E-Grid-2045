import type { Alert } from "../../sim";

export class AlertVisibilityController {
  readonly firstSeen = new Map<string, number>();

  private readonly dismissed = new Set<string>();
  private readonly timers = new Map<string, number>();

  constructor(private readonly onChanged: () => void) {}

  visibleAlerts(alerts: Alert[]): Alert[] {
    const now = Date.now();
    const currentIds = new Set(alerts.map((alert) => alert.id));
    for (const [alertId, timer] of this.timers) {
      if (!currentIds.has(alertId)) {
        clearTimeout(timer);
        this.timers.delete(alertId);
        this.firstSeen.delete(alertId);
        this.dismissed.delete(alertId);
      }
    }

    for (const alert of alerts) {
      if (!this.firstSeen.has(alert.id)) {
        this.firstSeen.set(alert.id, now);
      }
      if (alert.autoDismissMs > 0 && !this.timers.has(alert.id)) {
        const firstSeen = this.firstSeen.get(alert.id) ?? now;
        const remaining = Math.max(0, alert.autoDismissMs - (now - firstSeen));
        const timer = window.setTimeout(() => this.dismiss(alert.id), remaining);
        this.timers.set(alert.id, timer);
      }
      const elapsed = now - (this.firstSeen.get(alert.id) ?? now);
      if (alert.autoDismissMs > 0 && elapsed >= alert.autoDismissMs) {
        this.dismissed.add(alert.id);
      }
    }

    return alerts.filter((alert) => !this.dismissed.has(alert.id));
  }

  dismiss(alertId: string): void {
    this.dismissed.add(alertId);
    const timer = this.timers.get(alertId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(alertId);
    }
    this.onChanged();
  }
}
