import { t } from "../../i18n";
import type { BuildingDefinition, RegionSnapshot, ResearchOption } from "../../sim";
import { EFFECT_VALUE_KEYS } from "./types";

export function translatedOrFallback(key: string, fallback: string): string {
  const translated = t(key);
  return translated === key ? fallback : translated;
}

export function regionName(region: RegionSnapshot): string {
  return translatedOrFallback(`content.regions.${region.id}.name`, region.display_name);
}

export function localizedBuildingName(building: BuildingDefinition | undefined, fallbackId = ""): string {
  if (!building) {
    return fallbackId;
  }
  return translatedOrFallback(`content.buildings.${building.id}.name`, building.display_name);
}

export function localizedBuildingDescription(building: BuildingDefinition | undefined): string {
  if (!building) {
    return t("hud.construction.regionalInfrastructure");
  }
  return translatedOrFallback(`content.buildings.${building.id}.notes`, building.description);
}

export function localizedTechnologyName(technologyId: string): string {
  return translatedOrFallback(`content.technologies.${technologyId}.name`, technologyId);
}

export function localizedResearchName(option: ResearchOption): string {
  return translatedOrFallback(`content.technologies.${option.id}.name`, option.display_name);
}

export function localizedResearchNotes(option: ResearchOption): string {
  return translatedOrFallback(`content.technologies.${option.id}.notes`, option.notes);
}

export function localizedRegionTag(tag: string): string {
  return translatedOrFallback(`content.regionTags.${tag}`, tag);
}

export function localizedRegionTags(tags: string[], limit: number): string {
  return tags.slice(0, limit).map((tag) => localizedRegionTag(tag)).join(" / ");
}

export function localizedPotential(potential: string): string {
  return translatedOrFallback(`content.potentials.${potential}`, potential);
}

export function localizedEffectKey(effectKey: string): string {
  return translatedOrFallback(`content.effects.${effectKey}`, effectKey);
}

export function localizedEffectValue(effectValue: string): string {
  if (!effectValue) {
    return "";
  }
  const mappedKey = EFFECT_VALUE_KEYS[effectValue] ?? `content.effectValues.${effectValue}`;
  return translatedOrFallback(mappedKey, effectValue);
}
