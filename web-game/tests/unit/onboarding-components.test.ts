import { renderCoachPanel } from "../../src/onboarding/CoachPanel";
import { renderObjectiveChecklist } from "../../src/onboarding/ObjectiveChecklist";
import { renderSpotlight } from "../../src/onboarding/Spotlight";
import { ONBOARDING_STEPS } from "../../src/onboarding/onboardingSteps";
import { TargetResolver } from "../../src/onboarding/targetResolver";
import type { OnboardingStep, OnboardingViewModel } from "../../src/onboarding/types";

describe("onboarding DOM renderers", () => {
  it("renders the coach panel, navigation buttons, objective, and accessible labels", () => {
    const html = renderCoachPanel(view(step("mission"), false));

    expect(html).toContain('role="dialog"');
    expect(html).toContain("onboarding-coach-avatar");
    expect(html).toContain("Network Operations Director");
    expect(html).toContain("Briefing");
    expect(html).toContain("Mission");
    expect(html).toContain("Previous");
    expect(html).toContain("Next");
    expect(html).toContain("Skip");
    expect(html).toContain("Build a university");
    expect(html).toContain("aria-live");
  });

  it("renders consequence mode with the consequence copy and confirm label", () => {
    const html = renderCoachPanel(view({ ...step("university"), consequence: "Le vivier augmente." }, true, "consequence"));

    expect(html).toContain("Consequence");
    expect(html).toContain("Le vivier augmente.");
    expect(html).toContain("Understood");
    expect(html).not.toContain(">Body<");
  });

  it("renders checklist completion state", () => {
    const html = renderObjectiveChecklist(step("done"), true);

    expect(html).toContain("is-complete");
    expect(html).toContain("OK");
  });

  it("renders attached and fallback spotlights", () => {
    const attached = renderSpotlight({
      found: true,
      selector: "target",
      rect: rect(10, 20, 100, 40)
    });
    const fallback = renderSpotlight({ found: false, selector: "missing" });

    expect(attached).toContain("is-attached");
    expect(attached).toContain("left:10px");
    expect(attached).toContain("width:100px");
    expect(fallback).toContain("is-fallback");
  });

  it("resolves DOM, region, and missing targets without throwing", () => {
    const resolver = new TargetResolver({
      document: {
        querySelector: (selector: string) =>
          selector.includes("kpi.resources")
            ? ({
                getBoundingClientRect: () => rect(4, 8, 80, 20)
              } as Element)
            : null,
        querySelectorAll: (selector: string) =>
          selector.includes("kpi.resources")
            ? ([{ getBoundingClientRect: () => rect(4, 8, 80, 20) }] as unknown as NodeListOf<Element>)
            : ([] as unknown as NodeListOf<Element>)
      },
      regionPoint: (regionId) => (regionId === "fr_nord" ? { x: 50, y: 70 } : undefined)
    });

    expect(resolver.resolve("kpi.resources")).toMatchObject({ found: true });
    expect(resolver.resolve("region.fr_nord")).toMatchObject({ found: true });
    expect(resolver.resolve("missing.target")).toMatchObject({ found: false });
  });

  it("uses the visible matching target when duplicate onboarding targets exist", () => {
    const hidden = { getBoundingClientRect: () => rect(0, 0, 0, 0) } as Element;
    const visible = { getBoundingClientRect: () => rect(12, 24, 120, 32) } as Element;
    const resolver = new TargetResolver({
      document: {
        querySelector: () => hidden,
        querySelectorAll: () => [hidden, visible] as unknown as NodeListOf<Element>
      }
    });

    expect(resolver.resolve("kpi.resources")).toMatchObject({
      found: true,
      rect: expect.objectContaining({ x: 4, y: 16, width: 136, height: 48 })
    });
  });

  it("points the resources onboarding step at the current resources summary", () => {
    expect(ONBOARDING_STEPS.find((step) => step.id === "resources")?.target).toBe("kpi.resources");
  });

  it("introduces energy research after the AI research center", () => {
    const researchIndex = ONBOARDING_STEPS.findIndex((step) => step.id === "research");
    const energyResearchIndex = ONBOARDING_STEPS.findIndex((step) => step.id === "energy-research");

    expect(researchIndex).toBeGreaterThan(-1);
    expect(energyResearchIndex).toBe(researchIndex + 1);
    expect(ONBOARDING_STEPS[researchIndex]?.target).toBe("build.ai_research_center");
    expect(ONBOARDING_STEPS[energyResearchIndex]?.target).toBe("build.energy_research_center");
    expect(ONBOARDING_STEPS[energyResearchIndex + 1]?.id).toBe("network-overlay");
  });
});

function step(id: string): OnboardingStep {
  return {
    id,
    title: id === "mission" ? "Mission" : "Done",
    body: "Body",
    objective: "Build a university",
    checklist: ["Build a university"],
    isCompleted: () => false
  };
}

function view(
  currentStep: OnboardingStep,
  complete: boolean,
  mode: OnboardingViewModel["mode"] = "instruction"
): OnboardingViewModel {
  return {
    status: "running",
    step: currentStep,
    stepIndex: 0,
    totalSteps: 10,
    currentComplete: complete,
    mode
  };
}

function rect(x: number, y: number, width: number, height: number): DOMRectReadOnly {
  return {
    x,
    y,
    width,
    height,
    top: y,
    right: x + width,
    bottom: y + height,
    left: x,
    toJSON: () => ({ x, y, width, height })
  };
}
