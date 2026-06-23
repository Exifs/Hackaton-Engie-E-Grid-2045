import { BuildingSystem } from "./BuildingSystem";
import { generateAlerts } from "./alerts";
import { CoolingSystem } from "./CoolingSystem";
import { EconomySystem } from "./EconomySystem";
import { EnergyNetworkSystem } from "./EnergyNetworkSystem";
import { GameState } from "./GameState";
import { clamp, cloneRecord, lerp, stableHash } from "./math";
import { RegionSystem } from "./RegionSystem";
import { buildResearchOptions } from "./researchOptions";
import { ResearchSystem } from "./ResearchSystem";
import { ScoringSystem } from "./ScoringSystem";
import type {
  BuildAvailability,
  BuildResult,
  BuildingDefinition,
  CancelResult,
  Co2Tier,
  Constants,
  DemolishResult,
  GameData,
  GameSummary,
  NetworkResult,
  ProvisionalScore,
  RegionCachedMetrics,
  RegionHistoryPoint,
  RegionMetrics,
  RegionRuntime,
  RegionSnapshot,
  ResearchOption,
  ResearchStartResult,
  TechnologyDefinition
} from "./types";

const ENERGY_RESEARCH_CENTER_ID = "energy_research_center";
const AI_RESEARCH_CENTER_ID = "ai_research_center";
const REGION_HISTORY_LIMIT = 48;

interface SimulationTotals {
  energy_produced: number;
  energy_consumed: number;
  cooling_available: number;
  cooling_used: number;
  compute_produced: number;
  compute_demand: number;
  co2_monthly: number;
  technology_points: number;
  energy_technology_points: number;
  ai_technology_points: number;
  ai_research_centers: number;
  ai_research_capacity: number;
  blackout_regions: number;
  severe_blackout_regions: number;
  network_efficiency_sum: number;
  researcher_shortage_regions: number;
}

export class SimulationCore {
  readonly state = new GameState();

  secondsPerMonth = 4.8;

  private gameData: GameData;
  private constants!: Constants;
  private regions: Record<string, RegionRuntime> = {};
  private buildingDefinitions: Record<string, BuildingDefinition> = {};
  private technologies: Record<string, TechnologyDefinition> = {};
  private co2Tiers: Co2Tier[] = [];
  private tickAccumulator = 0;
  private seed = "default";
  private previousSimulationSpeed = 1;

  private readonly regionSystem = new RegionSystem();
  private readonly buildingSystem = new BuildingSystem();
  private readonly energyNetwork = new EnergyNetworkSystem();
  private readonly coolingSystem = new CoolingSystem();
  private readonly researchSystem = new ResearchSystem();
  private readonly economySystem = new EconomySystem();
  private readonly scoringSystem = new ScoringSystem();

  constructor(gameData: GameData) {
    this.gameData = gameData;
  }

  newGame(seed = "default"): void {
    this.seed = seed;
    this.tickAccumulator = 0;
    this.previousSimulationSpeed = 1;
    this.constants = cloneRecord(this.gameData.constants);
    this.regions = this.regionSystem.cloneRegions(this.gameData.regions, this.gameData.region_layout);
    this.buildingDefinitions = cloneRecord(this.gameData.buildings);
    this.technologies = cloneRecord(this.gameData.technologies);
    this.co2Tiers = cloneRecord(this.gameData.co2_tiers);
    this.state.setup(this.constants);
    this.energyNetwork.configure(this.gameData.network_graph, this.constants.regional_distance_cap);

    const firstRegion = this.regions.fr_nord ? "fr_nord" : Object.keys(this.regions)[0] ?? "";
    this.selectRegion(firstRegion);
    this.recalculate(false);
  }

  stepSimulationTime(deltaSeconds: number): number {
    if (this.state.paused || this.state.game_result) {
      return 0;
    }

    this.tickAccumulator += deltaSeconds * Math.max(this.state.simulation_speed, 0);
    let advancedMonths = 0;
    while (this.tickAccumulator >= this.secondsPerMonth && advancedMonths < 2) {
      this.tickAccumulator -= this.secondsPerMonth;
      advancedMonths += 1;
      this.advanceMonth();
    }
    if (this.tickAccumulator >= this.secondsPerMonth) {
      this.tickAccumulator %= this.secondsPerMonth;
    }
    return advancedMonths;
  }

