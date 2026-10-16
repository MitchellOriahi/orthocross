import { useEffect, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";

/** Scrollable list of every supported language, native name first. */
export function LanguageList({ onPick, onScroll }: { onPick: (l: LanguageCode) => void; onScroll?: () => void }) {
  const { language } = useLanguage();
  return (
    <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2" onScroll={onScroll}>
      {LANGUAGES.map(l => (
        <Button key={l.code} variant={l.code === language ? "default" : "outline"} className="h-12 justify-between rounded-full px-5" onClick={() => onPick(l.code)}>
          <span dir={l.rtl ? "rtl" : "ltr"} className="font-semibold">{l.native}</span>
          <span className="text-xs opacity-70">{l.english}</span>
        </Button>
      ))}
    </div>
  );
}

const SWIPE_HINT_SEEN_KEY = "orthocross-language-swipe-hint-seen";

export const LanguageButton = () => {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { t, setLanguage } = useLanguage();

  useEffect(() => {
    if (!open) {
      setShowHint(false);
      return;
    }
    if (!localStorage.getItem(SWIPE_HINT_SEEN_KEY)) {
      localStorage.setItem(SWIPE_HINT_SEEN_KEY, "1");
      setShowHint(true);
    }
  }, [open]);

  const dismissHint = () => setShowHint(false);

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title={t("language")} aria-label={t("language")}>
        <Globe className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="text-2xl">{t("chooseLanguage")}</DialogTitle>
          <DialogDescription>{t("languageNote")}</DialogDescription>
          <div className="relative">
            <LanguageList onPick={l => { setLanguage(l); setOpen(false); }} onScroll={dismissHint} />
            {showHint && (
              <div className="pointer-events-none absolute inset-x-0 bottom-1 z-10 flex justify-center">
                <div className="flex items-center gap-2 rounded-full border bg-background px-4 py-2 shadow-lg">
                  <ChevronDown className="h-4 w-4 animate-bounce" />
                  <span className="text-sm font-medium">{t("swipeForMoreLanguages")}</span>
                  <ChevronDown className="h-4 w-4 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
