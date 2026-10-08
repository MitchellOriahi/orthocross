import face_anna from "@/assets/saints/card-icons/anna-face.jpg.asset.json";
import face_symeon_new_theologian from "@/assets/saints/card-icons/symeon-new-theologian-face.jpg.asset.json";
import face_pelagia_the_penitent from "@/assets/saints/card-icons/pelagia-the-penitent-face.jpg.asset.json";
import face_cyricus_and_julitta from "@/assets/saints/card-icons/cyricus-and-julitta-face.jpg.asset.json";
import face_john_theologian from "@/assets/saints/card-icons/john-theologian-face.jpg.asset.json";
import face_basil_the_blessed from "@/assets/saints/card-icons/basil-the-blessed-face.jpg.asset.json";
import face_dominions from "@/assets/saints/card-icons/dominions-face.jpg.asset.json";
import face_nicholas_of_pskov from "@/assets/saints/card-icons/nicholas-of-pskov-face.jpg.asset.json";
import face_dimiana_and_the_forty_virgins from "@/assets/saints/card-icons/dimiana-and-the-forty-virgins-face.jpg.asset.json";
import { SAINT_ONLINE_PORTRAITS } from "./saintOnlinePortraits";

/** Face-focused portrait replacements requested by the user; applied last so earlier registries stay preserved. */
export const SAINT_FACE_PORTRAIT_UPDATES = {
  "anna": { image_url: face_anna.url, image_source: "https://commons.wikimedia.org/wiki/File:Angelos_Akotanos_-_Saint_Anne_with_the_Virgin_-_15th_century.jpg", image_license: "Public domain", image_attribution: "Attributed to Angelos Akotantos, 15th century; via Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "symeon-new-theologian": { image_url: face_symeon_new_theologian.url, image_source: "https://commons.wikimedia.org/wiki/File:Symeon_the_New_Theologian.jpg", image_license: "Public domain", image_attribution: "Unknown iconographer; via Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "pelagia-the-penitent": { image_url: face_pelagia_the_penitent.url, image_source: "https://commons.wikimedia.org/wiki/File:8_oct_PELAGIA.jpg", image_license: "Public domain", image_attribution: "Unknown iconographer; via Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "cyricus-and-julitta": { image_url: face_cyricus_and_julitta.url, image_source: "https://commons.wikimedia.org/wiki/File:Serbian_Fresco_Icon_of_Saints_Quiricus_and_Julitta.jpg", image_license: "Public domain", image_attribution: "Serbian fresco, unknown artist; via Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "john-theologian": { image_url: face_john_theologian.url, image_source: "https://commons.wikimedia.org/wiki/File:Four_Icons_from_a_Pair_of_Doors_(Panels),_possibly_part_of_a_Polyptych-_John_the_Theologian_and_Prochoros,_the_Baptism_(Epiphany),_Harrowing_of_Hell_(Anastasis),_and_Saint_Nicholas_MET_DP327378.jpg", image_license: "CC0", image_attribution: "The Metropolitan Museum of Art; via Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "basil-the-blessed": { image_url: face_basil_the_blessed.url, image_source: "https://commons.wikimedia.org/wiki/File:Vasily_the_Great_and_Vasily_Blazhenny_(16-17_c.)_detail.jpg", image_license: "CC BY-SA 3.0", image_attribution: "Photo: Shakko / Wikimedia Commons", focus_x: 50, focus_y: 50, zoom: 1 },
  "dominions": { ...SAINT_ONLINE_PORTRAITS["dominions"], image_url: face_dominions.url, focus_x: 50, focus_y: 50, zoom: 1 },
  "nicholas-of-pskov": { ...SAINT_ONLINE_PORTRAITS["nicholas-of-pskov"], image_url: face_nicholas_of_pskov.url, focus_x: 50, focus_y: 50, zoom: 1 },
  "dimiana-and-the-forty-virgins": { ...SAINT_ONLINE_PORTRAITS["dimiana-and-the-forty-virgins"], image_url: face_dimiana_and_the_forty_virgins.url, focus_x: 50, focus_y: 50, zoom: 1 },
};
