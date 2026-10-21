import { expect, test } from "bun:test";
import { SAINT_CATEGORIES } from "./saintCategories";
import { PRAYER_CATEGORIES } from "./prayerCategories";
import { categoryArtwork } from "./categoryStyleArtwork";
import { SAINT_DISPLAY_ICONS, SAINT_CATEGORY_DISPLAY_ICON } from "./saintDisplayIcons";

// Photographs and icons the app owner supplied. The Coptic ones are George
// Makary's work and credit his page; the Tewahedo saint photographs credit the
// Taamra Maryam collection page at the Royal Collection Trust.
const SUPPLIED = ["tewahedo-fathers", "tewahedo-selassie-manuscript", "tewahedo-theotokos", "tewahedo-george", "tewahedo-annunciation", "tewahedo-monastics", "coptic-trinity", "coptic-fathers", "coptic-john-olympia", "coptic-photini", "coptic-christ-photini", "coptic-katherine", "coptic-david", "coptic-church-bridegroom", "byzantine-owner-christ", "byzantine-owner-hierarch", "byzantine-owner-george", "byzantine-owner-mandylion"];
const MAKARY = "https://www.copticicon.com/";
const TAAMRA = "https://www.rct.uk/collection/1005083/taamra-maryam-taamera-maareyaame-the-miracles-of-the-virgin-mary";

test("Russian prayer top and middle rows use supplied panels in upload order and preserve Saints", () => {
  expect(categoryArtwork("prayers", "byzantine", "foundational").image_url).toContain("russian-prayer-foundational.png");
  expect(categoryArtwork("prayers", "byzantine", "daily").image_url).toContain("russian-prayer-daily.png");
  expect(categoryArtwork("prayers", "byzantine", "christ-saints").image_url).toContain("russian-prayer-christ-saints.png");
  expect(categoryArtwork("prayers", "byzantine", "communion").image_url).toContain("russian-prayer-communion.png");
  expect(categoryArtwork("prayers", "byzantine", "christ-saints").image_shape).toBe("silhouette");
  expect(categoryArtwork("prayers", "byzantine", "communion").image_shape).toBe("silhouette");
  expect(categoryArtwork("prayers", "byzantine", "christ-saints").image_license).toBe("Supplied by the app owner");
  expect(categoryArtwork("prayers", "byzantine", "communion").image_source).toBe("");
  expect(categoryArtwork("saints", "byzantine", "angels").image_url).toContain("russian-saint-annunciation");
  expect(categoryArtwork("saints", "byzantine", "biblical").image_url).toContain("russian-saint-theotokos");
});

test("Original leaves all existing category art untouched", () => {
  for (const category of SAINT_CATEGORIES) expect(categoryArtwork("saints", "original", category.id)).toBeNull();
  for (const category of PRAYER_CATEGORIES) expect(categoryArtwork("prayers", "original", category.id)).toBeNull();
});

test("Tewahedo prayers use supplied crosses in upload order above the preserved panels", () => {
  const placed = { foundational: "gold-cross-cut.png", daily: "copper-cross-cut.png", "christ-saints": "communion-sq.jpg", communion: "psalms-sq.jpg", occasions: "foundational-sq.jpg", psalms: "christ-saints-sq.jpg" };
  const categories = ["foundational", "daily", "christ-saints", "communion", "occasions", "psalms"];
  const urls = categories.map(category => {
    const artwork = categoryArtwork("prayers", "tewahedo", category);
    expect(artwork.image_url).toContain(`tewahedo-prayer-${placed[category]}`);
    expect(artwork.image_license).toBe("Supplied by the app owner");
    expect(artwork.image_source).toBe(["foundational", "daily"].includes(category) ? "" : "https://www.instagram.com/p/BJLBk6TDaA9/?srtk=cTg2cmthYmV0Zjcw");
    expect(artwork.image_license_url).toBe("");
    return artwork.image_url;
  });
  expect(new Set(urls).size).toBe(6);
  for (const category of SAINT_CATEGORIES) {
    expect(urls.includes(categoryArtwork("saints", "tewahedo", category.id).image_url)).toBe(false);
  }
});

