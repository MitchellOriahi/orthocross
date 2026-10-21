/** Keep opening geometry independent of the dialog's current scroll position. */
export function donationPeekHeight(
  dialogTop: number,
  sliderTop: number,
  sliderHeight: number,
  scrollTop: number,
  viewportHeight: number,
): number {
  return Math.min(Math.max(sliderTop - dialogTop + scrollTop + sliderHeight / 2, 240), viewportHeight - 32);
}

/** Distance from `root`'s top border to `element`, via layout offsets.
 * Offsets ignore transforms, so the opening zoom animation never skews the
 * measurement the way getBoundingClientRect would. */
function offsetWithin(element: HTMLElement, root: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = element;
  while (node && node !== root) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return node === root ? top : NaN;
}

/** Pin the dialog to show half of the price slider. Runs synchronously before
 * the dialog's first paint (layout effect + requestAnimationFrame), so the
 * centered dialog opens at its final height and never re-centers afterwards. */
export function observeDonationPeek(content: HTMLDivElement): () => void {
  let frame: number | undefined;
  let last: number | undefined;
  const apply = () => {
    frame = undefined;
    const slider = content.querySelector('input[type="range"]');
    if (!(slider instanceof HTMLInputElement)) {
      last = undefined;
      content.style.maxHeight = "";
      return;
    }
    const top = offsetWithin(slider, content);
    if (!Number.isFinite(top)) {
      last = undefined;
      content.style.maxHeight = "";
      return;
    }
    const height = donationPeekHeight(0, top, slider.offsetHeight, 0, window.innerHeight);
    if (last === undefined || Math.abs(last - height) >= 1) {
      content.style.maxHeight = `${height}px`;
      last = height;
    }
  };
  const schedule = () => {
    if (frame === undefined) frame = window.requestAnimationFrame(apply);
  };
  const watcher = new ResizeObserver(schedule);
  for (const child of content.children) watcher.observe(child);
  window.addEventListener("resize", schedule);
  return () => {
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    watcher.disconnect();
    window.removeEventListener("resize", schedule);
  };
}
