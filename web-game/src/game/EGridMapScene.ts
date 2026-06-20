import Phaser from "phaser";
import type { GameSummary, RegionLayout, RegionSnapshot, SimulationCore } from "../sim";

export type HeatmapMode = "none" | "energy" | "cooling" | "compute" | "co2";

interface SceneConfig {
  simulation: SimulationCore;
  testMode: boolean;
  onRegionSelected: (regionId: string) => void;
  onSimulationAdvanced: () => void;
}

interface MapRect {
  x: number;
  y: number;
  width: number;
  height: number;
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

export class EGridMapScene extends Phaser.Scene {
  private simulation: SimulationCore;
  private readonly testMode: boolean;
  private readonly onRegionSelected: (regionId: string) => void;
  private readonly onSimulationAdvanced: () => void;

  private heatmapMode: HeatmapMode = "energy";
  private mapImage?: Phaser.GameObjects.Image;
  private flowLayer?: Phaser.GameObjects.Graphics;
  private regionLayer?: Phaser.GameObjects.Graphics;
  private slotLayer?: Phaser.GameObjects.Graphics;
  private labelLayer?: Phaser.GameObjects.Container;
  private animationTime = 0;
  private dirty = true;

  constructor(config: SceneConfig) {
    super("EGridMapScene");
    this.simulation = config.simulation;
    this.testMode = config.testMode;
    this.onRegionSelected = config.onRegionSelected;
    this.onSimulationAdvanced = config.onSimulationAdvanced;
  }

  preload(): void {
    this.load.image(
      "map-backdrop",
      `${import.meta.env.BASE_URL}assets/map/europe_map_backdrop_generated_clean_v1.png`
    );
  }

  create(): void {
    this.mapImage = this.add.image(0, 0, "map-backdrop").setOrigin(0, 0).setAlpha(0.94);
    this.flowLayer = this.add.graphics();
    this.regionLayer = this.add.graphics();
    this.slotLayer = this.add.graphics();
    this.labelLayer = this.add.container(0, 0);

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => this.handlePointer(pointer));
    this.scale.on("resize", () => {
      this.dirty = true;
      this.renderState();
    });

    this.renderState();
  }

  update(_time: number, delta: number): void {
    if (!this.testMode) {
      this.animationTime += delta / 1000;
      const advanced = this.simulation.stepSimulationTime(delta / 1000);
      if (advanced > 0) {
        this.onSimulationAdvanced();
        this.dirty = true;
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

  renderState(): void {
    if (!this.flowLayer || !this.regionLayer || !this.slotLayer || !this.labelLayer || !this.mapImage) {
      return;
    }

    const rect = this.mapRect();
    this.mapImage.setPosition(rect.x, rect.y).setDisplaySize(rect.width, rect.height);
    this.drawBackdropVignette(rect);
    this.drawFlows(rect);
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
    this.slotLayer?.setDepth(4);
    this.labelLayer?.setDepth(5);
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
    const maxCompute = Math.max(...Object.values(regions).map((region) => region.cached.compute_produced ?? 0), 1);

    for (const [regionId, region] of Object.entries(regions)) {
      const layout = region.layout as RegionLayout;
      if (!layout || layout.x === undefined || layout.y === undefined) {
        continue;
      }
      const point = this.regionPoint(rect, layout);
      const radius = Math.max(9, layout.hitbox_radius * Math.min(rect.width, rect.height) * 0.46);
      const color = this.regionColor(region, summary, maxCompute);
      const isSelected = regionId === selectedId;
      const alert = summary.alerts.find((item) => item.region_id === regionId);
      const pulse = this.testMode ? 0.6 : (Math.sin(this.animationTime * 3.6 + point.x * 0.01) + 1) * 0.5;

      if (alert) {
        const alertColor = alert.state === "critical" ? HEATMAP_COLORS.critical : HEATMAP_COLORS.warning;
        graphics.lineStyle(2.5, alertColor, 0.35 + pulse * 0.34);
        graphics.strokeCircle(point.x, point.y, radius * (1.8 + pulse * 0.25));
      }

      const haloAlpha = isSelected ? 0.52 : 0.18;
      graphics.fillStyle(color, haloAlpha);
      graphics.fillCircle(point.x, point.y, radius * (isSelected ? 1.72 : 1.36));
      graphics.lineStyle(isSelected ? 3 : 1.2, isSelected ? 0xf5fbff : color, isSelected ? 0.9 : 0.52);
      graphics.fillStyle(color, isSelected ? 0.78 : 0.58);
      graphics.fillCircle(point.x, point.y, radius);
      graphics.strokeCircle(point.x, point.y, radius);
      graphics.fillStyle(0xf7fbff, isSelected ? 0.95 : 0.55);
      graphics.fillCircle(point.x, point.y, Math.max(2.5, radius * 0.22));

      if (isSelected || (region.cached.problems?.length ?? 0) > 0) {
        const text = this.add
          .text(point.x, point.y - radius - 20, region.display_name, {
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            fontSize: isSelected ? "13px" : "10px",
            color: "#eaf8ff",
            stroke: "#06131d",
            strokeThickness: 4
          })
          .setOrigin(0.5, 0.5);
        labels.add(text);
      }
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
    const width = this.scale.width;
    const height = this.scale.height;
    const texture = this.textures.get("map-backdrop").getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const imageRatio = texture.width / texture.height || 16 / 9;
    const availableWidth = width;
    const availableHeight = height;
    const scale = Math.min(availableWidth / texture.width, availableHeight / texture.height);
    const mapWidth = texture.width * scale;
    const mapHeight = texture.height * scale;
    if (mapWidth / mapHeight > imageRatio + 0.001) {
      return { x: 0, y: 0, width: availableWidth, height: availableWidth / imageRatio };
    }
    return {
      x: (availableWidth - mapWidth) / 2,
      y: (availableHeight - mapHeight) / 2,
      width: mapWidth,
      height: mapHeight
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
