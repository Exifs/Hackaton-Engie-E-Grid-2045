import { loadFixtureData } from "./testData";

describe("DataLoader", () => {
  it("parses canonical E-Grid CSV and JSON data", async () => {
    const data = await loadFixtureData();

    expect(Object.keys(data.regions).length).toBeGreaterThanOrEqual(30);
    expect(Object.keys(data.buildings)).toContain("datacenter_standard");
    expect(data.regions.fr_nord.display_name).toBe("Northern France");
    expect(data.regions.fr_nord.tags).toContain("fleuve");
    expect(data.buildings.university.produces_researchers).toBe(8);
    expect(data.region_layout.fr_nord.x).toBeGreaterThan(0);
    expect(data.constants.distance_efficiency["2"]).toBeCloseTo(0.84);
    expect(data.constants.volume_efficiency_tiers.length).toBeGreaterThan(3);
  });
});
