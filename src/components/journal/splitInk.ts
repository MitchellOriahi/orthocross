/**
 * Splits the visible ink of an RGBA pixel buffer into disconnected pieces.
 *
 * The true eraser cuts holes in a stroke; when a cut divides a stroke into
 * separate parts, each part must become its own drawable object so the
 * grabber tool can pick up just one piece instead of the whole former line.
 */

export interface InkPiece {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /** RGBA pixels for the bounding box; pixels of other pieces are transparent. */
  pixels: Uint8ClampedArray<ArrayBuffer>;
}

const ALPHA_THRESHOLD = 8;

export function splitInkIntoPieces(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): InkPiece[] {
  const labels = new Int32Array(width * height).fill(-1);
  const boxes: { minX: number; minY: number; maxX: number; maxY: number }[] = [];
  const stack: number[] = [];

  // Flood-fill each connected region (8-connectivity keeps anti-aliased
  // diagonal strokes together as one piece).
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (labels[i] !== -1 || data[i * 4 + 3] <= ALPHA_THRESHOLD) continue;
      const id = boxes.length;
      boxes.push({ minX: x, minY: y, maxX: x, maxY: y });
      labels[i] = id;
      stack.push(i);
      while (stack.length) {
        const p = stack.pop() as number;
        const px = p % width;
        const py = (p - px) / width;
        const box = boxes[id];
        if (px < box.minX) box.minX = px;
        if (px > box.maxX) box.maxX = px;
        if (py < box.minY) box.minY = py;
        if (py > box.maxY) box.maxY = py;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = px + dx;
            const ny = py + dy;
            if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
            const ni = ny * width + nx;
            if (labels[ni] === -1 && data[ni * 4 + 3] > ALPHA_THRESHOLD) {
              labels[ni] = id;
              stack.push(ni);
            }
          }
        }
      }
    }
  }

  return boxes.map((box, id) => {
    const w = box.maxX - box.minX + 1;
    const h = box.maxY - box.minY + 1;
    const pixels = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const si = (box.minY + y) * width + (box.minX + x);
        if (labels[si] !== id) continue;
        const di = (y * w + x) * 4;
        pixels[di] = data[si * 4];
        pixels[di + 1] = data[si * 4 + 1];
        pixels[di + 2] = data[si * 4 + 2];
        pixels[di + 3] = data[si * 4 + 3];
      }
    }
    return { ...box, pixels };
  });
}
