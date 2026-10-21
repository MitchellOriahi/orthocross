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

/** Resize callbacks only queue work; never change layout during observer delivery. */
export function observeDonationPeek(content: HTMLDivElement): () => void {
  let frame: number | undefined;
  let settled = false;
  const apply = () => {
    frame = undefined;
    const slider = content.querySelector('input[type="range"]');
    if (!(slider instanceof HTMLInputElement)) {
      content.style.maxHeight = "";
      return;
    }
    const box = content.getBoundingClientRect();
    const thumb = slider.getBoundingClientRect();
    const height = donationPeekHeight(box.top, thumb.top, thumb.height, content.scrollTop, window.innerHeight);
    const previous = Number.parseFloat(content.style.maxHeight);
    if (!Number.isFinite(previous) || Math.abs(previous - height) >= 1) {
      content.style.maxHeight = `${height}px`;
    }
  };
  const schedule = () => {
    if (settled && frame === undefined) frame = window.requestAnimationFrame(apply);
  };
  // The opening zoom must finish before measuring relative positions.
  const timer = window.setTimeout(() => { settled = true; schedule(); }, 260);
  const watcher = new ResizeObserver(schedule);
  for (const child of content.children) watcher.observe(child);
  window.addEventListener("resize", schedule);
  return () => {
    window.clearTimeout(timer);
    if (frame !== undefined) window.cancelAnimationFrame(frame);
    watcher.disconnect();
    window.removeEventListener("resize", schedule);
  };
}