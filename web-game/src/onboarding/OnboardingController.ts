import { ONBOARDING_STEPS } from "./onboardingSteps";
import { OnboardingPersistence } from "./onboardingPersistence";
import type {
  OnboardingAction,
  OnboardingEvent,
  OnboardingGameStateSnapshot,
  OnboardingStatus,
  OnboardingStep,
  OnboardingViewModel
} from "./types";

interface OnboardingRenderer {
  bind?: (callbacks: { onNext: () => void; onPrevious: () => void; onSkip: () => void }) => void;
  render: (view: OnboardingViewModel) => void;
  destroy: () => void;
  refreshTarget?: () => void;
}

interface OnboardingActions {
  selectOverlay?: (mode: OnboardingAction & { type: "selectOverlay" }) => void;
  openConstruction?: (action: OnboardingAction & { type: "openConstruction" }) => void;
  openResearch?: (action: OnboardingAction & { type: "openResearch" }) => void;
  focusRegion?: (action: OnboardingAction & { type: "focusRegion" }) => void;
}

interface OnboardingControllerOptions {
  getSnapshot: () => OnboardingGameStateSnapshot;
  renderer: OnboardingRenderer;
  persistence?: OnboardingPersistence;
  steps?: OnboardingStep[];
  actions?: OnboardingActions;
}

export class OnboardingController {
  private readonly getSnapshot: () => OnboardingGameStateSnapshot;
  private readonly renderer: OnboardingRenderer;
  private readonly persistence: OnboardingPersistence;
  private readonly steps: OnboardingStep[];
  private readonly actions: OnboardingActions;
  private status: OnboardingStatus = "idle";
  private stepIndex = 0;

  constructor(options: OnboardingControllerOptions) {
    this.getSnapshot = options.getSnapshot;
    this.renderer = options.renderer;
    this.persistence = options.persistence ?? new OnboardingPersistence();
    this.steps = options.steps ?? ONBOARDING_STEPS;
    this.actions = options.actions ?? {};
    this.renderer.bind?.({
      onNext: () => this.next(),
      onPrevious: () => this.previous(),
      onSkip: () => this.skip()
    });
  }

  getStatus(): OnboardingStatus {
    return this.status;
  }

  getCurrentStep(): OnboardingStep | undefined {
    return this.steps[this.stepIndex];
  }

  start(options: { force?: boolean } = {}): void {
    if (!options.force && this.persistence.hasFinished()) {
      this.status = "idle";
      this.renderer.destroy();
      return;
    }
    this.status = "running";
    this.stepIndex = 0;
    this.enterCurrentStep();
  }

  replay(): void {
    this.persistence.replay();
    this.start({ force: true });
  }

  reset(): void {
    this.persistence.reset();
    this.status = "idle";
    this.stepIndex = 0;
    this.renderer.destroy();
  }

  next(): void {
    if (this.status !== "running") {
      return;
    }
    if (this.stepIndex >= this.steps.length - 1) {
      this.complete();
      return;
    }
    this.stepIndex += 1;
    this.enterCurrentStep();
  }

  previous(): void {
    if (this.status !== "running" || this.stepIndex <= 0) {
      return;
    }
    this.stepIndex -= 1;
    this.enterCurrentStep({ allowAlreadyCompletedAdvance: false });
  }

  skip(): void {
    if (this.status !== "running") {
      return;
    }
    this.status = "skipped";
    this.persistence.markSkipped();
    this.renderer.destroy();
  }

  recordGameEvent(_event: OnboardingEvent): void {
    this.refresh();
  }

  refresh(): void {
    if (this.status !== "running") {
      return;
    }
    const step = this.steps[this.stepIndex];
    if (!step) {
      this.complete();
      return;
    }
    if (step.isCompleted(this.getSnapshot())) {
      this.next();
      return;
    }
    this.render();
  }

  refreshTarget(): void {
    this.renderer.refreshTarget?.();
  }

  private enterCurrentStep(options: { allowAlreadyCompletedAdvance?: boolean } = {}): void {
    const allowAlreadyCompletedAdvance = options.allowAlreadyCompletedAdvance ?? true;
    const step = this.steps[this.stepIndex];
    if (!step) {
      this.complete();
      return;
    }

    if (allowAlreadyCompletedAdvance && step.isCompleted(this.getSnapshot())) {
      this.next();
      return;
    }

    for (const action of step.enter ?? []) {
      this.runAction(action);
    }
    this.render();
  }

  private render(): void {
    const step = this.steps[this.stepIndex];
    if (!step || this.status !== "running") {
      return;
    }
    this.renderer.render({
      status: this.status,
      step,
      stepIndex: this.stepIndex,
      totalSteps: this.steps.length,
      currentComplete: step.isCompleted(this.getSnapshot())
    });
  }

  private complete(): void {
    this.status = "completed";
    this.persistence.markCompleted();
    this.renderer.destroy();
  }

  private runAction(action: OnboardingAction): void {
    if (action.type === "selectOverlay") {
      this.actions.selectOverlay?.(action);
    } else if (action.type === "openConstruction") {
      this.actions.openConstruction?.(action);
    } else if (action.type === "openResearch") {
      this.actions.openResearch?.(action);
    } else if (action.type === "focusRegion") {
      this.actions.focusRegion?.(action);
    }
  }
}
