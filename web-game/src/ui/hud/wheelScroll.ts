export function handleHudWheel(root: HTMLElement, event: WheelEvent): void {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target || !root.contains(target)) {
    return;
  }

  const nativeScroller = closestScrollable(root, target);
  if (nativeScroller && canConsumeWheel(nativeScroller, event)) {
    return;
  }

  const fallbackScroller = fallbackWheelScroller(target);
  if (fallbackScroller) {
    const didScrollY = scrollElement(fallbackScroller, event.deltaY, "y");
    const didScrollX = scrollElement(fallbackScroller, event.deltaX, "x");
    if (didScrollY || didScrollX) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
  }

  const horizontalScroller = target.closest<HTMLElement>(".build-category-tabs, .build-grid");
  const horizontalDelta = event.deltaX || (event.shiftKey ? event.deltaY : 0);
  if (horizontalScroller && scrollElement(horizontalScroller, horizontalDelta, "x")) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function closestScrollable(root: HTMLElement, target: HTMLElement): HTMLElement | undefined {
  let node: HTMLElement | null = target;
  while (node && node !== root) {
    const style = getComputedStyle(node);
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1;
    const canScrollX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1;
    if (canScrollY || canScrollX) {
      return node;
    }
    node = node.parentElement;
  }
  return undefined;
}

function fallbackWheelScroller(target: HTMLElement): HTMLElement | undefined {
  const palette = target.closest<HTMLElement>(".build-palette");
  if (palette) {
    return palette.querySelector<HTMLElement>(".palette-body[data-scroll-key]") ?? palette;
  }
  return target.closest<HTMLElement>(".region-panel, .alerts-panel") ?? undefined;
}

function canConsumeWheel(scroller: HTMLElement, event: WheelEvent): boolean {
  return canScrollAxis(scroller, event.deltaY, "y") || canScrollAxis(scroller, event.deltaX, "x");
}

function canScrollAxis(scroller: HTMLElement, delta: number, axis: "x" | "y"): boolean {
  if (Math.abs(delta) < 0.5) {
    return false;
  }
  const position = axis === "y" ? scroller.scrollTop : scroller.scrollLeft;
  const max = axis === "y" ? scroller.scrollHeight - scroller.clientHeight : scroller.scrollWidth - scroller.clientWidth;
  return delta > 0 ? position < max - 1 : position > 1;
}

function scrollElement(scroller: HTMLElement, delta: number, axis: "x" | "y"): boolean {
  if (!canScrollAxis(scroller, delta, axis)) {
    return false;
  }
  if (axis === "y") {
    const before = scroller.scrollTop;
    scroller.scrollTop = Math.max(0, Math.min(scroller.scrollHeight - scroller.clientHeight, before + delta));
    return Math.abs(scroller.scrollTop - before) > 0.5;
  }
  const before = scroller.scrollLeft;
  scroller.scrollLeft = Math.max(0, Math.min(scroller.scrollWidth - scroller.clientWidth, before + delta));
  return Math.abs(scroller.scrollLeft - before) > 0.5;
}
