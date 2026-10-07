import i_michael from "@/assets/saints/card-icons/michael.jpg.asset.json";
import i_gabriel from "@/assets/saints/card-icons/gabriel.jpg.asset.json";
import i_raphael from "@/assets/saints/card-icons/raphael.jpg.asset.json";
import i_uriel from "@/assets/saints/card-icons/uriel.jpg.asset.json";
import i_selaphiel from "@/assets/saints/card-icons/selaphiel.jpg.asset.json";
import i_jegudiel from "@/assets/saints/card-icons/jegudiel.jpg.asset.json";
import i_raguel from "@/assets/saints/card-icons/raguel.jpg.asset.json";
import i_seraphim from "@/assets/saints/card-icons/seraphim.jpg.asset.json";
import i_cherubim from "@/assets/saints/card-icons/cherubim.jpg.asset.json";
import i_guardian_angels from "@/assets/saints/card-icons/guardian-angels.jpg.asset.json";

// Card icon for each roster saint (keyed by roster id). To replace an icon, change
// only its entry here (or save it from /icon-tuner); the card layout is untouched.
// Saints without an entry show the neutral cross placeholder.
export interface SaintCardIcon {
  image_url: string;
  image_source: string;
  image_license: string;
  image_attribution: string;
  focus_x: number; // 0-100, face center horizontally
  focus_y: number; // 0-100, face center vertically
  zoom: number; // 1 = whole image covers the circle
}

export const SAINT_CARD_ICONS: Record<string, SaintCardIcon> = {
  "michael": { image_url: i_michael.url, image_source: "https://commons.wikimedia.org/wiki/File:Saint_Michael_(Yaroslavl,_13th_c.,_GTG).jpg", image_license: "Public domain", image_attribution: "Unknown iconographer", focus_x: 50, focus_y: 13, zoom: 4.5 },
  "gabriel": { image_url: i_gabriel.url, image_source: "https://commons.wikimedia.org/wiki/File:Archangel_Gabriel_-_Orthodox_Icon.jpg", image_license: "CC BY-SA 4.0", image_attribution: "33milos33", focus_x: 55, focus_y: 30, zoom: 2.5 },
  "raphael": { image_url: i_raphael.url, image_source: "https://commons.wikimedia.org/wiki/File:%22St.Archangel_Raphael%22,egg_tempera,_goldleaf_on_wood,_sm_32x24.jpeg", image_license: "CC BY-SA 3.0", image_attribution: "Tjaarke Maas", focus_x: 45, focus_y: 30, zoom: 2.4 },
  "uriel": { image_url: i_uriel.url, image_source: "https://commons.wikimedia.org/wiki/File:Icon_of_the_Archangel_Uriel_01.jpg", image_license: "CC BY-SA 4.0", image_attribution: "Mark Czekanski (Marek Czeka\u0144ski)", focus_x: 50, focus_y: 37, zoom: 4 },
  "selaphiel": { image_url: i_selaphiel.url, image_source: "https://commons.wikimedia.org/wiki/File:Icon_of_Archangel_Selaphiel.jpg", image_license: "Public domain", image_attribution: "Unknown iconographer", focus_x: 50, focus_y: 13, zoom: 3.5 },
  "jegudiel": { image_url: i_jegudiel.url, image_source: "https://commons.wikimedia.org/wiki/File:Jegudil.jpg", image_license: "Public domain", image_attribution: "Unknown iconographer (uploaded by EugeneZ)", focus_x: 50, focus_y: 11, zoom: 4.5 },
  "raguel": { image_url: i_raguel.url, image_source: "https://commons.wikimedia.org/wiki/File:Colecci%C3%B3n_Miguel_Gall%C3%A9s._Lienzo_et%C3%ADope_(c.1950-60)_(90x55)_San_Raguel_Arc%C3%A1ngel._Detalle.jpg", image_license: "CC BY-SA 4.0", image_attribution: "Miquel.galles", focus_x: 45, focus_y: 35, zoom: 1.8 },
  "seraphim": { image_url: i_seraphim.url, image_source: "https://commons.wikimedia.org/wiki/File:The_Dormition_of_Mother_of_God_(Detail)_-_Seraph.jpg", image_license: "Public domain", image_attribution: "Onouphrios Cypriotes", focus_x: 52, focus_y: 55, zoom: 2 },
  "cherubim": { image_url: i_cherubim.url, image_source: "https://commons.wikimedia.org/wiki/File:Nine_orders_of_angels_cherubim.jpg", image_license: "Public domain", image_attribution: "Unknown iconographer", focus_x: 50, focus_y: 50, zoom: 1 },
  "guardian-angels": { image_url: i_guardian_angels.url, image_source: "https://commons.wikimedia.org/wiki/File:Guardian_Angel,_Old_Believers_icon_(19th_c,_priv.coll).jpg", image_license: "Public domain", image_attribution: "Anonymous Russian icon painter (before 1917)", focus_x: 50, focus_y: 30, zoom: 4 },
};
