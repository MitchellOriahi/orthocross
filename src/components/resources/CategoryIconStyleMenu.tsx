import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from "@/components/ui/dropdown-menu";
import { CATEGORY_ICON_STYLES, CATEGORY_ICON_STYLE_LABELS, useCategoryIconStyle } from "@/hooks/useCategoryIconStyle";

export function CategoryIconStyleMenu() {
  const { style, setStyle } = useCategoryIconStyle();
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="ml-auto shrink-0 gap-1.5" aria-label={`Icons: ${CATEGORY_ICON_STYLE_LABELS[style]}`}>
        Icons<ChevronDown className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuRadioGroup value={style} onValueChange={setStyle}>
        {CATEGORY_ICON_STYLES.map(value => <DropdownMenuRadioItem key={value} value={value}>{CATEGORY_ICON_STYLE_LABELS[value]}</DropdownMenuRadioItem>)}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>;
}