import { useEffect, useRef, useState } from "react";
import type { Ref, UIEvent } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";

/** Scrollable list of every supported language, native name first. */
export function LanguageList({ onPick, onScroll, scrollContainerRef }: { onPick: (l: LanguageCode) => void; onScroll?: (e: UIEvent<HTMLDivElement>) => void; scrollContainerRef?: Ref<HTMLDivElement> }) {
  const { language } = useLanguage();
  return (
    <div ref={scrollContainerRef} className="scrollbar-hidden flex max-h-[55vh] flex-col gap-3 overflow-y-auto pt-2" onScroll={onScroll}>
      {LANGUAGES.map(l => (
        <Button key={l.code} variant={l.code === language ? "default" : "outline"} className="h-14 justify-between rounded-full px-6 text-base" onClick={() => onPick(l.code)}>
          <span dir={l.rtl ? "rtl" : "ltr"} className="text-base font-semibold">{l.native}</span>
          <span className="text-sm opacity-70">{l.english}</span>
        </Button>
      ))}
    </div>
  );
}

const SWIPE_HINT_SEEN_KEY = "orthocross-language-swipe-hint-seen";
const SCROLL_STEP = 180; // roughly three language rows

export const LanguageButton = () => {
  const [open, setOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { t, setLanguage } = useLanguage();

  useEffect(() => {
    if (!open) {
      setBounce(false);
      setAtBottom(false);
      return;
    }
    if (!localStorage.getItem(SWIPE_HINT_SEEN_KEY)) {
      localStorage.setItem(SWIPE_HINT_SEEN_KEY, "1");
      setBounce(true);
    }
  }, [open]);

  const scrollDown = () => listRef.current?.scrollBy({ top: SCROLL_STEP, behavior: "smooth" });

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 8);
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title={t("language")} aria-label={t("language")}>
        <Globe className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="text-2xl">{t("chooseLanguage")}</DialogTitle>
          <DialogDescription>{t("swipeForMoreLanguages")}</DialogDescription>
          <div className="flex flex-col items-center gap-3">
            <LanguageList onPick={l => { setLanguage(l); setOpen(false); }} onScroll={handleScroll} scrollContainerRef={listRef} />
            {!atBottom && (
              <button
                type="button"
                onClick={scrollDown}
                aria-label={t("swipeForMoreLanguages")}
                className={`flex justify-center ${bounce ? "animate-bounce" : ""}`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-lg ${bounce ? "language-hint-glow" : ""}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