  setSimulationSpeed(speedMultiplier: number): void {
    const speed = clamp(speedMultiplier, 0, 4);
    if (speed > 0) {
      this.previousSimulationSpeed = speed;
    }
    this.state.simulation_speed = speed;
    this.state.paused = this.state.simulation_speed <= 0;
  }

  setPaused(paused: boolean): void {
    this.state.paused = paused;
    if (paused) {
      if (this.state.simulation_speed > 0) {
        this.previousSimulationSpeed = this.state.simulation_speed;
      }
      this.state.simulation_speed = 0;
    } else if (this.state.simulation_speed <= 0) {
      this.state.simulation_speed = this.previousSimulationSpeed;
    }
  }

  togglePaused(): void {
    this.setPaused(!this.state.paused);
  }

  isRunning(): boolean {
    return !this.state.paused && !this.state.game_result && this.state.simulation_speed > 0;
  }

  advanceMonth(): void {
    if (this.state.game_result) {
      return;
    }
    this.state.advanceMonth();
    for (const region of Object.values(this.regions)) {
      this.buildingSystem.advanceConstruction(region);
      this.buildingSystem.advanceDemolition(region);
    }
    this.recalculate(true);
    this.checkEndgame();
  }

  selectRegion(regionId: string): void {
    if (regionId && !this.regions[regionId]) {
      return;
    }
    this.state.selected_region_id = regionId;
  }

  requestBuilding(regionId: string, buildingId: string): BuildResult {
    const targetRegionId = regionId || this.state.selected_region_id;
    const region = this.regions[targetRegionId];
    const definition = this.buildingDefinitions[buildingId];
    const check = this.buildingSystem.canStartConstruction(
      region,
      definition,
      this.state.money,
      this.state.completed_technologies,
      this.buildingDefinitions
    );
    if (!check.ok) {
      return check;
    }

    this.state.money -= definition.cost;
    this.buildingSystem.startConstruction(region, definition);
    this.recalculate(false);
    return { ok: true, reason: "" };
  }

  cancelConstruction(regionId: string, queueIndex: number): CancelResult {
    const region = this.regions[regionId];
    const result = this.buildingSystem.cancelConstruction(region, queueIndex, this.constants);
    if (result.ok) {
      this.state.money += result.refund;
      this.recalculate(false);
    }
    return result;
  }

  requestDemolition(regionId: string, buildingIndex: number): DemolishResult {
    const targetRegionId = regionId || this.state.selected_region_id;
    const region = this.regions[targetRegionId];
    const check = this.buildingSystem.canStartDemolition(region, buildingIndex, this.state.money, this.buildingDefinitions);
    if (!check.ok) {
      return check;
    }

    this.state.money -= check.cost;
    this.buildingSystem.startDemolition(region, buildingIndex, this.buildingDefinitions);
    this.recalculate(false);
    return { ok: true, cost: check.cost, reason: "" };
  }

  startResearch(technologyId: string): ResearchStartResult {
    const technology = this.technologies[technologyId];
    if (!technologyId || !technology) {
      return { ok: false, reason: "Unknown research.", cause: "unknown" };
    }
    const readiness = this.researchReadiness(technology);
    if (!readiness.ok) {
      return readiness;
    }

    if (this.state.active_research_id) {
      this.state.research_queue.push(technologyId);
      return { ok: true, reason: "Queued." };
    }

    this.beginResearch(technologyId);
    return { ok: true, reason: "" };
  }

  removeQueuedResearch(queueIndex: number): ResearchStartResult {
    if (!Number.isInteger(queueIndex) || queueIndex < 0 || queueIndex >= this.state.research_queue.length) {
      return { ok: false, reason: "Unknown queued research." };
    }
    this.state.research_queue.splice(queueIndex, 1);
    return { ok: true, reason: "" };
  }

