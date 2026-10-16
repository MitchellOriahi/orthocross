import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, TRANSLATIONS, type LanguageCode, type TranslationKey } from "@/lib/i18n/translations";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import { applyDictionary, loadDictionary, translateString } from "@/lib/i18n/domTranslator";

const KEY = "orthocross-language";
export const hasChosenLanguage = () => !!localStorage.getItem(KEY);

interface Ctx { language: LanguageCode; setLanguage: (l: LanguageCode) => void; t: (k: TranslationKey) => string; tr: (text: string) => string }
const LanguageContext = createContext<Ctx>({ language: "en", setLanguage: () => {}, t: k => TRANSLATIONS.en[k], tr: s => s });

function readStored(): LanguageCode {
  const v = localStorage.getItem(KEY);
  return LANGUAGES.some(l => l.code === v) ? (v as LanguageCode) : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<LanguageCode>(readStored);
  const [dict, setDict] = useState<Record<string, string> | null>(null);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = LANGUAGES.find(l => l.code === language)?.rtl ? "rtl" : "ltr";
    let alive = true;
    const started = Date.now();
    loadDictionary(language).then(d => {
      if (!alive) return;
      setDict(d); applyDictionary(d);
      // Keep the splash briefly so the switch feels deliberate, then reveal the translated app.
      setTimeout(() => { if (alive) setSwitching(false); }, Math.max(0, 600 - (Date.now() - started)));
    }).catch(() => { if (alive) setSwitching(false); });
    return () => { alive = false; };
  }, [language]);
  const setLanguage = useCallback((l: LanguageCode) => {
    if (localStorage.getItem(KEY) !== l) localStorage.removeItem("preferredBibleTranslation");
    if (localStorage.getItem(KEY) !== l || l !== language) setSwitching(true);
    localStorage.setItem(KEY, l); setLang(l);
  }, [language]);
  const t = useCallback((k: TranslationKey) => TRANSLATIONS[language]?.[k] ?? TRANSLATIONS.en[k] ?? k, [language]);
  const tr = useCallback((s: string) => translateString(s, dict), [dict]);
  return <LanguageContext.Provider value={{ language, setLanguage, t, tr }}>
    {children}
    {switching && (
      <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-6 bg-background" data-no-translate>
        <div className="h-24 w-24 animate-pulse rounded-3xl bg-foreground p-3 shadow-lg dark:bg-card">
          <img src={orthodoxCross} alt="OrthoCross" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">OrthoCross</h1>
        <div className="flex gap-1">
          {[0, 150, 300].map(d => <div key={d} className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${d}ms` }} />)}
        </div>
      </div>
    )}
  </LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
