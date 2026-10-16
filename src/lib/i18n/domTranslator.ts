/**
 * Whole-app text translation. Every visible English string is looked up in a per-language
 * dictionary (public/i18n/<lang>.json) and swapped in place; originals are remembered so
 * switching back to English restores them. Elements marked data-no-translate (Bible text,
 * user-written notes) and form fields are left untouched.
 */
type Dict = Record<string, string>;

const ATTRS = ["placeholder", "title", "aria-label"] as const;
const originals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const cache: Record<string, Dict> = {};
let dict: Dict | null = null;
let observer: MutationObserver | null = null;
let applying = false;

export async function loadDictionary(lang: string): Promise<Dict | null> {
  if (lang === "en") return null;
  if (cache[lang]) return cache[lang];
  try {
    const res = await fetch(`/i18n/${lang}.json`);
    if (!res.ok) return null;
    cache[lang] = await res.json();
    return cache[lang];
  } catch {
    return null;
  }
}

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

function skip(el: Element | null): boolean {
  if (!el) return true;
  if (el.closest("[data-no-translate],script,style,textarea,input,[contenteditable='true']")) return true;
  return false;
}

/** Translate one string: exact match, or keep surrounding whitespace/punctuation. */
export function translateString(text: string, d: Dict | null): string {
  if (!d) return text;
  const key = norm(text);
  if (!key) return text;
  const hit = d[key];
  if (hit === undefined) return text;
  const lead = text.match(/^\s*/)![0];
  const trail = text.match(/\s*$/)![0];
  return lead + hit + trail;
}

function translateText(node: Text) {
  if (skip(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  let original = originals.get(node);
  // The app replaced the text itself: treat the new value as the original.
  if (original === undefined || (current !== original && current !== translateString(original, dict))) {
    original = current;
    originals.set(node, original);
  }
  const next = translateString(original, dict);
  if (next !== current) node.nodeValue = next;
}

function translateAttrs(el: Element) {
  if (skip(el.parentElement) && el.closest("[data-no-translate]")) return;
  let saved = attrOriginals.get(el);
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v == null) continue;
    if (!saved) { saved = {}; attrOriginals.set(el, saved); }
    if (saved[a] === undefined || (v !== saved[a] && v !== translateString(saved[a], dict))) saved[a] = v;
    const next = translateString(saved[a], dict);
    if (next !== v) el.setAttribute(a, next);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (!(root instanceof Element)) return;
  if (root.closest("[data-no-translate],script,style")) return;
  translateAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) translateText(n as Text);
    else translateAttrs(n as Element);
    n = tw.nextNode();
  }
}

export function applyDictionary(d: Dict | null) {
  dict = d;
  applying = true;
  walk(document.body);
  applying = false;
  if (!observer) {
    observer = new MutationObserver(muts => {
      if (applying) return;
      applying = true;
      for (const m of muts) {
        if (m.type === "characterData") translateText(m.target as Text);
        else if (m.type === "attributes") translateAttrs(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
      applying = false;
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  }
}
