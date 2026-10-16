import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, TRANSLATIONS, type LanguageCode, type TranslationKey } from "@/lib/i18n/translations";

const KEY = "orthocross-language";
export const hasChosenLanguage = () => !!localStorage.getItem(KEY);

interface Ctx { language: LanguageCode; setLanguage: (l: LanguageCode) => void; t: (k: TranslationKey) => string }
const LanguageContext = createContext<Ctx>({ language: "en", setLanguage: () => {}, t: k => TRANSLATIONS.en[k] });

function readStored(): LanguageCode {
  const v = localStorage.getItem(KEY);
  return LANGUAGES.some(l => l.code === v) ? (v as LanguageCode) : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<LanguageCode>(readStored);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = LANGUAGES.find(l => l.code === language)?.rtl ? "rtl" : "ltr";
  }, [language]);
  const setLanguage = useCallback((l: LanguageCode) => { localStorage.setItem(KEY, l); setLang(l); }, []);
  const t = useCallback((k: TranslationKey) => TRANSLATIONS[language]?.[k] ?? TRANSLATIONS.en[k], [language]);
  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
