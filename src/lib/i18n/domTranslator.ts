/**
 * Whole-app text translation. Every visible English string is looked up in a per-language
 * dictionary (public/i18n/<lang>.json) and swapped in place; originals are remembered so
 * switching back to English restores them. Elements marked data-no-translate (Bible text,
 * user-written notes) and form fields are left untouched.
 */
import { fitPageTitles } from "./layoutFitting";
type Dict = Record<string, string>;

const ATTRS = ["placeholder", "title", "aria-label"] as const;
const originals = new WeakMap<Text, string>();
const attrOriginals = new WeakMap<Element, Record<string, string>>();
const cache: Record<string, Dict> = {};
let dict: Dict | null = null;
let previousDict: Dict | null = null;
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

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const DATE_WORD = new RegExp(`\\b(${[...MONTHS, ...DAYS, "Present Day", "AD", "BC"].join("|")})\\b`, "g");

/** Find a translation for an already-normalised key, trying a few safe fallbacks. */
function lookup(key: string, d: Dict, depth = 0): string | undefined {
  const hit = d[key];
  if (hit !== undefined) return hit;
  if (depth > 1) return undefined;
  // Trailing parenthetical such as "(33–313 AD)" or "(Thrice)".
  const paren = key.match(/^(.+?)\s*(\([^()]*\))$/);
  if (paren) {
    const base = lookup(paren[1], d, depth + 1);
    if (base !== undefined) return `${base} ${paren[2]}`;
  }
  // Leading or trailing number, e.g. "5 day streak", "Page 3".
  const lead = key.match(/^([\d.,:/–-]+)\s+(.+)$/);
  if (lead) { const r = lookup(lead[2], d, depth + 1); if (r !== undefined) return `${lead[1]} ${r}`; }
  const trail = key.match(/^(.+?)\s+([\d.,:/–-]+)$/);
  if (trail) { const r = lookup(trail[1], d, depth + 1); if (r !== undefined) return `${r} ${trail[2]}`; }
  // Dates built from month/day names and numbers, e.g. "October 18".
  if (DATE_WORD.test(key) && /^[A-Za-z\d\s,–-]+$/.test(key)) {
    DATE_WORD.lastIndex = 0;
    return key.replace(DATE_WORD, w => d[w] ?? w);
  }
  DATE_WORD.lastIndex = 0;
  return undefined;
}

/** Translate one string: exact match (with fallbacks), line-by-line for multi-line text. */
export function translateString(text: string, d: Dict | null): string {
  if (!d) return text;
  const key = norm(text);
  if (!key || key === "OrthoCross") return text;
  let hit = lookup(key, d);
  if (hit === undefined && /\n/.test(text.trim())) {
    const lines = text.split("\n");
    const out = lines.map(l => translateString(l, d));
    if (out.some((l, i) => l !== lines[i])) return out.join("\n");
  }
  if (hit === undefined) {
    // Sentence-by-sentence for long paragraphs.
    const parts = key.split(/(?<=[.!?])\s+/);
    if (parts.length > 1) {
      const out = parts.map(p => lookup(p, d));
      if (out.some(Boolean)) hit = out.map((p, i) => p ?? parts[i]).join(" ");
    }
  }
  if (hit === undefined) return text;
  // The app name is never translated.
  if (key.includes("OrthoCross") && !hit.includes("OrthoCross")) return text;
  const lead = text.match(/^\s*/)?.[0] ?? "";
  const trail = text.match(/\s*$/)?.[0] ?? "";
  return lead + hit + trail;
}

function translateText(node: Text) {
  if (skip(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  let original = originals.get(node);
  // The app replaced the text itself: treat the new value as the original.
  if (original === undefined || (current !== original && current !== translateString(original, dict) && current !== translateString(original, previousDict))) {
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
    if (saved[a] === undefined || (v !== saved[a] && v !== translateString(saved[a], dict) && v !== translateString(saved[a], previousDict))) saved[a] = v;
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
  previousDict = dict;
  dict = d;
  applying = true;
  walk(document.body);
  fitPageTitles();
  applying = false;
  previousDict = null;
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
      fitPageTitles();
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
  }
}

/** Wait for translated React updates and DOM translation to settle before revealing the app. */
export function waitForTranslationSettled(signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    let quietFrames = 0;
    let frame = 0;
    const mutations = new MutationObserver(() => { quietFrames = 0; });
    const finish = () => {
      mutations.disconnect();
      cancelAnimationFrame(frame);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    if (signal.aborted) return finish();
    mutations.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    signal.addEventListener("abort", finish, { once: true });
    const check = () => {
      quietFrames += 1;
      if (quietFrames >= 3) finish();
      else frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
  });
}
