import { describe, expect, it } from "vitest";
import { cssUrlForPageAsset } from "../../src/ui/assetUrls";

describe("cssUrlForPageAsset", () => {
  it("resolves public assets from the current page, not the bundled CSS file", () => {
    const cssUrl = cssUrlForPageAsset(
      "assets/generated/building-card-art-atlas.png",
      "https://exifs.github.io/Hackaton-Engie-E-Grid-2045/play-js/?testMode=1"
    );

    expect(cssUrl).toBe(
      'url("https://exifs.github.io/Hackaton-Engie-E-Grid-2045/play-js/assets/generated/building-card-art-atlas.png")'
    );
    expect(cssUrl).not.toContain("/assets/assets/");
  });

  it("keeps root dev-server assets rooted at the page URL", () => {
    expect(cssUrlForPageAsset("assets/generated/building-icon-atlas.png", "http://127.0.0.1:5173/")).toBe(
      'url("http://127.0.0.1:5173/assets/generated/building-icon-atlas.png")'
    );
  });
});
