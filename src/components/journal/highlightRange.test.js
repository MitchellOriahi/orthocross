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
  it('highlights only the full tapped sentence across formatting', () => {
    const root = rootFor('Have <strong>faith</strong> today! Rise anew.');
    tap(root, 'faith');
    expect(Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join('')).toBe('Have faith today!');
    expect(root.querySelector('strong').textContent).toBe('faith');
    expect(root.textContent).toBe('Have faith today! Rise anew.');
  });
  it('removes a single word from a highlighted sentence', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word');
    expect(Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join('')).toBe('Have  today.');
    expect(root.textContent).toBe('Have faith today.');
  });
  it('removes a word inside nested formatting without losing surrounding highlights', () => {
    const root = rootFor(`<mark class="${color}">Have <strong>firm faith always</strong> today.</mark>`);
    tap(root, 'faith', 'word');
    expect(Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join('')).toBe('Have firm  always today.');
    expect(root.querySelectorAll('strong').length).toBeGreaterThan(0);
    expect(root.textContent).toBe('Have firm faith always today.');
  });
  it('restores the removed word and rejoins the highlight', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word');
    tap(root, 'faith', 'word');
    expect(root.querySelectorAll('mark').length).toBe(1);
    expect(root.querySelector('mark').textContent).toBe('Have faith today.');
  });
  it('repaints one word without changing the rest of the sentence', () => {
    const root = rootFor('Have faith today.');
    tap(root, 'faith');
    tap(root, 'faith', 'word', 'journal-highlight-blue');
    expect(root.querySelector('.journal-highlight-blue').textContent).toBe('faith');
    expect(Array.from(root.querySelectorAll(`.${color}`), mark => mark.textContent).join('')).toBe('Have  today.');
  });
  it('removes only one sentence from a joined two-sentence highlight', () => {
    const root = rootFor('Have faith. Rise anew!');
    tap(root, 'faith'); tap(root, 'anew'); tap(root, 'faith');
    expect(root.querySelector('mark').textContent.trim()).toBe('Rise anew!');
  });
  it('stops at line breaks and paragraph boundaries', () => {
    const root = rootFor('<p>Have faith<br>Rise anew</p><p>Keep going.</p>');
    tap(root, 'faith');
    expect(root.querySelector('mark').textContent).toBe('Have faith');
  });
  it('allows removing a word from an older saved highlight', () => {
    const root = rootFor('<mark class="bg-yellow-200 dark:bg-yellow-900/50">Have faith today.</mark>');
    tap(root, 'faith', 'word');
    expect(Array.from(root.querySelectorAll('mark'), mark => mark.textContent).join('')).toBe('Have  today.');
  });
});