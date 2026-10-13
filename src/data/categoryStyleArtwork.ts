import type { SaintDisplayIcon } from "./saintDisplayIcons";
import { SAINT_DISPLAY_ICONS } from "./saintDisplayIcons";
import { SAINT_CARD_ICONS } from "./saintCardIcons";
import type { SaintCategoryId } from "./saintCategories";
import type { PrayerCategoryId } from "./prayerCategories";
import type { CategoryIconStyle } from "@/hooks/useCategoryIconStyle";
import coptic_michael from "@/assets/category-styles/coptic-michael.jpg.asset.json";
import coptic_desert_fathers from "@/assets/category-styles/coptic-desert-fathers.jpg.asset.json";
import coptic_mercurios from "@/assets/category-styles/coptic-mercurios.jpg.asset.json";
import coptic_holy_family from "@/assets/category-styles/coptic-holy-family.jpg.asset.json";
import coptic_communion from "@/assets/category-styles/coptic-communion.jpg.asset.json";
import tewahedo_mary_george from "@/assets/category-styles/tewahedo-mary-george.jpg.asset.json";
import tewahedo_hierarchs from "@/assets/category-styles/tewahedo-hierarchs.jpg.asset.json";
import tewahedo_communion from "@/assets/category-styles/tewahedo-communion.jpg.asset.json";
import byzantine_communion from "@/assets/category-styles/byzantine-communion.jpg.asset.json";
import coptic_mark from "@/assets/category-styles/coptic-mark.jpg.asset.json";
import coptic_simon from "@/assets/category-styles/coptic-simon.jpg.asset.json";
import coptic_christ from "@/assets/category-styles/coptic-christ.jpg.asset.json";
import tewahedo_angels from "@/assets/category-styles/tewahedo-angels.jpg.asset.json";
import tewahedo_selassie_panel_sq from "@/assets/category-styles/tewahedo-selassie-panel-sq.jpg.asset.json";
import tewahedo_selassie_manuscript_sq from "@/assets/category-styles/tewahedo-selassie-manuscript-sq.jpg.asset.json";
import tewahedo_theotokos_sq from "@/assets/category-styles/tewahedo-theotokos-sq.jpg.asset.json";
import tewahedo_george_sq from "@/assets/category-styles/tewahedo-george-sq.jpg.asset.json";
import tewahedo_angels_michael_sq from "@/assets/category-styles/tewahedo-angels-michael-sq.jpg.asset.json";
import tewahedo_archangel_wings_sq from "@/assets/category-styles/tewahedo-archangel-wings-sq.jpg.asset.json";
import tewahedo_laypeople from "@/assets/category-styles/tewahedo-laypeople.jpg.asset.json";

