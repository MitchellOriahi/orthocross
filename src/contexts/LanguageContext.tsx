import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, TRANSLATIONS, type LanguageCode, type TranslationKey } from "@/lib/i18n/translations";
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
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = LANGUAGES.find(l => l.code === language)?.rtl ? "rtl" : "ltr";
    let alive = true;
    loadDictionary(language).then(d => { if (alive) { setDict(d); applyDictionary(d); } });
    return () => { alive = false; };
  }, [language]);
  const setLanguage = useCallback((l: LanguageCode) => {
    if (localStorage.getItem(KEY) !== l) localStorage.removeItem("preferredBibleTranslation");
    localStorage.setItem(KEY, l); setLang(l);
  }, []);
  const t = useCallback((k: TranslationKey) => TRANSLATIONS[language]?.[k] ?? TRANSLATIONS.en[k] ?? k, [language]);
  const tr = useCallback((s: string) => translateString(s, dict), [dict]);
  return <LanguageContext.Provider value={{ language, setLanguage, t, tr }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
