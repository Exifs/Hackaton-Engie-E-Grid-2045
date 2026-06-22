import Phaser from "phaser";
import { EGridMapScene, type HeatmapMode } from "./game/EGridMapScene";
import { OnboardingController, OnboardingOverlay, TargetResolver, type OnboardingGameStateSnapshot } from "./onboarding";
import { DataLoader, SimulationCore } from "./sim";
import { initI18n, t } from "./i18n";
import { cssUrlForPageAsset } from "./ui/assetUrls";
import { GameHud } from "./ui/GameHud";
import "./styles/game.css";

declare global {
  interface Window {
    __EGRID__?: {
      simulation: SimulationCore;
      scene: EGridMapScene;
      hud: GameHud;
      onboarding: OnboardingController;
      runP0Scenario: () => void;
      runAlertScenario: () => void;
      runConceptScenario: () => void;
      setHeatmap: (mode: HeatmapMode) => void;
      resetOnboarding: () => void;
    };
  }
}

const params = new URLSearchParams(window.location.search);
const testMode = params.get("testMode") === "1";
const seed = params.get("seed") || "web";

const hudRoot = document.querySelector<HTMLElement>("#hud-root");
const canvasRoot = document.querySelector<HTMLElement>("#game-canvas");
const appRoot = document.querySelector<HTMLElement>("#app");

if (!hudRoot || !canvasRoot || !appRoot) {
  throw new Error("Missing E-Grid web game roots.");
}

await initI18n();
document.title = t("app.title");
document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute("content", t("app.description"));
canvasRoot.setAttribute("aria-label", t("app.canvasLabel"));

document.documentElement.dataset.testMode = testMode ? "1" : "0";
document.documentElement.dataset.egridSceneReady = "0";
document.documentElement.dataset.conceptScenario = params.get("scenario") === "concept" ? "1" : "0";

document.documentElement.style.setProperty(
  "--building-atlas",
  cssUrlForPageAsset("assets/generated/building-icon-atlas.png")
);
document.documentElement.style.setProperty(
  "--building-art-atlas",
  cssUrlForPageAsset("assets/generated/building-card-art-atlas.png")
);
document.documentElement.style.setProperty(
  "--grid-overview-map",
  cssUrlForPageAsset("assets/generated/grid-overview-europe-map-only-v1.png")
);
document.documentElement.style.setProperty(
  "--panel-chrome-texture",
  cssUrlForPageAsset("assets/generated/panel-chrome-texture-v1.png")
);
for (const [name, file] of Object.entries({
  energy: "00_energy.png",
  datacenter: "01_datacenter.png",
  cooling: "02_cooling.png",
  research: "03_research.png",
  grid: "04_grid.png",
  snow: "05_snow.png",
  battery: "06_battery.png",
  compute: "07_compute.png",
  gas: "08_gas.png",
  money: "09_money.png",
  science: "10_science.png"
})) {
  document.documentElement.style.setProperty(
    `--utility-icon-${name}`,
    cssUrlForPageAsset(`assets/ui/utility_icons_48px/${file}`)
  );
}

const data = await DataLoader.load();
const simulation = new SimulationCore(data);
simulation.newGame(seed);
const requestedRegion = params.get("region");
if (requestedRegion && simulation.getRegionSnapshot(requestedRegion)) {
  simulation.selectRegion(requestedRegion);
}
if (testMode) {
  simulation.setPaused(true);
}

let scene: EGridMapScene;
let onboarding: OnboardingController | undefined;
let currentHeatmap: HeatmapMode = "energy";

const onboardingRoot = document.createElement("div");
onboardingRoot.id = "onboarding-root";
onboardingRoot.className = "onboarding-root";
appRoot.append(onboardingRoot);

