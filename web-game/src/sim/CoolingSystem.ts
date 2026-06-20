import { clamp } from "./math";

export class CoolingSystem {
  resolveRegion(coolingAvailable: number, coolingUsed: number): { cooling_efficiency: number; cooling_state: string } {
    let efficiency = 1;
    if (coolingUsed > 0.01) {
      efficiency = clamp(coolingAvailable / coolingUsed, 0, 1);
    }

    let coolingState = "stable";
    if (efficiency < 0.65) {
      coolingState = "critical";
    } else if (efficiency < 0.92) {
      coolingState = "low";
    }

    return {
      cooling_efficiency: efficiency,
      cooling_state: coolingState
    };
  }
}