  promoteQueuedResearch(queueIndex: number): ResearchStartResult {
    if (!Number.isInteger(queueIndex) || queueIndex <= 0 || queueIndex >= this.state.research_queue.length) {
      return { ok: false, reason: "Queued research cannot move higher." };
    }
    const [technologyId] = this.state.research_queue.splice(queueIndex, 1);
    this.state.research_queue.splice(queueIndex - 1, 0, technologyId);
    return { ok: true, reason: "" };
  }

  getSummary(): GameSummary {
    return {
      ...this.state.toSummary(),
      month_progress: this.getMonthProgress()
    };
  }

  getMonthProgress(): number {
    if (this.secondsPerMonth <= 0) {
      return 0;
    }
    return clamp(this.tickAccumulator / this.secondsPerMonth, 0, 1);
  }

  getRegionSnapshot(regionId = ""): RegionSnapshot | undefined {
    const targetRegionId = regionId || this.state.selected_region_id;
    const region = this.regions[targetRegionId];
    if (!region) {
      return undefined;
    }
    return this.regionSystem.regionSnapshot(region, this.buildingDefinitions);
  }

  getRegionsSnapshot(): Record<string, RegionSnapshot> {
    const snapshots: Record<string, RegionSnapshot> = {};
    for (const [regionId, region] of Object.entries(this.regions)) {
      snapshots[regionId] = this.regionSystem.regionSnapshot(region, this.buildingDefinitions);
    }
    return snapshots;
  }

  getBuildAvailability(regionId = ""): Record<string, BuildAvailability> {
    const targetRegionId = regionId || this.state.selected_region_id;
    const region = this.regions[targetRegionId];
    const result: Record<string, BuildAvailability> = {};
    for (const [buildingId, definition] of Object.entries(this.buildingDefinitions)) {
      result[buildingId] = this.buildingSystem.canStartConstruction(
        region,
        definition,
        this.state.money,
        this.state.completed_technologies,
        this.buildingDefinitions
      );
    }
    return result;
  }

  getBuildingDefinitions(): Record<string, BuildingDefinition> {
    return cloneRecord(this.buildingDefinitions);
  }

  getRegionLayout() {
    return cloneRecord(this.gameData.region_layout);
  }

  getNetworkGraph(): Record<string, string[]> {
    return cloneRecord(this.gameData.network_graph);
  }

  getTechnologies(): Record<string, TechnologyDefinition> {
    return cloneRecord(this.technologies);
  }

  getResearchOptions(): ResearchOption[] {
    return buildResearchOptions({
      technologies: this.technologies,
      state: this.state,
      currentTechnologyPointRate: (technologyId) => this.currentTechnologyPointRate(technologyId),
      researchBuildingRequirement: (technology) => this.researchBuildingRequirement(technology)
    });
  }

  getScore(): ProvisionalScore {
    return this.scoringSystem.provisionalScore(this.state.toSummary());
  }

  private recalculate(applyMonthlyChanges: boolean): void {
    const metrics = this.buildRegionMetrics();
    const networkResult = this.energyNetwork.resolve(metrics, this.constants, this.hasSupergrid());
    this.state.network_flows = networkResult.flows;
    const totals = this.applyNetworkAndCoolingResults(metrics, networkResult);
    this.recordAllRegionHistory();
    this.applyGlobalTotals(metrics, totals);
    this.applyMonthlyResearchAndCo2(totals, applyMonthlyChanges);
    this.updateAgiRace(totals, applyMonthlyChanges);
    this.updateEconomy(applyMonthlyChanges);
    this.updateAlerts();
  }

