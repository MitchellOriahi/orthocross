/** Fit page titles into their existing slot without moving adjacent controls. */
const watched = new WeakSet<HTMLElement>();
const maxSizes = new WeakMap<HTMLElement, number>();
let resizeObserver: ResizeObserver | undefined;
let queued = false;

export function fitPageTitles() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    resizeObserver ??= new ResizeObserver(fitPageTitles);
    document.querySelectorAll<HTMLElement>("header h1").forEach(title => {
      if (!watched.has(title)) {
        watched.add(title);
        maxSizes.set(title, parseFloat(getComputedStyle(title).fontSize));
        resizeObserver?.observe(title);
      }
      const maximum = maxSizes.get(title) ?? 24;
      title.style.fontSize = `${maximum}px`;
      title.classList.remove("localized-title-wrap");
      if (!title.clientWidth) return;
      let size = maximum;
      while (title.scrollWidth > title.clientWidth && size > 10) {
        size -= 0.5;
        title.style.fontSize = `${size}px`;
      }
      title.classList.toggle("localized-title-wrap", title.scrollWidth > title.clientWidth);
    });
  });
}