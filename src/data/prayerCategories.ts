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
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-to-the-most-holy-trinity": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "come-let-us-worship": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "glory-to-the-father": [
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
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
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "prayer-of-st-ephrem": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
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
  "we-have-seen-the-true-light": [
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
    }
  ],
  "prayer-of-the-hours": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "into-thy-hands": [
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "agpeya-thanksgiving": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "agpeya-trisagion": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "introduction-to-the-creed": [
    {
      "category": "foundational",
      "subgroup": "Creeds"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "the-orthodox-creed-coptic": [
    {
      "category": "foundational",
      "subgroup": "Creeds"
    }
  ],
  "the-praise-of-the-angels": [
    {
      "category": "foundational",
      "subgroup": "Doxologies"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "morning-prayer-to-the-holy-trinity": [
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
  "morning-prayer-to-the-theotokos": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "morning-prayer-to-the-guardian-angel": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    }
  ],
  "prayer-to-ones-patron-saint": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "o-christ-the-true-light": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "to-thee-o-master": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "prayer-at-the-beginning-of-the-day": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "evening-prayer-to-the-father": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "evening-prayer-to-jesus-christ": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "evening-prayer-to-the-holy-spirit": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "rejoice-o-virgin-theotokos": [
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "o-gladsome-light": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "prayer-for-rest-of-body-and-soul": [
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "prayer-before-meals": [
    {
      "category": "daily",
      "subgroup": "Meals"
    }
  ],
  "prayer-after-meals": [
    {
      "category": "daily",
      "subgroup": "Meals"
    }
  ],
  "before-reading-holy-scripture": [
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "prayer-of-metropolitan-philaret": [
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "before-any-work": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "agpeya-first-hour-litanies": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-first-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-third-hour-litanies": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-third-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-sixth-hour-litanies": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-sixth-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-ninth-hour-litanies": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-ninth-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-eleventh-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Evening"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-twelfth-hour-litanies": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-twelfth-hour-absolution": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "agpeya-veil-absolution": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "i-confess-with-faith": [
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "occasions",
      "subgroup": "Repentance"
    }
  ],
  "troparion-of-the-cross": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "hymn-of-the-resurrection": [
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    },
    {
      "category": "communion",
      "subgroup": "Hymns"
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
  "beneath-thy-compassion": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "paschal-hymn-to-the-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "all-holy-lady-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
    }
  ],
  "o-angel-of-god": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "o-angel-of-christ": [
    {
      "category": "christ-saints",
      "subgroup": "Angels"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "apolytikion-st-john-chrysostom": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    }
  ],
  "apolytikion-st-basil": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    }
  ],
  "through-the-prayers-of-our-holy-fathers": [
    {
      "category": "christ-saints",
      "subgroup": "Saints"
    },
    {
      "category": "foundational",
      "subgroup": "Short Prayers"
    }
  ],
  "o-victorious-leader": [
    {
      "category": "christ-saints",
      "subgroup": "Akathists and Canons"
    },
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "agpeya-hail-to-you-mary": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "i-believe-o-lord": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "of-thy-mystical-supper": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "may-the-communion": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-1": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-2": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-3": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-4": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-5": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-6": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-7": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-8": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "prayer-before-communion-9": [
    {
      "category": "communion",
      "subgroup": "Before Communion"
    }
  ],
  "thanksgiving-after-communion": [
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
  "prayer-of-st-symeon-after-communion": [
    {
      "category": "communion",
      "subgroup": "After Communion"
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
  "only-begotten-son": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "the-great-litany": [
    {
      "category": "communion",
      "subgroup": "Litanies"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "christ-is-risen": [
    {
      "category": "communion",
      "subgroup": "Hymns"
    },
    {
      "category": "occasions",
      "subgroup": "Feasts"
    },
    {
      "category": "christ-saints",
      "subgroup": "Christ"
    }
  ],
  "for-the-sick": [
    {
      "category": "occasions",
      "subgroup": "Healing"
    }
  ],
  "prayer-for-travel": [
    {
      "category": "occasions",
      "subgroup": "Travel"
    }
  ],
  "prayer-for-the-departed": [
    {
      "category": "occasions",
      "subgroup": "The Departed"
    }
  ],
  "prayer-for-parents": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayer-of-parents-for-their-children": [
    {
      "category": "occasions",
      "subgroup": "Family"
    }
  ],
  "prayers-of-thanksgiving": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ],
  "troparion-of-the-nativity": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-theophany": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-the-annunciation": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-the-transfiguration": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-the-ascension": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "troparion-of-pentecost": [
    {
      "category": "occasions",
      "subgroup": "Feasts"
    }
  ],
  "psalm-1": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    }
  ],
  "psalm-23": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-27": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-34": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-46": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-50": [
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
  "psalm-91": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "psalm-103": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "psalm-104": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    }
  ],
  "psalm-117": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-121": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-130": [
    {
      "category": "psalms",
      "subgroup": "Selected Psalms"
    }
  ],
  "psalm-141": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "psalm-150": [
    {
      "category": "psalms",
      "subgroup": "Psalter"
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
    }
  ],
  "nunc-dimittis": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    },
    {
      "category": "communion",
      "subgroup": "After Communion"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "song-of-moses": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "song-of-hannah": [
    {
      "category": "psalms",
      "subgroup": "Canticles"
    }
  ],
  "the-beatitudes": [
    {
      "category": "psalms",
      "subgroup": "Beatitudes"
    },
    {
      "category": "communion",
      "subgroup": "Liturgies"
    }
  ],
  "agpeya-concluding-prayer": [
    {
      "category": "daily",
      "subgroup": "Hours"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "nerses-prayer-1": [
    {
      "category": "daily",
      "subgroup": "Morning"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "nerses-prayer-13": [
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "nerses-prayer-24": [
    {
      "category": "daily",
      "subgroup": "Night"
    },
    {
      "category": "daily",
      "subgroup": "Hours"
    }
  ],
  "malankara-trisagion": [
    {
      "category": "foundational",
      "subgroup": "Core"
    },
    {
      "category": "daily",
      "subgroup": "Rule of Prayer"
    }
  ],
  "malankara-morning-enyono": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "malankara-bootho-mor-yaqub": [
    {
      "category": "daily",
      "subgroup": "Morning"
    }
  ],
  "malankara-evening-incense": [
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "malankara-intercession-theotokos": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    },
    {
      "category": "daily",
      "subgroup": "Evening"
    }
  ],
  "malankara-bedtime-supplication": [
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "ephrem-night-hymn": [
    {
      "category": "daily",
      "subgroup": "Night"
    }
  ],
  "wudase-maryam-monday": [
    {
      "category": "christ-saints",
      "subgroup": "Theotokos"
    }
  ],
  "god-grant-you-many-years": [
    {
      "category": "occasions",
      "subgroup": "Blessings"
    }
  ]
};
