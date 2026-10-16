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
  /** App language this Bible is written in. */
  language: string;
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
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
    language: 'en',
  },
];


const other = (id: string, language: string, abbreviation: string, fullName: string, description: string, tradition: string, year: number): BibleTranslation => ({
  id, language, abbreviation, fullName, description, tradition, year,
  translationPhilosophy: 'Formal equivalence', license: 'public_domain', isDefault: false, apiSupported: true,
});

/** Bibles in other languages, chosen for their standing in the Orthodox churches of that language. */
export const OTHER_LANGUAGE_BIBLES: BibleTranslation[] = [
  other('ru-synod', 'ru', 'СП', 'Синодальный перевод', 'The Synodal translation, the standard Bible of the Russian Orthodox Church.', 'Russian Orthodox', 1876),
  other('el-lxx', 'el', 'ΟΕΚ', 'Μετάφραση των Ο΄ & Κείμενο Καινής Διαθήκης', 'Septuagint Old Testament with the traditional Byzantine-text New Testament, as read in the Greek Orthodox Church.', 'Greek Orthodox', 1624),
  other('ar-svd', 'ar', 'SVD', 'ترجمة فاندايك', 'The Smith–Van Dyck Bible, used across the Antiochian and Coptic Orthodox churches.', 'Antiochian & Coptic Orthodox', 1865),
  other('ro-vdcl', 'ro', 'VDC', 'Traducerea Cornilescu', 'The classic Romanian Bible translation by Dumitru Cornilescu.', 'Romanian', 1931),
  other('es-rv1960', 'es', 'RV60', 'Reina-Valera 1960', 'The most widely read Spanish Bible, used in many Spanish-speaking Orthodox parishes.', 'Spanish', 1960),
  other('fr-lsg', 'fr', 'LSG', 'Bible Segond 1910', 'The classic French Louis Segond Bible.', 'French', 1910),
  other('uk-ubio', 'uk', 'УБО', 'Біблія Огієнка', 'Translation by Metropolitan Ilarion (Ohienko), widely used by Ukrainian Orthodox faithful.', 'Ukrainian Orthodox', 1962),
  other('pt-arc', 'pt', 'ARC', 'Almeida Revista e Corrigida', 'The classic Almeida Bible in Portuguese.', 'Portuguese', 2009),
  other('he-wlc', 'he', 'WLC', 'כתבי הקודש – נוסח המסורה ודליטש', 'Hebrew Old Testament (Westminster Leningrad Codex) with Delitzsch\'s Hebrew New Testament.', 'Hebrew', 1877),
  other('ml-mov', 'ml', 'MOV', 'സത്യവേദപുസ്തകം', 'The Malayalam Bible read by the Malankara Orthodox Syrian Church.', 'Malankara Orthodox', 1910),
  other('sr-dk', 'sr', 'ДК', 'Библија (Даничић–Караџић)', 'The Daničić–Karadžić Bible, traditionally used by the Serbian Orthodox Church.', 'Serbian Orthodox', 1868),
];

export const ALL_BIBLE_TRANSLATIONS: BibleTranslation[] = [...BIBLE_TRANSLATIONS, ...OTHER_LANGUAGE_BIBLES];

/** Bibles offered in a given app language: the OSB always, plus that language's own Bibles.
 *  English also shows the other English Bibles; other languages never show English-only Bibles. */
export const getTranslationsForLanguage = (language: string): BibleTranslation[] => {
  const own = ALL_BIBLE_TRANSLATIONS.filter(t => t.language === language && t.id !== 'osb');
  return [ALL_BIBLE_TRANSLATIONS.find(t => t.id === 'osb')!, ...own];
};

/** Main Bible for a language: its own Bible when one exists, otherwise the OSB. */
export const getMainTranslationForLanguage = (language: string): BibleTranslation =>
  getTranslationsForLanguage(language)[1] ?? getDefaultTranslation();

const currentLanguage = () => localStorage.getItem('orthocross-language') || 'en';

export const getTranslationById = (id: string): BibleTranslation | undefined => {
  return ALL_BIBLE_TRANSLATIONS.find(t => t.id === id);
};

export const getTranslationByAbbreviation = (abbr: string): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.abbreviation.toLowerCase() === abbr.toLowerCase());
};

export const getDefaultTranslation = (): BibleTranslation => {
  return BIBLE_TRANSLATIONS.find(t => t.isDefault) || BIBLE_TRANSLATIONS[0];
};

// Get user's preferred translation from localStorage
export const getUserPreferredTranslation = (): BibleTranslation => {
  const language = currentLanguage();
  const offered = getTranslationsForLanguage(language);
  const saved = localStorage.getItem('preferredBibleTranslation');
  const match = saved ? offered.find(t => t.id === saved) : undefined;
  if (match) return match;
  return language === 'en' ? getDefaultTranslation() : getMainTranslationForLanguage(language);
};

// Save user's preferred translation to localStorage
export const setUserPreferredTranslation = (translationId: string): void => {
  localStorage.setItem('preferredBibleTranslation', translationId);
};
