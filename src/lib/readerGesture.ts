export type ReaderGesture = {
  x: number; y: number; lastY: number;
  minX: number; maxX: number; minY: number; maxY: number;
  axis: "pending" | "horizontal" | "vertical";
};

export function startReaderGesture(x: number, y: number): ReaderGesture {
  return { x, y, lastY: y, minX: x, maxX: x, minY: y, maxY: y, axis: "pending" };
}

export function moveReaderGesture(g: ReaderGesture, x: number, y: number): ReaderGesture {
  const next = { ...g, lastY: y, minX: Math.min(g.minX, x), maxX: Math.max(g.maxX, x), minY: Math.min(g.minY, y), maxY: Math.max(g.maxY, y) };
  const dx = Math.abs(x - g.x);
  const dy = Math.abs(y - g.y);
  if (g.axis === "pending" && Math.max(dx, dy) >= 10) {
    if (dy >= dx * 1.2) next.axis = "vertical";
    else if (dx >= dy * 2) next.axis = "horizontal";
  }
  return next;
}

export function readerPageTurn(g: ReaderGesture): "next" | "prev" | null {
  const horizontal = g.maxX - g.minX;
  const vertical = g.maxY - g.minY;
  const left = g.x - g.minX;
  const right = g.maxX - g.x;
  if (g.axis !== "horizontal" || Math.max(left, right) < 80 || horizontal <= vertical * 2.5) return null;
  return left >= right ? "next" : "prev";
}

export function readerScrollDirection(previous: number, current: number, max: number): "show" | "hide" | null {
  // Out-of-range Safari rubber-banding is not an intentional scroll direction.
  if (previous < 0 || current < 0 || previous > max || current > max) return null;
  if (current - previous >= 8) return "hide";
  if (previous - current >= 8) return "show";
  return null;
}