const art: Record<string, SaintDisplayIcon> = {
  "coptic-michael": { image_url: coptic_michael.url, "image_source": "https://commons.wikimedia.org/wiki/File:Coptic_Icon_of_the_Archangel_Michael.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Unknown author Unknown author", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-desert-fathers": { image_url: coptic_desert_fathers.url, "image_source": "https://commons.wikimedia.org/wiki/File:Coptic_anthony_and_paul.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Anonymous  Unknown author", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-mercurios": { image_url: coptic_mercurios.url, "image_source": "https://commons.wikimedia.org/wiki/File:St._Mercurios_Killing_King_Oleonus_%28St._Mercurios_Killing_Emperor_Julian_the_Apostate%29_%283309043161%29.jpg", "image_license": "CC BY 2.0", "image_license_url": "https://creativecommons.org/licenses/by/2.0", "image_author": "A. Davey  from Where I Live Now: Pacific Northwest", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-holy-family": { image_url: coptic_holy_family.url, "image_source": "https://commons.wikimedia.org/wiki/File:Flight_into_Egypt_%28coptic_icon%29.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Anonymous  Unknown author", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-communion": { image_url: coptic_communion.url, "image_source": "https://commons.wikimedia.org/wiki/File:Last_Supper_Sharm_el-Sheikh.JPG", "image_license": "CC BY-SA 4.0", "image_license_url": "https://creativecommons.org/licenses/by-sa/4.0", "image_author": "Robert Schediwy", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "tewahedo-mary-george": { image_url: tewahedo_mary_george.url, "image_source": "https://commons.wikimedia.org/wiki/File:Ethiopian_-_Diptych_Icon_with_Saint_George%2C_and_Mary_and_the_Infant_Christ_-_Walters_3616_-_Open.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Anonymous  (  Ethiopia  ) Unknown author", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "tewahedo-hierarchs": { image_url: tewahedo_hierarchs.url, "image_source": "https://commons.wikimedia.org/wiki/File:Ethiopian_Saints_%2810335517745%29.jpg", "image_license": "CC BY-SA 2.0", "image_license_url": "https://creativecommons.org/licenses/by-sa/2.0", "image_author": "Ted", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "tewahedo-communion": { image_url: tewahedo_communion.url, "image_source": "https://commons.wikimedia.org/wiki/File:Int%C3%A9rieur_Debre_Berhan_Selassie6.jpg", "image_license": "CC BY-SA 2.0", "image_license_url": "https://creativecommons.org/licenses/by-sa/2.0", "image_author": "sameffron", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "byzantine-communion": { image_url: byzantine_communion.url, "image_source": "https://commons.wikimedia.org/wiki/File:Last_Supper_Greek_Icon.tif", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Unknown author Unknown author", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-mark": { image_url: coptic_mark.url, "image_source": "https://commons.wikimedia.org/wiki/File:StMarkcoptic.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Ldingley  at  English Wikipedia  and/or  Lanternix", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-simon": { image_url: coptic_simon.url, "image_source": "https://commons.wikimedia.org/wiki/File:Abraham_of_Alexandria_with_Simon_the_Tanner.jpg", "image_license": "CC BY-SA 4.0", "image_license_url": "https://creativecommons.org/licenses/by-sa/4.0", "image_author": "松照庵", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "coptic-christ": { image_url: coptic_christ.url, "image_source": "https://commons.wikimedia.org/wiki/File:ChristCopticArt.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Afanous  at  English Wikipedia", "image_modification": "Resized; square cover framing at display; original painting colors retained." },
  "tewahedo-angels": { image_url: tewahedo_angels.url, "image_source": "https://commons.wikimedia.org/wiki/File:Ethiopian_-_Folding_Processional_Icon_in_the_Shape_of_a_Fan_-_Walters_369_-_Open.jpg", "image_license": "Public domain", "image_license_url": "https://creativecommons.org/publicdomain/mark/1.0/", "image_author": "Anonymous  (  Ethiopia  ) Unknown author", "image_modification": "Cropped central register including museum-identified Michael, Mary and Raphael from the Ethiopian processional icon; resized." },
  // Owner-supplied photographs of Tewahedo artwork: no online source or licence
  // link exists, so both stay empty and the credit line renders as plain text.
  "tewahedo-angels-michael": { image_url: tewahedo_angels_michael_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox illumination of the Archangel Michael with sword above the angel hosts; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-theotokos": { image_url: tewahedo_theotokos_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox icon of the Theotokos holding the Christ Child, flanked by two angels; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-selassie-panel": { image_url: tewahedo_selassie_panel_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox icon of the Holy Trinity (Selassie) with the four living creatures; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-selassie-manuscript": { image_url: tewahedo_selassie_manuscript_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox manuscript miniature of the Holy Trinity (Selassie) with the four living creatures; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-george": { image_url: tewahedo_george_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox icon of Saint George on horseback slaying the dragon, with the rescued maiden in the tree; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-archangel-wings": { image_url: tewahedo_archangel_wings_sq.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox icon of an archangel with rainbow-coloured wings above the fiery pit, flanked by two angels; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
  "tewahedo-laypeople": { image_url: tewahedo_laypeople.url, "image_source": "", "image_license": "Supplied by the app owner", "image_license_url": "", "image_author": "Ethiopian Orthodox illumination panel of winged cherubim faces in a red-and-orange grid; photograph supplied by the app owner", "image_modification": "Square-cropped from the supplied photograph so the tile fills without background bands; original colors retained." },
};

function saved(id: string): SaintDisplayIcon {
  const icon = SAINT_CARD_ICONS[id];
  if (!icon) throw new Error(`Missing category artwork: ${id}`);
  const licenseUrl = icon.image_license === "Public domain" ? "https://creativecommons.org/publicdomain/mark/1.0/" : icon.image_license === "CC0" ? "https://creativecommons.org/publicdomain/zero/1.0/" : icon.image_license.includes("4.0") ? "https://creativecommons.org/licenses/by-sa/4.0/" : "https://creativecommons.org/licenses/by-sa/3.0/";
  return { image_url: icon.image_url, image_source: icon.image_source, image_author: icon.image_attribution, image_license: icon.image_license, image_license_url: licenseUrl, image_modification: "Existing credited portrait; square cover framing; original colors retained." };
}
const tewahedoMonastic = saved("tekle-haymanot");
const copticFather = saved("severus-antioch");
const byzantineAngel = saved("michael");
const byzantineDavid = saved("david");
const byzantineAnna = saved("anna");
type AlternateStyle = Exclude<CategoryIconStyle, "original">;

export const SAINT_CATEGORY_STYLE_ART: Record<AlternateStyle, Record<Exclude<SaintCategoryId, "rulers">, SaintDisplayIcon>> = {
  tewahedo: { angels: art["tewahedo-selassie-panel"], biblical: art["tewahedo-selassie-manuscript"], monastics: art["tewahedo-theotokos"], "fathers-hierarchs": art["tewahedo-george"], martyrs: art["tewahedo-angels-michael"], "apostles-missionaries": art["tewahedo-archangel-wings"], laypeople: art["tewahedo-laypeople"] },
  coptic: { angels: art["coptic-michael"], biblical: art["coptic-holy-family"], monastics: art["coptic-desert-fathers"], "fathers-hierarchs": copticFather, martyrs: art["coptic-mercurios"], "apostles-missionaries": art["coptic-mark"], laypeople: art["coptic-simon"] },
  byzantine: { angels: byzantineAngel, biblical: SAINT_DISPLAY_ICONS["mary-magdalene"], monastics: SAINT_DISPLAY_ICONS.anthony, "fathers-hierarchs": SAINT_DISPLAY_ICONS.athanasius, martyrs: SAINT_DISPLAY_ICONS.george, "apostles-missionaries": SAINT_DISPLAY_ICONS["peter-apostle"], laypeople: byzantineAnna },
};

export const PRAYER_CATEGORY_STYLE_ART: Record<AlternateStyle, Record<PrayerCategoryId, SaintDisplayIcon>> = {
  tewahedo: { foundational: art["tewahedo-mary-george"], daily: tewahedoMonastic, "christ-saints": art["tewahedo-mary-george"], psalms: art["tewahedo-angels"], communion: art["tewahedo-communion"], occasions: art["tewahedo-hierarchs"] },
  coptic: { foundational: art["coptic-mark"], daily: art["coptic-desert-fathers"], "christ-saints": art["coptic-christ"], psalms: art["coptic-mark"], communion: art["coptic-communion"], occasions: art["coptic-holy-family"] },
  byzantine: { foundational: SAINT_DISPLAY_ICONS["peter-apostle"], daily: SAINT_DISPLAY_ICONS.anthony, "christ-saints": SAINT_DISPLAY_ICONS["mary-magdalene"], psalms: byzantineDavid, communion: art["byzantine-communion"], occasions: byzantineAnna },
};

export function categoryArtwork(section: "saints" | "prayers", style: CategoryIconStyle, category: string): SaintDisplayIcon | null {
  if (style === "original") return null;
  const registry: Record<string, SaintDisplayIcon> = section === "saints" ? SAINT_CATEGORY_STYLE_ART[style] : PRAYER_CATEGORY_STYLE_ART[style];
  return registry[category] ?? null;
}
