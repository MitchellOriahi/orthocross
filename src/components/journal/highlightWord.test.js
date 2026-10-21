import { describe, expect, it } from 'bun:test';
import { wordBounds, highlightTapAction, isWordChar } from './highlightWord';

describe('wordBounds', () => {
  it('expands a caret inside a word to the whole word', () => {
    expect(wordBounds('the quick fox', 5)).toEqual([4, 9]);
  });
  it('keeps apostrophes and hyphens inside words', () => {
    expect(wordBounds("it's well-known", 2)).toEqual([0, 4]);
    expect(wordBounds("it's well-known", 9)).toEqual([5, 15]);
  });
  it('a tap just after a word still highlights that word', () => {
    expect(wordBounds('the quick', 3)).toEqual([0, 3]);
    expect(wordBounds('hi, there', 2)).toEqual([0, 2]);
  });
  it('returns null on gaps between words', () => {
    expect(wordBounds('a  b', 1)).toBeNull();
    expect(wordBounds('a  b', 2)).toBeNull();
  });
  it('handles unicode letters', () => {
    expect(wordBounds('καὶ λόγος', 2)).toEqual([0, 3]);
    expect(wordBounds('καὶ λόγος', 6)).toEqual([4, 9]);
  });
  it('a caret at a word boundary still finds the word', () => {
    expect(wordBounds('word', 4)).toEqual([0, 4]);
    expect(wordBounds('word', 0)).toEqual([0, 4]);
  });
  it('returns null for empty text or out-of-range offsets', () => {
    expect(wordBounds('', 0)).toBeNull();
    expect(wordBounds('abc', 9)).toBeNull();
  });
});

describe('highlightTapAction', () => {
  it('applies color to a plain word', () => {
    expect(highlightTapAction(null, 'bg-yellow-200')).toBe('apply');
  });
  it('removes the highlight when tapped with the same color', () => {
    expect(highlightTapAction('bg-yellow-200', 'bg-yellow-200')).toBe('remove');
  });
  it('repaints when tapped with a different color', () => {
    expect(highlightTapAction('bg-yellow-200', 'bg-pink-200')).toBe('repaint');
  });
});

describe('isWordChar', () => {
  it('treats letters and digits as word characters', () => {
    expect(isWordChar('a')).toBe(true);
    expect(isWordChar('7')).toBe(true);
    expect(isWordChar(' ')).toBe(false);
    expect(isWordChar(undefined)).toBe(false);
  });
});
