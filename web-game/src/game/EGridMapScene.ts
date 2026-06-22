import Phaser from "phaser";
import { t } from "../i18n";
import type { GameSummary, RegionLayout, RegionSnapshot, SimulationCore } from "../sim";
import type { HeatmapMode } from "./heatmap";
import { MapInteractionController } from "./mapInteractionController";
import type { MapRect, ViewportOccluder } from "./mapViewport";
import { clampColor, hashString, mixColor, quadraticPoint } from "./mapRenderMath";

interface SceneConfig {
  simulation: SimulationCore;
  testMode: boolean;
  onRegionSelected: (regionId: string) => void;
  onSimulationAdvanced: () => void;
  onSimulationProgress: () => void;
}

interface ConceptMapLabel {
  key: string;
  x: number;
  y: number;
  kind: "country" | "sea";
  rotation?: number;
  size?: number;
}

interface MapStructureCandidate {
  region: RegionSnapshot;
  point: { x: number; y: number };
  hash: number;
  buildingId: string;
  state: "built" | "construction";
  index: number;
  score: number;
}

interface MapAlertAccent {
  regionId: string;
  state: string;
  priority: number;
  flow?: GameSummary["network_flows"][number];
}

interface MapDragState {
  pointerId: number;
  startX: number;
  startY: number;
  previousX: number;
  previousY: number;
  moved: boolean;
}

interface SceneRenderContext {
  summary: GameSummary;
  regions: Record<string, RegionSnapshot>;
  selectedRegion?: RegionSnapshot;
  graph: Record<string, string[]>;
  conceptGrade: boolean;
}

interface PhaserInputEvent {
  stopPropagation?: () => void;
}

const HEATMAP_COLORS = {
  stable: 0x49e7b8,
  energy: 0x53e7ff,
  cooling: 0x79b9ff,
  compute: 0xb879ff,
  warning: 0xffb25f,
  critical: 0xff5f4f,
  co2: 0xc0814f
};

const MAP_DRAG_CLICK_TOLERANCE = 6;
const MAP_WHEEL_ZOOM_INTENSITY = 0.0015;
const MAP_ZOOM_OVERLAY_WIDTH = 154;
const MAP_ZOOM_OVERLAY_HEIGHT = 38;
const MAP_ZOOM_OVERLAY_MARGIN = 14;
const MAP_ANIMATION_FRAME_MS = 80;

const CONCEPT_MAP_LABELS: ConceptMapLabel[] = [
  { key: "ireland", x: 0.23, y: 0.39, kind: "country" },
  { key: "unitedKingdom", x: 0.34, y: 0.45, kind: "country" },
  { key: "norway", x: 0.55, y: 0.17, kind: "country" },
  { key: "sweden", x: 0.63, y: 0.19, kind: "country" },
  { key: "finland", x: 0.76, y: 0.15, kind: "country" },
  { key: "denmark", x: 0.55, y: 0.34, kind: "country" },
  { key: "belgium", x: 0.43, y: 0.51, kind: "country" },
  { key: "germany", x: 0.56, y: 0.52, kind: "country" },
  { key: "france", x: 0.37, y: 0.65, kind: "country" },
  { key: "spain", x: 0.29, y: 0.78, kind: "country" },
  { key: "portugal", x: 0.19, y: 0.79, kind: "country" },
  { key: "switzerland", x: 0.48, y: 0.63, kind: "country" },
  { key: "italy", x: 0.58, y: 0.78, kind: "country" },
  { key: "austria", x: 0.62, y: 0.62, kind: "country" },
  { key: "czechia", x: 0.65, y: 0.52, kind: "country" },
  { key: "poland", x: 0.72, y: 0.45, kind: "country" },
  { key: "slovakia", x: 0.72, y: 0.57, kind: "country" },
  { key: "hungary", x: 0.73, y: 0.64, kind: "country" },
  { key: "romania", x: 0.84, y: 0.64, kind: "country" },
  { key: "bulgaria", x: 0.84, y: 0.74, kind: "country" },
  { key: "greece", x: 0.82, y: 0.86, kind: "country" },
  { key: "northSea", x: 0.43, y: 0.27, kind: "sea", rotation: -7, size: 12 },
  { key: "balticSea", x: 0.69, y: 0.32, kind: "sea", rotation: -10, size: 12 },
  { key: "atlanticOcean", x: 0.17, y: 0.56, kind: "sea", rotation: -7, size: 12 },
  { key: "mediterraneanSea", x: 0.45, y: 0.88, kind: "sea", rotation: -5, size: 11 },
  { key: "blackSea", x: 0.67, y: 0.78, kind: "sea", rotation: 12, size: 11 }
];

export class EGridMapScene extends Phaser.Scene {
  private simulation: SimulationCore;
  private readonly testMode: boolean;
  private readonly onRegionSelected: (regionId: string) => void;
  private readonly onSimulationAdvanced: () => void;
  private readonly onSimulationProgress: () => void;
  private readonly mapInteraction: MapInteractionController;

  private heatmapMode: HeatmapMode = "energy";
  private mapImage?: Phaser.GameObjects.Image;
  private mapAtmosphereLayer?: Phaser.GameObjects.Graphics;
  private flowLayer?: Phaser.GameObjects.Graphics;
  private structureLayer?: Phaser.GameObjects.Graphics;
  private structureSpriteLayer?: Phaser.GameObjects.Container;
  private regionLayer?: Phaser.GameObjects.Graphics;
  private slotLayer?: Phaser.GameObjects.Graphics;
  private labelLayer?: Phaser.GameObjects.Container;
  private mapZoomOverlayLayer?: Phaser.GameObjects.Container;
  private mapZoomOverlayBackground?: Phaser.GameObjects.Graphics;
  private mapZoomOverlayText?: Phaser.GameObjects.Text;
  private mapZoomResetButton?: Phaser.GameObjects.Rectangle;
  private mapZoomResetText?: Phaser.GameObjects.Text;
  private animationTime = 0;
  private hudProgressAccumulatorMs = 0;
  private mapAnimationAccumulatorMs = 0;
  private dirty = true;
  private mapDrag: MapDragState | null = null;

  constructor(config: SceneConfig) {
    super("EGridMapScene");
    this.simulation = config.simulation;
    this.testMode = config.testMode;
    this.onRegionSelected = config.onRegionSelected;
    this.onSimulationAdvanced = config.onSimulationAdvanced;
    this.onSimulationProgress = config.onSimulationProgress;
    this.mapInteraction = new MapInteractionController({
      testMode: this.testMode,
      viewportSize: () => ({ width: this.scale.width, height: this.scale.height }),
      textureSize: () => {
        const texture = this.textures.get("map-backdrop").getSourceImage() as HTMLImageElement | HTMLCanvasElement;
        return { width: texture.width, height: texture.height };
      },
      focusPoint: (focusRegionId) => this.mapFocusPoint(focusRegionId),
      occluders: () => this.mapViewportOccluders()
    });
  }

  preload(): void {
    this.load.image(
      "map-backdrop",
      `${import.meta.env.BASE_URL}assets/map/europe_map_backdrop_generated_clean_v1.png`
    );
    this.load.image(
      "building-icon-atlas",
      `${import.meta.env.BASE_URL}assets/generated/building-icon-atlas.png`
    );
    this.load.image(
      "building-map-atlas",
      `${import.meta.env.BASE_URL}assets/generated/building-map-atlas-v4.png`
    );
  }

