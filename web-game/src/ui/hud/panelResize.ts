import type { ResizeTarget } from "./types";

export const PANEL_STORAGE_KEYS = {
  dockHeight: "egrid:dock-height",
  rightPanelWidth: "egrid:right-panel-width"
};

export const DEFAULT_DOCK_HEIGHT = 320;
export const DEFAULT_RIGHT_PANEL_WIDTH = 336;
export const DOCK_COLLAPSED_HEIGHT = 56;
export const MIN_DOCK_HEIGHT = 190;
export const MIN_RIGHT_PANEL_WIDTH = 280;

export function applyPanelSizing(
  root: HTMLElement,
  paletteOpen: boolean,
  dockHeightValue: number,
  rightPanelWidthValue: number
): void {
  const dockHeight = `${dockHeightValue}px`;
  const dockCurrentHeight = `${paletteOpen ? dockHeightValue : DOCK_COLLAPSED_HEIGHT}px`;
  const rightPanelWidth = `${rightPanelWidthValue}px`;
  root.style.setProperty("--dock-height", dockHeight);
  root.style.setProperty("--dock-current-height", dockCurrentHeight);
  root.style.setProperty("--right-panel-width", rightPanelWidth);
  root.parentElement?.style.setProperty("--dock-height", dockHeight);
  root.parentElement?.style.setProperty("--dock-current-height", dockCurrentHeight);
  root.parentElement?.style.setProperty("--right-panel-width", rightPanelWidth);
}

export function clampDockHeight(value: number): number {
  const max = Math.max(MIN_DOCK_HEIGHT, Math.min(560, window.innerHeight - 120));
  return Math.round(Math.max(MIN_DOCK_HEIGHT, Math.min(max, value)));
}

export function clampRightPanelWidth(value: number): number {
  const max = Math.max(MIN_RIGHT_PANEL_WIDTH, Math.min(520, window.innerWidth - 48));
  return Math.round(Math.max(MIN_RIGHT_PANEL_WIDTH, Math.min(max, value)));
}

export function loadStoredNumber(key: string, fallback: number): number {
  const value = Number(window.localStorage.getItem(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function storeNumber(key: string, value: number): void {
  window.localStorage.setItem(key, String(Math.round(value)));
}

export class HudPanelResizeController {
  private dockHeight = clampDockHeight(loadStoredNumber(PANEL_STORAGE_KEYS.dockHeight, DEFAULT_DOCK_HEIGHT));
  private rightPanelWidth = clampRightPanelWidth(
    loadStoredNumber(PANEL_STORAGE_KEYS.rightPanelWidth, DEFAULT_RIGHT_PANEL_WIDTH)
  );
  private resizeDrag:
    | {
        target: ResizeTarget;
        startX: number;
        startY: number;
        startDockHeight: number;
        startRightPanelWidth: number;
      }
    | null = null;

  constructor(
    private readonly root: HTMLElement,
    private readonly paletteOpen: () => boolean,
    private readonly render: () => void
  ) {}

  apply(): void {
    applyPanelSizing(this.root, this.paletteOpen(), this.dockHeight, this.rightPanelWidth);
  }

  start(event: PointerEvent): boolean {
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>("[data-resize-panel]");
    const resizeTarget = handle?.dataset.resizePanel as ResizeTarget | undefined;
    if (!handle || (resizeTarget !== "dock" && resizeTarget !== "region")) {
      return false;
    }
    event.preventDefault();
    this.resizeDrag = {
      target: resizeTarget,
      startX: event.clientX,
      startY: event.clientY,
      startDockHeight: this.dockHeight,
      startRightPanelWidth: this.rightPanelWidth
    };
    document.addEventListener("pointermove", this.handleMove);
    document.addEventListener("pointerup", this.handleEnd, { once: true });
    return true;
  }

  reset(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    const handle = target.closest<HTMLElement>("[data-resize-panel]");
    const resizeTarget = handle?.dataset.resizePanel as ResizeTarget | undefined;
    if (resizeTarget === "dock") {
      this.dockHeight = clampDockHeight(DEFAULT_DOCK_HEIGHT);
      storeNumber(PANEL_STORAGE_KEYS.dockHeight, this.dockHeight);
      this.render();
      return true;
    }
    if (resizeTarget === "region") {
      this.rightPanelWidth = clampRightPanelWidth(DEFAULT_RIGHT_PANEL_WIDTH);
      storeNumber(PANEL_STORAGE_KEYS.rightPanelWidth, this.rightPanelWidth);
      this.render();
      return true;
    }
    return false;
  }

  handleViewportResize(): void {
    this.dockHeight = clampDockHeight(this.dockHeight);
    this.rightPanelWidth = clampRightPanelWidth(this.rightPanelWidth);
    this.apply();
  }

  private readonly handleMove = (event: PointerEvent): void => {
    if (!this.resizeDrag) {
      return;
    }
    if (this.resizeDrag.target === "dock") {
      this.dockHeight = clampDockHeight(this.resizeDrag.startDockHeight + this.resizeDrag.startY - event.clientY);
    } else {
      this.rightPanelWidth = clampRightPanelWidth(
        this.resizeDrag.startRightPanelWidth + this.resizeDrag.startX - event.clientX
      );
    }
    this.apply();
  };

  private readonly handleEnd = (): void => {
    if (!this.resizeDrag) {
      return;
    }
    storeNumber(PANEL_STORAGE_KEYS.dockHeight, this.dockHeight);
    storeNumber(PANEL_STORAGE_KEYS.rightPanelWidth, this.rightPanelWidth);
    this.resizeDrag = null;
    document.removeEventListener("pointermove", this.handleMove);
  };
}
