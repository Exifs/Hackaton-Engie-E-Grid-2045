export class PaletteScrollMemory {
  private readonly positions: Record<string, { top: number; left: number }> = {
    construction: { top: 0, left: 0 },
    research: { top: 0, left: 0 }
  };

  constructor(
    private readonly root: HTMLElement,
    private readonly fallbackKey: () => string
  ) {}

  capture(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.fallbackKey();
    this.positions[key] = { top: scroller.scrollTop, left: scroller.scrollLeft };
  }

  restore(): void {
    const scroller = this.root.querySelector<HTMLElement>(".palette-body[data-scroll-key]");
    if (!scroller) {
      return;
    }
    const key = scroller.dataset.scrollKey ?? this.fallbackKey();
    const scroll = this.positions[key] ?? { top: 0, left: 0 };
    scroller.scrollTop = scroll.top;
    scroller.scrollLeft = scroll.left;
  }
}
