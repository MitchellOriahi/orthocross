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
    <div ref={scrollContainerRef} className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2" onScroll={onScroll}>
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
          <div className="relative">
            <LanguageList onPick={l => { setLanguage(l); setOpen(false); }} onScroll={handleScroll} scrollContainerRef={listRef} />
            {!atBottom && (
              <button
                type="button"
                onClick={scrollDown}
                aria-label={t("swipeForMoreLanguages")}
                className="absolute inset-x-0 bottom-1 z-10 flex justify-center"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-lg">
                  <ChevronDown className={`h-4 w-4 ${bounce ? "animate-bounce" : ""}`} />
                </span>
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
