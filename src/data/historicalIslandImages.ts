import eo_1 from "@/assets/history/authentic/eo_1.asset.json";
import eo_2 from "@/assets/history/authentic/eo_2.asset.json";
import eo_3 from "@/assets/history/authentic/eo_3.asset.json";
import eo_4 from "@/assets/history/authentic/eo_4.asset.json";
import eo_5 from "@/assets/history/authentic/eo_5.asset.json";
import eo_6 from "@/assets/history/authentic/eo_6.asset.json";
import eo_7 from "@/assets/history/authentic/eo_7.asset.json";
import eo_8 from "@/assets/history/authentic/eo_8.asset.json";
import eo_9 from "@/assets/history/authentic/eo_9.asset.json";
import eo_10 from "@/assets/history/authentic/eo_10.asset.json";
import eo_11 from "@/assets/history/authentic/eo_11.asset.json";
import oo_1 from "@/assets/history/authentic/oo_1.asset.json";
import oo_2 from "@/assets/history/authentic/oo_2.asset.json";
import oo_3 from "@/assets/history/authentic/oo_3.asset.json";
import oo_4 from "@/assets/history/authentic/oo_4.asset.json";
import oo_5 from "@/assets/history/authentic/oo_5.asset.json";
import oo_6 from "@/assets/history/authentic/oo_6.asset.json";
import oo_7 from "@/assets/history/authentic/oo_7.asset.json";
import oo_8 from "@/assets/history/authentic/oo_8.asset.json";

// Upper framing protects heads and halos in portrait-oriented historical art.
export const HISTORICAL_FACE_FOCUSED_ISLANDS = new Set([
  "eo_1", "eo_3", "eo_6", "eo_7", "eo_8", "eo_9", "oo_8",
]);

