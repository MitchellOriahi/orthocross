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

const isBlankText = (node: Node): boolean =>
  node.nodeType === Node.TEXT_NODE && /\s/.test(node.textContent || '');

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
 * <mark>one</mark>' '<mark>two</mark>. Runs on the mark's direct contents and
 * returns the mark (or its first surviving segment, or null when the mark held
 * nothing but whitespace and dissolves).
 */
export const stripMarkWhitespace = (mark: Element): Element | null => {
  const kids = Array.from(mark.childNodes);
  if (!kids.some(isBlankText)) return mark;
  const doc = mark.ownerDocument;
  type Piece = { node?: Node; text?: string; blank: boolean };
  const pieces: Piece[] = [];
  for (const kid of kids) {
    if (kid.nodeType !== Node.TEXT_NODE) {
      pieces.push({ node: kid, blank: false });
      continue;
    }
    const text = kid.textContent || '';
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      pieces.push({ text: part, blank: !part.trim() });
    }
  }
  const rebuild: Node[] = [];
  let chunk: Piece[] = [];
  const flush = () => {
    if (!chunk.length) return;
    const fresh = mark.cloneNode(false);
    for (const piece of chunk) {
      fresh.appendChild(piece.node ? piece.node : doc.createTextNode(piece.text || ''));
    }
    rebuild.push(fresh);
    chunk = [];
  };
  for (const piece of pieces) {
    if (piece.blank) {
      flush();
      rebuild.push(doc.createTextNode(piece.text || ''));
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
 * out of every mark, then fold marks that still touch. */
export const repairHighlights = (root: HTMLElement): void => {
  for (const mark of Array.from(root.querySelectorAll('mark'))) {
    if (!root.contains(mark)) continue;
    const kept = stripMarkWhitespace(mark);
    if (kept) mergeWithAdjacentHighlights(kept);
  }
};
