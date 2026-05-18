// Bible Translation Configuration
// Only includes translations actually available via our Bible API (public domain)

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
  apiSupported: boolean;
}

export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    id: 'osb',
    abbreviation: 'OSB',
    fullName: 'Orthodox Study Bible',
    description: 'Orthodox Christian study Bible with Old Testament based on the Septuagint. Uses local Orthodox text where available; falls back to KJV for unimported chapters.',
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
    description: 'Classic English translation commissioned by King James I (1611).',
    tradition: 'Protestant (Traditional)',
    translationPhilosophy: 'Formal equivalence',
    year: 1611,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'web',
    abbreviation: 'WEB',
    fullName: 'World English Bible',
    description: 'Modern public-domain revision of the American Standard Version.',
    tradition: 'Ecumenical',
    translationPhilosophy: 'Formal equivalence',
    year: 2000,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'asv',
    abbreviation: 'ASV',
    fullName: 'American Standard Version',
    description: 'Highly literal 1901 American revision of the Revised Version.',
    tradition: 'Protestant',
    translationPhilosophy: 'Formal equivalence (word-for-word)',
    year: 1901,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'dra',
    abbreviation: 'DRA',
    fullName: 'Douay-Rheims (1899 American Edition)',
    description: 'Classic Catholic English translation from the Latin Vulgate.',
    tradition: 'Catholic',
    translationPhilosophy: 'Formal equivalence',
    year: 1899,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'bbe',
    abbreviation: 'BBE',
    fullName: 'Bible in Basic English',
    description: 'Translation using a limited vocabulary of basic English words.',
    tradition: 'Ecumenical',
    translationPhilosophy: 'Simplified / accessible language',
    year: 1965,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'ylt',
    abbreviation: 'YLT',
    fullName: "Young's Literal Translation",
    description: 'Extremely literal translation by Robert Young (1862).',
    tradition: 'Protestant',
    translationPhilosophy: 'Strictly literal',
    year: 1862,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'darby',
    abbreviation: 'DBY',
    fullName: 'Darby Bible',
    description: 'Literal translation by John Nelson Darby (1890).',
    tradition: 'Protestant',
    translationPhilosophy: 'Formal equivalence',
    year: 1890,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
  },
  {
    id: 'webbe',
    abbreviation: 'WEBBE',
    fullName: 'World English Bible, British Edition',
    description: 'British English edition of the World English Bible.',
    tradition: 'Ecumenical',
    translationPhilosophy: 'Formal equivalence',
    year: 2000,
    license: 'public_domain',
    isDefault: false,
    apiSupported: true,
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
