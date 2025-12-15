import { useState } from "react";
import { ChevronDown, Check, BookOpen, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  BIBLE_TRANSLATIONS,
  BibleTranslation,
  setUserPreferredTranslation,
} from "@/data/bibleTranslations";

interface TranslationSelectorProps {
  currentTranslation: BibleTranslation;
  onTranslationChange: (translation: BibleTranslation) => void;
}

export const TranslationSelector = ({
  currentTranslation,
  onTranslationChange,
}: TranslationSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<BibleTranslation | null>(null);

  const handleSelect = (translation: BibleTranslation) => {
    setUserPreferredTranslation(translation.id);
    onTranslationChange(translation);
    setOpen(false);
  };

  const showDetails = (translation: BibleTranslation, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForDetails(translation);
    setDetailsOpen(true);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-semibold hover:bg-muted/50"
          >
            <span className="text-primary">{currentTranslation.abbreviation}</span>
            <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-3 border-b">
            <h4 className="font-semibold text-sm">Bible Translation</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Currently reading: {currentTranslation.fullName}
            </p>
          </div>
          <ScrollArea className="h-[320px]">
            <div className="p-2 space-y-1">
              {BIBLE_TRANSLATIONS.map((translation) => (
                <div
                  key={translation.id}
                  className={`
                    flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors
                    ${currentTranslation.id === translation.id 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'hover:bg-muted/50'}
                  `}
                  onClick={() => handleSelect(translation)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${currentTranslation.id === translation.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'}
                    `}>
                      {currentTranslation.id === translation.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <BookOpen className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {translation.abbreviation}
                        </span>
                        {translation.isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {translation.fullName}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={(e) => showDetails(translation, e)}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-2 border-t bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Some translations require proper licensing for digital distribution
            </p>
          </div>
        </PopoverContent>
      </Popover>

      {/* Translation Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedForDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>{selectedForDetails.abbreviation}</span>
                  <span className="text-muted-foreground font-normal">—</span>
                  <span className="font-normal">{selectedForDetails.fullName}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedForDetails.description}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tradition</p>
                    <p className="text-sm font-medium">{selectedForDetails.tradition}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Year Published</p>
                    <p className="text-sm font-medium">{selectedForDetails.year}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Translation Philosophy</p>
                    <p className="text-sm font-medium">{selectedForDetails.translationPhilosophy}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">License</p>
                    <Badge 
                      variant={selectedForDetails.license === 'public_domain' ? 'secondary' : 'outline'}
                      className={selectedForDetails.license === 'public_domain' ? 'text-green-600' : ''}
                    >
                      {selectedForDetails.license === 'public_domain' ? 'Public Domain' : 'Licensed'}
                    </Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    handleSelect(selectedForDetails);
                    setDetailsOpen(false);
                  }}
                >
                  {currentTranslation.id === selectedForDetails.id
                    ? 'Currently Selected'
                    : `Switch to ${selectedForDetails.abbreviation}`}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
