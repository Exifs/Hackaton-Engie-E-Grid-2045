import { isLockedTooltipMeta, tooltipBodyElement, type TooltipContentContext } from "./tooltipContent";

export class TooltipController {
  private tooltipElement?: HTMLElement;
  private tooltipTrigger?: HTMLElement;
  private suppressedUntil = 0;

  constructor(
    private readonly root: HTMLElement,
    private readonly contentContext: TooltipContentContext
  ) {}

  suppress(durationMs: number): void {
    this.suppressedUntil = performance.now() + durationMs;
    this.hide();
  }

  handlePointerOver(event: PointerEvent): void {
    if (performance.now() < this.suppressedUntil) {
      return;
    }
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    this.show(trigger, event.clientX, event.clientY);
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.tooltipElement || !this.tooltipTrigger) {
      return;
    }
    this.position(event.clientX, event.clientY);
  }

  handlePointerOut(event: PointerEvent): void {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    const related = event.relatedTarget;
    if (related instanceof Node && trigger.contains(related)) {
      return;
    }
    this.hide();
  }

  handleFocus(event: FocusEvent): void {
    if (performance.now() < this.suppressedUntil) {
      return;
    }
    const trigger = (event.target as HTMLElement).closest<HTMLElement>("[data-rich-tooltip]");
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    this.show(trigger, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }

  hide(): void {
    this.tooltipElement?.classList.remove("is-visible");
    this.tooltipTrigger = undefined;
  }

  private show(trigger: HTMLElement, x: number, y: number): void {
    const title = trigger.dataset.tooltipTitle ?? "";
    const body = trigger.dataset.tooltipBody ?? "";
    const meta = trigger.dataset.tooltipMeta ?? "";
    if (!title && !body && !meta) {
      return;
    }

    const tooltip = this.ensureElement();
    const titleElement = document.createElement("strong");
    titleElement.textContent = title;
    const bodyElement = tooltipBodyElement(trigger, body, this.contentContext);
    tooltip.replaceChildren(titleElement, bodyElement);
    if (meta) {
      const metaElement = document.createElement("small");
      if (isLockedTooltipMeta(meta, trigger)) {
        metaElement.className = "is-locked";
      }
      metaElement.textContent = meta;
      tooltip.append(metaElement);
    }
    tooltip.classList.add("is-visible");
    this.tooltipTrigger = trigger;
    this.position(x, y);
  }

  private ensureElement(): HTMLElement {
    if (this.tooltipElement?.isConnected) {
      return this.tooltipElement;
    }
    const tooltip = document.createElement("div");
    tooltip.className = "rich-tooltip";
    tooltip.setAttribute("role", "tooltip");
    this.root.append(tooltip);
    this.tooltipElement = tooltip;
    return tooltip;
  }

  private position(x: number, y: number): void {
    const tooltip = this.tooltipElement;
    if (!tooltip) {
      return;
    }
    const margin = 12;
    const offset = 16;
    const rect = tooltip.getBoundingClientRect();
    let left = x + offset;
    let top = y + offset;
    if (left + rect.width > window.innerWidth - margin) {
      left = x - rect.width - offset;
    }
    if (top + rect.height > window.innerHeight - margin) {
      top = y - rect.height - offset;
    }
    tooltip.style.left = `${Math.max(margin, left)}px`;
    tooltip.style.top = `${Math.max(margin, top)}px`;
  }
}
