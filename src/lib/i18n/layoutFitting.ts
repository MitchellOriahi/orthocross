/** Fit page titles into their existing slot without moving adjacent controls. */
const watched = new WeakSet<HTMLElement>();
const maxSizes = new WeakMap<HTMLElement, number>();
let resizeObserver: ResizeObserver | undefined;
let queued = false;
const fitted = new Map<HTMLElement, string>();
const widths = new WeakMap<Element, number>();
let wordObserver: ResizeObserver | undefined;

/** Fit overlong words inside their text slot, without resizing adjacent icons. */
function fitTranslatedWords() {
  for (const [element, originalSize] of fitted) element.style.fontSize = originalSize;
  fitted.clear();
  if (document.documentElement.lang === "en") return;
  const context = document.createElement("canvas").getContext("2d");
  if (!context) return;
  wordObserver ??= new ResizeObserver(entries => {
    let changed = false;
    for (const entry of entries) {
      const width = entry.contentRect.width;
      if (widths.get(entry.target) !== width) { widths.set(entry.target, width); changed = true; }
    }
    if (changed) fitPageTitles();
  });
  const parents = new Set<HTMLElement>();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && node.textContent?.trim() && !parent.closest("[data-no-translate],script,style,input,textarea,[contenteditable='true']")) parents.add(parent);
    node = walker.nextNode();
  }
  for (const element of parents) {
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const style = getComputedStyle(element);
    let available = (element.clientWidth || rect.width) - parseFloat(style.paddingLeft || "0") - parseFloat(style.paddingRight || "0");
    if (style.display === "flex" || style.display === "inline-flex") {
      const children = Array.from(element.children).filter(child => getComputedStyle(child).position !== "absolute");
      for (const child of children) {
        const childStyle = getComputedStyle(child);
        available -= child.getBoundingClientRect().width + parseFloat(childStyle.marginLeft || "0") + parseFloat(childStyle.marginRight || "0");
      }
      available -= children.length * (parseFloat(style.columnGap) || 0);
    }
    if (available <= 0) continue;
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const text = Array.from(element.childNodes).filter(child => child.nodeType === Node.TEXT_NODE).map(child => child.textContent ?? "").join(" ");
    const longest = Math.max(0, ...text.split(/\s+/u).filter(Boolean).map(word => context.measureText(word).width));
    if (!widths.has(element)) wordObserver.observe(element);
    if (longest > available) {
      fitted.set(element, element.style.fontSize);
      element.style.fontSize = `${Math.floor(parseFloat(style.fontSize) * available / longest * 10) / 10}px`;
    }
  }
}

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
    fitTranslatedWords();
  });
}