test("each tradition covers all seven saint and six prayer categories with stored credited art", () => {
  expect(SAINT_CATEGORIES).toHaveLength(7);
  expect(PRAYER_CATEGORIES).toHaveLength(6);
  for (const style of ["tewahedo", "coptic", "byzantine"]) {
    for (const [section, categories] of [["saints", SAINT_CATEGORIES], ["prayers", PRAYER_CATEGORIES]]) {
      for (const category of categories) {
        const art = categoryArtwork(section, style, category.id);
        expect(art).not.toBeNull();
        expect(art.image_url).toStartWith("/__l5e/assets-v1/");
        expect(art.image_author.length).toBeGreaterThan(0);
        if (art.image_license === "Supplied by the app owner") {
          expect(art.image_source === "" || ["www.copticicon.com", "www.instagram.com", "www.rct.uk"].includes(new URL(art.image_source).hostname)).toBe(true);
          expect(art.image_license_url).toBe("");
        } else {
          expect(new URL(art.image_source).hostname).toBe("commons.wikimedia.org");
          expect(art.image_license).toMatch(/^(Public domain|CC)/);
          expect(art.image_license_url).toStartWith("https://creativecommons.org/");
        }
      }
    }
  }
});

test("Tewahedo Saints top row shows the supplied Annunciation and Theotokos photographs", () => {
  const angels = categoryArtwork("saints", "tewahedo", "angels");
  const biblical = categoryArtwork("saints", "tewahedo", "biblical");
  expect(angels.image_url).toContain("tewahedo-annunciation");
  expect(biblical.image_url).toContain("tewahedo-theotokos-sq4");
  for (const art of [angels, biblical]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(TAAMRA);
  }
});

test("Tewahedo Saints middle row shows the supplied rainbow-winged archangel and Trinity panel photographs", () => {
  const monastics = categoryArtwork("saints", "tewahedo", "monastics");
  const fathers = categoryArtwork("saints", "tewahedo", "fathers-hierarchs");
  expect(monastics.image_url).toContain("tewahedo-monastics");
  expect(fathers.image_url).toContain("tewahedo-fathers");
  for (const art of [monastics, fathers]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(TAAMRA);
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
  }
});

test("Tewahedo Saints row below the middle shows the supplied Saint George and Trinity manuscript photographs", () => {
  const martyrs = categoryArtwork("saints", "tewahedo", "martyrs");
  const missionaries = categoryArtwork("saints", "tewahedo", "apostles-missionaries");
  expect(martyrs.image_url).toContain("tewahedo-george");
  expect(missionaries.image_url).toContain("tewahedo-missionaries-sq");
  for (const art of [martyrs, missionaries]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(TAAMRA);
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
  }
});

test("the laypeople tile shows the supplied seated righteous layman photograph, square-cropped", () => {
  const art = categoryArtwork("saints", "tewahedo", "laypeople");
  expect(art.image_url).toContain("tewahedo-laypeople-sq");
  expect(art.image_license).toBe("Supplied by the app owner");
  expect(art.image_source).toBe(TAAMRA);
  expect(art.image_license_url).toBe("");
  expect(art.image_modification).toContain("Square-cropped");
});

test("Coptic Saints top row shows the two supplied Coptic icons", () => {
  const angels = categoryArtwork("saints", "coptic", "angels");
  const biblical = categoryArtwork("saints", "coptic", "biblical");
  expect(angels.image_url).toContain("coptic-angel-three-saints");
  expect(biblical.image_url).toContain("coptic-family-christ");
  for (const art of [angels, biblical]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(MAKARY);
    expect(art.image_license_url).toBe("");
    expect(art.image_modification).toContain("Square-cropped");
  }
});

test("the supplied Coptic icons stay out of the remaining Coptic saint tiles", () => {
  for (const category of ["monastics", "fathers-hierarchs", "martyrs", "apostles-missionaries", "laypeople"]) {
    const art = categoryArtwork("saints", "coptic", category);
    expect(art.image_url.includes("coptic-trinity")).toBe(false);
    expect(art.image_url.includes("coptic-fathers")).toBe(false);
  }
});

test("Coptic Saints middle row shows the two supplied Coptic icons, square-cropped", () => {
  const monastics = categoryArtwork("saints", "coptic", "monastics");
  const fathers = categoryArtwork("saints", "coptic", "fathers-hierarchs");
  expect(monastics.image_url).toContain("coptic-church-bridegroom");
  expect(fathers.image_url).toContain("coptic-john-olympia");
  expect(monastics.image_modification).toContain("both halos kept whole");
  for (const art of [monastics, fathers]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(MAKARY);
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
    expect(art.image_modification).toContain("Square-cropped");
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "coptic", category.id);
    expect(art.image_url.includes("coptic-john-olympia")).toBe(false);
    expect(art.image_url.includes("coptic-christ-photini")).toBe(false);
    expect(art.image_url.includes("coptic-photini")).toBe(false);
  }
});

