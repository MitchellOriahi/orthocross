// Joining a fresh highlight with an identical-colour highlight that already
// sits right beside it, so two neighbouring words read as one continuous
// stroke instead of two tiles with a gap between them.
//
// Only whitespace may separate the two marks, and only marks painted with the
// exact same colour class are joined — a differently coloured neighbour stays
// a separate highlight.

const isWhitespaceText = (node: Node | null): node is Text =>
  !!node &&
  node.nodeType === Node.TEXT_NODE &&
  !(node.textContent || '').trim();

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

  // Backwards: <mark>one</mark>␣<mark>two</mark>
  for (;;) {
    const gaps: Text[] = [];
    let prev = current.previousSibling;
    while (isWhitespaceText(prev)) {
      gaps.unshift(prev);
      prev = prev.previousSibling;
    }
    if (!isSameColorMark(prev, current.className)) break;
    for (const gap of gaps) prev.appendChild(gap);
    while (current.firstChild) prev.appendChild(current.firstChild);
    current.remove();
    current = prev;
  }

  // Forwards: <mark>one</mark>␣<mark>two</mark>
  for (;;) {
    const gaps: Text[] = [];
    let next = current.nextSibling;
    while (isWhitespaceText(next)) {
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