  private applyNetworkAndCoolingResults(
    metrics: Record<string, RegionMetrics>,
    networkResult: NetworkResult
  ): SimulationTotals {
    const totals = this.emptyTotals();
    for (const [regionId, region] of Object.entries(this.regions)) {
      const regionMetrics = metrics[regionId];
      const network = networkResult.regions[regionId];
      const cooling = this.coolingSystem.resolveRegion(regionMetrics.cooling_available, regionMetrics.cooling_used);
      const energyEfficiency = network.energy_efficiency;
      const coolingEfficiency = cooling.cooling_efficiency;
      const researcherEfficiency = regionMetrics.researcher_efficiency;
      const finalEfficiency = Math.min(energyEfficiency, coolingEfficiency);
      const computeProduced = regionMetrics.compute_potential * finalEfficiency;
      const energyTechnologyPoints = regionMetrics.energy_technology_points * finalEfficiency;
      const aiTechnologyPoints = regionMetrics.ai_technology_points * finalEfficiency;
      const aiResearchCapacity = regionMetrics.ai_research_capacity * finalEfficiency;
      const technologyPoints = energyTechnologyPoints + aiTechnologyPoints;

      const cached: RegionCachedMetrics = {
        energy_production: regionMetrics.energy_production,
        energy_consumption: regionMetrics.energy_consumption,
        energy_balance_local: regionMetrics.energy_production - regionMetrics.energy_consumption,
        energy_imported: network.energy_imported,
        energy_exported: network.energy_exported,
        energy_unserved: network.energy_unserved,
        energy_efficiency: energyEfficiency,
        cooling_available: regionMetrics.cooling_available,
        cooling_used: regionMetrics.cooling_used,
        cooling_exported: Math.max(regionMetrics.cooling_available - regionMetrics.cooling_used, 0),
        cooling_efficiency: coolingEfficiency,
        cooling_state: cooling.cooling_state,
        compute_produced: computeProduced,
        compute_demand: regionMetrics.compute_demand,
        compute_exported: Math.max(computeProduced - regionMetrics.compute_demand, 0),
        researchers_required: regionMetrics.researchers_required,
        researchers_available: regionMetrics.researchers_available,
        researcher_efficiency: researcherEfficiency,
        regional_efficiency: finalEfficiency,
        blackout_state: network.blackout_state,
        network_congested: network.network_congested,
        co2_monthly: regionMetrics.co2_monthly,
        technology_points: technologyPoints,
        energy_technology_points: energyTechnologyPoints,
        ai_technology_points: aiTechnologyPoints,
        ai_research_capacity: aiResearchCapacity,
        problems: this.regionProblems(network, cooling, finalEfficiency, researcherEfficiency)
      };
      region.cached = cached;
      this.addRegionTotals(totals, regionMetrics, cached, computeProduced, technologyPoints);
    }
    return totals;
  }

  private emptyTotals(): SimulationTotals {
    return {
      energy_produced: 0,
      energy_consumed: 0,
      cooling_available: 0,
      cooling_used: 0,
      compute_produced: 0,
      compute_demand: 0,
      co2_monthly: 0,
      technology_points: 0,
      energy_technology_points: 0,
      ai_technology_points: 0,
      ai_research_centers: 0,
      ai_research_capacity: 0,
      blackout_regions: 0,
      severe_blackout_regions: 0,
      network_efficiency_sum: 0,
      researcher_shortage_regions: 0
    };
  }

  private addRegionTotals(
    totals: SimulationTotals,
    regionMetrics: RegionMetrics,
    cached: RegionCachedMetrics,
    computeProduced: number,
    technologyPoints: number
  ): void {
    totals.energy_produced += cached.energy_production ?? 0;
    totals.energy_consumed += cached.energy_consumption ?? 0;
    totals.cooling_available += cached.cooling_available ?? 0;
    totals.cooling_used += cached.cooling_used ?? 0;
    totals.compute_produced += computeProduced;
    totals.compute_demand += cached.compute_demand ?? 0;
    totals.co2_monthly += cached.co2_monthly ?? 0;
    totals.technology_points += technologyPoints;
    totals.energy_technology_points += cached.energy_technology_points ?? 0;
    totals.ai_technology_points += cached.ai_technology_points ?? 0;
    totals.ai_research_centers += regionMetrics.ai_research_centers;
    totals.ai_research_capacity += cached.ai_research_capacity ?? 0;
    totals.network_efficiency_sum += cached.energy_efficiency ?? 1;
    if (regionMetrics.researchers_required > 0.01 && regionMetrics.researcher_efficiency < 0.9) {
      totals.researcher_shortage_regions += 1;
    }
    if (cached.blackout_state !== "stable") {
      totals.blackout_regions += 1;
    }
    if (cached.blackout_state === "severe") {
      totals.severe_blackout_regions += 1;
    }
  }