test("Coptic Saints row under the middle shows the supplied Saint Photini and Saint Catherine icons, square-cropped", () => {
  const martyrs = categoryArtwork("saints", "coptic", "martyrs");
  const missionaries = categoryArtwork("saints", "coptic", "apostles-missionaries");
  expect(martyrs.image_url).toContain("coptic-photini");
  expect(missionaries.image_url).toContain("coptic-katherine");
  for (const art of [martyrs, missionaries]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe(MAKARY);
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
    expect(art.image_modification).toContain("Square-cropped");
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "coptic", category.id);
    expect(art.image_url.includes("coptic-photini")).toBe(false);
    expect(art.image_url.includes("coptic-katherine")).toBe(false);
  }
});

test("the Coptic laypeople tile shows the third supplied image of a martyr beneath an angel, square-cropped", () => {
  const art = categoryArtwork("saints", "coptic", "laypeople");
  expect(art.image_url).toContain("coptic-martyr-angel");
  expect(art.image_license).toBe("Supplied by the app owner");
  expect(art.image_source).toBe(MAKARY);
  expect(art.image_license_url).toBe("");
  expect(art.image_author).toContain("supplied by the app owner");
  expect(art.image_modification).toContain("Square-cropped");
  expect(art.image_url.includes("coptic-simon")).toBe(false);
});

test("Russian Saints top row shows the supplied Annunciation and Theotokos icons, square-cropped", () => {
  const angels = categoryArtwork("saints", "byzantine", "angels");
  const biblical = categoryArtwork("saints", "byzantine", "biblical");
  expect(angels.image_url).toContain("russian-saint-annunciation");
  expect(biblical.image_url).toContain("russian-saint-theotokos");
  for (const art of [angels, biblical]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
    expect(art.image_modification).toContain("keeps its own shape");
    expect(art.image_shape).toBe("silhouette");
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "byzantine", category.id);
    expect(art.image_url.includes("byzantine-creation-light")).toBe(false);
    expect(art.image_url.includes("byzantine-firmament")).toBe(false);
  }
});

test("Russian Saints middle row shows the supplied Pechersk Mother of God and mitred-hierarch icons, square-cropped", () => {
  const monastics = categoryArtwork("saints", "byzantine", "monastics");
  const fathers = categoryArtwork("saints", "byzantine", "fathers-hierarchs");
  expect(monastics.image_url).toContain("russian-saint-pechersk-monastics");
  expect(fathers.image_url).toContain("russian-saint-mitre-fathers");
  for (const art of [monastics, fathers]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
    expect(art.image_modification).toContain("keeps its own shape");
    expect(art.image_shape).toBe("silhouette");
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "byzantine", category.id);
    expect(art.image_url.includes("byzantine-dry-land")).toBe(false);
    expect(art.image_url.includes("byzantine-lights")).toBe(false);
  }
});

test("supplied photographs stay out of the remaining Tewahedo category and every prayer tile", () => {
  for (const category of ["laypeople"]) {
    const art = categoryArtwork("saints", "tewahedo", category);
    for (const name of SUPPLIED) expect(art.image_url.includes(name)).toBe(false);
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "tewahedo", category.id);
    for (const name of SUPPLIED) expect(art.image_url.includes(name)).toBe(false);
  }
});

test("Russian Saints laypeople tile shows the supplied Khlebnikov triptych with a transparent background", () => {
  const art = categoryArtwork("saints", "byzantine", "laypeople");
  expect(art.image_url).toContain("russian-saint-laypeople-triptych.png");
  expect(art.image_shape).toBe("silhouette");
  expect(art.image_license).toBe("Supplied by the app owner");
  expect(art.image_source).toBe("");
  expect(art.image_license_url).toBe("");
  expect(art.image_author).toContain("supplied by the app owner");
  expect(art.image_modification).toContain("transparent");
  // The triptych is wider than tall, so its tile follows its own proportions
  // instead of the tall default frame that left a gap under the row above.
  expect(art.image_box_aspect).toBe("934 / 899");
  const [boxW, boxH] = art.image_box_aspect.split("/").map(Number);
  expect(boxW / boxH).toBeGreaterThan(1);
  expect(boxW / boxH).toBeLessThan(1.1);
  // The arch leaves transparent space above its own peak, so the tile is lifted
  // a share of its width toward the row above. It stays small enough that the
  // tile never climbs into the labels of that row.
  expect(art.image_shift_up).toBe(12);
  expect(art.image_shift_up).toBeLessThanOrEqual(15);
  // No other tile in the grid is lifted.
  for (const id of ["angels", "biblical", "monastics", "fathers-hierarchs", "martyrs", "apostles-missionaries"]) {
    expect(categoryArtwork("saints", "byzantine", id).image_shift_up).toBeUndefined();
  }
  // The Rublev prayer panels keep the tall default frame.
  expect(categoryArtwork("prayers", "byzantine", "foundational").image_box_aspect).toBeUndefined();
  expect(categoryArtwork("prayers", "byzantine", "foundational").image_shift_up).toBeUndefined();
});

