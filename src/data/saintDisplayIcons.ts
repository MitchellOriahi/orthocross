import michael from "@/assets/saints/display/archangel-michael-lrp.jpg.asset.json";
import anthonyLrp from "@/assets/saints/display/saint-anthony-lrp-2.png.asset.json";
import theotokosLrp from "@/assets/saints/display/theotokos-seven-swords-lrp.jpg.asset.json";
import nicholasLrp from "@/assets/saints/display/saint-nicholas-lrp.jpg.asset.json";
import mary from "@/assets/saints/display/mary-magdalene.jpg.asset.json";
import timothy from "@/assets/saints/display/timothy-apostle.jpg.asset.json";
import peter from "@/assets/saints/display/peter-apostle.jpg.asset.json";
import athanasius from "@/assets/saints/display/athanasius.jpg.asset.json";
import anthony from "@/assets/saints/display/anthony.jpg.asset.json";
import george from "@/assets/saints/display/george.jpg.asset.json";
import xenia from "@/assets/saints/display/xenia-petersburg.jpg.asset.json";

export interface SaintDisplayIcon {
  image_url: string;
  image_source: string;
  image_license: string;
  image_license_url: string;
  image_modification: string;
  image_author: string;
  // "contain" (default "cover") shows the whole artwork letterboxed inside
  // the square frame instead of cropping it to the face-and-halo region.
  image_fit?: "contain";
  // Adds a soft golden glow around the artwork's edges.
  image_glow?: boolean;
}

// Only audited, matching Commons paintings belong here. To replace an icon,
// change this entry's image_url and its provenance; the layout stays unchanged.
// Missing entries deliberately use the neutral cross, never legacy artwork.
const commons = "https://commons.wikimedia.org/wiki/File:";
const pd = "https://creativecommons.org/publicdomain/mark/1.0/";
const modification = "Square face-and-halo crop from the original painting; border and inscriptions excluded. Resized; uniform brightness and saturation applied at display.";
function portrait(url: string, file: string, author: string, license = "Public domain", licenseUrl = pd): SaintDisplayIcon {
  return { image_url: url, image_source: commons + encodeURIComponent(file), image_author: author, image_license: license, image_license_url: licenseUrl, image_modification: modification };
}

export const SAINT_DISPLAY_ICONS: Record<string, SaintDisplayIcon> = {
  "archangel-michael": {
    image_url: michael.url,
    image_source: "Provided by the app owner (uploaded icon)",
    image_author: "LRP icon studio (owner-provided artwork)",
    image_license: "Owner-provided",
    image_license_url: "",
    image_modification: "Shown whole inside the square frame (owner-provided artwork, no crop) with a soft golden edge glow.",
    image_fit: "contain",
    image_glow: true,
  },
  "saint-anthony-lrp": {
    image_url: anthonyLrp.url,
    image_source: "Provided by the app owner (uploaded icon)",
    image_author: "LRP icon studio (owner-provided artwork)",
    image_license: "Owner-provided",
    image_license_url: "",
    image_modification: "Shown whole inside the square frame (owner-provided artwork, no crop) with a soft golden edge glow.",
    image_fit: "contain",
    image_glow: true,
  },
  "theotokos-seven-swords-lrp": {
    image_url: theotokosLrp.url,
    image_source: "Provided by the app owner (uploaded icon)",
    image_author: "LRP icon studio (owner-provided artwork)",
    image_license: "Owner-provided",
    image_license_url: "",
    image_modification: "Shown whole inside the square frame (owner-provided artwork, no crop) with a soft golden edge glow.",
    image_fit: "contain",
    image_glow: true,
  },
  "mary-magdalene": portrait(mary.url, "Maria_Magdalene_icon.jpg", "Unknown icon painter, Dionysiou Monastery"),
  "timothy-apostle": portrait(timothy.url, "Saint_Timothy.jpg", "Unknown icon painter"),
  "peter-apostle": portrait(peter.url, "St_Peter_Icon_Sinai_7th_century.jpg", "Unknown painter, Saint Catherine’s Monastery, Sinai, 7th century"),
  athanasius: portrait(athanasius.url, "St._Athanasius_Icon_(10335730335).jpg", "Unknown Byzantine painter, 1556; photograph by Ted", "CC BY-SA 2.0", "https://creativecommons.org/licenses/by-sa/2.0/"),
  anthony: portrait(anthony.url, "Cretan_Icon_Saint_Anthony_the_Great.jpg", "Unknown Cretan painter, 15th–17th century"),
  george: portrait(george.url, "Icon_of_Saint_George_in_the_Byzantine_and_Christian_Museum_(Athens).jpg", "Unknown Byzantine painter, 14th century; photograph by Yair-haklai", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"),
  "xenia-petersburg": portrait(xenia.url, "Блаженная_Ксения_Петербурская_(иконописная_мастерская_Елеон).jpg", "Eleon icon-painting workshop", "CC BY 2.0", "https://creativecommons.org/licenses/by/2.0/"),
};

export const SAINT_CATEGORY_DISPLAY_ICON: Record<string, string> = {
  angels: "archangel-michael",
  biblical: "theotokos-seven-swords-lrp",
  "apostles-missionaries": "peter-apostle",
  "fathers-hierarchs": "athanasius",
  monastics: "saint-anthony-lrp",
  martyrs: "george",
  rulers: "vladimir-kyiv",
  laypeople: "xenia-petersburg",
};