  private recordAllRegionHistory(): void {
    for (const region of Object.values(this.regions)) {
      this.recordRegionHistory(region);
    }
  }

  private applyGlobalTotals(metrics: Record<string, RegionMetrics>, totals: SimulationTotals): void {
    this.state.energy_produced = totals.energy_produced;
    this.state.energy_consumed = totals.energy_consumed;
    this.state.cooling_available = totals.cooling_available;
    this.state.cooling_used = totals.cooling_used;
    this.state.compute_produced = totals.compute_produced;
    this.state.compute_used = Math.min(totals.compute_produced, totals.compute_demand);
    this.state.blackout_regions = totals.blackout_regions;
    this.state.severe_blackout_regions = totals.severe_blackout_regions;
    this.state.researchers_available = this.globalResearchersAvailable(metrics);
    this.state.researchers_required = this.globalResearchersRequired(metrics);
    this.state.researcher_shortage_regions = totals.researcher_shortage_regions;
    this.state.co2_tier = this.co2TierForValue(this.state.cumulative_co2);
  }

  private applyMonthlyResearchAndCo2(totals: SimulationTotals, applyMonthlyChanges: boolean): void {
    if (!applyMonthlyChanges) {
      return;
    }
    this.state.cumulative_co2 += totals.co2_monthly;
    this.state.co2_tier = this.co2TierForValue(this.state.cumulative_co2);
    this.advanceResearch(this.currentTechnologyPointRate(this.state.active_research_id));
  }

  private updateAgiRace(totals: SimulationTotals, applyMonthlyChanges: boolean): void {
    const networkStability =
      Object.keys(this.regions).length > 0 ? clamp(totals.network_efficiency_sum / Object.keys(this.regions).length, 0, 1) : 1;
    const aiBonus = this.researchSystem.aiEfficiencyBonus(this.state.completed_technologies, this.technologies);
    const agiGain = this.researchSystem.computeEuAgiGain(
      this.state.toSummary(),
      this.constants,
      totals.ai_research_capacity,
      networkStability,
      aiBonus
    );
    if (applyMonthlyChanges) {
      this.state.eu_agi_progress = clamp(this.state.eu_agi_progress + agiGain, 0, 100);
    }
    this.state.usa_agi_progress = this.researchSystem.computeUsaProgress(this.state.year, this.state.month);
  }

  private updateEconomy(applyMonthlyChanges: boolean): void {
    this.state.monthly_income = this.economySystem.calculateMonthlyIncome(
      this.state.toSummary(),
      this.constants,
      this.state.completed_technologies
    );
    if (applyMonthlyChanges) {
      this.state.money += this.state.monthly_income;
    }
  }

  private updateAlerts(): void {
    this.state.alerts = generateAlerts({
      regions: this.regions,
      state: this.state,
      buildingDefinitions: this.buildingDefinitions,
      slotsFree: (region, buildings) => this.regionSystem.slotsFree(region, buildings)
    });
  }

