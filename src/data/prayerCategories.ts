export const PRAYER_CATEGORIES = [
  {
    "id": "foundational",
    "label": "Foundational Prayers",
    "subgroups": [
      "Core",
      "Creeds",
      "Doxologies",
      "Short Prayers"
    ]
  },
  {
    "id": "daily",
    "label": "Daily Prayers",
    "subgroups": [
      "Morning",
      "Evening",
      "Night",
      "Hours",
      "Meals",
      "Rule of Prayer"
    ]
  },
  {
    "id": "christ-saints",
    "label": "Prayers to Christ and the Saints",
    "subgroups": [
      "Christ",
      "Theotokos",
      "Angels",
      "Saints",
      "Akathists and Canons"
    ]
  },
  {
    "id": "psalms",
    "label": "Psalms and Canticles",
    "subgroups": [
      "Psalter",
      "Selected Psalms",
      "Canticles",
      "Beatitudes"
    ]
  },
  {
    "id": "communion",
    "label": "Holy Communion and Liturgy",
    "subgroups": [
      "Before Communion",
      "After Communion",
      "Hymns",
      "Liturgies",
      "Litanies"
    ]
  },
  {
    "id": "occasions",
    "label": "Needs and Occasions",
    "subgroups": [
      "Repentance",
      "Healing",
      "Travel",
      "Family",
      "The Departed",
      "Blessings",
      "Feasts"
    ]
  }
] as const;

export type PrayerCategoryId = typeof PRAYER_CATEGORIES[number]["id"];
export interface PrayerPlacement { category: PrayerCategoryId; subgroup: string }

// One identity can belong to several category-qualified subgroups.
export const PRAYER_PLACEMENTS: Record<string, PrayerPlacement[]> = {
  "lords-prayer": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "trisagion": [
    {
      "category": "foundational",
      "subgroup": "Core"
    }
  ],
  "the-trisagion-prayers": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "o-heavenly-king-prayer-to-the-holy-spirit": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "come-true-light-st-symeon-the-new-theologian": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "thanksgiving": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "glory-be-gloria-patri": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "jesus-prayer": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "nicene-creed": [
    {
      "category": "foundational",
      "subgroup": "Creeds"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "the-great-doxology-glory-to-god-in-the-highest": [
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "kyrie-eleison-lord-have-mercy": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    }
  ],
  "prayer-of-the-publican-god-be-merciful-to-me-a-sinner": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-the-penitent-thief-remember-me-o-lord": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "morning-prayer": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "morning-prayer-of-the-optina-elders": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "prayer-of-st-philaret-of-moscow": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "evening-prayer": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "evening-prayer-of-st-macarius-the-great": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayers-before-sleep": [
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "midnight-office": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "orthros-matins": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "first-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "third-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "sixth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "ninth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "vespers-eastern": [
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "small-compline": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "great-compline": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "o-gladsome-light-phos-hilaron": [
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "agpeya-prime": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "agpeya-terce": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-sext": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-none": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-vespers": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "agpeya-compline": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "agpeya-midnight": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "agpeya-the-veil": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "shehimo-ramsho-evening": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "shehimo-sootoro-compline": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "shehimo-lilyo-night": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "shehimo-safro-morning": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "shehimo-third-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "shehimo-sixth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "shehimo-ninth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "zhamagirk-armenian-book-of-hours": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "grace-before-meals-the-eyes-of-all-look-to-thee": [
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "grace-after-meals": [
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "grace-before-and-after-meals-coptic": [
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "paschal-greeting-christ-is-risen": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "paschal-troparion": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-the-cross-o-lord-save-thy-people": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-the-nativity": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-theophany": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "o-only-begotten-son": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "paschal-homily-of-st-john-chrysostom": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "akathist-to-our-sweetest-lord-jesus": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "canon-of-repentance-to-our-lord-jesus-christ": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "paschal-canon": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "rejoice-o-virgin-theotokos-hail-mary": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "beneath-thy-compassion-sub-tuum-praesidium": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "magnificat-song-of-the-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "it-is-truly-meet-axion-estin": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "to-thee-the-champion-leader": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "paraklesis-supplicatory-canon-to-the-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "akathist-hymn-to-the-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "agni-parthene": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "weddase-maryam-ethiopian-praise-of-mary": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "theotokia-coptic-hymns-to-the-virgin": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "prayer-to-the-guardian-angel": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "prayer-to-the-archangel-michael": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    }
  ],
  "canon-to-the-guardian-angel": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "akathist-to-the-guardian-angel": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "prayer-to-st-nicholas": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    }
  ],
  "akathist-to-st-nicholas": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "troparion-of-all-saints": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    }
  ],
  "akathist-glory-to-god-for-all-things": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    }
  ],
  "akathist-for-the-departed": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "the-great-canon-of-st-andrew-of-crete": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "the-psalter": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    }
  ],
  "psalm-22-23-the-lord-is-my-shepherd": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "psalm-50-51-have-mercy-on-me-o-god": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "psalm-62-63-o-god-thou-art-my-god": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "psalm-90-91-he-who-dwells-in-the-help-of-the-most-high": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "psalm-102-103-bless-the-lord-o-my-soul": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "psalm-140-141-let-my-prayer-arise": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "the-beatitudes": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "song-of-simeon-nunc-dimittis": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "song-of-zacharias-benedictus": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "song-of-the-three-holy-youths": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "song-of-moses": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "prayers-before-holy-communion": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayer-of-st-john-chrysostom-before-communion": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "the-coptic-confession-amen-i-believe": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayers-of-thanksgiving-after-communion": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "let-our-mouths-be-filled": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "the-cherubic-hymn": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "we-have-seen-the-true-light": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "divine-liturgy-of-st-john-chrysostom": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "divine-liturgy-of-st-basil-the-great": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "divine-liturgy-of-st-james": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "liturgy-of-the-presanctified-gifts": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "coptic-liturgy-of-st-gregory-the-theologian": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "coptic-liturgy-of-st-cyril-st-mark": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "armenian-divine-liturgy-badarak": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "ethiopian-liturgy-anaphora-of-the-apostles": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "great-litany-litany-of-peace": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "litany-of-the-oblations": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "litany-of-the-sick": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "litany-of-travelers": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "litany-of-the-departed": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "litany-of-waters-plants-and-fruits": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-of-st-isaac-the-syrian": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-st-ephrem-the-syrian": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-manasseh": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayers-before-confession": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-absolution-eastern": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "coptic-absolution-to-the-son": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "i-confess-with-faith-havatov-khostovanim-st-nerses-shnorhali": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    },
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "book-of-lamentations-narek-st-gregory-of-narek": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayers-for-the-sick-holy-unction": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-of-the-sick-coptic": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-for-travelers": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-family-and-children": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "blessing-of-the-home": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    },
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "memorial-service-panikhida": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "trisagion-for-the-departed": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "memory-eternal": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "great-blessing-of-waters": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "prayer-before-study": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-at-the-beginning-of-any-good-work": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-for-the-new-year": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "coptic-our-father": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "armenian-prayer": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "ethiopian-prayer": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "syrian-prayer": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "prayer-cross": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ]
};
