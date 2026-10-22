import { wordBounds } from './highlightWord';
import { repairHighlights } from './highlightMerge';

export type HighlightMode = 'word' | 'sentence';

// Use the browser's Unicode sentence parser rather than splitting only on dots.
export const sentenceBounds = (text: string, offset: number): [number, number] | null => {
  if (!text.trim() || offset < 0 || offset > text.length) return null;
  const { Segmenter } = Intl as typeof Intl & {
    Segmenter: new (locale: undefined, options: { granularity: 'sentence' }) => {
      segment: (text: string) => Iterable<{ segment: string; index: number }>;
    };
  };
  const segmenter = new Segmenter(undefined, { granularity: 'sentence' });
  const position = Math.min(offset, text.length - 1);
  // Unicode ellipsis is not treated as a terminator by every ICU version.
  // Substitute a same-length terminator for parsing, keeping original offsets.
  for (const { segment, index } of segmenter.segment(text.replace(/…/g, '!'))) {
    if (position < index || position >= index + segment.length) continue;
    const start = index + segment.length - segment.trimStart().length;
    const end = index + segment.trimEnd().length;
    return start < end ? [start, end] : null;
  }
  return null;
};

const canonicalColor = (classes: string) => {
  const legacy = classes.match(/\bbg-(yellow|green|blue|pink)-200\b/);
  return legacy ? `journal-highlight-${legacy[1]}` : classes;
};

// Isolate the selected ink within a mark, preserving highlighted text and
// inline formatting on both sides before unwrapping just this piece.
const unwrapSelectedText = (text: Text, root: HTMLElement) => {
  let mark = text.parentElement?.closest('mark');
  while (mark && root.contains(mark)) {
    const after = root.ownerDocument.createRange();
    after.setStartAfter(text);
    after.setEnd(mark, mark.childNodes.length);
    const tail = after.extractContents();
    if (tail.textContent) {
      const copy = mark.cloneNode(false);
      copy.appendChild(tail);
      mark.after(copy);
    }
    const before = root.ownerDocument.createRange();
    before.setStart(mark, 0);
    before.setEndBefore(text);
    const head = before.extractContents();
    if (head.textContent) {
      const copy = mark.cloneNode(false);
      copy.appendChild(head);
      mark.before(copy);
    }
    mark.replaceWith(...Array.from(mark.childNodes));
    mark = text.parentElement?.closest('mark');
  }
};

export const toggleHighlightAt = (
  root: HTMLElement, node: Text, offset: number, mode: HighlightMode, color: string,
): boolean => {
  if (!root.contains(node)) return false;
  const block = node.parentElement?.closest('p,li,h1,h2,h3,div');
  const scope = block && root.contains(block) ? block : root;
  const pieces: { node: Text; start: number; end: number }[] = [];
  let text = '';
  const collect = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === 3) {
        const start = text.length;
        text += child.textContent || '';
        pieces.push({ node: child as Text, start, end: text.length });
      } else if (child.nodeType === 1) {
        const element = child as Element;
        if (element.matches('img,audio,video,button,svg,[contenteditable="false"]')) continue;
        if (element.tagName === 'BR') text += '\n';
        else {
          collect(child);
          if (element.matches('p,li,h1,h2,h3,div')) text += '\n';
        }
      }
    }
  };
  collect(scope);
  const tapped = pieces.find(piece => piece.node === node);
  if (!tapped) return false;
  const absoluteOffset = tapped.start + offset;
  // A line break ends the current passage, even without punctuation.
  const lineStart = text.lastIndexOf('\n', Math.max(0, absoluteOffset - 1)) + 1;
  const nextBreak = text.indexOf('\n', absoluteOffset);
  const lineEnd = nextBreak < 0 ? text.length : nextBreak;
  const bounds = mode === 'word'
    ? wordBounds(text, absoluteOffset)
    : sentenceBounds(text.slice(lineStart, lineEnd), absoluteOffset - lineStart)?.map(n => n + lineStart);
  if (!bounds) return false;
  const selected = pieces.filter(piece => piece.start < bounds[1] && piece.end > bounds[0]);
  if (!selected.length) return false;
  const remove = selected.every(piece => {
    const mark = piece.node.parentElement?.closest('mark');
    return mark && canonicalColor(mark.className) === color;
  });
  for (const piece of selected.reverse()) {
    const start = Math.max(0, bounds[0] - piece.start);
    const end = Math.min(piece.end, bounds[1]) - piece.start;
    if (end < piece.node.length) piece.node.splitText(end);
    const target = start > 0 ? piece.node.splitText(start) : piece.node;
    unwrapSelectedText(target, root);
    if (!remove) {
      const mark = root.ownerDocument.createElement('mark');
      mark.className = color;
      target.replaceWith(mark);
      mark.appendChild(target);
    }
  }
  for (const mark of Array.from(root.querySelectorAll('mark'))) {
    if (root.contains(mark)) mark.className = canonicalColor(mark.className);
  }
  // Whitespace never sits inside a highlight: strip it, then fold marks that touch.
  repairHighlights(root);
  root.normalize();
  return true;
};