  private buildRegionMetrics(): Record<string, RegionMetrics> {
    const metrics: Record<string, RegionMetrics> = {};

    for (const [regionId, region] of Object.entries(this.regions)) {
      const regionMetrics = this.baseRegionMetrics(region);
      for (const buildingId of region.buildings) {
        const definition = this.buildingDefinitions[buildingId];
        if (!definition) {
          continue;
        }
        regionMetrics.researchers_available += this.researchersFromBuilding(definition, region);
        regionMetrics.researchers_required += definition.researchers_required;
      }

      metrics[regionId] = regionMetrics;
    }

    for (const [regionId, region] of Object.entries(this.regions)) {
      const regionMetrics = metrics[regionId];
      const researcherEfficiency = regionMetrics.researchers_required > 0.01
        ? clamp(regionMetrics.researchers_available / regionMetrics.researchers_required, 0, 1)
        : 1;
      regionMetrics.researcher_efficiency = researcherEfficiency;
      for (const buildingId of region.buildings) {
        const definition = this.buildingDefinitions[buildingId];
        if (!definition) {
          continue;
        }
        this.applyActiveBuilding(regionId, region, definition, regionMetrics, researcherEfficiency);
      }
    }
    return metrics;
  }

  private baseRegionMetrics(region: RegionRuntime): RegionMetrics {
    return {
      energy_production: region.starting_energy_generation,
      energy_consumption: region.base_energy_demand,
      cooling_available: region.starting_cooling_capacity,
      cooling_used: 0,
      compute_potential: region.starting_compute,
      compute_demand: 0,
      researchers_available: region.starting_researchers,
      researchers_required: 0,
      researcher_efficiency: 1,
      co2_monthly: region.starting_co2_pressure_per_month,
      technology_points: 0,
      energy_technology_points: 0,
      ai_technology_points: 0,
      ai_research_centers: 0,
      ai_research_capacity: 0
    };
  }

  private applyActiveBuilding(
    regionId: string,
    region: RegionRuntime,
    definition: BuildingDefinition,
    metrics: RegionMetrics,
    researcherEfficiency: number
  ): void {
    const requiresResearchers = definition.researchers_required > 0.01;
    const laborEfficiency = requiresResearchers ? researcherEfficiency : 1;
    const outputScale = laborEfficiency * this.potentialScale(definition, region) * this.variationMultiplier(regionId, definition);

    metrics.energy_production += definition.produces_energy * outputScale;
    metrics.cooling_available += definition.produces_cooling * outputScale;
    metrics.compute_potential += definition.produces_compute * outputScale;
    metrics.cooling_used += definition.consumes_cooling;
    metrics.energy_consumption += definition.consumes_energy;
    metrics.compute_demand += definition.consumes_compute;
    metrics.co2_monthly += definition.co2_monthly * outputScale;

    if (definition.id === AI_RESEARCH_CENTER_ID) {
      metrics.ai_research_centers += 1;
      metrics.ai_research_capacity += outputScale;
      metrics.ai_technology_points += 18 * outputScale;
    } else if (definition.id === ENERGY_RESEARCH_CENTER_ID) {
      metrics.energy_technology_points += 18 * outputScale;
    }
    metrics.technology_points = metrics.energy_technology_points + metrics.ai_technology_points;
  }

  private researchersFromBuilding(definition: BuildingDefinition, region: RegionRuntime): number {
    if (definition.produces_researchers <= 0) {
      return 0;
    }
    return definition.produces_researchers * this.potentialScale(definition, region);
  }

  private potentialScale(definition: BuildingDefinition, region: RegionRuntime): number {
    if (!definition.scaling_potential) {
      return 1;
    }
    const potential = this.regionSystem.potential(region, definition.scaling_potential);
    return clamp(0.7 + 0.1 * potential, 0.65, 1.35);
  }

  private variationMultiplier(regionId: string, definition: BuildingDefinition): number {
    const profile = definition.variation_profile;
    if (!profile) {
      return 1;
    }
    let minValue = 0.8;
    let maxValue = 1.2;
    if (profile === "wind_offshore") {
      minValue = 0.85;
      maxValue = 1.25;
    } else if (profile === "solar") {
      minValue = 0.7;
      maxValue = 1.3;
    } else if (profile === "hydro") {
      minValue = 0.9;
      maxValue = 1.1;
    }

    const phase = ((stableHash(`${this.seed}:${regionId}:${profile}`) % 1000) / 1000) * Math.PI * 2;
    const wave = (Math.sin((this.state.month_index / 18) * Math.PI * 2 + phase) + 1) * 0.5;
    const noise = ((stableHash(`${this.seed}:${regionId}:${profile}:${this.state.month_index}`) % 100) / 100 - 0.5) * 0.04;
    return clamp(lerp(minValue, maxValue, wave) + noise, minValue, maxValue);
  }

