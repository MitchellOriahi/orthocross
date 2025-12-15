// Bible Translation Configuration
// Only includes official, licensed or public domain translations

export interface BibleTranslation {
  id: string;
  abbreviation: string;
  fullName: string;
  description: string;
  tradition: string;
  translationPhilosophy: string;
  year: number;
  license: 'public_domain' | 'licensed';
  isDefault: boolean;
  apiSupported: boolean; // Whether this translation is available via Bible API
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    id: 'osb',
    abbreviation: 'OSB',
    fullName: 'Orthodox Study Bible',
    description: 'Orthodox Christian study Bible with Old Testament based on the Septuagint',
    tradition: 'Eastern Orthodox',
    translationPhilosophy: 'Septuagint-based, formal equivalence',
    year: 2008,
    license: 'licensed',
    isDefault: true,
    apiSupported: false,
  },
  {
    id: 'kjv',
    abbreviation: 'KJV',
    fullName: 'King James Version',
    description: 'Classic English translation commissioned by King James I',
    tradition: 'Protestant (Traditional)',
    translationPhilosophy: 'Formal equivalence',
    year: 1611,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'nkjv',
    abbreviation: 'NKJV',
    fullName: 'New King James Version',
    description: 'Modern English update of the King James Version',
    tradition: 'Protestant',
    translationPhilosophy: 'Formal equivalence',
    year: 1982,
    license: 'licensed',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'rsv',
    abbreviation: 'RSV',
    fullName: 'Revised Standard Version',
    description: 'Scholarly revision of the American Standard Version',
    tradition: 'Ecumenical',
    translationPhilosophy: 'Formal equivalence',
    year: 1952,
    license: 'licensed',
    isDefault: false,
    apiSupported: false,
  },
  {
    id: 'nrsv',
    abbreviation: 'NRSV',
    fullName: 'New Revised Standard Version',
    description: 'Updated version of the RSV with gender-inclusive language',
    tradition: 'Ecumenical',
    translationPhilosophy: 'Formal equivalence',
    year: 1989,
    license: 'licensed',
    isDefault: false,
    apiSupported: false,
  },
  {
    id: 'esv',
    abbreviation: 'ESV',
    fullName: 'English Standard Version',
    description: 'Essentially literal translation for reading and study',
    tradition: 'Protestant (Evangelical)',
    translationPhilosophy: 'Essentially literal',
    year: 2001,
    license: 'licensed',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'nasb',
    abbreviation: 'NASB',
    fullName: 'New American Standard Bible',
    description: 'Highly literal translation known for accuracy',
    tradition: 'Protestant (Evangelical)',
    translationPhilosophy: 'Formal equivalence (word-for-word)',
    year: 1971,
    license: 'licensed',
    isDefault: false,
    apiSupported: false,
  },
];

export const getTranslationById = (id: string): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.id === id);
};

export const getTranslationByAbbreviation = (abbr: string): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.abbreviation.toLowerCase() === abbr.toLowerCase());
};

export const getDefaultTranslation = (): BibleTranslation => {
  return BIBLE_TRANSLATIONS.find(t => t.isDefault) || BIBLE_TRANSLATIONS[0];
};

// Get user's preferred translation from localStorage
export const getUserPreferredTranslation = (): BibleTranslation => {
  const saved = localStorage.getItem('preferredBibleTranslation');
  if (saved) {
    const translation = getTranslationById(saved);
    if (translation) return translation;
  }
  return getDefaultTranslation();
};

// Save user's preferred translation to localStorage
export const setUserPreferredTranslation = (translationId: string): void => {
  localStorage.setItem('preferredBibleTranslation', translationId);
};
