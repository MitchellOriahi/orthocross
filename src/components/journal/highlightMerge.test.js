import { describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.Node = dom.window.Node;

const { mergeWithAdjacentHighlights, stripMarkWhitespace } = await import('./highlightMerge');

const YELLOW = 'bg-yellow-200 dark:bg-yellow-900/50';
const GREEN = 'bg-green-200 dark:bg-green-900/50';

const run = (html) => {
  const root = dom.window.document.createElement('div');
  root.innerHTML = html;
  const marks = root.querySelectorAll('mark');
  mergeWithAdjacentHighlights(marks[marks.length - 1]);
  return root.innerHTML;
};

const strip = (html) => {
  const root = dom.window.document.createElement('div');
  root.innerHTML = html;
  stripMarkWhitespace(root.querySelector('mark'));
  return root.innerHTML;
};

describe('mergeWithAdjacentHighlights', () => {
  for (const direction of ['backwards', 'forwards']) {
    it(`joins a final letter across multiple empty text nodes ${direction}`, () => {
      const root = dom.window.document.createElement('div');
      root.innerHTML = `<mark class="${YELLOW}">Flexxing</mark><mark class="${YELLOW}">g</mark>`;
      const [first, last] = root.querySelectorAll('mark');
      root.insertBefore(dom.window.document.createTextNode(''), last);
      root.insertBefore(dom.window.document.createTextNode(''), last);
      mergeWithAdjacentHighlights(direction === 'backwards' ? last : first);
      expect(root.querySelectorAll('mark').length).toBe(1);
      expect(root.textContent).toBe('Flexxingg');
    });
  }

  it('keeps the space between two same-colour words unpainted', () => {
    expect(run(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`))
      .toBe(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`);
  });

  it('stays separate when the earlier word is highlighted last', () => {
    const root = dom.window.document.createElement('div');
    root.innerHTML = `<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`;
    const survivor = mergeWithAdjacentHighlights(root.querySelector('mark'));
    expect(root.innerHTML).toBe(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`);
    expect(survivor.textContent).toBe('one');
  });

  it('keeps three same-colour words apart across spaces', () => {
    expect(run(
      `<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark> <mark class="${YELLOW}">three</mark>`,
    )).toBe(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark> <mark class="${YELLOW}">three</mark>`);
  });

  it('absorbs invisible empty fragments without pulling a space inside', () => {
    const root = dom.window.document.createElement('div');
    root.innerHTML = `<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`;
    const last = root.querySelectorAll('mark')[1];
    for (const text of ['', '']) root.insertBefore(dom.window.document.createTextNode(text), last);
    mergeWithAdjacentHighlights(last);
    expect(root.querySelectorAll('mark').length).toBe(2);
    expect(root.textContent).toBe('one two');
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

describe('stripMarkWhitespace', () => {
  it('splits an interior space out of a highlight', () => {
    expect(strip(`<mark class="${YELLOW}">one two</mark>`))
      .toBe(`<mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark>`);
  });

  it('lifts edge whitespace out of a highlight', () => {
    expect(strip(`<mark class="${YELLOW}"> one two </mark>`))
      .toBe(` <mark class="${YELLOW}">one</mark> <mark class="${YELLOW}">two</mark> `);
  });

  it('dissolves a highlight holding only whitespace', () => {
    expect(strip(`<mark class="${YELLOW}">  </mark>`)).toBe('  ');
  });

  it('keeps formatting elements whole while splitting text', () => {
    expect(strip(`<mark class="${YELLOW}"><strong>one</strong> two</mark>`))
      .toBe(`<mark class="${YELLOW}"><strong>one</strong></mark> <mark class="${YELLOW}">two</mark>`);
  });

  it('leaves a highlight without whitespace untouched', () => {
    expect(strip(`<p>a <mark class="${YELLOW}">one</mark></p>`))
      .toBe(`<p>a <mark class="${YELLOW}">one</mark></p>`);
  });
});
