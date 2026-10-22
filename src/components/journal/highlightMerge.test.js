import { describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.Node = dom.window.Node;

const { mergeWithAdjacentHighlights } = await import('./highlightMerge');

const YELLOW = 'bg-yellow-200 dark:bg-yellow-900/50';
const GREEN = 'bg-green-200 dark:bg-green-900/50';

const run = (html) => {
  const root = dom.window.document.createElement('div');
  root.innerHTML = html;
  const marks = root.querySelectorAll('mark');
  mergeWithAdjacentHighlights(marks[marks.length - 1]);
  return root.innerHTML;
};

describe('mergeWithAdjacentHighlights', () => {
  it('joins two same-colour words separated by a space into one highlight', () => {
    expect(run(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`))
      .toBe(`<mark class="${YELLOW}">one two</mark>`);
  });

  it('joins leftwards when the earlier word is highlighted last', () => {
    const root = dom.window.document.createElement('div');
    root.innerHTML = `<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`;
    const survivor = mergeWithAdjacentHighlights(root.querySelector('mark'));
    expect(root.innerHTML).toBe(`<mark class="${YELLOW}">one two</mark>`);
    expect(survivor.textContent).toBe('one two');
  });

  it('joins on both sides of a middle word', () => {
    expect(run(
      `<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark> <mark class="${YELLOW}">three</mark>`,
    )).toBe(`<mark class="${YELLOW}">one two three</mark>`);
  });

  it('keeps a differently coloured neighbour separate', () => {
    const joined = run(`<mark class="${YELLOW}">one</mark> <mark class="${GREEN}">two</mark>`);
    expect(joined).toBe(`<mark class="${YELLOW}">one</mark> <mark class="${GREEN}">two</mark>`);
  });

  it('keeps words apart when a plain word sits between them', () => {
    expect(run(`<mark class="${YELLOW}">one</mark> x <mark class="${YELLOW}">two</mark>`))
      .toBe(`<mark class="${YELLOW}">one</mark> x <mark class="${YELLOW}">two</mark>`);
  });

  it('does not bridge a line break between highlights', () => {
    expect(run(`<mark class="${YELLOW}">one</mark><br><mark class="${YELLOW}">two</mark>`))
      .toBe(`<mark class="${YELLOW}">one</mark><br><mark class="${YELLOW}">two</mark>`);
  });

  it('joins marks with no space between them', () => {
    expect(run(`<mark class="${YELLOW}">one</mark><mark class="${YELLOW}">two</mark>`))
      .toBe(`<mark class="${YELLOW}">onetwo</mark>`);
  });

  it('leaves an isolated highlight untouched', () => {
    expect(run(`<p>start <mark class="${YELLOW}">one</mark> end</p>`))
      .toBe(`<p>start <mark class="${YELLOW}">one</mark> end</p>`);
  });
});