  create(): void {
    this.mapImage = this.add.image(0, 0, "map-backdrop").setOrigin(0, 0).setAlpha(0.94);
    this.mapAtmosphereLayer = this.add.graphics();
    this.flowLayer = this.add.graphics();
    this.structureLayer = this.add.graphics();
    this.structureSpriteLayer = this.add.container(0, 0);
    this.regionLayer = this.add.graphics();
    this.slotLayer = this.add.graphics();
    this.labelLayer = this.add.container(0, 0);
    this.createMapZoomOverlay();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointerDown(pointer));
    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => this.handlePointerMove(pointer));
    this.input.on("pointerup", (pointer: Phaser.Input.Pointer) => this.handlePointerUp(pointer));
    this.input.on("pointerupoutside", (pointer: Phaser.Input.Pointer) => this.handlePointerUp(pointer, false));
    this.input.on(
      "wheel",
      (pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) =>
        this.handleWheel(pointer, deltaY)
    );
    this.scale.on("resize", () => {
      this.constrainMapInteraction();
      this.dirty = true;
      this.renderState();
    });

    this.renderState();
    document.documentElement.dataset.egridSceneReady = "1";
  }

  update(_time: number, delta: number): void {
    if (!this.testMode) {
      this.animationTime += delta / 1000;
      const advanced = this.simulation.stepSimulationTime(delta / 1000);
      if (advanced > 0) {
        this.onSimulationAdvanced();
        this.hudProgressAccumulatorMs = 0;
        this.dirty = true;
      } else if (this.simulation.isRunning()) {
        this.hudProgressAccumulatorMs += delta;
        if (this.hudProgressAccumulatorMs >= 160) {
          this.hudProgressAccumulatorMs = 0;
          this.onSimulationProgress();
        }
      }
    }

    if (this.dirty) {
      this.renderState();
    } else if (!this.testMode) {
      this.mapAnimationAccumulatorMs += delta;
      if (this.mapAnimationAccumulatorMs >= MAP_ANIMATION_FRAME_MS) {
        this.mapAnimationAccumulatorMs = 0;
        this.renderState();
      }
    }
  }

  setHeatmapMode(mode: HeatmapMode): void {
    this.heatmapMode = mode;
    this.dirty = true;
    this.renderState();
  }

  setSimulation(simulation: SimulationCore): void {
    this.simulation = simulation;
    this.dirty = true;
    this.renderState();
  }

  focusRegion(regionId: string): void {
    this.mapInteraction.focusRegion(regionId);
    this.dirty = true;
    this.renderState();
  }

  getRegionScreenPoint(regionId: string): { x: number; y: number } | undefined {
    const region = this.simulation.getRegionSnapshot(regionId);
    if (!region?.layout) {
      return undefined;
    }
    const rect = this.mapRect();
    return this.regionPoint(rect, region.layout as RegionLayout);
  }

  renderState(): void {
    if (
      !this.flowLayer ||
      !this.mapAtmosphereLayer ||
      !this.structureLayer ||
      !this.structureSpriteLayer ||
      !this.regionLayer ||
      !this.slotLayer ||
      !this.labelLayer ||
      !this.mapImage
    ) {
      return;
    }

    this.mapAnimationAccumulatorMs = 0;
    this.mapInteraction.clearSafeViewportCache();
    const rect = this.mapRect();
    const context = this.renderContext();
    this.mapImage.setPosition(rect.x, rect.y).setDisplaySize(rect.width, rect.height).setAlpha(context.conceptGrade ? 1 : 0.94);
    this.drawBackdropVignette(rect);
    this.drawMapAtmosphere(rect);
    this.drawFlows(rect, context);
    this.drawStructures(rect, context);
    this.drawRegions(rect, context);
    this.drawSelectedSlots(rect, context);
    this.updateMapZoomOverlay();
    this.dirty = false;
  }

  private renderContext(): SceneRenderContext {
    const summary = this.simulation.getSummary();
    const regions = this.simulation.getRegionsSnapshot();
    return {
      summary,
      regions,
      selectedRegion: regions[summary.selected_region_id],
      graph: this.simulation.getNetworkGraph(),
      conceptGrade: this.usesConceptMapGrade()
    };
  }

  private usesConceptMapGrade(): boolean {
    return window.innerWidth >= 1180 || document.documentElement.dataset.conceptScenario === "1";
  }

  private drawBackdropVignette(rect: MapRect): void {
    const camera = this.cameras.main;
    camera.setBackgroundColor("#06131d");
    this.addedVignette?.destroy();
    this.addedVignette = this.add
      .rectangle(rect.x, rect.y, rect.width, rect.height, 0x06131d, 0.08)
      .setOrigin(0, 0)
      .setDepth(0);
    this.mapImage?.setDepth(1);
    this.mapAtmosphereLayer?.setDepth(1.55);
    this.flowLayer?.setDepth(2);
    this.regionLayer?.setDepth(3);
    this.structureLayer?.setDepth(4);
    this.structureSpriteLayer?.setDepth(4.5);
    this.slotLayer?.setDepth(5);
    this.labelLayer?.setDepth(6);
  }

  private addedVignette?: Phaser.GameObjects.Rectangle;

  private drawMapAtmosphere(rect: MapRect): void {
    const graphics = this.mapAtmosphereLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();
    const desktopConceptGrade = this.usesConceptMapGrade();
    const strength = desktopConceptGrade ? 1 : 0.5;
    graphics.setBlendMode(Phaser.BlendModes.ADD);

    graphics.fillStyle(0x9edce2, 0.06 * strength);
    graphics.fillEllipse(rect.x + rect.width * 0.5, rect.y + rect.height * 0.54, rect.width * 0.64, rect.height * 0.5);
    graphics.fillStyle(0x53e7ff, 0.046 * strength);
    graphics.fillEllipse(rect.x + rect.width * 0.44, rect.y + rect.height * 0.46, rect.width * 0.5, rect.height * 0.34);
    graphics.fillStyle(0xd8f8ff, 0.034 * strength);
    graphics.fillEllipse(rect.x + rect.width * 0.55, rect.y + rect.height * 0.34, rect.width * 0.42, rect.height * 0.26);
    graphics.fillStyle(0x4eb2c7, 0.03 * strength);
    graphics.fillEllipse(rect.x + rect.width * 0.36, rect.y + rect.height * 0.75, rect.width * 0.34, rect.height * 0.2);
    graphics.fillStyle(0xe6fbff, 0.018 * strength);
    graphics.fillEllipse(rect.x + rect.width * 0.5, rect.y + rect.height * 0.58, rect.width * 0.42, rect.height * 0.2);

    graphics.lineStyle(1, 0x9edce2, 0.1 * strength);
    this.drawNormalizedQuadratic(graphics, rect, { x: -0.04, y: 0.78 }, { x: 0.32, y: 0.54 }, { x: 1.02, y: 0.36 }, 18);
    this.drawNormalizedQuadratic(graphics, rect, { x: 0.08, y: 0.86 }, { x: 0.46, y: 0.56 }, { x: 0.98, y: 0.72 }, 18);
    graphics.lineStyle(1, 0x53e7ff, 0.074 * strength);
    this.drawNormalizedQuadratic(graphics, rect, { x: 0.16, y: 0.24 }, { x: 0.5, y: 0.12 }, { x: 0.82, y: 0.24 }, 16);
    this.drawNormalizedQuadratic(graphics, rect, { x: 0.28, y: 0.94 }, { x: 0.54, y: 0.8 }, { x: 0.86, y: 0.9 }, 14);

    graphics.setBlendMode(Phaser.BlendModes.NORMAL);
    graphics.fillStyle(0x02070b, 0.11 * strength);
    graphics.fillRect(rect.x, rect.y, rect.width, rect.height * 0.08);
    graphics.fillRect(rect.x, rect.y + rect.height * 0.9, rect.width, rect.height * 0.1);
    graphics.fillStyle(0x02070b, 0.08 * strength);
    graphics.fillRect(rect.x, rect.y, rect.width * 0.04, rect.height);
    graphics.fillRect(rect.x + rect.width * 0.965, rect.y, rect.width * 0.035, rect.height);
  }

  private drawFlows(rect: MapRect, context: SceneRenderContext): void {
    const graphics = this.flowLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();
    const { summary, regions, graph } = context;
    const drawnEdges = new Set<string>();
    const useStrategicRouteRendering = context.conceptGrade;
    const strategicFlows = useStrategicRouteRendering
      ? this.strategicMapFlows(summary.network_flows, summary.selected_region_id, regions)
      : summary.network_flows;
    const activeConceptEdges = new Set(
      strategicFlows
        .map((flow) => [flow.source_region_id, flow.target_region_id].sort().join(":"))
    );
    const activeConceptEdgeColors = new Map<string, number>(
      strategicFlows.map((flow) => [
        [flow.source_region_id, flow.target_region_id].sort().join(":"),
        flow.is_congested ? HEATMAP_COLORS.warning : HEATMAP_COLORS.energy
      ] as [string, number])
    );

    for (const [sourceId, targets] of Object.entries(graph)) {
      const source = regions[sourceId];
      if (!source) {
        continue;
      }
      const sourcePoint = this.regionPoint(rect, source.layout as RegionLayout);
      for (const targetId of targets) {
        const target = regions[targetId];
        if (!target) {
          continue;
        }
        const edgeKey = [sourceId, targetId].sort().join(":");
        if (drawnEdges.has(edgeKey)) {
          continue;
        }
        drawnEdges.add(edgeKey);

        const targetPoint = this.regionPoint(rect, target.layout as RegionLayout);
        const hash = hashString(edgeKey);
        const isActiveConceptEdge = activeConceptEdges.has(edgeKey);
        const color = useStrategicRouteRendering
          ? activeConceptEdgeColors.get(edgeKey) ?? (hash % 4 === 0 ? HEATMAP_COLORS.compute : HEATMAP_COLORS.energy)
          : hash % 4 === 0 ? HEATMAP_COLORS.compute : hash % 5 === 0 ? HEATMAP_COLORS.warning : HEATMAP_COLORS.energy;
        if (useStrategicRouteRendering) {
          if (!isActiveConceptEdge && hash % 5 !== 0) {
            continue;
          }
          this.strokeConceptRoute(
            graphics,
            sourcePoint,
            targetPoint,
            hash,
            color,
            isActiveConceptEdge ? 1.05 : 0.58,
            isActiveConceptEdge ? 0.18 : 0.075
          );
          if (isActiveConceptEdge || hash % 10 === 0) {
            const nodeRatio = 0.32 + (hash % 30) / 90;
            const control = this.conceptRouteControl(sourcePoint, targetPoint, hash);
            const node = quadraticPoint(sourcePoint, control, targetPoint, nodeRatio);
            graphics.fillStyle(color, isActiveConceptEdge ? 0.5 : 0.22);
            graphics.fillCircle(node.x, node.y, isActiveConceptEdge ? 2.1 : 1.35);
          }
          continue;
        }
        const alpha = hash % 4 === 0 ? 0.32 : 0.24;
        graphics.lineStyle(4, 0x02090f, 0.48);
        graphics.lineBetween(sourcePoint.x, sourcePoint.y, targetPoint.x, targetPoint.y);
        graphics.lineStyle(1.15, color, alpha);
        graphics.lineBetween(sourcePoint.x, sourcePoint.y, targetPoint.x, targetPoint.y);

        if (hash % 3 !== 0) {
          const nodeRatio = 0.28 + (hash % 34) / 80;
          const nodeX = Phaser.Math.Linear(sourcePoint.x, targetPoint.x, nodeRatio);
          const nodeY = Phaser.Math.Linear(sourcePoint.y, targetPoint.y, nodeRatio);
          graphics.fillStyle(color, 0.48);
          graphics.fillCircle(nodeX, nodeY, 2.2);
          graphics.lineStyle(1, 0xd8fbff, 0.2);
          graphics.strokeCircle(nodeX, nodeY, 4.2);
        }
      }
    }

    for (const flow of strategicFlows) {
      const source = regions[flow.source_region_id];
      const target = regions[flow.target_region_id];
      if (!source || !target) {
        continue;
      }
      const sourcePoint = this.regionPoint(rect, source.layout as RegionLayout);
      const targetPoint = this.regionPoint(rect, target.layout as RegionLayout);
      const width = 1.5 + flow.intensity_normalized * 4;
      const color = flow.is_congested ? HEATMAP_COLORS.warning : HEATMAP_COLORS.energy;
      if (useStrategicRouteRendering) {
        const hash = hashString(`${flow.source_region_id}:${flow.target_region_id}`);
        const control = this.conceptRouteControl(sourcePoint, targetPoint, hash);
        const strategicWidth = flow.is_congested ? Math.max(0.95, width * 0.58) : Math.max(1.05, width * 0.66);
        graphics.lineStyle(strategicWidth + 3.2, 0x03131b, 0.46);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);
        graphics.lineStyle(strategicWidth, color, flow.is_congested ? 0.54 : 0.64);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);
        graphics.lineStyle(0.62, 0xd8fbff, flow.is_congested ? 0.12 : 0.13);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);

        const pulse = this.testMode ? 0.58 : (this.animationTime * 0.22 + flow.intensity_normalized) % 1;
        const point = quadraticPoint(sourcePoint, control, targetPoint, pulse);
        graphics.fillStyle(color, flow.is_congested ? 0.62 : 0.78);
        graphics.fillCircle(point.x, point.y, (flow.is_congested ? 1.65 : 1.9) + flow.intensity_normalized * 1.65);
        continue;
      }
      graphics.lineStyle(width + 4, 0x062431, 0.55);
      graphics.beginPath();
      graphics.moveTo(sourcePoint.x, sourcePoint.y);
      graphics.lineTo(targetPoint.x, targetPoint.y);
      graphics.strokePath();
      graphics.lineStyle(width, color, flow.is_congested ? 0.72 : 0.58);
      graphics.beginPath();
      graphics.moveTo(sourcePoint.x, sourcePoint.y);
      graphics.lineTo(targetPoint.x, targetPoint.y);
      graphics.strokePath();

      const pulse = this.testMode ? 0.58 : (this.animationTime * 0.22 + flow.intensity_normalized) % 1;
      const px = Phaser.Math.Linear(sourcePoint.x, targetPoint.x, pulse);
      const py = Phaser.Math.Linear(sourcePoint.y, targetPoint.y, pulse);
      graphics.fillStyle(color, 0.78);
      graphics.fillCircle(px, py, 2 + flow.intensity_normalized * 3);
    }

    if (useStrategicRouteRendering) {
      this.drawAlertAccents(graphics, rect, summary, regions, strategicFlows);
    }
  }

  private drawAlertAccents(
    graphics: Phaser.GameObjects.Graphics,
    rect: MapRect,
    summary: GameSummary,
    regions: Record<string, RegionSnapshot>,
    strategicFlows: GameSummary["network_flows"]
  ): void {
    const accents = this.strategicAlertAccents(summary, regions, strategicFlows);
    for (const accent of accents) {
      const region = regions[accent.regionId];
      const layout = region?.layout as RegionLayout | undefined;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const color = accent.state === "critical" ? HEATMAP_COLORS.critical : HEATMAP_COLORS.warning;
      const pulse = this.testMode ? 0.55 : (Math.sin(this.animationTime * 4.2 + point.x * 0.011) + 1) * 0.5;
      const radius = Math.max(5.5, layout.hitbox_radius * Math.min(rect.width, rect.height) * 0.17);

      if (accent.flow) {
        const source = regions[accent.flow.source_region_id];
        const target = regions[accent.flow.target_region_id];
        if (source?.layout && target?.layout) {
          const sourcePoint = this.regionPoint(rect, source.layout as RegionLayout);
          const targetPoint = this.regionPoint(rect, target.layout as RegionLayout);
          const hash = hashString(`${accent.flow.source_region_id}:${accent.flow.target_region_id}:alert`);
          const control = this.conceptRouteControl(sourcePoint, targetPoint, hash);
          const nearTarget = accent.flow.target_region_id === accent.regionId;
          const start = nearTarget ? 0.72 : 0.14;
          const end = nearTarget ? 0.91 : 0.33;
          graphics.lineStyle(4, 0x050b0d, 0.34);
          this.drawQuadraticSegment(graphics, sourcePoint, control, targetPoint, start, end, 8);
          graphics.lineStyle(1.45, color, 0.58);
          this.drawQuadraticSegment(graphics, sourcePoint, control, targetPoint, start, end, 8);
          graphics.lineStyle(0.75, 0xffe2a6, 0.22);
          this.drawQuadraticSegment(graphics, sourcePoint, control, targetPoint, start + 0.025, end - 0.02, 6);
        }
      }

      graphics.lineStyle(1.2, color, 0.5 + pulse * 0.18);
      graphics.strokeCircle(point.x, point.y, radius * (1.55 + pulse * 0.18));
      graphics.lineStyle(1.1, 0xffe2a6, 0.28);
      graphics.strokeCircle(point.x, point.y, radius * 0.82);
      graphics.fillStyle(color, 0.34);
      graphics.fillCircle(point.x, point.y, Math.max(1.8, radius * 0.24));

      const tickRadius = radius * 1.95;
      const tickLength = radius * 0.74;
      for (const angle of [-52, 38, 137]) {
        const radians = Phaser.Math.DegToRad(angle + (accent.priority % 2) * 8);
        const startX = point.x + Math.cos(radians) * tickRadius;
        const startY = point.y + Math.sin(radians) * tickRadius;
        const endX = point.x + Math.cos(radians) * (tickRadius + tickLength);
        const endY = point.y + Math.sin(radians) * (tickRadius + tickLength);
        graphics.lineStyle(1.05, color, 0.48);
        graphics.lineBetween(startX, startY, endX, endY);
      }
    }
  }

  private strategicAlertAccents(
    summary: GameSummary,
    regions: Record<string, RegionSnapshot>,
    strategicFlows: GameSummary["network_flows"]
  ): MapAlertAccent[] {
    const flowKey = (flow: GameSummary["network_flows"][number]): string =>
      [flow.source_region_id, flow.target_region_id].sort().join(":");
    const strategicKeys = new Set(strategicFlows.map(flowKey));
    return summary.alerts
      .filter((alert) => alert.region_id && regions[alert.region_id])
      .sort((left, right) => left.priority - right.priority)
      .slice(0, 4)
      .map((alert) => {
        const touchingStrategic = strategicFlows.find(
          (flow) => flow.source_region_id === alert.region_id || flow.target_region_id === alert.region_id
        );
        const touchingCongested = summary.network_flows.find(
          (flow) =>
            flow.is_congested &&
            (flow.source_region_id === alert.region_id || flow.target_region_id === alert.region_id)
        );
        const touchingAny = summary.network_flows.find(
          (flow) => flow.source_region_id === alert.region_id || flow.target_region_id === alert.region_id
        );
        const flow = touchingStrategic ?? touchingCongested ?? touchingAny;
        return {
          regionId: alert.region_id,
          state: alert.state,
          priority: alert.priority,
          flow: flow && (strategicKeys.has(flowKey(flow)) || flow.is_congested) ? flow : undefined
        };
      });
  }

  private strategicMapFlows(
    flows: GameSummary["network_flows"],
    selectedRegionId: string,
    regions: Record<string, RegionSnapshot>
  ): GameSummary["network_flows"] {
    type StrategicFlow = GameSummary["network_flows"][number];
    type RankedFlow = {
      flow: StrategicFlow;
      hasSelectedEndpoint: boolean;
      isLocal: boolean;
      length: number;
      score: number;
    };

    const ranked = flows
      .map((flow): RankedFlow | undefined => {
        const source = regions[flow.source_region_id];
        const target = regions[flow.target_region_id];
        const sourceLayout = source?.layout as RegionLayout | undefined;
        const targetLayout = target?.layout as RegionLayout | undefined;
        if (
          !sourceLayout ||
          !targetLayout ||
          sourceLayout.x === undefined ||
          sourceLayout.y === undefined ||
          targetLayout.x === undefined ||
          targetLayout.y === undefined
        ) {
          return undefined;
        }
        const dx = targetLayout.x - sourceLayout.x;
        const dy = targetLayout.y - sourceLayout.y;
        const length = Math.hypot(dx, dy);
        const midX = (sourceLayout.x + targetLayout.x) / 2;
        const midY = (sourceLayout.y + targetLayout.y) / 2;
        const centralityPenalty = Math.abs(midX - 0.52) + Math.abs(midY - 0.5);
        const hasSelectedEndpoint =
          flow.source_region_id === selectedRegionId || flow.target_region_id === selectedRegionId;
        const isLocal = length <= 0.25;
        const score =
          flow.intensity_normalized * 9 +
          (hasSelectedEndpoint ? 3.2 : 0) +
          (isLocal ? 1.1 : 0) -
          centralityPenalty * 1.6 -
          Math.max(0, length - 0.32) * 4 -
          (flow.is_congested && !hasSelectedEndpoint ? 1.2 : 0);
        return { flow, hasSelectedEndpoint, isLocal, length, score };
      })
      .filter((entry): entry is RankedFlow => Boolean(entry));

    const result: StrategicFlow[] = [];
    const used = new Set<string>();
    const addFlow = (entry: RankedFlow | undefined): void => {
      if (!entry) {
        return;
      }
      const key = [entry.flow.source_region_id, entry.flow.target_region_id].sort().join(":");
      if (used.has(key)) {
        return;
      }
      result.push(entry.flow);
      used.add(key);
    };
    const byScore = (left: RankedFlow, right: RankedFlow): number => right.score - left.score;

    ranked
      .filter((entry) => entry.hasSelectedEndpoint && !entry.flow.is_congested)
      .sort(byScore)
      .slice(0, 9)
      .forEach(addFlow);

    ranked
      .filter((entry) => !entry.hasSelectedEndpoint && !entry.flow.is_congested && entry.isLocal)
      .sort(byScore)
      .slice(0, 2)
      .forEach(addFlow);

    ranked
      .filter((entry) => entry.flow.is_congested && entry.length <= 0.5)
      .sort((left, right) => left.length - right.length || byScore(left, right))
      .slice(0, 1)
      .forEach(addFlow);

    ranked
      .filter((entry) => !entry.flow.is_congested)
      .sort(byScore)
      .forEach((entry) => {
        if (result.length < 12) {
          addFlow(entry);
        }
      });

    return result.slice(0, 12);
  }

  private strokeConceptRoute(
    graphics: Phaser.GameObjects.Graphics,
    sourcePoint: { x: number; y: number },
    targetPoint: { x: number; y: number },
    hash: number,
    color: number,
    width: number,
    alpha: number
  ): void {
    const control = this.conceptRouteControl(sourcePoint, targetPoint, hash);
    graphics.lineStyle(width + 1.8, 0x02090f, alpha * 1.35);
    this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint, 10);
    graphics.lineStyle(width, color, alpha);
    this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint, 10);
  }

  private conceptRouteControl(
    sourcePoint: { x: number; y: number },
    targetPoint: { x: number; y: number },
    hash: number
  ): { x: number; y: number } {
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const bend = Math.min(78, length * 0.18) * (hash % 2 === 0 ? 1 : -1);
    return {
      x: (sourcePoint.x + targetPoint.x) / 2 + (-dy / length) * bend,
      y: (sourcePoint.y + targetPoint.y) / 2 + (dx / length) * bend - Math.min(26, length * 0.045)
    };
  }

  private drawQuadraticRoute(
    graphics: Phaser.GameObjects.Graphics,
    sourcePoint: { x: number; y: number },
    controlPoint: { x: number; y: number },
    targetPoint: { x: number; y: number },
    steps = 16
  ): void {
    graphics.beginPath();
    graphics.moveTo(sourcePoint.x, sourcePoint.y);
    for (let step = 1; step <= steps; step += 1) {
      const point = quadraticPoint(sourcePoint, controlPoint, targetPoint, step / steps);
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  }

  private drawQuadraticSegment(
    graphics: Phaser.GameObjects.Graphics,
    sourcePoint: { x: number; y: number },
    controlPoint: { x: number; y: number },
    targetPoint: { x: number; y: number },
    start: number,
    end: number,
    steps = 8
  ): void {
    const clampedStart = Phaser.Math.Clamp(start, 0, 1);
    const clampedEnd = Phaser.Math.Clamp(end, clampedStart, 1);
    graphics.beginPath();
    const first = quadraticPoint(sourcePoint, controlPoint, targetPoint, clampedStart);
    graphics.moveTo(first.x, first.y);
    for (let step = 1; step <= steps; step += 1) {
      const point = quadraticPoint(
        sourcePoint,
        controlPoint,
        targetPoint,
        Phaser.Math.Linear(clampedStart, clampedEnd, step / steps)
      );
      graphics.lineTo(point.x, point.y);
    }
    graphics.strokePath();
  }

  private drawNormalizedQuadratic(
    graphics: Phaser.GameObjects.Graphics,
    rect: MapRect,
    source: { x: number; y: number },
    control: { x: number; y: number },
    target: { x: number; y: number },
    steps: number
  ): void {
    this.drawQuadraticRoute(
      graphics,
      { x: rect.x + source.x * rect.width, y: rect.y + source.y * rect.height },
      { x: rect.x + control.x * rect.width, y: rect.y + control.y * rect.height },
      { x: rect.x + target.x * rect.width, y: rect.y + target.y * rect.height },
      steps
    );
  }

  private drawStructures(rect: MapRect, context: SceneRenderContext): void {
    const graphics = this.structureLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();
    this.structureSpriteLayer?.removeAll(true);

    const { regions } = context;
    const selectedRegionId = context.summary.selected_region_id;
    const useStrategicStructureCap = context.conceptGrade;
    const scale = Phaser.Math.Clamp(Math.min(rect.width, rect.height) / 760, 0.82, 1.35);
    const candidates: MapStructureCandidate[] = [];

    for (const [regionId, region] of Object.entries(regions)) {
      const layout = region.layout as RegionLayout;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const entries = [
        ...region.buildings.map((buildingId, index) => ({ buildingId, state: "built" as const, index })),
        ...region.construction_queue.map((item, index) => ({
          buildingId: item.building_id,
          state: "construction" as const,
          index: region.buildings.length + index
        }))
      ];

      if (entries.length <= 0) {
        continue;
      }

      for (const entry of entries) {
        const entryHash = hashString(`${regionId}:${entry.buildingId}:${entry.index}:${entry.state}`);
        const score =
          (entry.state === "built" ? 3 : 2.25) +
          (regionId === selectedRegionId ? 8 : 0) +
          ((region.cached.network_congested ?? false) ? 1.8 : 0) +
          (this.isStrategicMapBuilding(entry.buildingId) ? 1.2 : 0) -
          entry.index * 0.06;
        candidates.push({ region, point, hash: entryHash, buildingId: entry.buildingId, state: entry.state, index: entry.index, score });
      }
    }

    const maxVisibleStructures = useStrategicStructureCap ? 15 : 22;
    const rankedCandidates = candidates.sort((left, right) => right.score - left.score);
    const visibleCandidates = useStrategicStructureCap
      ? this.strategicStructureCandidates(rankedCandidates, selectedRegionId, maxVisibleStructures)
      : rankedCandidates.slice(0, maxVisibleStructures);
    const selectedPrimary = useStrategicStructureCap
      ? this.selectedPrimaryStructure(visibleCandidates, selectedRegionId)
      : undefined;
    visibleCandidates.sort((left, right) => left.point.y - right.point.y);

    for (const candidate of visibleCandidates) {
      const { region, point, hash, buildingId, state, index } = candidate;
      const accent = hash % 5 === 0 ? HEATMAP_COLORS.compute : hash % 4 === 0 ? HEATMAP_COLORS.cooling : HEATMAP_COLORS.energy;
      const isPrimarySelected = candidate === selectedPrimary;
      const renderScale = isPrimarySelected ? scale * 1.18 : region.id === selectedRegionId && useStrategicStructureCap ? scale * 0.72 : scale;
      const offset = isPrimarySelected && !this.isOffshoreMapBuilding(buildingId)
        ? { x: 0, y: -13 * scale }
        : this.structureOffset(region, buildingId, index, renderScale);
      const moduleX = point.x + offset.x;
      const moduleY = point.y + offset.y;
      if (state === "construction") {
        this.drawConstructionPlaceholder(graphics, moduleX, moduleY, renderScale);
        continue;
      }
      this.drawModuleGroundIntegration(graphics, point, moduleX, moduleY, renderScale, accent, hash);
      if (!this.drawModuleSprite(moduleX, moduleY, renderScale, this.moduleIconIndex(buildingId, hash), accent, isPrimarySelected)) {
        this.drawIsoBase(graphics, moduleX, moduleY + 12 * renderScale, 34 * renderScale, 20 * renderScale, accent);
        this.drawModuleMarker(graphics, moduleX, moduleY, renderScale, accent, hash);
      }
    }
  }

  private strategicStructureCandidates(
    candidates: MapStructureCandidate[],
    selectedRegionId: string,
    maxVisibleStructures: number
  ): MapStructureCandidate[] {
    const result: MapStructureCandidate[] = [];
    const visibleByRegion = new Map<string, number>();
    for (const candidate of candidates) {
      const regionId = candidate.region.id;
      const currentCount = visibleByRegion.get(regionId) ?? 0;
      const perRegionLimit = regionId === selectedRegionId ? 3 : 2;
      if (currentCount >= perRegionLimit) {
        continue;
      }
      result.push(candidate);
      visibleByRegion.set(regionId, currentCount + 1);
      if (result.length >= maxVisibleStructures) {
        break;
      }
    }
    return result;
  }

  private selectedPrimaryStructure(
    candidates: MapStructureCandidate[],
    selectedRegionId: string
  ): MapStructureCandidate | undefined {
    const selectedBuilt = candidates
      .filter((candidate) =>
        candidate.region.id === selectedRegionId &&
        candidate.state === "built" &&
        !this.isOffshoreMapBuilding(candidate.buildingId)
      )
      .sort((left, right) =>
        this.mapPrimaryStructurePriority(right.buildingId) - this.mapPrimaryStructurePriority(left.buildingId) ||
        right.score - left.score
      );
    return (
      selectedBuilt[0] ??
      candidates.find((candidate) => candidate.region.id === selectedRegionId && candidate.state === "built") ??
      candidates.find((candidate) => candidate.region.id === selectedRegionId)
    );
  }

  private mapPrimaryStructurePriority(buildingId: string): number {
    if (buildingId.includes("datacenter")) {
      return 90;
    }
    if (buildingId.includes("ai_research")) {
      return 80;
    }
    if (buildingId.includes("research")) {
      return 70;
    }
    if (buildingId.includes("university")) {
      return 60;
    }
    if (buildingId.includes("nuclear")) {
      return 50;
    }
    if (buildingId.includes("gas")) {
      return 40;
    }
    if (buildingId.includes("grid") || buildingId.includes("supergrid")) {
      return 30;
    }
    if (buildingId.includes("wind") || buildingId.includes("solar") || buildingId.includes("hydro")) {
      return 20;
    }
    return 10;
  }

  private isStrategicMapBuilding(buildingId: string): boolean {
    return (
      buildingId.includes("datacenter") ||
      buildingId.includes("nuclear") ||
      buildingId.includes("gas") ||
      buildingId.includes("research") ||
      buildingId.includes("supergrid") ||
      buildingId.includes("wind_offshore")
    );
  }

  private structureOffset(region: RegionSnapshot, buildingId: string, index: number, scale: number): { x: number; y: number } {
    const landColumn = index % 3;
    const landRow = Math.floor(index / 3);
    const baseLandOffset = {
      x: (landColumn - 1) * 18 * scale + (landRow % 2 === 0 ? 0 : 8 * scale),
      y: -10 * scale + landRow * 10 * scale
    };

    if (this.isOffshoreMapBuilding(buildingId)) {
      const coast = this.regionCoastDirection(region);
      const distance = buildingId.includes("wind_offshore") ? 44 : 34;
      return {
        x: coast.x * distance * scale + (index % 2 === 0 ? -6 : 6) * scale,
        y: coast.y * distance * scale - 6 * scale
      };
    }

    const landOffset = this.landStructureInset(region, baseLandOffset, scale);

    if (buildingId.includes("river") || buildingId.includes("hydro")) {
      return {
        x: landOffset.x + (index % 2 === 0 ? -14 : 14) * scale,
        y: landOffset.y + 17 * scale
      };
    }

    if (buildingId.includes("solar")) {
      return { x: landOffset.x + 10 * scale, y: landOffset.y + 12 * scale };
    }

    if (buildingId.includes("wind_onshore")) {
      return { x: landOffset.x - 10 * scale, y: landOffset.y - 8 * scale };
    }

    return landOffset;
  }

  private landStructureInset(region: RegionSnapshot, offset: { x: number; y: number }, scale: number): { x: number; y: number } {
    if (!region.tags.includes("littoral") && !region.tags.includes("iles")) {
      return offset;
    }
    const coast = this.regionCoastDirection(region);
    return {
      x: offset.x - coast.x * 16 * scale,
      y: offset.y - coast.y * 14 * scale
    };
  }

  private isOffshoreMapBuilding(buildingId: string): boolean {
    return buildingId.includes("wind_offshore") || buildingId.includes("sea_cooling");
  }

  private regionCoastDirection(region: RegionSnapshot): { x: number; y: number } {
    const tags = new Set(region.tags);
    const layout = region.layout as RegionLayout;
    if (tags.has("mer_du_nord")) {
      return { x: 0, y: -1 };
    }
    if (tags.has("mer_noire")) {
      return { x: 1, y: 0.36 };
    }
    if (tags.has("iles")) {
      return { x: 0.2, y: 1 };
    }
    if (tags.has("littoral") && (layout.y ?? 0.5) < 0.48 && (layout.x ?? 0.5) > 0.36 && (layout.x ?? 0.5) < 0.55) {
      return { x: -0.35, y: -1 };
    }
    if ((layout.x ?? 0.5) < 0.38) {
      return { x: -1, y: 0.15 };
    }
    if ((layout.x ?? 0.5) > 0.66) {
      return { x: 1, y: 0.12 };
    }
    if ((layout.y ?? 0.5) < 0.34) {
      return { x: 0.1, y: -1 };
    }
    return { x: 0, y: 1 };
  }

  private drawModuleSprite(
    x: number,
    y: number,
    scale: number,
    iconIndex: number,
    accent: number,
    primary = false
  ): boolean {
    const container = this.structureSpriteLayer;
    const textureKey = this.textures.exists("building-map-atlas") ? "building-map-atlas" : "building-icon-atlas";
    if (!container || !this.textures.exists(textureKey)) {
      return false;
    }
    const texture = this.textures.get(textureKey);
    const source = texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement | undefined;
    if (!source?.width || !source?.height) {
      return false;
    }

    const columns = 4;
    const rows = 4;
    const cellWidth = source.width / columns;
    const cellHeight = source.height / rows;
    const clampedIndex = Phaser.Math.Clamp(Math.trunc(iconIndex), 0, columns * rows - 1);
    const cropX = (clampedIndex % columns) * cellWidth;
    const cropY = Math.floor(clampedIndex / columns) * cellHeight;
    const useEnhancedMapSprites = this.usesConceptMapGrade();
    const displaySize = (useEnhancedMapSprites ? (primary ? 62 : 47) : 50) * scale;
    const spriteScale = displaySize / cellWidth;
    const spriteY = y - (useEnhancedMapSprites ? (primary ? 6 : 5) : 7) * scale;
    if (useEnhancedMapSprites) {
      const shadow = this.add
        .image(x + 1.5 * scale, spriteY + 8 * scale, textureKey)
        .setOrigin(0.5, 0.74)
        .setCrop(cropX, cropY, cellWidth, cellHeight)
        .setScale(spriteScale * (primary ? 1.12 : 1.08))
        .setTint(0x02070b)
        .setAlpha(primary ? 0.34 : 0.28);
      container.add(shadow);

      const glow = this.add
        .image(x, spriteY + 2 * scale, textureKey)
        .setOrigin(0.5, 0.74)
        .setCrop(cropX, cropY, cellWidth, cellHeight)
        .setScale(spriteScale * (primary ? 1.1 : 1.04))
        .setTint(accent)
        .setAlpha(primary ? 0.17 : 0.095)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add(glow);
    }
    const image = this.add
      .image(x, spriteY, textureKey)
      .setOrigin(0.5, 0.74)
      .setCrop(cropX, cropY, cellWidth, cellHeight)
      .setScale(spriteScale)
      .setTint(useEnhancedMapSprites ? (primary ? 0xf4fbff : 0xc9d7d9) : 0xffffff)
      .setAlpha(primary ? 0.98 : useEnhancedMapSprites ? 0.9 : 0.94);
    container.add(image);
    if (useEnhancedMapSprites) {
      const detailLift = this.add
        .image(x, spriteY - 1 * scale, textureKey)
        .setOrigin(0.5, 0.74)
        .setCrop(cropX, cropY, cellWidth, cellHeight)
        .setScale(spriteScale * 0.98)
        .setTint(0xd8fbff)
        .setAlpha(primary ? 0.12 : 0.055)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add(detailLift);
      this.drawModuleTerrainSkirt(container, x, spriteY + displaySize * 0.24, displaySize, scale, accent, primary);
    }
    return true;
  }

  private drawModuleTerrainSkirt(
    container: Phaser.GameObjects.Container,
    x: number,
    y: number,
    displaySize: number,
    scale: number,
    accent: number,
    primary: boolean
  ): void {
    const skirt = this.add.graphics();
    skirt.fillStyle(0x07141b, primary ? 0.34 : 0.3);
    skirt.fillEllipse(x, y, displaySize * 0.76, displaySize * 0.18);
    skirt.fillStyle(0x24434c, primary ? 0.12 : 0.095);
    skirt.fillEllipse(x - 1.5 * scale, y - 1.2 * scale, displaySize * 0.54, displaySize * 0.11);
    skirt.lineStyle(0.75, accent, primary ? 0.14 : 0.09);
    skirt.beginPath();
    skirt.moveTo(x - displaySize * 0.28, y - displaySize * 0.01);
    skirt.lineTo(x, y + displaySize * 0.07);
    skirt.lineTo(x + displaySize * 0.28, y - displaySize * 0.01);
    skirt.strokePath();
    container.add(skirt);
  }

  private moduleIconIndex(buildingId: string, variant: number): number {
    if (buildingId.includes("university")) {
      return 0;
    }
    if (buildingId.includes("ai_research")) {
      return 1;
    }
    if (buildingId.includes("research")) {
      return 2;
    }
    if (buildingId.includes("datacenter")) {
      return 3;
    }
    if (buildingId.includes("gas")) {
      return 4;
    }
    if (buildingId.includes("nuclear")) {
      return 5;
    }
    if (buildingId.includes("wind")) {
      return 6;
    }
    if (buildingId.includes("solar")) {
      return 7;
    }
    if (buildingId.includes("hydro")) {
      return 8;
    }
    if (buildingId.includes("battery")) {
      return 9;
    }
    if (buildingId.includes("cooling")) {
      return 10;
    }
    if (buildingId.includes("grid") || buildingId.includes("supergrid")) {
      return 11;
    }
    return variant % 5 === 0 ? 10 : variant % 5 === 1 ? 4 : 3;
  }

  private drawConstructionPlaceholder(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number
  ): void {
    const baseY = y + 12 * scale;
    this.drawIsoBase(graphics, x, baseY, 36 * scale, 21 * scale, 0x9ba8ad);
    const width = 20 * scale;
    const depth = 14 * scale;
    const height = 20 * scale;
    const halfW = width / 2;
    const halfD = depth / 2;
    const topY = baseY - height;

    this.fillPoly(graphics, 0x88939a, 0.96, [
      [x, topY - halfD],
      [x + halfW, topY],
      [x, topY + halfD],
      [x - halfW, topY]
    ]);
    this.fillPoly(graphics, 0x5d676d, 0.96, [
      [x - halfW, topY],
      [x, topY + halfD],
      [x, baseY + halfD],
      [x - halfW, baseY]
    ]);
    this.fillPoly(graphics, 0x6f7a80, 0.96, [
      [x + halfW, topY],
      [x, topY + halfD],
      [x, baseY + halfD],
      [x + halfW, baseY]
    ]);
    graphics.lineStyle(1.2, 0xdbe6ea, 0.5);
    this.strokePoly(graphics, [
      [x, topY - halfD],
      [x + halfW, topY],
      [x + halfW, baseY],
      [x, baseY + halfD],
      [x - halfW, baseY],
      [x - halfW, topY]
    ]);
    graphics.lineStyle(1, 0x303a40, 0.55);
    graphics.lineBetween(x - halfW, topY, x, topY + halfD);
    graphics.lineBetween(x + halfW, topY, x, topY + halfD);
  }

  private drawModuleMarker(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    accent: number,
    variant: number
  ): void {
    const baseY = y + 12 * scale;
    this.drawIsoBase(graphics, x, baseY, 38 * scale, 22 * scale, accent);

    if (variant % 5 === 0) {
      this.drawCoolingModule(graphics, x, baseY - 6 * scale, scale, accent);
      return;
    }

    if (variant % 5 === 1) {
      this.drawEnergyModule(graphics, x, baseY - 6 * scale, scale, accent);
      return;
    }

    const towerCount = variant % 3 === 0 ? 2 : 1;
    for (let index = 0; index < towerCount; index += 1) {
      const towerX = x - (towerCount === 2 ? 8 * scale : 0) + index * 15 * scale;
      const towerHeight = (28 + ((variant + index) % 3) * 6) * scale;
      this.drawIsoTower(graphics, towerX, baseY - 5 * scale, 16 * scale, towerHeight, scale, accent, variant + index);
    }
  }

  private drawModuleGroundIntegration(
    graphics: Phaser.GameObjects.Graphics,
    regionPoint: { x: number; y: number },
    x: number,
    y: number,
    scale: number,
    accent: number,
    variant: number
  ): void {
    const baseY = y + 14 * scale;
    const padWidth = 48 * scale;
    const padDepth = 26 * scale;
    const halfW = padWidth / 2;
    const halfD = padDepth / 2;
    const connectorAlpha = Phaser.Math.Clamp(0.16 + (variant % 5) * 0.025, 0.16, 0.25);

    graphics.lineStyle(2.4 * scale, 0x02080d, 0.34);
    graphics.lineBetween(regionPoint.x, regionPoint.y, x, baseY);
    graphics.lineStyle(1.1 * scale, accent, connectorAlpha);
    graphics.lineBetween(regionPoint.x, regionPoint.y, x, baseY);

    graphics.fillStyle(0x02070b, 0.42);
    graphics.fillEllipse(x, baseY + 7 * scale, padWidth * 1.22, padDepth * 0.72);
    graphics.fillStyle(0x020c12, 0.2);
    graphics.fillEllipse(x + 1.5 * scale, baseY + 2 * scale, padWidth * 0.92, padDepth * 0.46);
    graphics.fillStyle(accent, 0.07);
    graphics.fillEllipse(x, baseY + 1 * scale, padWidth * 0.98, padDepth * 0.52);

    this.fillPoly(graphics, 0x061722, 0.34, [
      [x, baseY - halfD],
      [x + halfW, baseY],
      [x, baseY + halfD],
      [x - halfW, baseY]
    ]);

    graphics.lineStyle(0.8, accent, 0.18);
    this.strokePoly(graphics, [
      [x, baseY - halfD],
      [x + halfW, baseY],
      [x, baseY + halfD],
      [x - halfW, baseY]
    ]);

    graphics.lineStyle(0.8, 0xd8fbff, 0.09);
    graphics.lineBetween(x - halfW * 0.62, baseY, x, baseY + halfD * 0.58);
    graphics.lineBetween(x + halfW * 0.62, baseY, x, baseY + halfD * 0.58);
    graphics.lineStyle(1.1 * scale, 0x02080d, 0.34);
    graphics.lineBetween(x - halfW * 0.74, baseY + halfD * 0.1, x - halfW * 0.38, baseY + halfD * 0.34);
    graphics.lineBetween(x + halfW * 0.74, baseY + halfD * 0.1, x + halfW * 0.38, baseY + halfD * 0.34);

    const nodeCount = 3 + (variant % 2);
    graphics.fillStyle(accent, 0.34);
    for (let index = 0; index < nodeCount; index += 1) {
      const t = nodeCount === 1 ? 0.5 : index / (nodeCount - 1);
      const nodeX = Phaser.Math.Linear(x - halfW * 0.58, x + halfW * 0.58, t);
      const nodeY = baseY + halfD * (index % 2 === 0 ? 0.12 : -0.12);
      graphics.fillCircle(nodeX, nodeY, 1.8 * scale);
      graphics.lineStyle(0.8, accent, 0.18);
      graphics.strokeCircle(nodeX, nodeY, 3.4 * scale);
    }

    graphics.fillStyle(0xd8fbff, 0.18);
    graphics.fillCircle(x - halfW * 0.82, baseY, 1.2 * scale);
    graphics.fillCircle(x + halfW * 0.82, baseY, 1.2 * scale);
    graphics.fillCircle(x, baseY + halfD * 0.78, 1.1 * scale);
  }

  private drawIsoBase(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    depth: number,
    accent: number
  ): void {
    const halfW = width / 2;
    const halfD = depth / 2;
    graphics.fillStyle(0x02080d, 0.42);
    graphics.fillEllipse(x, y + halfD + 3, width * 1.08, depth * 0.72);

    this.fillPoly(graphics, 0x132b37, 0.78, [
      [x, y - halfD],
      [x + halfW, y],
      [x, y + halfD],
      [x - halfW, y]
    ]);
    this.fillPoly(graphics, 0x081923, 0.72, [
      [x - halfW, y],
      [x, y + halfD],
      [x, y + halfD + 7],
      [x - halfW, y + 7]
    ]);
    this.fillPoly(graphics, 0x0d202c, 0.74, [
      [x + halfW, y],
      [x, y + halfD],
      [x, y + halfD + 7],
      [x + halfW, y + 7]
    ]);

    graphics.lineStyle(0.9, accent, 0.32);
    this.strokePoly(graphics, [
      [x, y - halfD],
      [x + halfW, y],
      [x, y + halfD],
      [x - halfW, y]
    ]);
    graphics.fillStyle(accent, 0.1);
    graphics.fillEllipse(x, y - halfD * 0.04, width * 0.56, depth * 0.34);
    graphics.lineStyle(1, 0xd9fbff, 0.13);
    graphics.lineBetween(x - halfW, y, x, y + halfD + 7);
    graphics.lineBetween(x + halfW, y, x, y + halfD + 7);
  }

  private drawIsoTower(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    footY: number,
    width: number,
    height: number,
    scale: number,
    accent: number,
    variant: number
  ): void {
    const side = 5 * scale;
    const topY = footY - height;
    this.fillPoly(graphics, 0x152b39, 0.98, [
      [x - width / 2, topY + side],
      [x + width / 2, topY],
      [x + width / 2, footY],
      [x - width / 2, footY + side]
    ]);
    this.fillPoly(graphics, 0x071722, 0.95, [
      [x + width / 2, topY],
      [x + width / 2 + side, topY + side],
      [x + width / 2 + side, footY + side],
      [x + width / 2, footY]
    ]);
    this.fillPoly(graphics, 0x274656, 0.95, [
      [x - width / 2, topY + side],
      [x, topY - side * 0.42],
      [x + width / 2 + side, topY + side],
      [x + width / 2, topY + side * 2],
      [x - width / 2, topY + side * 2]
    ]);

    graphics.lineStyle(1.2, accent, 0.72);
    this.strokePoly(graphics, [
      [x - width / 2, topY + side],
      [x + width / 2, topY],
      [x + width / 2 + side, topY + side],
      [x + width / 2 + side, footY + side],
      [x, footY + side * 1.38],
      [x - width / 2, footY + side]
    ]);

    graphics.fillStyle(accent, 0.76);
    const rowCount = Math.max(3, Math.floor(height / (7 * scale)));
    for (let row = 0; row < rowCount; row += 1) {
      const windowY = topY + 8 * scale + row * 6 * scale;
      graphics.fillRect(x - width / 2 + 4 * scale, windowY, 2.6 * scale, 2 * scale);
      graphics.fillRect(x + 1.2 * scale, windowY - 1 * scale, 2.6 * scale, 2 * scale);
      if ((variant + row) % 2 === 0) {
        graphics.fillRect(x + width / 2 + side * 0.32, windowY + 1 * scale, 1.5 * scale, 2 * scale);
      }
    }

    graphics.fillStyle(0xdff8ff, 0.18);
    graphics.fillRect(x - width / 2 + 2 * scale, topY + 6 * scale, 1.4 * scale, height * 0.78);
  }

  private drawCoolingModule(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    accent: number
  ): void {
    graphics.fillStyle(0x102532, 0.96);
    graphics.fillRoundedRect(x - 15 * scale, y - 12 * scale, 30 * scale, 18 * scale, 3 * scale);
    graphics.lineStyle(1.2, accent, 0.58);
    graphics.strokeRoundedRect(x - 15 * scale, y - 12 * scale, 30 * scale, 18 * scale, 3 * scale);
    graphics.lineStyle(2, 0xd8fbff, 0.52);
    graphics.strokeCircle(x, y - 7 * scale, 8.4 * scale);
    graphics.lineStyle(1.2, accent, 0.76);
    graphics.strokeCircle(x, y - 7 * scale, 4.5 * scale);
    for (let blade = 0; blade < 4; blade += 1) {
      const angle = blade * Math.PI * 0.5 + 0.35;
      const x2 = x + Math.cos(angle) * 7 * scale;
      const y2 = y - 7 * scale + Math.sin(angle) * 7 * scale;
      graphics.lineBetween(x, y - 7 * scale, x2, y2);
    }
    graphics.fillStyle(accent, 0.72);
    graphics.fillCircle(x, y - 7 * scale, 2.4 * scale);
  }

  private drawEnergyModule(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    scale: number,
    accent: number
  ): void {
    for (let index = 0; index < 2; index += 1) {
      const stackX = x - 7 * scale + index * 13 * scale;
      const stackHeight = (24 - index * 5) * scale;
      graphics.fillStyle(0x22313b, 0.96);
      graphics.fillRoundedRect(stackX - 4 * scale, y - stackHeight, 8 * scale, stackHeight, 2 * scale);
      graphics.fillStyle(0x5d6f77, 0.5);
      graphics.fillRect(stackX - 2.4 * scale, y - stackHeight + 3 * scale, 2 * scale, stackHeight - 6 * scale);
      graphics.lineStyle(1.1, accent, 0.62);
      graphics.strokeRoundedRect(stackX - 4 * scale, y - stackHeight, 8 * scale, stackHeight, 2 * scale);
      graphics.fillStyle(0xffb25f, 0.74);
      graphics.fillEllipse(stackX, y - stackHeight, 7 * scale, 3 * scale);
    }
    graphics.fillStyle(0x102532, 0.92);
    graphics.fillRoundedRect(x - 16 * scale, y - 8 * scale, 32 * scale, 16 * scale, 3 * scale);
    graphics.lineStyle(1, accent, 0.45);
    graphics.strokeRoundedRect(x - 16 * scale, y - 8 * scale, 32 * scale, 16 * scale, 3 * scale);
  }

  private fillPoly(
    graphics: Phaser.GameObjects.Graphics,
    color: number,
    alpha: number,
    points: Array<[number, number]>
  ): void {
    graphics.fillStyle(color, alpha);
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);
    for (const [pointX, pointY] of points.slice(1)) {
      graphics.lineTo(pointX, pointY);
    }
    graphics.closePath();
    graphics.fillPath();
  }

  private strokePoly(graphics: Phaser.GameObjects.Graphics, points: Array<[number, number]>): void {
    graphics.beginPath();
    graphics.moveTo(points[0][0], points[0][1]);
    for (const [pointX, pointY] of points.slice(1)) {
      graphics.lineTo(pointX, pointY);
    }
    graphics.closePath();
    graphics.strokePath();
  }

  private drawRegions(rect: MapRect, context: SceneRenderContext): void {
    const graphics = this.regionLayer;
    const labels = this.labelLayer;
    if (!graphics || !labels) {
      return;
    }
    graphics.clear();
    labels.removeAll(true);

    const { summary, regions } = context;
    const selectedId = summary.selected_region_id;
    const useGeographicLabelLayer = context.conceptGrade;
    const maxCompute = Math.max(...Object.values(regions).map((region) => region.cached.compute_produced ?? 0), 1);

    if (useGeographicLabelLayer) {
      this.drawConceptGeoLabels(rect, labels);
    }

    for (const [regionId, region] of Object.entries(regions)) {
      const layout = region.layout as RegionLayout;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const baseRadius = Math.max(5.5, layout.hitbox_radius * Math.min(rect.width, rect.height) * 0.24);
      const color = this.regionColor(region, summary, maxCompute);
      const isSelected = regionId === selectedId;
      const alert = summary.alerts.find((item) => item.region_id === regionId);
      const pulse = this.testMode ? 0.6 : (Math.sin(this.animationTime * 3.6 + point.x * 0.01) + 1) * 0.5;
      const radius = useGeographicLabelLayer
        ? isSelected
          ? Math.max(6.2, baseRadius * 0.9)
          : Math.max(3.2, baseRadius * 0.5)
        : baseRadius;

      if (alert) {
        const alertColor = alert.state === "critical" ? HEATMAP_COLORS.critical : HEATMAP_COLORS.warning;
        graphics.lineStyle(useGeographicLabelLayer ? 1.35 : 2.5, alertColor, useGeographicLabelLayer ? 0.24 + pulse * 0.18 : 0.35 + pulse * 0.34);
        graphics.strokeCircle(point.x, point.y, radius * (useGeographicLabelLayer ? 2.4 + pulse * 0.18 : 1.8 + pulse * 0.25));
      }

      if (useGeographicLabelLayer && !isSelected) {
        graphics.fillStyle(color, 0.055);
        graphics.fillCircle(point.x, point.y, radius * 1.75);
        graphics.lineStyle(1, color, 0.28);
        graphics.strokeCircle(point.x, point.y, radius * 1.35);
        graphics.fillStyle(color, 0.44);
        graphics.fillCircle(point.x, point.y, radius * 0.72);
        graphics.fillStyle(0xf7fbff, 0.42);
        graphics.fillCircle(point.x, point.y, Math.max(1, radius * 0.24));
      } else {
        const haloAlpha = useGeographicLabelLayer ? 0.34 : isSelected ? 0.46 : 0.1;
        graphics.fillStyle(color, haloAlpha);
        graphics.fillCircle(point.x, point.y, radius * (isSelected ? 2.35 : 1.65));
        graphics.lineStyle(isSelected ? (useGeographicLabelLayer ? 2 : 2.5) : 1, isSelected ? 0xf5fbff : color, isSelected ? 0.86 : 0.45);
        graphics.fillStyle(color, isSelected ? 0.74 : 0.42);
        graphics.fillCircle(point.x, point.y, radius);
        graphics.strokeCircle(point.x, point.y, radius);
        graphics.fillStyle(0xf7fbff, isSelected ? 0.9 : 0.55);
        graphics.fillCircle(point.x, point.y, Math.max(1.4, radius * 0.2));
      }

      const shouldDrawRegionLabel = useGeographicLabelLayer
        ? isSelected
        : isSelected || (region.cached.problems?.length ?? 0) > 0 || hashString(regionId) % 2 === 0;
      if (shouldDrawRegionLabel) {
        const regionName = translatedOrFallback(`content.regions.${region.id}.name`, region.display_name);
        const text = this.add
          .text(point.x, point.y - radius - (isSelected ? 21 : 15), regionName.toUpperCase(), {
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            fontSize: isSelected ? "13px" : "9px",
            color: "#eaf8ff",
            stroke: "#06131d",
            strokeThickness: isSelected ? 4 : 3
          })
          .setOrigin(0.5, 0.5)
          .setAlpha(isSelected ? 0.95 : 0.62);
        labels.add(text);
      }
    }
  }

  private drawConceptGeoLabels(rect: MapRect, labels: Phaser.GameObjects.Container): void {
    for (const label of CONCEPT_MAP_LABELS) {
      const isSea = label.kind === "sea";
      const text = this.add
        .text(rect.x + label.x * rect.width, rect.y + label.y * rect.height, t(`hud.map.labels.${label.key}`), {
          align: "center",
          color: isSea ? "#4eb2c7" : "#eef7fb",
          fontFamily: "Inter, Segoe UI, Arial, sans-serif",
          fontSize: `${label.size ?? (isSea ? 11 : 12)}px`,
          fontStyle: "700",
          stroke: "#06131d",
          strokeThickness: isSea ? 2 : 3
        })
        .setOrigin(0.5, 0.5)
        .setAlpha(isSea ? 0.54 : 0.76)
        .setRotation(Phaser.Math.DegToRad(label.rotation ?? 0));
      labels.add(text);
    }
  }

  private drawSelectedSlots(rect: MapRect, context: SceneRenderContext): void {
    const graphics = this.slotLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();

    const region = context.selectedRegion;
    if (!region?.layout) {
      return;
    }
    const layout = region.layout as RegionLayout;
    const anchor = this.regionPoint(rect, {
      ...layout,
      x: layout.x + (layout.slot_anchor_dx ?? 0),
      y: layout.y + (layout.slot_anchor_dy ?? 0)
    });
    const cols = Math.max(layout.slot_grid_cols ?? 4, 1);
    const rows = Math.max(layout.slot_grid_rows ?? 4, 1);
    const hasVisibleStructures = region.buildings.length + region.construction_queue.length > 0;
    const baseSlotSize = Math.max(6, Math.min(rect.width, rect.height) * 0.0085);
    const slotSize = hasVisibleStructures ? baseSlotSize * 0.36 : baseSlotSize;
    const gap = Math.max(hasVisibleStructures ? 1 : 2, slotSize * (hasVisibleStructures ? 0.26 : 0.38));
    const total = cols * rows;
    const width = cols * slotSize + (cols - 1) * gap;
    const height = rows * slotSize + (rows - 1) * gap;
    const startX = anchor.x - width / 2;
    const startY = anchor.y - height / 2;

    const occupied = Math.min(region.slots_used, total);
    const constructingSlots = region.construction_queue.reduce((totalSlots, item) => {
      const definition = this.simulation.getBuildingDefinitions()[item.building_id];
      return totalSlots + (definition?.slots_required ?? 1);
    }, 0);

    for (let index = 0; index < total; index += 1) {
      const x = startX + (index % cols) * (slotSize + gap);
      const y = startY + Math.floor(index / cols) * (slotSize + gap);
      let color = 0x183848;
      let alpha = hasVisibleStructures ? 0.012 : 0.42;
      if (index < occupied - constructingSlots) {
        color = 0x5df4c5;
        alpha = hasVisibleStructures ? 0.075 : 0.72;
      } else if (index < occupied) {
        color = 0xffc15f;
        alpha = hasVisibleStructures ? 0.14 : 0.78;
      }
      graphics.fillStyle(color, alpha);
      graphics.fillRoundedRect(x, y, slotSize, slotSize, Math.max(2, slotSize * 0.25));
      graphics.lineStyle(1, 0xd8f8ff, hasVisibleStructures ? 0.012 : 0.15);
      graphics.strokeRoundedRect(x, y, slotSize, slotSize, Math.max(2, slotSize * 0.25));
    }
  }

  private regionColor(region: RegionSnapshot, summary: GameSummary, maxCompute: number): number {
    const cached = region.cached;
    if (cached.blackout_state === "severe") {
      return HEATMAP_COLORS.critical;
    }
    if (this.heatmapMode === "energy") {
      const efficiency = cached.energy_efficiency ?? 1;
      if (efficiency < 0.72) {
        return HEATMAP_COLORS.critical;
      }
      if (efficiency < 0.94 || (cached.network_congested ?? false)) {
        return HEATMAP_COLORS.warning;
      }
      return (cached.energy_balance_local ?? 0) >= 0 ? HEATMAP_COLORS.stable : HEATMAP_COLORS.energy;
    }
    if (this.heatmapMode === "cooling") {
      const efficiency = cached.cooling_efficiency ?? 1;
      if (efficiency < 0.65) {
        return HEATMAP_COLORS.critical;
      }
      if (efficiency < 0.92) {
        return HEATMAP_COLORS.warning;
      }
      return HEATMAP_COLORS.cooling;
    }
    if (this.heatmapMode === "network") {
      if (cached.network_congested) {
        return HEATMAP_COLORS.warning;
      }
      if ((cached.energy_imported ?? 0) > 0 || (cached.energy_exported ?? 0) > 0) {
        return HEATMAP_COLORS.energy;
      }
      return HEATMAP_COLORS.stable;
    }
    if (this.heatmapMode === "compute") {
      const ratio = clampColor((cached.compute_produced ?? 0) / maxCompute);
      return mixColor(0x3650a8, HEATMAP_COLORS.compute, ratio);
    }
    if (this.heatmapMode === "co2") {
      if (summary.co2_tier === "critical" || summary.co2_tier === "very_high") {
        return HEATMAP_COLORS.critical;
      }
      if ((cached.co2_monthly ?? 0) > 2) {
        return HEATMAP_COLORS.co2;
      }
      return HEATMAP_COLORS.stable;
    }
    return HEATMAP_COLORS.stable;
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.mapDrag = {
      pointerId: pointer.id,
      startX: pointer.x,
      startY: pointer.y,
      previousX: pointer.x,
      previousY: pointer.y,
      moved: false
    };
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.mapDrag || this.mapDrag.pointerId !== pointer.id) {
      return;
    }

    const deltaX = pointer.x - this.mapDrag.previousX;
    const deltaY = pointer.y - this.mapDrag.previousY;
    const totalDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.mapDrag.startX, this.mapDrag.startY);
    this.mapDrag.previousX = pointer.x;
    this.mapDrag.previousY = pointer.y;
    if (totalDistance > MAP_DRAG_CLICK_TOLERANCE) {
      this.mapDrag.moved = true;
    }
    if (!this.mapDrag.moved || (deltaX === 0 && deltaY === 0)) {
      return;
    }

    this.mapInteraction.pan({ x: deltaX, y: deltaY });
    this.dirty = true;
    this.renderState();
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer, allowClick = true): void {
    if (!this.mapDrag || this.mapDrag.pointerId !== pointer.id) {
      return;
    }
    const drag = this.mapDrag;
    this.mapDrag = null;
    const totalDistance = Phaser.Math.Distance.Between(pointer.x, pointer.y, drag.startX, drag.startY);
    if (allowClick && !drag.moved && totalDistance <= MAP_DRAG_CLICK_TOLERANCE) {
      this.selectRegionAtPointer(pointer);
    }
  }

  private handleWheel(pointer: Phaser.Input.Pointer, deltaY: number): void {
    const nextZoom = this.mapInteraction.zoom * Math.exp(-deltaY * MAP_WHEEL_ZOOM_INTENSITY);
    this.mapInteraction.zoomAt({ x: pointer.x, y: pointer.y }, nextZoom);
    this.dirty = true;
    this.renderState();
  }

  private createMapZoomOverlay(): void {
    this.mapZoomOverlayLayer = this.add.container(0, 0).setDepth(20);
    this.mapZoomOverlayBackground = this.add.graphics();
    this.mapZoomOverlayText = this.add
      .text(0, 0, "", {
        color: "#eaf8ff",
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        fontSize: "11px",
        fontStyle: "700"
      })
      .setOrigin(0, 0.5);
    this.mapZoomResetButton = this.add
      .rectangle(0, 0, 54, 24, 0x102532, 0.92)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, 0x53e7ff, 0.32)
      .setInteractive({ useHandCursor: true });
    this.mapZoomResetText = this.add
      .text(0, 0, t("hud.map.resetZoom"), {
        align: "center",
        color: "#d8fbff",
        fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        fontSize: "10px",
        fontStyle: "700"
      })
      .setOrigin(0.5, 0.5);

    this.mapZoomResetButton.on(
      "pointerdown",
      (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: PhaserInputEvent) => {
        event?.stopPropagation?.();
        this.resetMapInteraction();
      }
    );
    this.mapZoomResetButton.on(
      "pointerup",
      (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event?: PhaserInputEvent) => {
        event?.stopPropagation?.();
      }
    );

    this.mapZoomOverlayLayer.add([
      this.mapZoomOverlayBackground,
      this.mapZoomOverlayText,
      this.mapZoomResetButton,
      this.mapZoomResetText
    ]);
  }

  private updateMapZoomOverlay(): void {
    if (
      !this.mapZoomOverlayLayer ||
      !this.mapZoomOverlayBackground ||
      !this.mapZoomOverlayText ||
      !this.mapZoomResetButton ||
      !this.mapZoomResetText
    ) {
      return;
    }

    const safe = this.safeViewportRect();
    const zoomPercent = Math.round(this.mapInteraction.zoom * 100);
    if (zoomPercent === 100) {
      this.mapZoomOverlayLayer.setVisible(false);
      this.mapZoomResetButton.disableInteractive();
      return;
    }
    this.mapZoomOverlayLayer.setVisible(true);
    this.mapZoomResetButton.setInteractive({ useHandCursor: true });

    const x = Phaser.Math.Clamp(
      safe.x + safe.width - MAP_ZOOM_OVERLAY_WIDTH - MAP_ZOOM_OVERLAY_MARGIN,
      safe.x + 8,
      safe.x + safe.width - MAP_ZOOM_OVERLAY_WIDTH
    );
    const y = Phaser.Math.Clamp(
      safe.y + safe.height - MAP_ZOOM_OVERLAY_HEIGHT - MAP_ZOOM_OVERLAY_MARGIN,
      safe.y + 8,
      safe.y + safe.height - MAP_ZOOM_OVERLAY_HEIGHT
    );

    this.mapZoomOverlayBackground.clear();
    this.mapZoomOverlayBackground.fillStyle(0x06131d, 0.78);
    this.mapZoomOverlayBackground.fillRoundedRect(x, y, MAP_ZOOM_OVERLAY_WIDTH, MAP_ZOOM_OVERLAY_HEIGHT, 7);
    this.mapZoomOverlayBackground.lineStyle(1, 0x9edce2, 0.22);
    this.mapZoomOverlayBackground.strokeRoundedRect(x, y, MAP_ZOOM_OVERLAY_WIDTH, MAP_ZOOM_OVERLAY_HEIGHT, 7);

    this.mapZoomOverlayText
      .setText(t("hud.map.zoomLevel", { value: zoomPercent }))
      .setPosition(x + 12, y + MAP_ZOOM_OVERLAY_HEIGHT / 2);
    this.mapZoomResetButton.setPosition(x + 92, y + MAP_ZOOM_OVERLAY_HEIGHT / 2);
    this.mapZoomResetText
      .setText(t("hud.map.resetZoom"))
      .setPosition(x + 119, y + MAP_ZOOM_OVERLAY_HEIGHT / 2);
    this.mapZoomOverlayLayer.setDepth(20);
  }

  private resetMapInteraction(): void {
    this.mapInteraction.reset();
    this.dirty = true;
    this.renderState();
  }

  private selectRegionAtPointer(pointer: Phaser.Input.Pointer): void {
    const rect = this.mapRect();
    const regions = this.simulation.getRegionsSnapshot();
    let bestRegion = "";
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const [regionId, region] of Object.entries(regions)) {
      const layout = region.layout as RegionLayout;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const radius = Math.max(12, layout.hitbox_radius * Math.min(rect.width, rect.height) * 0.66);
      const distance = Phaser.Math.Distance.Between(pointer.x, pointer.y, point.x, point.y);
      if (distance <= radius && distance < bestDistance) {
        bestRegion = regionId;
        bestDistance = distance;
      }
    }
    if (bestRegion) {
      this.simulation.selectRegion(bestRegion);
      this.mapInteraction.focusRegion(bestRegion);
      this.onRegionSelected(bestRegion);
      this.dirty = true;
      this.renderState();
    }
  }

  private regionPoint(rect: MapRect, layout: RegionLayout): { x: number; y: number } {
    return {
      x: rect.x + layout.x * rect.width,
      y: rect.y + layout.y * rect.height
    };
  }

  private mapRect(): MapRect {
    return this.mapInteraction.rect();
  }

  private constrainMapInteraction(): void {
    this.mapInteraction.constrain();
  }

  private safeViewportRect(): MapRect {
    return this.mapInteraction.safeViewportRect();
  }

  private mapFocusPoint(focusRegionId: string): { x: number; y: number } | undefined {
    const selectedRegion = this.simulation.getSummary().selected_region_id;
    const focusRegion = focusRegionId === selectedRegion ? focusRegionId : selectedRegion;
    const layout = focusRegion ? this.simulation.getRegionSnapshot(focusRegion)?.layout as RegionLayout | undefined : undefined;
    return layout?.x !== undefined && layout.y !== undefined ? { x: layout.x, y: layout.y } : undefined;
  }

  private mapViewportOccluders(): ViewportOccluder[] {
    const selectors = [".top-kpi", ".heatmap-switch", ".alerts-panel", ".region-panel", ".build-palette"];
    const occluders: ViewportOccluder[] = [];
    for (const selector of selectors) {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) {
        continue;
      }
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === "none" || rect.width < 2 || rect.height < 2) {
        continue;
      }
      occluders.push({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    }
    return occluders;
  }
}

function translatedOrFallback(key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}
