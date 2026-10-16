import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES, type LanguageCode } from "@/lib/i18n/translations";

/** Scrollable list of every supported language, native name first. */
export function LanguageList({ onPick }: { onPick: (l: LanguageCode) => void }) {
  const { language } = useLanguage();
  return (
    <div className="flex max-h-[55vh] flex-col gap-2 overflow-y-auto pt-2">
      {LANGUAGES.map(l => (
        <Button key={l.code} variant={l.code === language ? "default" : "outline"} className="h-12 justify-between rounded-full px-5" onClick={() => onPick(l.code)}>
          <span dir={l.rtl ? "rtl" : "ltr"} className="font-semibold">{l.native}</span>
          <span className="text-xs opacity-70">{l.english}</span>
        </Button>
      ))}
    </div>
  );
}

export const LanguageButton = () => {
  const [open, setOpen] = useState(false);
  const { t, setLanguage } = useLanguage();
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)} title={t("language")} aria-label={t("language")}>
        <Globe className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="text-2xl">{t("chooseLanguage")}</DialogTitle>
          <DialogDescription>{t("languageNote")}</DialogDescription>
          <LanguageList onPick={l => { setLanguage(l); setOpen(false); }} />
        </DialogContent>
      </Dialog>
    </>
  );
};