test("Russian Saints bottom row shows the supplied crowned-saint and hierarch icons, square-cropped", () => {
  const martyrs = categoryArtwork("saints", "byzantine", "martyrs");
  const missionaries = categoryArtwork("saints", "byzantine", "apostles-missionaries");
  expect(martyrs.image_url).toContain("russian-saint-crowned-martyrs");
  expect(missionaries.image_url).toContain("russian-saint-nicholas-missionaries");
  for (const art of [martyrs, missionaries]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("supplied by the app owner");
    expect(art.image_modification).toContain("keeps its own shape");
    expect(art.image_shape).toBe("silhouette");
  }
  for (const category of PRAYER_CATEGORIES) {
    const art = categoryArtwork("prayers", "byzantine", category.id);
    expect(art.image_url.includes("byzantine-swarms")).toBe(false);
    expect(art.image_url.includes("byzantine-adam")).toBe(false);
  }
});

test("Coptic prayers top row shows the supplied Gospel book and scroll panels, square-cropped", () => {
  const foundational = categoryArtwork("prayers", "coptic", "foundational");
  const daily = categoryArtwork("prayers", "coptic", "daily");
  expect(foundational.image_url).toContain("coptic-prayer-foundational-sq.jpg");
  expect(daily.image_url).toContain("coptic-prayer-daily-sq.jpg");
  for (const art of [foundational, daily]) {
    expect(art.image_license).toBe("Supplied by the app owner");
    expect(art.image_source).toBe("https://www.copticicon.com/");
    expect(art.image_license_url).toBe("");
    expect(art.image_author).toContain("George Makary");
    expect(art.image_modification).toContain("Square-cropped");
  }
  // The tiles below the top row carry their own panels, including the supplied left-column pair.
  expect(categoryArtwork("prayers", "coptic", "christ-saints").image_url).toContain("coptic-prayer-christ-saints-sq.jpg");
  expect(categoryArtwork("prayers", "coptic", "occasions").image_url).toContain("coptic-prayer-occasions-sq.jpg");
  // Neither panel replaces a Coptic Saints tile.
  for (const category of SAINT_CATEGORIES) {
    const url = categoryArtwork("saints", "coptic", category.id).image_url;
    expect(url.includes("coptic-prayer-foundational")).toBe(false);
    expect(url.includes("coptic-prayer-daily")).toBe(false);
  }
});

test("Coptic prayers right column shows the supplied Eucharist and Lamb panels, square-cropped", () => {
  const communion = categoryArtwork("prayers", "coptic", "communion");
  const psalms = categoryArtwork("prayers", "coptic", "psalms");
  expect(communion.image_url).toContain("coptic-prayer-communion-sq.jpg");
  expect(psalms.image_url).toContain("coptic-prayer-psalms-sq.jpg");
  // The top-right tile keeps the scroll panel, so the whole right column is supplied artwork.
  expect(categoryArtwork("prayers", "coptic", "daily").image_url).toContain("coptic-prayer-daily-sq.jpg");
  for (const panel of [communion, psalms]) {
    expect(panel.image_license).toBe("Supplied by the app owner");
    expect(panel.image_source).toBe("https://www.copticicon.com/");
    expect(panel.image_license_url).toBe("");
    expect(panel.image_author).toContain("George Makary");
    expect(panel.image_modification).toContain("Square-cropped");
  }
  // The whole left column is supplied artwork now.
  expect(categoryArtwork("prayers", "coptic", "foundational").image_url).toContain("coptic-prayer-foundational-sq.jpg");
  expect(categoryArtwork("prayers", "coptic", "christ-saints").image_url).toContain("coptic-prayer-christ-saints-sq.jpg");
  expect(categoryArtwork("prayers", "coptic", "occasions").image_url).toContain("coptic-prayer-occasions-sq.jpg");
  // Neither panel replaces a Coptic Saints tile.
  for (const category of SAINT_CATEGORIES) {
    const url = categoryArtwork("saints", "coptic", category.id).image_url;
    expect(url.includes("coptic-prayer-communion")).toBe(false);
    expect(url.includes("coptic-prayer-psalms")).toBe(false);
  }
});

