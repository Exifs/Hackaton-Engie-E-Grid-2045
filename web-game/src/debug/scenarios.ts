import type { HeatmapMode } from "../game/heatmap";
import type { OnboardingController } from "../onboarding";
import type { SimulationCore } from "../sim";
import type { EGridMapScene } from "../game/EGridMapScene";
import type { GameHud } from "../ui/GameHud";

interface DebugScenarioContext {
  seed: string;
  simulation: SimulationCore;
  scene: EGridMapScene;
  hud: GameHud;
  getOnboarding: () => OnboardingController | undefined;
  redraw: () => void;
  setCurrentHeatmap: (mode: HeatmapMode) => void;
}

export interface DebugScenarios {
  runP0Scenario: () => void;
  runAlertScenario: () => void;
  runConceptScenario: () => void;
}

export function createDebugScenarios(context: DebugScenarioContext): DebugScenarios {
  const recordGameChanged = () => context.getOnboarding()?.recordGameEvent({ type: "game_changed" });

  return {
    runP0Scenario: () => {
      context.simulation.newGame(context.seed);
      context.simulation.requestBuilding("fr_nord", "university");
      context.simulation.requestBuilding("fr_nord", "gas_power_plant");
      context.simulation.requestBuilding("fr_nord", "air_cooling");
      context.simulation.requestBuilding("fr_nord", "datacenter_standard");
      for (let index = 0; index < 6; index += 1) {
        context.simulation.advanceMonth();
      }
      context.simulation.selectRegion("fr_nord");
      context.redraw();
      recordGameChanged();
    },

    runAlertScenario: () => {
      context.simulation.newGame(context.seed);
      context.simulation.selectRegion("ie");
      context.simulation.requestBuilding("ie", "datacenter_standard");
      context.simulation.requestBuilding("ie", "datacenter_standard");
      for (let index = 0; index < 6; index += 1) {
        context.simulation.advanceMonth();
      }
      context.simulation.selectRegion("ie");
      context.scene.setHeatmapMode("cooling");
      context.setCurrentHeatmap("cooling");
      context.hud.setHeatmapMode("cooling");
      context.redraw();
      recordGameChanged();
    },

    runConceptScenario: () => {
      context.simulation.newGame(context.seed);
      context.simulation.state.money = 50000;
      const buildPlan: Array<[string, string]> = [
        ["benelux", "university"],
        ["benelux", "ai_research_center"],
        ["benelux", "energy_research_center"],
        ["benelux", "datacenter_standard"],
        ["benelux", "datacenter_standard"],
        ["benelux", "datacenter_standard"],
        ["benelux", "sea_cooling"],
        ["benelux", "sea_cooling"],
        ["benelux", "gas_power_plant"],
        ["benelux", "wind_onshore"],
        ["fr_nord", "gas_power_plant"],
        ["fr_nord", "datacenter_standard"],
        ["de_west", "gas_power_plant"],
        ["de_west", "datacenter_standard"],
        ["dk", "wind_onshore"],
        ["se_south", "sea_cooling"]
      ];
      for (const [regionId, buildingId] of buildPlan) {
        context.simulation.requestBuilding(regionId, buildingId);
      }
      for (let index = 0; index < 24; index += 1) {
        context.simulation.advanceMonth();
      }
      context.simulation.state.year = 2045;
      context.simulation.state.month = 5;
      context.simulation.state.month_index = 244;
      context.simulation.state.money = 26900;
      context.simulation.state.monthly_income = 1620;
      context.simulation.state.eu_agi_progress = 67;
      context.simulation.state.usa_agi_progress = 51;
      context.simulation.selectRegion("benelux");
      context.setCurrentHeatmap("energy");
      context.scene.focusRegion("benelux");
      context.scene.setHeatmapMode("energy");
      context.hud.setHeatmapMode("energy");
      context.redraw();
      recordGameChanged();
    }
  };
}
