import { renderCoachPanel } from "./CoachPanel";
import { renderSpotlight } from "./Spotlight";
import { TargetResolver } from "./targetResolver";
import type { OnboardingViewModel } from "./types";

interface OverlayCallbacks {
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
}

export class OnboardingOverlay {
  private readonly root: HTMLElement;
  private readonly targetResolver: TargetResolver;
  private callbacks?: OverlayCallbacks;
  private view?: OnboardingViewModel;
  private raf = 0;

  constructor(root: HTMLElement, targetResolver: TargetResolver) {
    this.root = root;
    this.targetResolver = targetResolver;
    this.root.addEventListener("click", (event) => this.handleClick(event));
    window.addEventListener("resize", this.scheduleTargetRefresh);
    window.addEventListener("scroll", this.scheduleTargetRefresh, true);
    window.addEventListener("keydown", this.handleKeyDown);
  }

  bind(callbacks: OverlayCallbacks): void {
    this.callbacks = callbacks;
  }

  render(view: OnboardingViewModel): void {
    this.view = view;
    const target = this.targetResolver.resolve(view.step.target);
    this.root.innerHTML = `
      <div class="onboarding-layer" data-onboarding-step="${view.step.id}">
        ${renderSpotlight(target)}
        ${renderCoachPanel(view)}
      </div>
    `;
  }

  refreshTarget(): void {
    if (!this.view) {
      return;
    }
    const target = this.targetResolver.resolve(this.view.step.target);
    const spotlight = this.root.querySelector<HTMLElement>(".onboarding-spotlight");
    if (!spotlight) {
      return;
    }
    const rect = target.rect;
    if (!rect) {
      spotlight.classList.remove("is-attached");
      spotlight.classList.add("is-fallback");
      return;
    }
    spotlight.classList.toggle("is-attached", target.found);
    spotlight.classList.toggle("is-fallback", !target.found);
    spotlight.style.left = `${rect.x}px`;
    spotlight.style.top = `${rect.y}px`;
    spotlight.style.width = `${rect.width}px`;
    spotlight.style.height = `${rect.height}px`;
  }

  destroy(): void {
    this.view = undefined;
    this.root.innerHTML = "";
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  dispose(): void {
    this.destroy();
    window.removeEventListener("resize", this.scheduleTargetRefresh);
    window.removeEventListener("scroll", this.scheduleTargetRefresh, true);
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    const action = target.closest<HTMLButtonElement>("[data-onboarding-action]")?.dataset.onboardingAction;
    if (action === "next") {
      this.callbacks?.onNext();
    } else if (action === "previous") {
      this.callbacks?.onPrevious();
    } else if (action === "skip") {
      this.callbacks?.onSkip();
    }
  }

  private readonly scheduleTargetRefresh = (): void => {
    if (this.raf) {
      return;
    }
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.refreshTarget();
    });
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.view) {
      return;
    }
    if (event.key === "Escape") {
      this.callbacks?.onSkip();
    } else if (event.key === "Enter" && !event.shiftKey) {
      this.callbacks?.onNext();
    } else if (event.key === "ArrowLeft" && event.altKey) {
      this.callbacks?.onPrevious();
    }
  };
}
