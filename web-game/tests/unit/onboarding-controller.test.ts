import { OnboardingController } from "../../src/onboarding";
import { OnboardingPersistence } from "../../src/onboarding/onboardingPersistence";
import type { OnboardingGameStateSnapshot, OnboardingStep, OnboardingViewModel } from "../../src/onboarding/types";
import type { HeatmapMode } from "../../src/game/EGridMapScene";

describe("OnboardingController", () => {
  it("transitions start -> next -> previous -> complete", () => {
    const renderer = new FakeRenderer();
    const storage = new MemoryStorage();
    const controller = new OnboardingController({
      getSnapshot: () => snapshot(),
      renderer,
      persistence: new OnboardingPersistence(storage),
      steps: [
        step("mission", () => false),
        step("resources", () => false)
      ]
    });

    controller.start();
    expect(renderer.last?.step.id).toBe("mission");

    controller.next();
    expect(renderer.last?.step.id).toBe("resources");

    controller.previous();
    expect(renderer.last?.step.id).toBe("mission");

    controller.next();
    controller.next();
    expect(controller.getStatus()).toBe("completed");
    expect(renderer.destroyed).toBe(1);
    expect(new OnboardingPersistence(storage).load()?.status).toBe("completed");
  });

  it("persists skip and can replay from the first step", () => {
    const renderer = new FakeRenderer();
    const storage = new MemoryStorage();
    const controller = new OnboardingController({
      getSnapshot: () => snapshot(),
      renderer,
      persistence: new OnboardingPersistence(storage),
      steps: [step("mission", () => false)]
    });

    controller.start();
    controller.skip();
    expect(controller.getStatus()).toBe("skipped");
    expect(new OnboardingPersistence(storage).load()?.status).toBe("skipped");

    controller.replay();
    expect(controller.getStatus()).toBe("running");
    expect(renderer.last?.step.id).toBe("mission");
    expect(new OnboardingPersistence(storage).load()).toBeNull();
  });

  it("auto-completes steps when the required state is already true", () => {
    const renderer = new FakeRenderer();
    const controller = new OnboardingController({
      getSnapshot: () => snapshot(),
      renderer,
      persistence: new OnboardingPersistence(new MemoryStorage()),
      steps: [
        step("already-done", () => true),
        step("next", () => false)
      ]
    });

    controller.start();
    expect(renderer.last?.step.id).toBe("next");
  });

  it("runs safe enter actions without duplicating simulation logic", () => {
    let overlay: HeatmapMode = "energy";
    const renderer = new FakeRenderer();
    const controller = new OnboardingController({
      getSnapshot: () => snapshot({ currentOverlay: overlay }),
      renderer,
      persistence: new OnboardingPersistence(new MemoryStorage()),
      steps: [
        {
          ...step("cooling", (state) => state.currentOverlay === "cooling"),
          enter: [{ type: "selectOverlay", mode: "cooling" }]
        }
      ],
      actions: {
        selectOverlay: ({ mode }) => {
          overlay = mode;
        }
      }
    });

    controller.start();
    expect(overlay).toBe("cooling");
    expect(renderer.last?.currentComplete).toBe(true);
    expect(renderer.last?.step.id).toBe("cooling");
  });

  it("does not crash when players act in a different order", () => {
    let hasBuilding = false;
    const renderer = new FakeRenderer();
    const controller = new OnboardingController({
      getSnapshot: () => snapshot({ hasUniversity: hasBuilding }),
      renderer,
      persistence: new OnboardingPersistence(new MemoryStorage()),
      steps: [
        step("university", (state) =>
          Object.values(state.regions).some((region) =>
            region.buildings.includes("university") ||
            region.construction_queue.some((item) => item.building_id === "university")
          )
        ),
        step("next", () => false)
      ]
    });

    controller.start();
    controller.recordGameEvent({ type: "overlay_selected", overlay: "cooling" });
    expect(renderer.last?.step.id).toBe("university");

    hasBuilding = true;
    controller.recordGameEvent({ type: "building_queued", buildingId: "university" });
    expect(renderer.last?.step.id).toBe("next");
  });
});

function step(id: string, isCompleted: OnboardingStep["isCompleted"]): OnboardingStep {
  return {
    id,
    title: id,
    body: "Body",
    objective: "Objective",
    isCompleted
  };
}

function snapshot(options: { currentOverlay?: HeatmapMode; hasUniversity?: boolean } = {}): OnboardingGameStateSnapshot {
  return {
    currentOverlay: options.currentOverlay ?? "energy",
    summary: {
      active_research_id: "",
      research_queue: []
    } as OnboardingGameStateSnapshot["summary"],
    regions: {
      fr_nord: {
        buildings: options.hasUniversity ? ["university"] : [],
        construction_queue: []
      } as unknown as OnboardingGameStateSnapshot["regions"][string]
    }
  };
}

class FakeRenderer {
  last?: OnboardingViewModel;
  destroyed = 0;
  callbacks?: { onNext: () => void; onPrevious: () => void; onSkip: () => void };

  bind(callbacks: { onNext: () => void; onPrevious: () => void; onSkip: () => void }): void {
    this.callbacks = callbacks;
  }

  render(view: OnboardingViewModel): void {
    this.last = view;
  }

  destroy(): void {
    this.destroyed += 1;
  }
}

class MemoryStorage implements Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
