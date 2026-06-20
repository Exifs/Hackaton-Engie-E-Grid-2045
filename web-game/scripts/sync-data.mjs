import { copyFile, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..");

const sourceData = path.join(repoRoot, "e-grid-2045", "data");
const publicData = path.join(webRoot, "public", "data");
const publicAssets = path.join(webRoot, "public", "assets");

async function copyDirectory(src, dest, predicate = () => true) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, predicate);
      continue;
    }
    if (entry.isFile() && predicate(srcPath)) {
      await mkdir(path.dirname(destPath), { recursive: true });
      await copyFile(srcPath, destPath);
    }
  }
}

async function copyIfExists(src, dest) {
  try {
    await stat(src);
  } catch {
    return false;
  }
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  return true;
}

await rm(publicData, { recursive: true, force: true });
await mkdir(publicData, { recursive: true });
await copyDirectory(sourceData, publicData, (src) => [".csv", ".json"].includes(path.extname(src)));

await mkdir(path.join(publicAssets, "map", "generated"), { recursive: true });
await copyIfExists(
  path.join(repoRoot, "e-grid-2045", "assets", "map", "europe_map_backdrop_generated_clean_v1.png"),
  path.join(publicAssets, "map", "europe_map_backdrop_generated_clean_v1.png")
);
await copyIfExists(
  path.join(repoRoot, "e-grid-2045", "assets", "map", "generated", "regions_contours.json"),
  path.join(publicAssets, "map", "generated", "regions_contours.json")
);

const uiIconSource = path.join(
  repoRoot,
  "Docs",
  "UI components",
  "egrid_2045_ui_component_pack_concept_v3",
  "sprites",
  "utility_icons_48px"
);
await copyDirectory(uiIconSource, path.join(publicAssets, "ui", "utility_icons_48px"), (src) => path.extname(src) === ".png");

const generatedManifestPath = path.join(publicAssets, "generated", "manifest.json");
try {
  await stat(generatedManifestPath);
} catch {
  await mkdir(path.dirname(generatedManifestPath), { recursive: true });
  await writeFile(
    generatedManifestPath,
    `${JSON.stringify(
      {
        generated_at: new Date().toISOString().slice(0, 10),
        source: "ImageGen assets will be registered here as they are finalized.",
        assets: []
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

console.log(`Synced E-Grid data to ${path.relative(repoRoot, publicData)}`);
