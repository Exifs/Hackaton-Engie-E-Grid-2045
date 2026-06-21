import Phaser from "phaser";
import type { GameSummary, RegionLayout, RegionSnapshot, SimulationCore } from "../sim";

export type HeatmapMode = "none" | "energy" | "cooling" | "network" | "compute" | "co2";

interface SceneConfig {
  simulation: SimulationCore;
  testMode: boolean;
  onRegionSelected: (regionId: string) => void;
  onSimulationAdvanced: () => void;
  onSimulationProgress: () => void;
}

interface MapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ConceptMapLabel {
  text: string;
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

const HEATMAP_COLORS = {
  stable: 0x49e7b8,
  energy: 0x53e7ff,
  cooling: 0x79b9ff,
  compute: 0xb879ff,
  warning: 0xffb25f,
  critical: 0xff5f4f,
  co2: 0xc0814f
};

const CONCEPT_MAP_LABELS: ConceptMapLabel[] = [
  { text: "IRELAND", x: 0.23, y: 0.39, kind: "country" },
  { text: "UNITED\nKINGDOM", x: 0.34, y: 0.45, kind: "country" },
  { text: "NORWAY", x: 0.55, y: 0.17, kind: "country" },
  { text: "SWEDEN", x: 0.63, y: 0.19, kind: "country" },
  { text: "FINLAND", x: 0.76, y: 0.15, kind: "country" },
  { text: "DENMARK", x: 0.55, y: 0.34, kind: "country" },
  { text: "BELGIUM", x: 0.43, y: 0.51, kind: "country" },
  { text: "GERMANY", x: 0.56, y: 0.52, kind: "country" },
  { text: "FRANCE", x: 0.37, y: 0.65, kind: "country" },
  { text: "SPAIN", x: 0.29, y: 0.78, kind: "country" },
  { text: "PORTUGAL", x: 0.19, y: 0.79, kind: "country" },
  { text: "SWITZERLAND", x: 0.48, y: 0.63, kind: "country" },
  { text: "ITALY", x: 0.58, y: 0.78, kind: "country" },
  { text: "AUSTRIA", x: 0.62, y: 0.62, kind: "country" },
  { text: "CZECHIA", x: 0.65, y: 0.52, kind: "country" },
  { text: "POLAND", x: 0.72, y: 0.45, kind: "country" },
  { text: "SLOVAKIA", x: 0.72, y: 0.57, kind: "country" },
  { text: "HUNGARY", x: 0.73, y: 0.64, kind: "country" },
  { text: "ROMANIA", x: 0.84, y: 0.64, kind: "country" },
  { text: "BULGARIA", x: 0.84, y: 0.74, kind: "country" },
  { text: "GREECE", x: 0.82, y: 0.86, kind: "country" },
  { text: "NORTH\nSEA", x: 0.43, y: 0.27, kind: "sea", rotation: -7, size: 12 },
  { text: "BALTIC\nSEA", x: 0.69, y: 0.32, kind: "sea", rotation: -10, size: 12 },
  { text: "ATLANTIC\nOCEAN", x: 0.17, y: 0.56, kind: "sea", rotation: -7, size: 12 },
  { text: "MEDITERRANEAN\nSEA", x: 0.45, y: 0.88, kind: "sea", rotation: -5, size: 11 },
  { text: "BLACK\nSEA", x: 0.67, y: 0.78, kind: "sea", rotation: 12, size: 11 }
];

export class EGridMapScene extends Phaser.Scene {
  private simulation: SimulationCore;
  private readonly testMode: boolean;
  private readonly onRegionSelected: (regionId: string) => void;
  private readonly onSimulationAdvanced: () => void;
  private readonly onSimulationProgress: () => void;

