import { renderCoachPanel } from "../../src/onboarding/CoachPanel";
import { renderObjectiveChecklist } from "../../src/onboarding/ObjectiveChecklist";
import { renderSpotlight } from "../../src/onboarding/Spotlight";
import { TargetResolver } from "../../src/onboarding/targetResolver";
import type { OnboardingStep, OnboardingViewModel } from "../../src/onboarding/types";

describe("onboarding DOM renderers", () => {
  it("renders the coach panel, navigation buttons, objective, and accessible labels", () => {
    const html = renderCoachPanel(view(step("mission"), false));

    expect(html).toContain('role="dialog"');
    expect(html).toContain("Mission");
    expect(html).toContain("Precedent");
    expect(html).toContain("Suivant");
    expect(html).toContain("Passer");
    expect(html).toContain("Construire une universite");
    expect(html).toContain("aria-live");
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
          selector.includes("kpi.energy")
            ? ({
                getBoundingClientRect: () => rect(4, 8, 80, 20)
              } as Element)
            : null
      },
      regionPoint: (regionId) => (regionId === "fr_nord" ? { x: 50, y: 70 } : undefined)
    });

    expect(resolver.resolve("kpi.energy")).toMatchObject({ found: true });
    expect(resolver.resolve("region.fr_nord")).toMatchObject({ found: true });
    expect(resolver.resolve("missing.target")).toMatchObject({ found: false });
  });
});

function step(id: string): OnboardingStep {
  return {
    id,
    title: id === "mission" ? "Mission" : "Done",
    body: "Body",
    objective: "Construire une universite",
    checklist: ["Construire une universite"],
    isCompleted: () => false
  };
}

function view(currentStep: OnboardingStep, complete: boolean): OnboardingViewModel {
  return {
    status: "running",
    step: currentStep,
    stepIndex: 0,
    totalSteps: 10,
    currentComplete: complete
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
