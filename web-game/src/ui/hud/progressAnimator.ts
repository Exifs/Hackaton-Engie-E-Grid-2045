import { clampPctFloat, parseProgressValue } from "./format";
import type { PendingProgressAnimation, ProgressCssVar } from "./types";

export class HudProgressAnimator {
  private readonly visualProgress = new Map<string, number>();
  private pendingProgressAnimations: PendingProgressAnimation[] = [];
  private progressAnimationFrame: number | null = null;

  constructor(private readonly root: HTMLElement) {}

  resetPending(): void {
    this.pendingProgressAnimations = [];
  }

  renderValue(key: string, target: number, cssVar: ProgressCssVar): number {
    const clampedTarget = clampPctFloat(target);
    const previous = this.visualProgress.get(key);
    if (previous === undefined || previous > clampedTarget) {
      this.visualProgress.set(key, clampedTarget);
      return clampedTarget;
    }
    const start = clampPctFloat(previous);
    if (clampedTarget > start) {
      this.pendingProgressAnimations.push({ key, cssVar, target: clampedTarget });
    }
    this.visualProgress.set(key, start);
    return start;
  }

  captureFromDom(): void {
    for (const element of this.root.querySelectorAll<HTMLElement>("[data-progress-key]")) {
      const key = element.dataset.progressKey;
      if (!key) {
        continue;
      }
      const value = parseProgressValue(getComputedStyle(element).getPropertyValue(this.progressCssVar(element)));
      if (value !== undefined) {
        this.visualProgress.set(key, value);
      }
    }
  }

  applyPending(): void {
    if (this.progressAnimationFrame !== null) {
      window.cancelAnimationFrame(this.progressAnimationFrame);
      this.progressAnimationFrame = null;
    }
    const animations = this.pendingProgressAnimations;
    this.pendingProgressAnimations = [];
    if (animations.length === 0) {
      return;
    }
    this.progressAnimationFrame = window.requestAnimationFrame(() => {
      this.progressAnimationFrame = null;
      for (const animation of animations) {
        this.patchValue(animation.key, animation.target, animation.cssVar);
      }
    });
  }

  patchValue(key: string, target: number, cssVar: ProgressCssVar): void {
    const element = this.findElement(key);
    const clampedTarget = clampPctFloat(target);
    if (!element) {
      return;
    }
    element.style.setProperty(cssVar, `${clampedTarget}%`);
    element.dataset.progressTarget = String(clampedTarget);
    this.visualProgress.set(key, clampedTarget);
  }

  findElement(key: string): HTMLElement | undefined {
    return [...this.root.querySelectorAll<HTMLElement>("[data-progress-key]")]
      .find((element) => element.dataset.progressKey === key);
  }

  private progressCssVar(element: HTMLElement): ProgressCssVar {
    return element.dataset.progressVar === "--research-progress" ? "--research-progress" : "--progress";
  }
}
