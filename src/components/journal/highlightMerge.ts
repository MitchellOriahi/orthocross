// Joining a fresh highlight with an identical-colour highlight that already
// sits right beside it, so two touching marks read as one continuous stroke
// instead of two tiles with a hairline gap between them.
//
// Only marks painted with the exact same colour class are joined — a
// differently coloured neighbour stays a separate highlight. A gap of any
// whitespace (spaces, line breaks) stops the join: spaces between highlighted
// words must stay unpainted.

// Empty text nodes render nothing, so they may be folded into a join; any
// visible whitespace cannot — it must stay outside the highlight.
const isJoinableGap = (node: Node | null): node is Text =>
  !!node &&
  node.nodeType === Node.TEXT_NODE &&
  (node.textContent || '') === '';

const isSameColorMark = (node: Node | null, className: string): node is Element =>
  !!node &&
  node.nodeType === Node.ELEMENT_NODE &&
  (node as Element).tagName === 'MARK' &&
  (node as Element).className === className;

/**
 * Fold any touching same-colour marks into `mark` (in place) and return the
 * surviving element. Safe to call on a mark with nothing next to it.
 */
export const mergeWithAdjacentHighlights = (mark: Element): Element => {
  let current = mark;

  // Backwards: <mark>one</mark><mark>two</mark>
  for (;;) {
    const gaps: Text[] = [];
    let prev = current.previousSibling;
    while (isJoinableGap(prev)) {
      gaps.unshift(prev);
      prev = prev.previousSibling;
    }
    if (!isSameColorMark(prev, current.className)) break;
    for (const gap of gaps) prev.appendChild(gap);
    while (current.firstChild) prev.appendChild(current.firstChild);
    current.remove();
    current = prev;
  }

  // Forwards: <mark>one</mark><mark>two</mark>
  for (;;) {
    const gaps: Text[] = [];
    let next = current.nextSibling;
    while (isJoinableGap(next)) {
      gaps.push(next);
      next = next.nextSibling;
    }
    if (!isSameColorMark(next, current.className)) break;
    for (const gap of gaps) current.appendChild(gap);
    while (next.firstChild) current.appendChild(next.firstChild);
    next.remove();
  }

  return current;
};

/**
 * Lift every run of whitespace out of a mark so a highlight never paints the
 * spaces between words: <mark>one two</mark> becomes
 * <mark>one</mark>' '<mark>two</mark>. Inline formatting inside the mark is
 * split the same way, so spaces inside <strong> never stay painted either.
 * Returns the mark (or its first surviving segment, or null when the mark held
 * nothing but whitespace and dissolves).
 */
type Segment = { node: Node } | { text: string; blank: boolean };

const VOIDED = 'img,audio,video,button,svg,br';

const explode = (node: Node, doc: Document): Segment[] => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || '';
    // Text without whitespace stays a single untouched node.
    if (!/\s/.test(text)) return [{ node }];
    return text.split(/(\s+)/).filter(Boolean).map(part =>
      part.trim() ? ({ text: part, blank: false } as Segment) : ({ text: part, blank: true } as Segment));
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return [{ node }];
  const element = node as Element;
  if ((element as HTMLElement).matches?.(VOIDED)) return [{ node }];
  const inner = Array.from(element.childNodes).flatMap(child => explode(child, doc));
  // Whitespace inside the element is hoisted out; word runs are re-wrapped in
  // fresh copies of the element, one per run.
  const groups: Segment[][] = [];
  let run: Segment[] = [];
  for (const piece of inner) {
    if ('blank' in piece && piece.blank) {
      if (run.length) groups.push(run);
      run = [];
      continue;
    }
    run.push(piece);
  }
  if (run.length) groups.push(run);
  const identity = groups.length === 1 &&
    inner.every((piece, index) => 'node' in piece && piece.node === element.childNodes[index]);
  if (identity) return [{ node }];
  if (groups.length === 0) return inner; // element held only whitespace
  return groups.map(group => {
    const copy = element.cloneNode(false);
    for (const piece of group) {
      copy.appendChild('node' in piece ? piece.node : doc.createTextNode(piece.text));
    }
    return { node: copy } as Segment;
  });
};

export const stripMarkWhitespace = (mark: Element): Element | null => {
  const doc = mark.ownerDocument;
  const pieces = Array.from(mark.childNodes).flatMap(kid => explode(kid, doc));
  if (pieces.length === mark.childNodes.length &&
      pieces.every((piece, index) => 'node' in piece && piece.node === mark.childNodes[index])) {
    return mark;
  }
  const rebuild: Node[] = [];
  let chunk: Segment[] = [];
  const flush = () => {
    if (!chunk.length) return;
    const fresh = mark.cloneNode(false);
    for (const piece of chunk) {
      fresh.appendChild('node' in piece ? piece.node : doc.createTextNode(piece.text));
    }
    rebuild.push(fresh);
    chunk = [];
  };
  for (const piece of pieces) {
    if ('blank' in piece && piece.blank) {
      flush();
      rebuild.push(doc.createTextNode(piece.text));
    } else {
      chunk.push(piece);
    }
  }
  flush();
  mark.replaceWith(...rebuild);
  for (const node of rebuild) {
    if (node.nodeType === Node.ELEMENT_NODE) return node as Element;
  }
  return null;
};

/** Convenience pass used wherever highlights are repaired: strip whitespace
 * out of every mark first (whitespace-only marks dissolve), then fold marks
 * that still touch. Stripping completes before any merge so a merge can never
 * swallow whitespace from a not-yet-stripped neighbour. */
export const repairHighlights = (root: HTMLElement): void => {
  const survivors: Element[] = [];
  for (const mark of Array.from(root.querySelectorAll('mark'))) {
    if (!root.contains(mark)) continue;
    const kept = stripMarkWhitespace(mark);
    if (kept) survivors.push(kept);
  }
  for (const kept of survivors) {
    // The mark may already have been folded into an earlier merge.
    if (!root.contains(kept)) continue;
    mergeWithAdjacentHighlights(kept);
  }
};