const hud = new GameHud(hudRoot, simulation, {
  onBuild: (buildingId) => {
    const result = simulation.requestBuilding("", buildingId);
    redraw();
    if (result.ok) {
      onboarding?.recordGameEvent({ type: "building_queued", buildingId });
    } else {
      onboarding?.recordGameEvent({ type: "game_changed" });
    }
  },
  onCancel: (queueIndex) => {
    simulation.cancelConstruction(simulation.getSummary().selected_region_id, queueIndex);
    redraw();
    onboarding?.recordGameEvent({ type: "game_changed" });
  },
  onDemolish: (buildingIndex) => {
    simulation.requestDemolition(simulation.getSummary().selected_region_id, buildingIndex);
    redraw();
    onboarding?.recordGameEvent({ type: "game_changed" });
  },
  onStartResearch: (technologyId) => {
    const result = simulation.startResearch(technologyId);
    redraw();
    if (result.ok) {
      onboarding?.recordGameEvent({ type: "research_started", researchId: technologyId });
    } else {
      onboarding?.recordGameEvent({ type: "game_changed" });
    }
  },
  onRemoveQueuedResearch: (queueIndex) => {
    simulation.removeQueuedResearch(queueIndex);
    redraw();
    onboarding?.recordGameEvent({ type: "game_changed" });
  },
  onPromoteQueuedResearch: (queueIndex) => {
    simulation.promoteQueuedResearch(queueIndex);
    redraw();
    onboarding?.recordGameEvent({ type: "game_changed" });
  },
  onAdvance: () => {
    simulation.advanceMonth();
    redraw();
    onboarding?.recordGameEvent({ type: "game_changed" });
  },
  onSpeed: (speed) => {
    if (speed === 0) {
      toggleSimulationPause();
    } else {
      simulation.setSimulationSpeed(speed);
      redraw();
      onboarding?.recordGameEvent({ type: "game_changed" });
    }
  },
  onSelectRegion: (regionId) => {
    simulation.selectRegion(regionId);
    scene.focusRegion(regionId);
    redraw();
    onboarding?.recordGameEvent({ type: "region_selected", regionId });
  },
  onHeatmap: (mode) => {
    currentHeatmap = mode;
    scene.setHeatmapMode(mode);
    onboarding?.recordGameEvent({ type: "overlay_selected", overlay: mode });
  },
  onReplayOnboarding: () => {
    onboarding?.replay();
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
window.addEventListener("keydown", handleGlobalKeyDown);

onboarding = new OnboardingController({
  getSnapshot: onboardingSnapshot,
  renderer: new OnboardingOverlay(
    onboardingRoot,
    new TargetResolver({
      regionPoint: (regionId) => scene.getRegionScreenPoint(regionId)
    })
  ),
  actions: {
    selectOverlay: ({ mode }) => {
      currentHeatmap = mode;
      scene.setHeatmapMode(mode);
      hud.setHeatmapMode(mode);
      hud.render();
      scene.renderState();
    },
    openConstruction: ({ category }) => {
      hud.openConstructionCategory(category);
      scene.renderState();
    },
    openResearch: () => {
      hud.openResearchPanel();
      scene.renderState();
    },
    focusRegion: ({ regionId }) => {
      simulation.selectRegion(regionId);
      scene.focusRegion(regionId);
      redraw();
    }
  }
});

if (params.get("onboarding") === "1" || (!testMode && params.get("onboarding") !== "0")) {
  onboarding.start();
}

window.__EGRID__ = {
  simulation,
  scene,
  hud,
  onboarding,
  runP0Scenario,
  runAlertScenario,
  runConceptScenario,
  setHeatmap: (mode: HeatmapMode) => {
    currentHeatmap = mode;
    scene.setHeatmapMode(mode);
    hud.setHeatmapMode(mode);
    hud.render();
    onboarding?.recordGameEvent({ type: "overlay_selected", overlay: mode });
  },
  resetOnboarding: () => onboarding?.reset()
};

if (params.get("scenario") === "concept") {
  runConceptScenario();
}

function redraw(renderHud = true): void {
  scene.renderState();
  if (renderHud) {
    hud.render();
  }
  onboarding?.refreshTarget();
}

function toggleSimulationPause(): void {
  simulation.togglePaused();
  redraw();
  onboarding?.recordGameEvent({ type: "game_changed" });
}

function handleGlobalKeyDown(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat || event.code !== "Space") {
    return;
  }
  if (isInteractiveKeyTarget(event.target)) {
    return;
  }
  event.preventDefault();
  toggleSimulationPause();
}

function isInteractiveKeyTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  return Boolean(target.closest("button, input, select, textarea, [contenteditable='true']"));
}

function onboardingSnapshot(): OnboardingGameStateSnapshot {
  return {
    summary: simulation.getSummary(),
    regions: simulation.getRegionsSnapshot(),
    currentOverlay: currentHeatmap
  };
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
  onboarding?.recordGameEvent({ type: "game_changed" });
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
  currentHeatmap = "cooling";
  hud.setHeatmapMode("cooling");
  redraw();
  onboarding?.recordGameEvent({ type: "game_changed" });
}

function runConceptScenario(): void {
  simulation.newGame(seed);
  simulation.state.money = 50000;
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
    simulation.requestBuilding(regionId, buildingId);
  }
  for (let index = 0; index < 24; index += 1) {
    simulation.advanceMonth();
  }
  simulation.state.year = 2045;
  simulation.state.month = 5;
  simulation.state.month_index = 244;
  simulation.state.money = 26900;
  simulation.state.monthly_income = 1620;
  simulation.state.eu_agi_progress = 67;
  simulation.state.usa_agi_progress = 51;
  simulation.selectRegion("benelux");
  currentHeatmap = "energy";
  scene.focusRegion("benelux");
  scene.setHeatmapMode("energy");
  hud.setHeatmapMode("energy");
  redraw();
  onboarding?.recordGameEvent({ type: "game_changed" });
}
