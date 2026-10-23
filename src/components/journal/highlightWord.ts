// Word-boundary helpers for the journal tap-to-highlight mode.
// Kept DOM-free so the behavior is unit-testable.

const WORD_CHAR = /[\p{L}\p{N}\p{M}'’-]/u;

export const isWordChar = (ch: string | undefined): boolean =>
  !!ch && WORD_CHAR.test(ch);

/**
 * Expand a caret offset inside `text` to the surrounding word's [start, end)
 * bounds. Returns null when the offset sits on whitespace or punctuation, so
 * taps between words highlight nothing.
 */
export const wordBounds = (text: string, offset: number): [number, number] | null => {
  if (!text || offset < 0 || offset > text.length) return null;
  // A caret at a boundary belongs to the word it touches.
  let start = offset;
  let end = offset;
  if (start === end && !isWordChar(text[start]) && isWordChar(text[start - 1])) {
    start -= 1;
    end -= 1;
  }
  if (!isWordChar(text[start]) && !isWordChar(text[end - 1])) return null;
  while (start > 0 && isWordChar(text[start - 1])) start -= 1;
  while (end < text.length && isWordChar(text[end])) end += 1;
  return start === end ? null : [start, end];
};

/**
 * Decide what tapping an already-highlighted word does: tapping with the same
 * color removes the highlight, tapping with another color repaints it.
 */
export const highlightTapAction = (
  currentClass: string | null,
  nextClass: string,
): "apply" | "repaint" | "remove" => {
  if (!currentClass) return "apply";
  return currentClass === nextClass ? "remove" : "repaint";
};