export const HISTORICAL_ISLAND_IMAGES: Record<string, { url: string; title: string; source: string; author: string; license: string; licenseUrl: string }> = {
  eo_1: { url: eo_1.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Good_shepherd_01.jpg", "author": "Unknown / historical work", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "The Good Shepherd — Catacomb of Priscilla, Rome"} },
  eo_2: { url: eo_2.url, ...{"source": "https://commons.wikimedia.org/wiki/File:First_Council_of_Nicaea_Michael_Damaskinos.png", "author": "Michael Damaskinos", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "First Council of Nicaea — Michael Damaskinos, 1591"} },
  eo_3: { url: eo_3.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Sv_Kiril_Metodij_Zahari_Zograf_Trojanski_mon_1848.jpg", "author": "painted by Zahari Zograf (Захарий Христович Димитров)", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "Saints Cyril and Methodius — Zahari Zograf, 1848"} },
  eo_4: { url: eo_4.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Aya_Sofia,_Constantinople_(BM_1889,0603.120).jpg", "author": "Print made by: Louis Haghe\n\nAfter: Gaspard Fossati", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "Hagia Sophia interior — Louis Haghe after Gaspard Fossati, 1852"} },
  eo_5: { url: eo_5.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Moni_Simonos_Petras_(Athos).jpg", "author": "Marek Balabuch", "license": "CC BY-SA 2.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.0", "title": "Simonopetra Monastery, Mount Athos"} },
  eo_6: { url: eo_6.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Andrey_Rublev_-_%D0%A1%D0%B2._%D0%A2%D1%80%D0%BE%D0%B8%D1%86%D0%B0_-_Google_Art_Project.jpg", "author": "Andrei Rublev", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "The Trinity — Andrei Rublev, 15th century"} },
  eo_7: { url: eo_7.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Pieter_van_der_Werff_-_Portrait_of_Peter_the_Great_-_WGA25542.jpg", "author": "Pieter van der Werff", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "Peter the Great — Pieter van der Werff"} },
  eo_8: { url: eo_8.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Tikhon_of_Moscow.jpg", "author": "Michael Goltz", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "Patriarch Tikhon of Moscow — archival portrait"} },
  eo_9: { url: eo_9.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Freiburg-_Universit%C3%A4t;_Professor_der_Theologie_Staniloae,_Bukarest_-_LABW_-_Staatsarchiv_Freiburg_W_134_Nr._037864.jpeg", "author": "Willy Pragher", "license": "CC BY 4.0", "licenseUrl": "https://creativecommons.org/licenses/by/4.0", "title": "Dumitru Stăniloae — archival photograph by Willy Pragher"} },
  eo_10: { url: eo_10.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Moscow_-_Cathedral_of_Christ_the_Saviour.jpg", "author": "Voytek S", "license": "CC BY-SA 2.5", "licenseUrl": "https://creativecommons.org/licenses/by-sa/2.5", "title": "Rebuilt Cathedral of Christ the Saviour, Moscow"} },
  eo_11: { url: eo_11.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Orthodox_Priests_in_Procession_-_Great_Vespers_of_the_Dormition.jpg", "author": "ΙΣΧΣΝΙΚΑ-888", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "title": "Orthodox procession — Ottawa, Canada"} },
  oo_1: { url: oo_1.url, ...{"source": "https://commons.wikimedia.org/wiki/File:T%27oros_Roslin_Gospels,_Portrait_of_the_Evangelist_Mark,_Walters_Manuscript_W.539,_fol._130v.jpg", "author": "Walters Art Museum Illuminated Manuscripts", "license": "CC0", "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en", "title": "Saint Mark — Toros Roslin Gospels, 1262, Walters Art Museum"} },
  oo_2: { url: oo_2.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Christian_council_of_Eph%C3%A8sus_in_431.jpg", "author": "Philippe Alès", "license": "CC BY-SA 3.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/3.0", "title": "Cyril of Alexandria at Ephesus — Fourvière mosaic, Lyon"} },
  oo_3: { url: oo_3.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Geez_bible.jpg", "author": "Royal Collection Trust", "license": "CC0", "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en", "title": "Ge’ez manuscript — The Miracles of Jesus, Ethiopia"} },
  oo_4: { url: oo_4.url, ...{"source": "https://commons.wikimedia.org/wiki/File:The_Armenian_Genocide_memorial_complex_(Tsitsernakaberd).JPG", "author": "Rupen Janbazian", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "title": "Tsitsernakaberd Armenian Genocide Memorial, Yerevan"} },
  oo_5: { url: oo_5.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Saint_Mark%27s_Coptic_Orthodox_Cathedral,_Azbakeya_01.jpg", "author": "Marsupium", "license": "CC BY-SA 4.0", "licenseUrl": "https://creativecommons.org/licenses/by-sa/4.0", "title": "Saint Mark’s Coptic Orthodox Cathedral, Azbakeya, Cairo"} },
  oo_6: { url: oo_6.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Bete_Giyorgis_Lalibela_Ethiopia.jpg", "author": "Jialiang Gao www.peace-on-earth.org", "license": "CC BY-SA 3.0", "licenseUrl": "http://creativecommons.org/licenses/by-sa/3.0/", "title": "Church of Saint George, Lalibela, Ethiopia"} },
  oo_7: { url: oo_7.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Monastery_of_Saint_Anthony,_Egypt_-_Saint_Anthony%27s_Cave,_exterior_view,_entrance_-_MSBZ004_A48_-_Dumbarton_Oaks.jpg", "author": "Kazazian", "license": "CC0", "licenseUrl": "http://creativecommons.org/publicdomain/zero/1.0/deed.en", "title": "Saint Anthony’s Cave, Egypt — Dumbarton Oaks archival photograph"} },
  oo_8: { url: oo_8.url, ...{"source": "https://commons.wikimedia.org/wiki/File:Toros_Roslin_Manrankar.jpg", "author": "MarshallBagramyan", "license": "Public domain", "licenseUrl": "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter#2D_art_(paintings,_etc.)", "title": "Armenian Gospel illumination — Toros Roslin, 13th century"} },
};
