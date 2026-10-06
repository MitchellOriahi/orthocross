type StyleId = "golden" | "pilgrim" | "midnight";

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.trim().split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, width: number, height: number, max: number, face: string, leading: number) {
  let size = max;
  let lines: string[] = [];
  do {
    ctx.font = `${size}px ${face}`;
    lines = wrap(ctx, text, width);
    if (lines.length * size * leading <= height && lines.every(line => ctx.measureText(line).width <= width)) break;
    size -= 1;
  } while (size > 1);
  return { lines, size, lineHeight: size * leading };
}

export function drawVerseTypography(ctx: CanvasRenderingContext2D, size: number, style: StyleId, text: string, reference: string) {
  ctx.save();
  ctx.scale(size / 1080, size / 1080);
  const tokens = getComputedStyle(document.documentElement);
  const color = (name: string, opacity = 1) => `hsl(${tokens.getPropertyValue(`--verse-art-${name}`).trim()} / ${opacity})`;
  const ink = color("ink");
  const accent = color(style === "pilgrim" ? "mist" : "gold");
  const shade = ctx.createLinearGradient(0, 0, 0, 1080);
  shade.addColorStop(0, color("night", style === "golden" ? 0.18 : 0.45));
  shade.addColorStop(0.5, color("night", style === "golden" ? 0.45 : 0.65));
  shade.addColorStop(1, color("night", 0.85));
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1080, 1080);
  ctx.textBaseline = "top";

  const cross = (x: number, y: number) => {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = accent;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath();
    ctx.moveTo(0, -32); ctx.lineTo(0, 32);
    ctx.moveTo(-9, -21); ctx.lineTo(9, -21);
    ctx.moveTo(-18, -6); ctx.lineTo(18, -6);
    ctx.moveTo(-11, 13); ctx.lineTo(11, 23); ctx.stroke(); ctx.restore();
  };
  const label = (x: number, y: number, align: CanvasTextAlign) => {
    ctx.textAlign = align; ctx.fillStyle = accent;
    const fitted = fit(ctx, reference.toUpperCase(), 780, 54, 23, "Arial, sans-serif", 1.2);
    ctx.font = `500 ${Math.min(23, fitted.size)}px Arial, sans-serif`;
    ctx.fillText(reference.toUpperCase(), x, y, 780);
  };

  if (style === "golden") {
    // A quiet, monumental serif quote floating over the sunset.
    cross(540, 210);
    ctx.textAlign = "center"; ctx.fillStyle = ink;
    const block = fit(ctx, text, 820, 490, 76, "Georgia, serif", 1.22);
    const top = 540 - block.lines.length * block.lineHeight / 2;
    block.lines.forEach((line, i) => ctx.fillText(line, 540, top + i * block.lineHeight));
    label(540, 860, "center");
  } else if (style === "pilgrim") {
    // An asymmetrical editorial composition with a large opening phrase.
    cross(128, 170);
    ctx.strokeStyle = color("mist", 0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 252); ctx.lineTo(980, 252); ctx.stroke();
    const words = text.trim().split(/\s+/);
    const opening = words.slice(0, 5).join(" ");
    const rest = words.slice(5).join(" ");
    ctx.textAlign = "left"; ctx.fillStyle = ink;
    const headline = fit(ctx, opening, 830, 270, 100, "Georgia, serif", 1.1);
    headline.lines.forEach((line, i) => ctx.fillText(line, 100, 310 + i * headline.lineHeight));
    const bodyTop = 310 + headline.lines.length * headline.lineHeight + 38;
    const body = fit(ctx, rest, 800, 815 - bodyTop, 42, "Arial, sans-serif", 1.45);
    body.lines.forEach((line, i) => ctx.fillText(line, 104, bodyTop + i * body.lineHeight));
    label(104, 886, "left");
  } else {
    // Widely spaced stanza-like lines contained in a fine celestial frame.
    ctx.strokeStyle = color("gold", 0.55); ctx.lineWidth = 1.5;
    ctx.strokeRect(90, 130, 900, 810);
    cross(540, 210);
    ctx.textAlign = "center"; ctx.fillStyle = ink;
    const block = fit(ctx, text.toUpperCase(), 720, 490, 44, "Arial, sans-serif", 1.8);
    const top = 552 - block.lines.length * block.lineHeight / 2;
    block.lines.forEach((line, i) => ctx.fillText(line, 540, top + i * block.lineHeight));
    ctx.strokeStyle = accent;
    ctx.beginPath(); ctx.moveTo(505, 823); ctx.lineTo(575, 823); ctx.stroke();
    label(540, 864, "center");
  }
  ctx.textAlign = "center"; ctx.fillStyle = color("ink", 0.7);
  ctx.font = "16px Arial, sans-serif";
  ctx.fillText("O R T H O C R O S S", 540, 1015);
  ctx.restore();
}