  private advanceResearch(technologyPoints: number): void {
    if (!this.state.active_research_id) {
      this.autoStartNextResearch();
      return;
    }
    if (technologyPoints <= 0.01) {
      return;
    }

    const technology = this.technologies[this.state.active_research_id];
    if (!technology) {
      this.state.active_research_id = "";
      this.state.active_research_points = 0;
      this.autoStartNextResearch();
      return;
    }
    this.state.active_research_points += technologyPoints;
    if (this.state.active_research_points >= technology.cost) {
      this.state.completed_technologies[technology.id] = true;
      this.state.active_research_id = "";
      this.state.active_research_points = 0;
      this.autoStartNextResearch();
    }
  }

  private beginResearch(technologyId: string): void {
    this.state.active_research_id = technologyId;
    this.state.active_research_points = 0;
  }

  private autoStartNextResearch(): void {
    if (this.state.active_research_id) {
      return;
    }

    for (let index = 0; index < this.state.research_queue.length; index += 1) {
      const technologyId = this.state.research_queue[index];
      const technology = this.technologies[technologyId];
      if (!technology || this.state.completed_technologies[technologyId]) {
        this.state.research_queue.splice(index, 1);
        index -= 1;
        continue;
      }
      const readiness = this.researchReadiness(technology, { ignoreQueued: true });
      if (!readiness.ok) {
        continue;
      }
      this.state.research_queue.splice(index, 1);
      this.beginResearch(technologyId);
      return;
    }
  }

  private researchReadiness(
    technology: TechnologyDefinition,
    options: { ignoreQueued?: boolean } = {}
  ): ResearchStartResult {
    if (this.state.completed_technologies[technology.id]) {
      return { ok: false, reason: "Research already completed.", cause: "completed" };
    }
    if (this.state.active_research_id === technology.id) {
      return { ok: false, reason: "Research already active.", cause: "active" };
    }
    if (!options.ignoreQueued && this.state.research_queue.includes(technology.id)) {
      return { ok: false, reason: "Research already queued.", cause: "queued" };
    }
    const missingPrereq = technology.prereq_technology_ids.find((prereq) => !this.state.completed_technologies[prereq]);
    if (missingPrereq) {
      return {
        ok: false,
        reason: `Requires ${this.technologies[missingPrereq]?.display_name ?? missingPrereq}.`,
        cause: "prerequisite"
      };
    }
    const buildingRequirement = this.researchBuildingRequirement(technology);
    if (!buildingRequirement.ok) {
      return buildingRequirement;
    }
    return { ok: true, reason: "" };
  }

  private researchBuildingRequirement(technology: TechnologyDefinition): ResearchStartResult {
    const branch = technology.branch.toLowerCase();
    if (branch === "ai") {
      return this.hasActiveBuilding(AI_RESEARCH_CENTER_ID)
        ? { ok: true, reason: "" }
        : { ok: false, reason: "Requires an active AI Research Center.", cause: "building" };
    }
    if (branch === "energy" || branch === "infrastructure") {
      return this.hasActiveBuilding(ENERGY_RESEARCH_CENTER_ID)
        ? { ok: true, reason: "" }
        : { ok: false, reason: "Requires an active Energy Research Center.", cause: "building" };
    }
    if (this.hasActiveBuilding(ENERGY_RESEARCH_CENTER_ID) || this.hasActiveBuilding(AI_RESEARCH_CENTER_ID)) {
      return { ok: true, reason: "" };
    }
    return { ok: false, reason: "Requires an active Energy Research Center or AI Research Center.", cause: "building" };
  }

  private hasActiveBuilding(buildingId: string): boolean {
    return Object.values(this.regions).some((region) => region.buildings.includes(buildingId));
  }