  private heatmapMode: HeatmapMode = "energy";
  private mapImage?: Phaser.GameObjects.Image;
  private flowLayer?: Phaser.GameObjects.Graphics;
  private structureLayer?: Phaser.GameObjects.Graphics;
  private structureSpriteLayer?: Phaser.GameObjects.Container;
  private regionLayer?: Phaser.GameObjects.Graphics;
  private slotLayer?: Phaser.GameObjects.Graphics;
  private labelLayer?: Phaser.GameObjects.Container;
  private animationTime = 0;
  private hudProgressAccumulatorMs = 0;
  private dirty = true;
  private currentMapRect?: MapRect;
  private focusRegionId = "";

  constructor(config: SceneConfig) {
    super("EGridMapScene");
    this.simulation = config.simulation;
    this.testMode = config.testMode;
    this.onRegionSelected = config.onRegionSelected;
    this.onSimulationAdvanced = config.onSimulationAdvanced;
    this.onSimulationProgress = config.onSimulationProgress;
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
  }

  create(): void {
    this.mapImage = this.add.image(0, 0, "map-backdrop").setOrigin(0, 0).setAlpha(0.94);
    this.flowLayer = this.add.graphics();
    this.structureLayer = this.add.graphics();
    this.structureSpriteLayer = this.add.container(0, 0);
    this.regionLayer = this.add.graphics();
    this.slotLayer = this.add.graphics();
    this.labelLayer = this.add.container(0, 0);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
    this.scale.on("resize", () => {
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

    if (!this.testMode || this.dirty) {
      this.renderState();
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
    this.focusRegionId = regionId;
    this.dirty = true;
    this.renderState();
  }

  getRegionScreenPoint(regionId: string): { x: number; y: number } | undefined {
    const region = this.simulation.getRegionsSnapshot()[regionId];
    if (!region?.layout) {
      return undefined;
    }
    const rect = this.currentMapRect ?? this.mapRect();
    return this.regionPoint(rect, region.layout as RegionLayout);
  }

  renderState(): void {
    if (
      !this.flowLayer ||
      !this.structureLayer ||
      !this.structureSpriteLayer ||
      !this.regionLayer ||
      !this.slotLayer ||
      !this.labelLayer ||
      !this.mapImage
    ) {
      return;
    }

    const rect = this.mapRect();
    this.mapImage.setPosition(rect.x, rect.y).setDisplaySize(rect.width, rect.height);
    this.drawBackdropVignette(rect);
    this.drawFlows(rect);
    this.drawStructures(rect);
    this.drawRegions(rect);
    this.drawSelectedSlots(rect);
    this.dirty = false;
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
    this.flowLayer?.setDepth(2);
    this.regionLayer?.setDepth(3);
    this.structureLayer?.setDepth(4);
    this.structureSpriteLayer?.setDepth(4.5);
    this.slotLayer?.setDepth(5);
    this.labelLayer?.setDepth(6);
  }

  private addedVignette?: Phaser.GameObjects.Rectangle;

  private drawFlows(rect: MapRect): void {
    const graphics = this.flowLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();
    const summary = this.simulation.getSummary();
    const regions = this.simulation.getRegionsSnapshot();
    const graph = this.simulation.getNetworkGraph();
    const drawnEdges = new Set<string>();
    const useStrategicRouteRendering = window.innerWidth >= 1180 || document.documentElement.dataset.conceptScenario === "1";
    const activeConceptEdges = new Set(
      summary.network_flows
        .slice(0, 16)
        .map((flow) => [flow.source_region_id, flow.target_region_id].sort().join(":"))
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
        const color = hash % 4 === 0 ? HEATMAP_COLORS.compute : hash % 5 === 0 ? HEATMAP_COLORS.warning : HEATMAP_COLORS.energy;
        const isActiveConceptEdge = activeConceptEdges.has(edgeKey);
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
            isActiveConceptEdge ? 1.15 : 0.72,
            isActiveConceptEdge ? 0.18 : 0.08
          );
          if (isActiveConceptEdge || hash % 10 === 0) {
            const nodeRatio = 0.32 + (hash % 30) / 90;
            const control = this.conceptRouteControl(sourcePoint, targetPoint, hash);
            const node = quadraticPoint(sourcePoint, control, targetPoint, nodeRatio);
            graphics.fillStyle(color, isActiveConceptEdge ? 0.5 : 0.26);
            graphics.fillCircle(node.x, node.y, isActiveConceptEdge ? 2.6 : 1.8);
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

    for (const flow of summary.network_flows) {
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
        graphics.lineStyle(width + 4.5, 0x03131b, 0.58);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);
        graphics.lineStyle(Math.max(1.2, width * 0.86), color, flow.is_congested ? 0.82 : 0.64);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);
        graphics.lineStyle(0.8, 0xd8fbff, flow.is_congested ? 0.2 : 0.12);
        this.drawQuadraticRoute(graphics, sourcePoint, control, targetPoint);

        const pulse = this.testMode ? 0.58 : (this.animationTime * 0.22 + flow.intensity_normalized) % 1;
        const point = quadraticPoint(sourcePoint, control, targetPoint, pulse);
        graphics.fillStyle(color, 0.82);
        graphics.fillCircle(point.x, point.y, 2.4 + flow.intensity_normalized * 2.6);
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
    graphics.lineStyle(width + 2.4, 0x02090f, alpha * 1.5);
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

  private drawStructures(rect: MapRect): void {
    const graphics = this.structureLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();
    this.structureSpriteLayer?.removeAll(true);

    const regions = this.simulation.getRegionsSnapshot();
    const selectedRegionId = this.simulation.getSummary().selected_region_id;
    const useStrategicStructureCap = window.innerWidth >= 1180 || document.documentElement.dataset.conceptScenario === "1";
    const scale = Phaser.Math.Clamp(Math.min(rect.width, rect.height) / 760, 0.82, 1.35);
    const candidates: MapStructureCandidate[] = [];

    for (const [regionId, region] of Object.entries(regions)) {
      const layout = region.layout as RegionLayout;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const hash = hashString(regionId);
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
    const visibleCandidates = candidates
      .sort((left, right) => right.score - left.score)
      .slice(0, maxVisibleStructures)
      .sort((left, right) => left.point.y - right.point.y);

    for (const candidate of visibleCandidates) {
      const { region, point, hash, buildingId, state, index } = candidate;
      const accent = hash % 5 === 0 ? HEATMAP_COLORS.compute : hash % 4 === 0 ? HEATMAP_COLORS.cooling : HEATMAP_COLORS.energy;
      const offset = this.structureOffset(region, buildingId, index, scale);
      const moduleX = point.x + offset.x;
      const moduleY = point.y + offset.y;
      if (state === "construction") {
        this.drawConstructionPlaceholder(graphics, moduleX, moduleY, scale);
        continue;
      }
      this.drawModuleGroundIntegration(graphics, point, moduleX, moduleY, scale, accent, hash);
      this.drawIsoBase(graphics, moduleX, moduleY + 12 * scale, 42 * scale, 25 * scale, accent);
      if (!this.drawModuleSprite(moduleX, moduleY, scale, this.moduleIconIndex(buildingId, hash), accent)) {
        this.drawModuleMarker(graphics, moduleX, moduleY, scale, accent, hash);
      }
    }
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
    const landOffset = {
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

  private drawModuleSprite(x: number, y: number, scale: number, iconIndex: number, accent: number): boolean {
    const container = this.structureSpriteLayer;
    if (!container || !this.textures.exists("building-icon-atlas")) {
      return false;
    }
    const texture = this.textures.get("building-icon-atlas");
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
    const useEnhancedMapSprites = window.innerWidth >= 1180 || document.documentElement.dataset.conceptScenario === "1";
    const displaySize = (useEnhancedMapSprites ? 56 : 48) * scale;
    const spriteScale = displaySize / cellWidth;
    const spriteY = y - (useEnhancedMapSprites ? 8 : 6) * scale;
    if (useEnhancedMapSprites) {
      const glow = this.add
        .image(x, spriteY + 2 * scale, "building-icon-atlas")
        .setOrigin(0.5, 0.74)
        .setCrop(cropX, cropY, cellWidth, cellHeight)
        .setScale(spriteScale * 1.18)
        .setTint(accent)
        .setAlpha(0.28)
        .setBlendMode(Phaser.BlendModes.ADD);
      container.add(glow);
    }
    const image = this.add
      .image(x, spriteY, "building-icon-atlas")
      .setOrigin(0.5, 0.74)
      .setCrop(cropX, cropY, cellWidth, cellHeight)
      .setScale(spriteScale)
      .setAlpha(useEnhancedMapSprites ? 1 : 0.95);
    container.add(image);
    return true;
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

    graphics.fillStyle(0x02070b, 0.5);
    graphics.fillEllipse(x, baseY + 5 * scale, padWidth * 1.08, padDepth * 0.64);
    graphics.fillStyle(accent, 0.065);
    graphics.fillEllipse(x, baseY + 1 * scale, padWidth * 0.96, padDepth * 0.5);

    this.fillPoly(graphics, 0x061722, 0.52, [
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
    graphics.fillStyle(0x02080d, 0.58);
    graphics.fillEllipse(x, y + halfD + 3, width * 1.08, depth * 0.72);

    this.fillPoly(graphics, 0x132b37, 0.96, [
      [x, y - halfD],
      [x + halfW, y],
      [x, y + halfD],
      [x - halfW, y]
    ]);
    this.fillPoly(graphics, 0x081923, 0.9, [
      [x - halfW, y],
      [x, y + halfD],
      [x, y + halfD + 7],
      [x - halfW, y + 7]
    ]);
    this.fillPoly(graphics, 0x0d202c, 0.92, [
      [x + halfW, y],
      [x, y + halfD],
      [x, y + halfD + 7],
      [x + halfW, y + 7]
    ]);

    graphics.lineStyle(1, accent, 0.42);
    this.strokePoly(graphics, [
      [x, y - halfD],
      [x + halfW, y],
      [x, y + halfD],
      [x - halfW, y]
    ]);
    graphics.fillStyle(accent, 0.16);
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

  private drawRegions(rect: MapRect): void {
    const graphics = this.regionLayer;
    const labels = this.labelLayer;
    if (!graphics || !labels) {
      return;
    }
    graphics.clear();
    labels.removeAll(true);

    const summary = this.simulation.getSummary();
    const regions = this.simulation.getRegionsSnapshot();
    const selectedId = summary.selected_region_id;
    const useGeographicLabelLayer = window.innerWidth >= 1180 || document.documentElement.dataset.conceptScenario === "1";
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
      const radius = Math.max(5.5, layout.hitbox_radius * Math.min(rect.width, rect.height) * 0.24);
      const color = this.regionColor(region, summary, maxCompute);
      const isSelected = regionId === selectedId;
      const alert = summary.alerts.find((item) => item.region_id === regionId);
      const pulse = this.testMode ? 0.6 : (Math.sin(this.animationTime * 3.6 + point.x * 0.01) + 1) * 0.5;

      if (alert) {
        const alertColor = alert.state === "critical" ? HEATMAP_COLORS.critical : HEATMAP_COLORS.warning;
        graphics.lineStyle(2.5, alertColor, 0.35 + pulse * 0.34);
        graphics.strokeCircle(point.x, point.y, radius * (1.8 + pulse * 0.25));
      }

      const haloAlpha = isSelected ? 0.46 : 0.1;
      graphics.fillStyle(color, haloAlpha);
      graphics.fillCircle(point.x, point.y, radius * (isSelected ? 2.5 : 1.65));
      graphics.lineStyle(isSelected ? 2.5 : 1, isSelected ? 0xf5fbff : color, isSelected ? 0.9 : 0.45);
      graphics.fillStyle(color, isSelected ? 0.82 : 0.42);
      graphics.fillCircle(point.x, point.y, radius);
      graphics.strokeCircle(point.x, point.y, radius);
      graphics.fillStyle(0xf7fbff, isSelected ? 0.95 : 0.55);
      graphics.fillCircle(point.x, point.y, Math.max(1.6, radius * 0.2));

      const shouldDrawRegionLabel = useGeographicLabelLayer
        ? isSelected || (region.cached.problems?.length ?? 0) > 0
        : isSelected || (region.cached.problems?.length ?? 0) > 0 || hashString(regionId) % 2 === 0;
      if (shouldDrawRegionLabel) {
        const text = this.add
          .text(point.x, point.y - radius - (isSelected ? 21 : 15), region.display_name.toUpperCase(), {
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
        .text(rect.x + label.x * rect.width, rect.y + label.y * rect.height, label.text, {
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

  private drawSelectedSlots(rect: MapRect): void {
    const graphics = this.slotLayer;
    if (!graphics) {
      return;
    }
    graphics.clear();

    const region = this.simulation.getRegionSnapshot();
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
    const slotSize = Math.max(6, Math.min(rect.width, rect.height) * 0.0085);
    const gap = Math.max(2, slotSize * 0.38);
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
      let alpha = 0.42;
      if (index < occupied - constructingSlots) {
        color = 0x5df4c5;
        alpha = 0.72;
      } else if (index < occupied) {
        color = 0xffc15f;
        alpha = 0.78;
      }
      graphics.fillStyle(color, alpha);
      graphics.fillRoundedRect(x, y, slotSize, slotSize, Math.max(2, slotSize * 0.25));
      graphics.lineStyle(1, 0xd8f8ff, 0.15);
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

  private handlePointer(pointer: Phaser.Input.Pointer): void {
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
      this.focusRegionId = bestRegion;
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
    const target = this.targetMapRect();
    if (this.testMode || !this.currentMapRect) {
      this.currentMapRect = target;
      return target;
    }
    const ratio = 0.16;
    this.currentMapRect = {
      x: Phaser.Math.Linear(this.currentMapRect.x, target.x, ratio),
      y: Phaser.Math.Linear(this.currentMapRect.y, target.y, ratio),
      width: Phaser.Math.Linear(this.currentMapRect.width, target.width, ratio),
      height: Phaser.Math.Linear(this.currentMapRect.height, target.height, ratio)
    };
    return this.currentMapRect;
  }

  private targetMapRect(): MapRect {
    const width = this.scale.width;
    const height = this.scale.height;
    const texture = this.textures.get("map-backdrop").getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const imageRatio = texture.width / texture.height || 16 / 9;
    const safe = this.safeViewportRect();
    const desktopConceptFrame = width >= 1180 && height >= 760;
    const baseScale = desktopConceptFrame
      ? Math.max(safe.width / texture.width, safe.height / texture.height)
      : Math.min(safe.width / texture.width, safe.height / texture.height);
    const focusScale = this.focusRegionId ? baseScale * (desktopConceptFrame ? 1.04 : 1.14) : baseScale;
    const scale = Math.max(baseScale, focusScale);
    const mapWidth = texture.width * scale;
    const mapHeight = texture.height * scale;

    let x = safe.x + (safe.width - mapWidth) / 2;
    let y = safe.y + (safe.height - mapHeight) / 2;

    const selectedRegion = this.simulation.getSummary().selected_region_id;
    const focusRegion = this.focusRegionId === selectedRegion ? this.focusRegionId : selectedRegion;
    const layout = focusRegion ? this.simulation.getRegionSnapshot(focusRegion)?.layout as RegionLayout | undefined : undefined;
    if (layout?.x !== undefined && layout.y !== undefined) {
      const margin = Math.min(84, Math.max(36, Math.min(safe.width, safe.height) * 0.12));
      const point = { x: x + layout.x * mapWidth, y: y + layout.y * mapHeight };
      if (point.x < safe.x + margin) {
        x += safe.x + margin - point.x;
      } else if (point.x > safe.x + safe.width - margin) {
        x -= point.x - (safe.x + safe.width - margin);
      }
      if (point.y < safe.y + margin) {
        y += safe.y + margin - point.y;
      } else if (point.y > safe.y + safe.height - margin) {
        y -= point.y - (safe.y + safe.height - margin);
      }
    }

    if (mapWidth > safe.width) {
      x = Phaser.Math.Clamp(x, safe.x + safe.width - mapWidth, safe.x);
    } else {
      x = safe.x + (safe.width - mapWidth) / 2;
    }
    if (mapHeight > safe.height) {
      y = Phaser.Math.Clamp(y, safe.y + safe.height - mapHeight, safe.y);
    } else {
      y = safe.y + (safe.height - mapHeight) / 2;
    }

    if (mapWidth / mapHeight > imageRatio + 0.001) {
      return { x, y, width: mapWidth, height: mapWidth / imageRatio };
    }
    return { x, y, width: mapWidth, height: mapHeight };
  }

  private safeViewportRect(): MapRect {
    const width = this.scale.width;
    const height = this.scale.height;
    let top = 0;
    let right = 0;
    let bottom = 0;
    let left = 0;
    const selectors = [".top-kpi", ".heatmap-switch", ".alerts-panel", ".region-panel", ".build-palette"];
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

      const spansHorizontal = rect.width > width * 0.5;
      const spansVertical = rect.height > height * 0.18;
      if (spansHorizontal && rect.top < height * 0.35) {
        top = Math.max(top, rect.bottom + 12);
      }
      if (spansHorizontal && rect.bottom > height * 0.58) {
        bottom = Math.max(bottom, height - rect.top + 12);
      }
      if (!spansHorizontal && spansVertical && rect.left < width * 0.22) {
        left = Math.max(left, rect.right + 12);
      }
      if (!spansHorizontal && spansVertical && rect.right > width * 0.78) {
        right = Math.max(right, width - rect.left + 12);
      }
    }

    const minWidth = Math.max(280, width * 0.36);
    const minHeight = Math.max(220, height * 0.32);
    if (width - left - right < minWidth) {
      left = 0;
      right = 0;
    }
    if (height - top - bottom < minHeight) {
      top = Math.min(top, height * 0.18);
      bottom = Math.min(bottom, height * 0.22);
    }

    return {
      x: left,
      y: top,
      width: Math.max(minWidth, width - left - right),
      height: Math.max(minHeight, height - top - bottom)
    };
  }
}

function clampColor(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function mixColor(start: number, end: number, ratio: number): number {
  const r1 = (start >> 16) & 255;
  const g1 = (start >> 8) & 255;
  const b1 = start & 255;
  const r2 = (end >> 16) & 255;
  const g2 = (end >> 8) & 255;
  const b2 = end & 255;
  const r = Math.round(Phaser.Math.Linear(r1, r2, ratio));
  const g = Math.round(Phaser.Math.Linear(g1, g2, ratio));
  const b = Math.round(Phaser.Math.Linear(b1, b2, ratio));
  return (r << 16) | (g << 8) | b;
}

function quadraticPoint(
  sourcePoint: { x: number; y: number },
  controlPoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, t));
  const inverse = 1 - clamped;
  return {
    x: inverse * inverse * sourcePoint.x + 2 * inverse * clamped * controlPoint.x + clamped * clamped * targetPoint.x,
    y: inverse * inverse * sourcePoint.y + 2 * inverse * clamped * controlPoint.y + clamped * clamped * targetPoint.y
  };
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
