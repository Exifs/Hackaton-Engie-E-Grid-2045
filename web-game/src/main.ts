import Phaser from "phaser";
import { EGridMapScene, type HeatmapMode } from "./game/EGridMapScene";
import { DataLoader, SimulationCore } from "./sim";
import { cssUrlForPageAsset } from "./ui/assetUrls";
import { GameHud } from "./ui/GameHud";
import "./styles/game.css";

declare global {
  interface Window {
    __EGRID__?: {
      simulation: SimulationCore;
      scene: EGridMapScene;
      hud: GameHud;
      runP0Scenario: () => void;
      runAlertScenario: () => void;
      setHeatmap: (mode: HeatmapMode) => void;
    };
  }
}

const params = new URLSearchParams(window.location.search);
const testMode = params.get("testMode") === "1";
const seed = params.get("seed") || "web";

const hudRoot = document.querySelector<HTMLElement>("#hud-root");
const canvasRoot = document.querySelector<HTMLElement>("#game-canvas");

if (!hudRoot || !canvasRoot) {
  throw new Error("Missing E-Grid web game roots.");
}

document.documentElement.dataset.testMode = testMode ? "1" : "0";

document.documentElement.style.setProperty(
  "--building-atlas",
  cssUrlForPageAsset("assets/generated/building-icon-atlas.png")
);
document.documentElement.style.setProperty(
  "--building-art-atlas",
  cssUrlForPageAsset("assets/generated/building-card-art-atlas.png")
);

const data = await DataLoader.load();
const simulation = new SimulationCore(data);
simulation.newGame(seed);
if (testMode) {
  simulation.setPaused(true);
}

let scene: EGridMapScene;

const hud = new GameHud(hudRoot, simulation, {
  onBuild: (buildingId) => {
    simulation.requestBuilding("", buildingId);
    redraw();
  },
  onCancel: (queueIndex) => {
    simulation.cancelConstruction(simulation.getSummary().selected_region_id, queueIndex);
    redraw();
  },
  onDemolish: (buildingIndex) => {
    simulation.requestDemolition(simulation.getSummary().selected_region_id, buildingIndex);
    redraw();
  },
  onStartResearch: (technologyId) => {
    simulation.startResearch(technologyId);
    redraw();
  },
  onRemoveQueuedResearch: (queueIndex) => {
    simulation.removeQueuedResearch(queueIndex);
    redraw();
  },
  onPromoteQueuedResearch: (queueIndex) => {
    simulation.promoteQueuedResearch(queueIndex);
    redraw();
  },
  onAdvance: () => {
    simulation.advanceMonth();
    redraw();
  },
  onSpeed: (speed) => {
    simulation.setSimulationSpeed(speed);
    redraw();
  },
  onSelectRegion: (regionId) => {
    simulation.selectRegion(regionId);
    scene.focusRegion(regionId);
    redraw();
  },
  onHeatmap: (mode) => {
    scene.setHeatmapMode(mode);
  }
});

scene = new EGridMapScene({
  simulation,
  testMode,
  onRegionSelected: () => hud.render(),
  onSimulationAdvanced: () => hud.render(),
  onSimulationProgress: () => hud.updateVisualProgress()
});

new Phaser.Game({
  type: Phaser.CANVAS,
  parent: canvasRoot,
  backgroundColor: "#06131d",
  width: window.innerWidth,
  height: window.innerHeight,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  scene
});

hud.render();

window.__EGRID__ = {
  simulation,
  scene,
  hud,
  runP0Scenario,
  runAlertScenario,
  setHeatmap: (mode: HeatmapMode) => {
    scene.setHeatmapMode(mode);
    hud.render();
  }
};

function redraw(renderHud = true): void {
  scene.renderState();
  if (renderHud) {
    hud.render();
  }
}

function runP0Scenario(): void {
  simulation.newGame(seed);
  simulation.requestBuilding("fr_nord", "university");
  simulation.requestBuilding("fr_nord", "gas_power_plant");
  simulation.requestBuilding("fr_nord", "air_cooling");
  simulation.requestBuilding("fr_nord", "datacenter_standard");
  for (let index = 0; index < 6; index += 1) {
    simulation.advanceMonth();
  }
  simulation.selectRegion("fr_nord");
  redraw();
}

function runAlertScenario(): void {
  simulation.newGame(seed);
  simulation.selectRegion("ie");
  simulation.requestBuilding("ie", "datacenter_standard");
  simulation.requestBuilding("ie", "datacenter_standard");
  for (let index = 0; index < 6; index += 1) {
    simulation.advanceMonth();
  }
  simulation.selectRegion("ie");
  scene.setHeatmapMode("cooling");
  redraw();
}
