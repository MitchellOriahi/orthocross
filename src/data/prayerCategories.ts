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
  }
] as const;;

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
    },
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
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
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "trisagion": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "morning-prayer": [
    {
      "category": "daily",
      "subgroup": "Morning"
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
  "evening-prayer": [
    {
      "category": "daily",
      "subgroup": "Evening"
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
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
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
  ],
  "o-heavenly-king": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-of-the-publican": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-the-thief": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "glory-be-doxology": [
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "the-apostles-creed": [
    {
      "category": "foundational",
      "subgroup": "Creeds"
    }
  ],
  "prayer-of-st-ephrem-the-syrian": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-to-the-holy-trinity": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "kyrie-eleison": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "prayer-before-sleep": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayer-upon-rising": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "morning-prayer-to-the-father": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "prayer-for-the-new-day": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-before-work": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-after-work": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "evening-prayer-of-thanksgiving": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayer-for-peaceful-sleep": [
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "night-prayer-of-repentance": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-at-the-first-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "prayer-at-the-third-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "prayer-at-the-sixth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "prayer-at-the-ninth-hour": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "prayer-at-vespers": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayer-at-compline": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "prayer-for-steadfast-prayer": [
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-for-attention": [
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-before-eating": [
    {
      "category": "daily",
      "subgroup": "Meals"
    }
  ],
  "blessing-of-food": [
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-after-meals": [
    {
      "category": "daily",
      "subgroup": "Meals"
    }
  ],
  "prayer-for-daily-bread": [
    {
      "category": "daily",
      "subgroup": "Meals"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "psalm-23": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "psalm-50": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "psalm-90": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "psalm-102": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "psalm-33": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "psalm-121": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "psalm-130": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "psalm-117": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "magnificat": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "benedictus": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "nunc-dimittis": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "song-of-the-three-holy-children": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "beatitude-poor-in-spirit": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    }
  ],
  "beatitude-they-that-mourn": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    }
  ],
  "beatitude-the-meek": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    }
  ],
  "beatitude-the-merciful": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    }
  ],
  "prayer-to-christ-for-mercy": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-to-christ-crucified": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "prayer-to-the-risen-christ": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-of-the-good-shepherd": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "hail-mary-rejoicing-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "prayer-to-the-theotokos-for-protection": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "it-is-truly-meet": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "sub-tuum-praesidium": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-to-the-guardian-angel": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-to-the-holy-angels": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-of-protection": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-the-angel-of-the-church": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "prayer-with-the-apostles": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "prayer-with-the-martyrs": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-with-the-fathers": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-with-all-saints": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "akathist-style-prayer-of-praise": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "akathist-style-prayer-of-supplication": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "canon-style-prayer-of-repentance": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "canon-style-prayer-of-thanksgiving": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "i-believe-o-lord-and-i-confess": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "of-thy-mystical-supper": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "prayer-of-st-john-chrysostom-before-communion": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-of-st-john-of-damascus-before-communion": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-of-thanksgiving-after-communion": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "prayer-of-st-basil-after-communion": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "prayer-after-communion-for-transformation": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "prayer-after-communion-for-mission": [
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "christ-is-risen": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "o-gladsome-light": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "only-begotten-son": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "cherubic-hymn": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "receive-the-body-of-christ": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "prayer-of-oblation": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "prayer-for-unity-at-the-liturgy": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    },
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "prayer-of-thanksgiving-at-the-altar": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    },
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    }
  ],
  "prayer-of-dismissal": [
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "litany-for-peace": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "litany-for-the-church": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    }
  ],
  "litany-for-the-sick": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "litany-for-the-departed": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "prayer-of-contrition": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-before-confession": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-for-a-new-beginning": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-for-freedom-from-sin": [
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-for-the-sick": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-for-healing-of-mind-and-heart": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-for-strength-in-sickness": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-for-caregivers": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    },
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-before-a-journey": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-safe-travel": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-a-pilgrimage": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-safe-return": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-husband-and-wife": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-for-children": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-for-parents": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-for-peace-in-the-home": [
    {
      "category": "occasions",
      "subgroup": "Family"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "prayer-for-the-newly-departed": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "prayer-for-remembered-loved-ones": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "prayer-for-the-departed-with-hope": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "prayer-at-the-grave": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "blessing-of-a-home": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "blessing-for-work": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "blessing-for-food-and-water": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    },
    {
      "category": "daily",
      "subgroup": "Meals"
    }
  ],
  "blessing-for-a-new-undertaking": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "nativity-feast-prayer": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "theophany-feast-prayer": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "pascha-feast-prayer": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "dormition-feast-prayer": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "feast-of-the-cross-prayer": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ]
};
