import { describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { sentenceBounds, toggleHighlightAt } from './highlightRange';

const dom = new JSDOM('<!doctype html>');
globalThis.Node = dom.window.Node;
const color = 'journal-highlight-yellow';
const rootFor = html => {
  const root = dom.window.document.createElement('div');
  root.innerHTML = html;
  return root;
};
const tap = (root, word, mode = 'sentence', nextColor = color) => {
  const walker = dom.window.document.createTreeWalker(root, 4);
  let node;
  while ((node = walker.nextNode())) {
    const index = node.textContent.indexOf(word);
    if (index >= 0) return toggleHighlightAt(root, node, index + 1, mode, nextColor);
  }
  throw new Error('Missing target word');
};

// The user's rule: a highlight never paints whitespace, so every mark's text
// must be bare words — no space, tab or line break inside a stroke.
const expectNoPaintedWhitespace = root => {
  for (const mark of Array.from(root.querySelectorAll('mark'))) {
    expect((mark.textContent || '')).toBe((mark.textContent || '').trim());
    for (const child of Array.from(mark.childNodes)) {
      if (child.nodeType === 3) {
        expect((child.textContent || '').trim().length).toBeGreaterThan(0);
      }
    }
  }
};

describe('sentence boundaries', () => {
  for (const punctuation of ['.', '?', '!', '…', '。', '؟']) {
    it(`ends a sentence at ${punctuation}`, () => {
      const first = `Have faith${punctuation}`;
      expect(sentenceBounds(`${first} Rise anew.`, 2)).toEqual([0, first.length]);
    });
  }
  it('includes closing quotation marks', () => {
    expect(sentenceBounds('“Rise!” Go onward.', 2)).toEqual([0, 7]);
  });
  it('handles a final sentence without punctuation', () => {
    expect(sentenceBounds('Rise. Keep going', 8)).toEqual([6, 16]);
  });
});

describe('word and sentence highlighting', () => {
  it('keeps a word in one highlight when its last letter is a separate text fragment', () => {
    const root = rootFor('Flexxagainng');
    root.firstChild.splitText(10);
    root.insertBefore(dom.window.document.createTextNode(''), root.lastChild);
    tap(root, 'Flexx', 'word');
    expect(root.querySelectorAll('mark').length).toBe(1);
    expect(root.querySelector('mark').textContent).toBe('Flexxagainng');
  });
  it('highlights every word of the tapped sentence without painting spaces', () => {
    const root = rootFor('Have <strong>faith</strong> today! Rise anew.');
    tap(root, 'faith');
    expect(root.querySelectorAll('mark').length).toBe(3);
    expect(root.textContent).toBe('Have faith today! Rise anew.');
    expect(root.querySelector('strong').textContent).toBe('faith');
    expectNoPaintedWhitespace(root);
  });
  it('removes a single word from a highlighted sentence', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word');
    expect(root.querySelectorAll('mark').length).toBe(2);
    expect(root.textContent).toBe('Have faith today.');
    expectNoPaintedWhitespace(root);
  });
  it('removes a word inside nested formatting without losing surrounding highlights', () => {
    const root = rootFor(`<mark class="${color}">Have <strong>firm faith always</strong> today.</mark>`);
    tap(root, 'faith', 'word');
    expect(root.textContent).toBe('Have firm faith always today.');
    expect(root.querySelectorAll('strong').length).toBeGreaterThan(0);
    expectNoPaintedWhitespace(root);
  });
  it('restores the removed word and leaves spaces unpainted', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word');
    tap(root, 'faith', 'word');
    expect(root.querySelectorAll('mark').length).toBe(3);
    expect(root.textContent).toBe('Have faith today.');
    expectNoPaintedWhitespace(root);
  });
  it('repaints one word without changing the rest of the sentence', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word', 'journal-highlight-blue');
    expect(root.querySelector('.journal-highlight-blue').textContent).toBe('faith');
    expect(
      Array.from(root.querySelectorAll('.journal-highlight-yellow'), mark => mark.textContent).join(' '),
    ).toBe('Have today.');
  });
  it('removes only one sentence from a joined two-sentence highlight', () => {
    const root = rootFor('Have faith. Rise anew!');
    tap(root, 'faith'); tap(root, 'anew'); tap(root, 'faith');
    // Removing 'faith' keeps the rest of both sentences highlighted;
    // the sentence's own period stays part of the highlight.
    expect(
      Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join(' '),
    ).toBe('Have . Rise anew!');
    expect(root.textContent).toBe('Have faith. Rise anew!');
    expectNoPaintedWhitespace(root);
  });
  it('stops at line breaks and paragraph boundaries', () => {
    const root = rootFor('<p>Have faith<br>Rise anew</p><p>Keep going.</p>');
    tap(root, 'faith');
    expect(root.querySelector('mark').textContent).toBe('Have');
    expect(root.querySelectorAll('mark').length).toBe(2);
    expect(root.textContent).toBe('Have faithRise anewKeep going.');
  });
  it('allows removing a word from an older saved highlight', () => {
    const root = rootFor('<mark class="bg-yellow-200 dark:bg-yellow-900/50">Have faith today.</mark>');
    tap(root, 'faith', 'word');
    expect(
      Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join(' '),
    ).toBe('Have today.');
    expectNoPaintedWhitespace(root);
  });
  it('keeps the space between two highlighted words unpainted', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'Have', 'word');
    tap(root, 'faith', 'word');
    expect(root.querySelectorAll('mark').length).toBe(2);
    expect(root.textContent).toBe('Have faith today.');
    expectNoPaintedWhitespace(root);
  });
});
