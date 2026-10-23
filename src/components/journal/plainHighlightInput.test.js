import { describe, expect, it } from 'bun:test';
import { JSDOM } from 'jsdom';
import { leaveHighlightForInput } from './plainHighlightInput';

describe('typing with the highlighter off', () => {
  for (const position of ['inside', 'parent-after', 'parent-before', 'nested']) {
    it(`inserts plain text at ${position} without changing existing highlights`, () => {
      const dom = new JSDOM('<div contenteditable="true"></div>');
      const root = dom.window.document.querySelector('div');
      root.innerHTML = position === 'nested'
        ? '<mark class="journal-highlight-yellow"><mark class="journal-highlight-blue">Faith</mark></mark>'
        : '<mark class="journal-highlight-yellow">Faith</mark>';
      const range = dom.window.document.createRange();
      if (position === 'parent-after') range.setStart(root, 1);
      else if (position === 'parent-before') range.setStart(root, 0);
      else if (position !== 'nested') range.setStart(root.querySelector('mark').firstChild, 5);
      // For nested markup select its actual text node.
      if (position === 'nested') range.setStart(root.querySelector('mark mark').firstChild, 5);
      range.collapse(true);
      const selection = dom.window.getSelection();
      selection.addRange(range);
      expect(leaveHighlightForInput(root, selection)).toBe(true);
      const plain = selection.getRangeAt(0).startContainer;
      plain.textContent = ' new words';
      expect(plain.parentElement.closest('mark')).toBeNull();
      expect(Array.from(root.querySelectorAll('mark')).every(mark => mark.textContent === 'Faith')).toBe(true);
      expect(root.textContent).toBe(position === 'parent-before' ? ' new wordsFaith' : 'Faith new words');
    });
  }
});