test("Coptic prayers left column shows the supplied blessing-hands and jar panels, square-cropped", () => {
  const christSaints = categoryArtwork("prayers", "coptic", "christ-saints");
  const occasions = categoryArtwork("prayers", "coptic", "occasions");
  expect(christSaints.image_url).toContain("coptic-prayer-christ-saints-sq.jpg");
  expect(occasions.image_url).toContain("coptic-prayer-occasions-sq.jpg");
  for (const panel of [christSaints, occasions]) {
    expect(panel.image_license).toBe("Supplied by the app owner");
    expect(panel.image_source).toBe("https://www.copticicon.com/");
    expect(panel.image_license_url).toBe("");
    expect(panel.image_author).toContain("George Makary");
    expect(panel.image_modification).toContain("Square-cropped");
  }
  // The top-left tile keeps the Gospel book, so the whole left column is supplied artwork.
  expect(categoryArtwork("prayers", "coptic", "foundational").image_url).toContain("coptic-prayer-foundational-sq.jpg");
  // Neither panel replaces a Coptic Saints tile.
  for (const category of SAINT_CATEGORIES) {
    const url = categoryArtwork("saints", "coptic", category.id).image_url;
    expect(url.includes("coptic-prayer-christ-saints")).toBe(false);
    expect(url.includes("coptic-prayer-occasions")).toBe(false);
  }
});

test("prayer tiles credit the artists of the supplied artwork", () => {
  const RUBLEV = "Andrei Rublev, Holy Gates";
  const MAKARY = "George Makary";
  const YAHUDAH = "Abba Yahudah's PROTECTION, Oil on Canvas";
  const MAKARY_PAGE = "https://www.copticicon.com/";
  const YAHUDAH_POST = "https://www.instagram.com/p/BJLBk6TDaA9/?srtk=cTg2cmthYmV0Zjcw";
  for (const category of PRAYER_CATEGORIES) {
    // The Russian panels are Rublev's Holy Gates; no online page was supplied for them.
    const russian = categoryArtwork("prayers", "byzantine", category.id);
    expect(russian.image_author).toContain(RUBLEV);
    expect(russian.image_source).toBe("");
    // The Coptic panels are George Makary's, linked to his icon studio page.
    const coptic = categoryArtwork("prayers", "coptic", category.id);
    expect(coptic.image_author).toContain(MAKARY);
    expect(coptic.image_source).toBe(MAKARY_PAGE);
    // The Tewahedo panels are Abba Yahudah's PROTECTION, oil on canvas, linked to its post.
    const tewahedo = categoryArtwork("prayers", "tewahedo", category.id);
    if (["foundational", "daily"].includes(category.id)) {
      expect(tewahedo.image_author).toContain("processional cross");
      expect(tewahedo.image_source).toBe("");
    } else {
      expect(tewahedo.image_author).toContain(YAHUDAH);
      expect(tewahedo.image_source).toBe(YAHUDAH_POST);
    }
  }
  // Russian saint tiles keep their own credits, and the Tewahedo saint tiles
  // credit the Taamra Maryam page; the prayer artists' links stay out of them.
  for (const category of SAINT_CATEGORIES) {
    expect(categoryArtwork("saints", "byzantine", category.id).image_source).toBe("");
    expect(categoryArtwork("saints", "tewahedo", category.id).image_source).toBe(TAAMRA);
  }
});

test("saint tiles credit the artist page of each tradition", () => {
  const MAKARY_PAGE = "https://www.copticicon.com/";
  const ATHONITE_PAGE = "https://www.athoniteusa.com/";
  // The Coptic saint tiles are photographs of George Makary's icons.
  for (const category of SAINT_CATEGORIES) {
    const coptic = categoryArtwork("saints", "coptic", category.id);
    expect(coptic.image_author).toContain("George Makary");
    expect(coptic.image_source).toBe(MAKARY_PAGE);
    expect(coptic.image_license_url).toBe("");
  }
  // The Greek saint tiles are the saved Athonite portraits, crediting the studio page.
  for (const category of SAINT_CATEGORIES) {
    const icon = SAINT_DISPLAY_ICONS[SAINT_CATEGORY_DISPLAY_ICON[category.id]];
    expect(icon.image_source).toBe(ATHONITE_PAGE);
    expect(icon.image_license_url).toBe("");
  }
});
