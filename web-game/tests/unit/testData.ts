import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DataLoader, SimulationCore, type GameData } from "../../src/sim";

const dataDir = fileURLToPath(new URL("../../public/data/", import.meta.url));

export async function loadFixtureData(): Promise<GameData> {
  const files: Record<string, string> = {};
  const entries = await readdir(dataDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (!entry.name.endsWith(".csv") && !entry.name.endsWith(".json")) {
      continue;
    }
    files[entry.name] = await readFile(path.join(dataDir, entry.name), "utf8");
  }
  return DataLoader.parseGameData(files);
}

export async function createCore(seed = "test"): Promise<SimulationCore> {
  const core = new SimulationCore(await loadFixtureData());
  core.newGame(seed);
  return core;
}
