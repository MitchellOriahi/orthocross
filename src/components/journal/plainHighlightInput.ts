// Put insertion outside highlighted ink, including browser caret positions on
// the parent immediately beside a mark (not just positions inside its text).
export const leaveHighlightForInput = (root: HTMLElement, selection: Selection): boolean => {
  if (!selection.rangeCount || !selection.isCollapsed) return false;
  const range = selection.getRangeAt(0);
  if (!root.contains(range.startContainer)) return false;
  const container = range.startContainer;
  const element = container.nodeType === 1 ? container as Element : container.parentElement;
  let mark: Element | null | undefined = element?.closest('mark');
  if (!mark && container.nodeType === 1) {
    const previous = container.childNodes[range.startOffset - 1];
    const next = container.childNodes[range.startOffset];
    const adjacent = [previous, next].find(node => node?.nodeType === 1 && (node as Element).tagName === 'MARK');
    if (adjacent) {
      mark = adjacent as Element;
      range.selectNodeContents(mark);
      range.collapse(adjacent === next);
    }
  }
  if (!mark || !root.contains(mark)) return false;
  // Leave the outermost mark, so legacy nested marks cannot leak their colour.
  while (mark.parentElement?.closest('mark') && root.contains(mark.parentElement.closest('mark'))) {
    const outer = mark.parentElement.closest('mark');
    if (!outer) break;
    mark = outer;
  }
  const tailRange = range.cloneRange();
  tailRange.setEnd(mark, mark.childNodes.length);
  const tail = tailRange.extractContents();
  const plain = root.ownerDocument.createElement('span');
  plain.className = 'whitespace-pre-wrap';
  const text = root.ownerDocument.createTextNode('');
  plain.appendChild(text);
  mark.after(plain);
  if (tail.textContent) {
    const trailingMark = mark.cloneNode(false);
    trailingMark.appendChild(tail);
    plain.after(trailingMark);
  }
  if (!mark.textContent) mark.remove();
  range.setStart(text, 0);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
};