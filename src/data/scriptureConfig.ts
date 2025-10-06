export const scriptureConfig = {
  scripture_config_version: "1.0",
  defaults: {
    language: "en",
    preferred_sources: {
      osb_extras: ["OSB", "BRENTON_LXX", "WEB"],
      tewahedo_extras: ["RH_CHARLES", "WEB"]
    },
    license_hints: {
      OSB: "Requires publisher license. Use Brenton LXX (PD) until licensed.",
      BRENTON_LXX: "Public Domain",
      WEB: "Public Domain",
      RH_CHARLES: "Public Domain (older translations of Enoch/Jubilees)"
    }
  },
  canons: [
    {
      id: "OSB_LXX",
      display_name: "Orthodox Study Bible (LXX order)",
      extras: [
        { slug: "1esdras", name: "1 Esdras", position_hint: 16 },
        { slug: "tobit", name: "Tobit", position_hint: 17 },
        { slug: "judith", name: "Judith", position_hint: 18 },
        { slug: "esther_greek", name: "Esther (Greek Additions)", position_hint: 19 },
        { slug: "wisdom", name: "Wisdom of Solomon", position_hint: 24 },
        { slug: "sirach", name: "Sirach (Ecclesiasticus)", position_hint: 25 },
        { slug: "baruch", name: "Baruch", position_hint: 26 },
        { slug: "letter_of_jeremiah", name: "Letter of Jeremiah (Baruch 6)", position_hint: 27 },
        { slug: "song_of_three", name: "Song of the Three Holy Children", position_hint: 34 },
        { slug: "susanna", name: "Susanna (Daniel 13)", position_hint: 35 },
        { slug: "bel_and_dragon", name: "Bel and the Dragon (Daniel 14)", position_hint: 36 },
        { slug: "1maccabees", name: "1 Maccabees", position_hint: 45 },
        { slug: "2maccabees", name: "2 Maccabees", position_hint: 46 },
        { slug: "3maccabees", name: "3 Maccabees", position_hint: 47 },
        { slug: "prayer_of_manasseh", name: "Prayer of Manasseh", position_hint: 48 },
        { slug: "psalm_151", name: "Psalm 151", position_hint: 49 },
        { slug: "odes", name: "Odes", position_hint: 50 },
        { slug: "4maccabees", name: "4 Maccabees", position_hint: 51, optional: true }
      ]
    },
    {
      id: "TEWAHEDO_81",
      display_name: "Ethiopian Orthodox Tewahedo (81)",
      extras: [
        { slug: "1enoch", name: "1 Enoch", position_hint: 60, chapters_hint: 108 },
        { slug: "jubilees", name: "Jubilees", position_hint: 61 },
        { slug: "meqabyan1", name: "1 Meqabyan", position_hint: 62 },
        { slug: "meqabyan2", name: "2 Meqabyan", position_hint: 63 },
        { slug: "meqabyan3", name: "3 Meqabyan", position_hint: 64 },
        { slug: "4baruch", name: "4 Baruch (Paralipomena of Jeremiah)", position_hint: 65 }
      ]
    }
  ]
};

export const allExtraBooks = [
  ...scriptureConfig.canons[0].extras,
  ...scriptureConfig.canons[1].extras
].sort((a, b) => a.position_hint - b.position_hint);
