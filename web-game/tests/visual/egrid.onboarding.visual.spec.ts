import { expect, test } from "@playwright/test";
import { expectConsequence, expectOnboardingStep, openGameWithOnboarding } from "./egrid.helpers";

test.describe("E-Grid 2045 onboarding and locale visuals", () => {
  test("browser locale can switch visible HUD labels between English and French", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/?testMode=1&seed=i18n&onboarding=0&lng=en");
    await page.waitForFunction(() => Boolean(window.__EGRID__));
    await expect(page.locator(".resource-summary")).toContainText("Energy");
    await expect(page.locator('[data-heatmap="cooling"]')).toHaveAttribute("aria-label", "Cooling");

    await page.goto("/?testMode=1&seed=i18n&onboarding=0&lng=fr");
    await page.waitForFunction(() => Boolean(window.__EGRID__));
    await expect(page.locator(".resource-summary")).toContainText("Energie");
    await expect(page.locator('[data-heatmap="cooling"]')).toHaveAttribute("aria-label", "Froid");
  });

  test("onboarding guides the first gameplay loop and persists completion", async ({ page }, testInfo) => {
    await openGameWithOnboarding(page, 1600, 900);
    const avatarResponse = await page.request.get("/assets/onboarding/operations-director.png");
    expect(avatarResponse.ok()).toBe(true);
    await expectOnboardingStep(page, "mission", "kpi.agi");
    await expect(page.locator(".onboarding-coach")).toContainText("Mission");
    await expect(page.locator(".onboarding-coach-avatar")).toBeVisible();

    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "resources", "kpi.resources");
    await expect(page.locator(".onboarding-coach")).toContainText("Ressources cles");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "university", "build.university");
    await expect(page.locator(".onboarding-coach")).toContainText("Universite");

    await page.locator('[data-build="university"]').click();
    await expectConsequence(page, "university", "vivier de chercheurs");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "cooling-overlay", "overlay.cooling");
    await expect(page.locator(".onboarding-coach")).toContainText("Overlay refroidissement");
    await page.locator('[data-heatmap="cooling"]').click();
    await expectConsequence(page, "cooling-overlay", "centres de donnees");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "starter-energy", "build.gas_power_plant");
    await expect(page.locator(".onboarding-coach")).toContainText("Energie de depart");

    await page.locator('[data-build="gas_power_plant"]').click();
    await expectConsequence(page, "starter-energy", "marge electrique");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "cooling-build", "build.air_cooling");
    await expect(page.locator(".onboarding-coach")).toContainText("Refroidissement");
    await page.locator('[data-build="air_cooling"]').click();
    await expectConsequence(page, "cooling-build", "froid disponible augmente");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "datacenter", "build.datacenter_standard");
    await expect(page.locator(".onboarding-coach")).toContainText("Centre de donnees");

    await page.locator('[data-build="datacenter_standard"]').click();
    await expectConsequence(page, "datacenter", "Le calcul augmente");
    await page.locator('[data-onboarding-action="next"]').click();
    await expectOnboardingStep(page, "research", "build.ai_research_center");
    await expect(page.locator(".onboarding-coach")).toContainText("Centre recherche IA");
    await page.locator('[data-build="ai_research_center"]').click();
    await expectConsequence(page, "research", "La trajectoire AGI");
    await page.locator('[data-onboarding-action="next"]').click();
    const hasNetworkOverlayStep = await page.locator('.onboarding-layer[data-onboarding-step="network-overlay"]').count();
    if (hasNetworkOverlayStep > 0) {
      await expectOnboardingStep(page, "network-overlay", "overlay.network");
      await expect(page.locator(".onboarding-coach")).toContainText("Overlay reseau");

      await page.locator('[data-heatmap="network"]').click();
      await expectConsequence(page, "network-overlay", "dependances aux imports");
      await page.locator('[data-onboarding-action="next"]').click();
    }
    const onboardCoach = page.locator(".onboarding-coach");
    for (let attempt = 0; attempt < 8; attempt++) {
      if ((await onboardCoach.count()) === 0) {
        break;
      }
      const nextButton = page.locator('[data-onboarding-action="next"]');
      if ((await nextButton.count()) === 0) {
        break;
      }
      await nextButton.click();
      await page.waitForTimeout(120);
    }
    await expect(onboardCoach).toHaveCount(0);

    const persisted = await page.evaluate(() => localStorage.getItem("egrid:onboarding:v1:completed"));
    expect(persisted).toContain("completed");

    await page.reload();
    await page.waitForFunction(() => Boolean(window.__EGRID__));
    await expect(page.locator(".onboarding-coach")).toHaveCount(0);

    await page.locator('[data-action="replay-onboarding"]').click();
    await expect(page.locator(".onboarding-coach")).toContainText("Mission");
    await page.screenshot({ path: testInfo.outputPath("onboarding-replay-visible.png"), fullPage: true });
  });
});
