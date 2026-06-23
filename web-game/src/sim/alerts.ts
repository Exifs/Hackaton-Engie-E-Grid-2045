import type { Alert, BuildingDefinition, RegionRuntime } from "./types";

interface AlertState {
  co2_tier: string;
  eu_agi_progress: number;
  usa_agi_progress: number;
}

interface GenerateAlertsOptions {
  regions: Record<string, RegionRuntime>;
  state: AlertState;
  buildingDefinitions: Record<string, BuildingDefinition>;
  slotsFree: (region: RegionRuntime, buildings: Record<string, BuildingDefinition>) => number;
}

export function generateAlerts({
  regions,
  state,
  buildingDefinitions,
  slotsFree
}: GenerateAlertsOptions): Alert[] {
  const alerts: Alert[] = [];
  for (const [regionId, region] of Object.entries(regions)) {
    const cached = region.cached;
    const displayName = region.display_name || regionId;

    if (cached.blackout_state === "severe") {
      alerts.push(createAlert(1, "Blackout severe", displayName, "local energy deficit", "build local production", regionId, "critical"));
    } else if ((cached.energy_efficiency ?? 1) < 0.94) {
      alerts.push(
        createAlert(2, "Energy deficit", displayName, "imports too weak or distant", "build nearby surplus", regionId, "power_warning")
      );
    }

    if ((cached.cooling_efficiency ?? 1) < 0.92) {
      alerts.push(
        createAlert(3, "Cooling insufficient", displayName, "datacenters exceed cooling", "build river, sea or air cooling", regionId, "cooling_warning")
      );
    }

    if (cached.network_congested) {
      alerts.push(
        createAlert(5, "Network saturated", displayName, "high-loss power flows", "spread production or unlock supergrid", regionId, "power_warning")
      );
    }

    if (slotsFree(region, buildingDefinitions) <= 0 && region.buildings.length > 0) {
      alerts.push(createAlert(6, "Slots saturated", displayName, "regional capacity is full", "choose another region", regionId, "market_info", false));
    }

    if ((cached.researchers_required ?? 0) > 0.01 && (cached.researcher_efficiency ?? 1) < 0.9) {
      alerts.push(
        createAlert(4, "Researchers insufficient", displayName, "needs exceed capacity", "build universities", regionId, "power_warning")
      );
    }
  }

  if (["elevated", "very_high", "critical"].includes(state.co2_tier)) {
    alerts.push(createAlert(5, "CO2 elevated", "Europe", "fossil dependence rising", "shift to nuclear and renewables", "", "power_warning"));
  }

  if (state.usa_agi_progress >= 85 && state.eu_agi_progress < state.usa_agi_progress) {
    alerts.push(createAlert(7, "USA near AGI", "Global", "US curve is pulling ahead", "accelerate AI research", "", "critical"));
  }

  return alerts.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

export function createAlert(
  priority: number,
  problem: string,
  regionName: string,
  cause: string,
  action: string,
  regionId: string,
  stateName: string,
  actionable = true
): Alert {
  const id = [problem, regionId || regionName, stateName].map((part) => part.toLowerCase().replace(/[^a-z0-9]+/g, "-")).join(":");
  return {
    id,
    priority,
    title: `${problem} - ${regionName}`,
    body: `${cause} -> ${action}`,
    region_id: regionId,
    state: stateName,
    actionable,
    autoDismissMs: actionable ? 0 : 8000
  };
}
