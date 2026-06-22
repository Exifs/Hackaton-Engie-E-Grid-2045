import { fallbackLng, resources, supportedLngs, createTestI18n } from "../../src/i18n";
import { loadFixtureData } from "./testData";

describe("i18n resources", () => {
  it("keeps English and French resource keys in sync", () => {
    const enKeys = flattenKeys(resources.en.translation);
    const frKeys = flattenKeys(resources.fr.translation);

    expect(frKeys).toEqual(enKeys);
  });

  it("falls back to English for unsupported languages", async () => {
    const i18n = await createTestI18n("de-DE");

    expect(fallbackLng).toBe("en");
    expect(supportedLngs).toEqual(["en", "fr"]);
    expect(i18n.t("hud.resources.energy")).toBe("Energy");
  });

  it("contains content keys for all canonical buildings technologies and regions", async () => {
    const data = await loadFixtureData();
    const en = resources.en.translation;
    const fr = resources.fr.translation;

    for (const buildingId of Object.keys(data.buildings)) {
      expect(hasPath(en, `content.buildings.${buildingId}.name`)).toBe(true);
      expect(hasPath(en, `content.buildings.${buildingId}.notes`)).toBe(true);
      expect(hasPath(fr, `content.buildings.${buildingId}.name`)).toBe(true);
      expect(hasPath(fr, `content.buildings.${buildingId}.notes`)).toBe(true);
    }

    for (const technologyId of Object.keys(data.technologies)) {
      expect(hasPath(en, `content.technologies.${technologyId}.name`)).toBe(true);
      expect(hasPath(en, `content.technologies.${technologyId}.notes`)).toBe(true);
      expect(hasPath(fr, `content.technologies.${technologyId}.name`)).toBe(true);
      expect(hasPath(fr, `content.technologies.${technologyId}.notes`)).toBe(true);
    }

    for (const eventId of Object.keys(data.events)) {
      expect(hasPath(en, `content.events.${eventId}.name`)).toBe(true);
      expect(hasPath(en, `content.events.${eventId}.alert`)).toBe(true);
      expect(hasPath(fr, `content.events.${eventId}.name`)).toBe(true);
      expect(hasPath(fr, `content.events.${eventId}.alert`)).toBe(true);
    }

    for (const tier of data.co2_tiers) {
      expect(hasPath(en, `content.co2Tiers.${tier.id}.notes`)).toBe(true);
      expect(hasPath(fr, `content.co2Tiers.${tier.id}.notes`)).toBe(true);
    }

    for (const regionId of Object.keys(data.regions)) {
      expect(hasPath(en, `content.regions.${regionId}.name`)).toBe(true);
      expect(hasPath(fr, `content.regions.${regionId}.name`)).toBe(true);
    }
  });
});

function flattenKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }

  return Object.entries(value)
    .flatMap(([key, child]) => flattenKeys(child, prefix ? `${prefix}.${key}` : key))
    .sort();
}

function hasPath(value: unknown, path: string): boolean {
  return path.split(".").every((segment) => {
    if (!value || typeof value !== "object" || !(segment in value)) {
      return false;
    }
    value = (value as Record<string, unknown>)[segment];
    return true;
  });
}