  private regionProblems(
    network: { blackout_state: string; energy_efficiency: number; network_congested: boolean },
    cooling: { cooling_efficiency: number },
    finalEfficiency: number,
    researcherEfficiency: number
  ): string[] {
    const problems: string[] = [];
    if (network.blackout_state !== "stable") {
      problems.push("blackout");
    }
    if (network.energy_efficiency < 0.94) {
      problems.push("energy");
    }
    if (cooling.cooling_efficiency < 0.92) {
      problems.push("cooling");
    }
    if (finalEfficiency < 0.9) {
      problems.push("efficiency");
    }
    if (researcherEfficiency < 0.9) {
      problems.push("researchers");
    }
    if (network.network_congested) {
      problems.push("network");
    }
    return problems;
  }

  private co2TierForValue(value: number): string {
    for (const tier of this.co2Tiers) {
      if (value >= tier.min && value <= tier.max) {
        return tier.id;
      }
    }
    return "critical";
  }

  private checkEndgame(): void {
    if (this.state.game_result) {
      return;
    }
    if (this.state.eu_agi_progress >= 100 && this.state.eu_agi_progress >= this.state.usa_agi_progress) {
      this.state.game_result = "victory";
    } else if (this.state.usa_agi_progress >= 100 && this.state.usa_agi_progress > this.state.eu_agi_progress) {
      this.state.game_result = "defeat";
    }
  }

  private globalResearchersAvailable(metrics: Record<string, RegionMetrics>): number {
    return Object.values(metrics).reduce((total, region) => total + region.researchers_available, 0);
  }

  private globalResearchersRequired(metrics: Record<string, RegionMetrics>): number {
    return Object.values(metrics).reduce((total, region) => total + region.researchers_required, 0);
  }

  private hasSupergrid(): boolean {
    return Boolean(this.state.completed_technologies.supergrid || this.state.completed_technologies.supergrid_european);
  }

  private currentTechnologyPointRate(technologyId = ""): number {
    const branch = technologyId ? this.technologies[technologyId]?.branch.toLowerCase() ?? "" : "";
    return Object.values(this.regions).reduce((total, region) => {
      const energyPoints = region.cached.energy_technology_points ?? 0;
      const aiPoints = region.cached.ai_technology_points ?? 0;
      if (branch === "ai") {
        return total + aiPoints;
      }
      if (branch === "energy" || branch === "infrastructure") {
        return total + energyPoints;
      }
      return total + energyPoints + aiPoints;
    }, 0);
  }

  private recordRegionHistory(region: RegionRuntime): void {
    const cached = region.cached;
    const energySupply = cached.energy_production ?? 0;
    const energyDemand = cached.energy_consumption ?? 0;
    const coolingSupply = cached.cooling_available ?? 0;
    const coolingDemand = cached.cooling_used ?? 0;
    const computeSupply = cached.compute_produced ?? 0;
    const computeDemand = cached.compute_demand ?? 0;
    const point: RegionHistoryPoint = {
      month_index: this.state.month_index,
      year: this.state.year,
      month: this.state.month,
      energy: {
        supply: energySupply,
        demand: energyDemand,
        imported: cached.energy_imported ?? 0,
        exported: cached.energy_exported ?? 0
      },
      cooling: {
        supply: coolingSupply,
        demand: coolingDemand,
        imported: Math.max(coolingDemand - coolingSupply, 0),
        exported: cached.cooling_exported ?? Math.max(coolingSupply - coolingDemand, 0)
      },
      compute: {
        supply: computeSupply,
        demand: computeDemand,
        imported: Math.max(computeDemand - computeSupply, 0),
        exported: cached.compute_exported ?? Math.max(computeSupply - computeDemand, 0)
      }
    };
    const currentIndex = region.history.findIndex((entry) => entry.month_index === point.month_index);
    if (currentIndex >= 0) {
      region.history[currentIndex] = point;
    } else {
      region.history.push(point);
    }
    if (region.history.length > REGION_HISTORY_LIMIT) {
      region.history.splice(0, region.history.length - REGION_HISTORY_LIMIT);
    }
  }
}
