export interface FastingEventData {
  name: string;
  month: number; // 0-11
  day: number;
  endMonth?: number; // 0-11
  endDay?: number;
  tradition: "Eastern" | "Oriental" | "Both";
  type: "fast" | "feast" | "holiday";
  isMajor: boolean;
  isMoveable?: boolean;
  /** Oriental calendar family; Oriental entries without one belong to the Alexandrian family. */
  family?: OrientalFamily;
}

/** Oriental Orthodox churches that share one set of calendar rules. */
export type OrientalFamily = "alexandrian" | "syriac" | "armenian";
export const ORIENTAL_FAMILIES: OrientalFamily[] = ["alexandrian", "syriac", "armenian"];
export const ORIENTAL_FAMILY_LABELS: Record<OrientalFamily, string> = {
  alexandrian: "Coptic, Ethiopian & Eritrean",
  syriac: "Syriac & Malankara (Indian)",
  armenian: "Armenian Apostolic",
};
export const parseOrientalFamily = (value: unknown): OrientalFamily | null =>
  value === "alexandrian" || value === "syriac" || value === "armenian" ? value : null;

// Fixed date events that apply to any year
export const fixedFastingEvents: FastingEventData[] = [
  // ============================================
  // EASTERN ORTHODOX - FIXED FASTS
  // ============================================
  { name: "Nativity Fast", month: 10, day: 15, endMonth: 11, endDay: 24, tradition: "Eastern", type: "fast", isMajor: true },
  { name: "Dormition Fast", month: 7, day: 1, endMonth: 7, endDay: 14, tradition: "Eastern", type: "fast", isMajor: true },
  { name: "Eve of Theophany (Strict Fast)", month: 0, day: 5, tradition: "Eastern", type: "fast", isMajor: false },
  { name: "Beheading of St. John (Fast)", month: 7, day: 29, tradition: "Eastern", type: "fast", isMajor: false },
  { name: "Elevation of the Cross (Fast)", month: 8, day: 14, tradition: "Eastern", type: "fast", isMajor: false },

  // ============================================
  // EASTERN ORTHODOX - GREAT FEASTS (12 + Pascha)
  // ============================================
  { name: "Nativity of Christ", month: 11, day: 25, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Theophany (Epiphany)", month: 0, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Presentation of Christ", month: 1, day: 2, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Annunciation", month: 2, day: 25, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Transfiguration", month: 7, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Dormition of Theotokos", month: 7, day: 15, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Nativity of Theotokos", month: 8, day: 8, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Elevation of the Cross", month: 8, day: 14, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Entry of Theotokos", month: 10, day: 21, tradition: "Eastern", type: "feast", isMajor: true },

  // ============================================
  // EASTERN ORTHODOX - HOLIDAYS & SAINTS DAYS
  // ============================================
  { name: "Circumcision of Christ", month: 0, day: 1, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Basil the Great", month: 0, day: 1, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Synaxis of Theotokos", month: 11, day: 26, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Stephen the Protomartyr", month: 11, day: 27, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Three Holy Hierarchs", month: 0, day: 30, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. George the Great Martyr", month: 3, day: 23, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Sts. Constantine & Helen", month: 4, day: 21, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Ss. Peter & Paul", month: 5, day: 29, tradition: "Eastern", type: "holiday", isMajor: true },
  { name: "St. Elijah (Elias)", month: 6, day: 20, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Nicholas", month: 11, day: 6, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Andrew the Apostle", month: 10, day: 30, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Protection of Theotokos", month: 9, day: 1, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Demetrios", month: 9, day: 26, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Synaxis of Archangels", month: 10, day: 8, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. John Chrysostom", month: 10, day: 13, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Gregory the Theologian", month: 0, day: 25, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Mark the Evangelist", month: 3, day: 25, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Nativity of St. John the Baptist", month: 5, day: 24, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "Beheading of St. John Baptist", month: 7, day: 29, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. John the Theologian", month: 8, day: 26, tradition: "Eastern", type: "holiday", isMajor: false },
  { name: "St. Luke the Evangelist", month: 9, day: 18, tradition: "Eastern", type: "holiday", isMajor: false },

  // ============================================
  // ORIENTAL ORTHODOX - FIXED FASTS
  // ============================================
  { name: "Nativity Fast (Advent)", month: 10, day: 25, endMonth: 0, endDay: 6, tradition: "Oriental", type: "fast", isMajor: true },
  { name: "Dormition Fast", month: 7, day: 7, endMonth: 7, endDay: 21, tradition: "Oriental", type: "fast", isMajor: true },

  // ============================================
  // ORIENTAL ORTHODOX - FEASTS
  // ============================================
  { name: "Nativity of Christ", month: 0, day: 7, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Theophany (Epiphany)", month: 0, day: 19, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Presentation of Christ", month: 1, day: 15, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Annunciation", month: 2, day: 25, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Transfiguration", month: 7, day: 19, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Dormition of Theotokos", month: 7, day: 22, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Nativity of Theotokos", month: 4, day: 9, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Finding of the True Cross", month: 2, day: 10, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Meskel (Finding of the Cross)", month: 8, day: 27, tradition: "Oriental", type: "feast", isMajor: true },
  { name: "Entry of Theotokos", month: 11, day: 3, tradition: "Oriental", type: "feast", isMajor: true },

  // ============================================
  // ORIENTAL ORTHODOX - HOLIDAYS & SAINTS DAYS
  // ============================================
  { name: "St. Mark the Evangelist", month: 3, day: 25, tradition: "Oriental", type: "holiday", isMajor: true },
  { name: "Coptic New Year (Nayrouz)", month: 8, day: 11, tradition: "Oriental", type: "holiday", isMajor: true },
  { name: "Flight to Egypt", month: 5, day: 1, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Entry into Egypt", month: 5, day: 24, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Athanasius the Apostolic", month: 4, day: 2, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Shenouda the Archimandrite", month: 6, day: 1, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Ss. Peter & Paul", month: 6, day: 12, tradition: "Oriental", type: "holiday", isMajor: true },
  { name: "St. George the Martyr", month: 3, day: 23, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Mina the Wonderworker", month: 10, day: 11, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Moses the Black", month: 7, day: 28, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Anthony the Great", month: 0, day: 17, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Paul the Hermit", month: 0, day: 15, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Archangel Michael", month: 10, day: 21, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Archangel Gabriel", month: 11, day: 19, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Wedding at Cana", month: 0, day: 13, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Massacre of Innocents", month: 0, day: 10, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Frumentius (Ethiopia)", month: 10, day: 30, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Yared (Ethiopia)", month: 4, day: 11, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Cathedral of St. Mark (Feast)", month: 10, day: 24, tradition: "Oriental", type: "holiday", isMajor: false },

  // ============================================
  // ORIENTAL ORTHODOX - SYRIAC & MALANKARA (Gregorian fixed feasts)
  // ============================================
  { name: "Nativity Fast", month: 11, day: 1, endMonth: 11, endDay: 24, tradition: "Oriental", family: "syriac", type: "fast", isMajor: true },
  { name: "Dormition Fast", month: 7, day: 1, endMonth: 7, endDay: 14, tradition: "Oriental", family: "syriac", type: "fast", isMajor: true },
  { name: "Nativity of Christ", month: 11, day: 25, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Theophany (Epiphany)", month: 0, day: 6, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Presentation of Christ", month: 1, day: 2, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Annunciation", month: 2, day: 25, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Apostles' Fast", month: 5, day: 16, endMonth: 5, endDay: 28, tradition: "Oriental", family: "syriac", type: "fast", isMajor: true },
  { name: "Ss. Peter & Paul", month: 5, day: 29, tradition: "Oriental", family: "syriac", type: "holiday", isMajor: true },
  { name: "Transfiguration", month: 7, day: 6, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Dormition of Theotokos", month: 7, day: 15, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Nativity of Theotokos", month: 8, day: 8, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },
  { name: "Exaltation of the Holy Cross", month: 8, day: 14, tradition: "Oriental", family: "syriac", type: "feast", isMajor: true },

  // ============================================
  // ORIENTAL ORTHODOX - ARMENIAN APOSTOLIC
  // ============================================
  { name: "Theophany Fast", month: 11, day: 30, endMonth: 0, endDay: 5, tradition: "Oriental", family: "armenian", type: "fast", isMajor: true },
  { name: "Nativity & Theophany of Christ", month: 0, day: 6, tradition: "Oriental", family: "armenian", type: "feast", isMajor: true },
  { name: "Presentation of Christ", month: 1, day: 14, tradition: "Oriental", family: "armenian", type: "feast", isMajor: true },
  { name: "Annunciation", month: 3, day: 7, tradition: "Oriental", family: "armenian", type: "feast", isMajor: true },
];

// Moveable feasts for 2025 (Eastern Orthodox)
export const moveableFeastsEastern2025: FastingEventData[] = [
  { name: "Great Lent", month: 2, day: 3, endMonth: 3, endDay: 19, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
  { name: "Palm Sunday", month: 3, day: 13, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Holy Week", month: 3, day: 14, endMonth: 3, endDay: 19, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
  { name: "Pascha (Easter)", month: 3, day: 20, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Bright Week", month: 3, day: 21, endMonth: 3, endDay: 26, tradition: "Eastern", type: "feast", isMajor: false, isMoveable: true },
  { name: "Ascension", month: 4, day: 29, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pentecost", month: 5, day: 8, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "All Saints Sunday", month: 5, day: 15, tradition: "Eastern", type: "holiday", isMajor: true, isMoveable: true },
  { name: "Apostles' Fast", month: 5, day: 16, endMonth: 5, endDay: 28, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
];

// Moveable feasts for 2026 (Eastern Orthodox)
export const moveableFeastsEastern2026: FastingEventData[] = [
  { name: "Great Lent", month: 1, day: 16, endMonth: 3, endDay: 4, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
  { name: "Palm Sunday", month: 3, day: 5, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Holy Week", month: 3, day: 6, endMonth: 3, endDay: 11, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
  { name: "Pascha (Easter)", month: 3, day: 12, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Bright Week", month: 3, day: 13, endMonth: 3, endDay: 18, tradition: "Eastern", type: "feast", isMajor: false, isMoveable: true },
  { name: "Ascension", month: 4, day: 21, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pentecost", month: 4, day: 31, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "All Saints Sunday", month: 5, day: 7, tradition: "Eastern", type: "holiday", isMajor: true, isMoveable: true },
  { name: "Apostles' Fast", month: 5, day: 8, endMonth: 5, endDay: 28, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
];

export type CalendarSystem = "Gregorian" | "Julian";

// Shift a month/day by `delta` days, returning the resulting month/day.
// Year is used only for arithmetic (handles month-length variation); the
// returned month/day is treated as belonging to the same display year so the
// shifted entry still appears under the selected year/month view.
const shiftMonthDay = (
  year: number,
  month: number,
  day: number,
  delta: number
): { month: number; day: number } => {
  const d = new Date(year, month, day);
  d.setDate(d.getDate() + delta);
  return { month: d.getMonth(), day: d.getDate() };
};

// Under the Old (Julian) Calendar, fixed Eastern Orthodox feasts/fasts fall
// 13 days later on the civil (Gregorian) calendar than under the New
// (Revised Julian) Calendar. Moveable feasts already use the Julian
// Paschalion in both calendars, so they are not shifted. Oriental Orthodox
// (Coptic/Ethiopian/Armenian/Syriac) dates use their own calendars and are
// not affected by this toggle.
const applyJulianShift = (
  event: FastingEventData,
  year: number
): FastingEventData => {
  if (event.isMoveable) return event;
  if (event.tradition !== "Eastern" && event.tradition !== "Both") return event;

  const start = shiftMonthDay(year, event.month, event.day, 13);
  let endMonth = event.endMonth;
  let endDay = event.endDay;

  if (event.endMonth !== undefined && event.endDay !== undefined) {
    const endYearGuess = event.endMonth < event.month ? year + 1 : year;
    const end = shiftMonthDay(endYearGuess, event.endMonth, event.endDay, 13);
    endMonth = end.month;
    endDay = end.day;
  }

  return { ...event, month: start.month, day: start.day, endMonth, endDay };
};

const inFamily = (event: FastingEventData, family: OrientalFamily) =>
  event.tradition !== "Oriental" || (event.family ?? "alexandrian") === family;

/** Oriental entries are limited to `orientalFamily`, so every caller sees one church family's calendar. */
export const getAllFastingEvents = (
  year: number,
  calendarSystem: CalendarSystem = "Gregorian",
  orientalFamily: OrientalFamily = "alexandrian"
): FastingEventData[] => {
  const base = fixedFastingEvents.filter((e) => inFamily(e, orientalFamily));
  const eastern = year === 2025 ? moveableFeastsEastern2025
    : year === 2026 ? moveableFeastsEastern2026
    : easternMoveableFeasts(orthodoxPaschaUtc(year));
  const all = [...base, ...eastern, ...orientalMoveableFeasts(year, orientalFamily)];

  if (calendarSystem === "Julian") {
    return all.map((e) => applyJulianShift(e, year));
  }
  return all;
};

export const formatEventDate = (month: number, day: number): string => {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${monthNames[month]} ${day}`;
};

export const createDateFromEvent = (year: number, month: number, day: number): Date => {
  return new Date(year, month, day);
};

// ============================================
// MOVEABLE FEASTS FOR ANY YEAR
// ============================================
// The hand-entered Eastern 2025/2026 lists above stay as they are. Every other list is
// computed from Orthodox Pascha (Julian Paschalion, shown on the civil
// calendar) using the same offsets as those lists.

const DAY_MS = 86_400_000;

/** Orthodox Pascha for `year`, as a UTC midnight timestamp on the civil (Gregorian) calendar. */
export function orthodoxPaschaUtc(year: number): number {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const julianMonth = Math.floor((d + e + 114) / 31);
  const julianDay = ((d + e + 114) % 31) + 1;
  const julianToCivilGap = Math.floor(year / 100) - Math.floor(year / 400) - 2;
  return Date.UTC(year, julianMonth - 1, julianDay + julianToCivilGap);
}

const offsetDay = (paschaUtc: number, offset: number) => {
  const date = new Date(paschaUtc + offset * DAY_MS);
  return { month: date.getUTCMonth(), day: date.getUTCDate() };
};

type MoveableSpec = {
  name: string;
  type: FastingEventData["type"];
  isMajor: boolean;
  start: number;
  end?: number | { month: number; day: number };
};

const buildMoveable = (paschaUtc: number, tradition: "Eastern" | "Oriental", specs: MoveableSpec[], family?: OrientalFamily): FastingEventData[] => {
  const year = new Date(paschaUtc).getUTCFullYear();
  const out: FastingEventData[] = [];
  for (const spec of specs) {
    const start = offsetDay(paschaUtc, spec.start);
    const event: FastingEventData = { name: spec.name, month: start.month, day: start.day, tradition, type: spec.type, isMajor: spec.isMajor, isMoveable: true };
    if (family) event.family = family;
    if (spec.end !== undefined) {
      const end = typeof spec.end === "number" ? offsetDay(paschaUtc, spec.end) : spec.end;
      // A fast that would end before it begins (very late Pascha) is skipped that year.
      if (Date.UTC(year, end.month, end.day) < Date.UTC(year, start.month, start.day)) continue;
      event.endMonth = end.month;
      event.endDay = end.day;
    }
    out.push(event);
  }
  return out;
};

const EASTERN_MOVEABLE: MoveableSpec[] = [
  { name: "Great Lent", type: "fast", isMajor: true, start: -48, end: -1 },
  { name: "Palm Sunday", type: "feast", isMajor: true, start: -7 },
  { name: "Holy Week", type: "fast", isMajor: true, start: -6, end: -1 },
  { name: "Pascha (Easter)", type: "feast", isMajor: true, start: 0 },
  { name: "Bright Week", type: "feast", isMajor: false, start: 1, end: 6 },
  { name: "Ascension", type: "feast", isMajor: true, start: 39 },
  { name: "Pentecost", type: "feast", isMajor: true, start: 49 },
  { name: "All Saints Sunday", type: "holiday", isMajor: true, start: 56 },
  { name: "Apostles' Fast", type: "fast", isMajor: true, start: 57, end: { month: 5, day: 28 } },
];

/** Western (Gregorian computus) Easter, followed by the Armenian Apostolic Church outside Jerusalem. */
export function gregorianEasterUtc(year: number): number {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return Date.UTC(year, month - 1, day);
}

// Coptic/Ethiopian Great Lent is 55 days (preparatory week + 40 days + Holy Week);
// the Fast of Nineveh begins two weeks before it.
const ALEXANDRIAN_MOVEABLE: MoveableSpec[] = [
  { name: "Nineveh Fast", type: "fast", isMajor: true, start: -69, end: -67 },
  { name: "Great Lent", type: "fast", isMajor: true, start: -55, end: -1 },
  { name: "Holy Week", type: "fast", isMajor: true, start: -6, end: -1 },
  { name: "Palm Sunday", type: "feast", isMajor: true, start: -7 },
  { name: "Pascha (Easter)", type: "feast", isMajor: true, start: 0 },
  { name: "Ascension", type: "feast", isMajor: true, start: 39 },
  { name: "Pentecost", type: "feast", isMajor: true, start: 49 },
  { name: "Apostles' Fast", type: "fast", isMajor: true, start: 50, end: { month: 6, day: 11 } },
];

// Syriac/Malankara Great Lent (50-day Lent) begins on Clean Monday; Ba'utha (Nineveh) three weeks earlier.
const SYRIAC_MOVEABLE: MoveableSpec[] = [
  { name: "Nineveh Fast", type: "fast", isMajor: true, start: -69, end: -67 },
  { name: "Great Lent", type: "fast", isMajor: true, start: -48, end: -1 },
  { name: "Holy Week", type: "fast", isMajor: true, start: -6, end: -1 },
  { name: "Palm Sunday", type: "feast", isMajor: true, start: -7 },
  { name: "Pascha (Easter)", type: "feast", isMajor: true, start: 0 },
  { name: "Ascension", type: "feast", isMajor: true, start: 39 },
  { name: "Pentecost", type: "feast", isMajor: true, start: 49 },
];

const ARMENIAN_MOVEABLE: MoveableSpec[] = [
  { name: "Great Lent", type: "fast", isMajor: true, start: -48, end: -1 },
  { name: "Holy Week", type: "fast", isMajor: true, start: -6, end: -1 },
  { name: "Palm Sunday", type: "feast", isMajor: true, start: -7 },
  { name: "Pascha (Easter)", type: "feast", isMajor: true, start: 0 },
  { name: "Ascension", type: "feast", isMajor: true, start: 39 },
  { name: "Pentecost", type: "feast", isMajor: true, start: 49 },
];

const ORIENTAL_SPECS: Record<OrientalFamily, MoveableSpec[]> = {
  alexandrian: ALEXANDRIAN_MOVEABLE, syriac: SYRIAC_MOVEABLE, armenian: ARMENIAN_MOVEABLE,
};

export const easternMoveableFeasts = (paschaUtc: number) => buildMoveable(paschaUtc, "Eastern", EASTERN_MOVEABLE);

/** Coptic, Ethiopian, Eritrean, Syriac and Malankara Pascha follows the Julian Paschalion (same day as Eastern Orthodoxy); Armenians use the Gregorian computus. */
export const orientalPaschaUtc = (year: number, family: OrientalFamily) =>
  family === "armenian" ? gregorianEasterUtc(year) : orthodoxPaschaUtc(year);

export const orientalMoveableFeasts = (year: number, family: OrientalFamily = "alexandrian") =>
  buildMoveable(orientalPaschaUtc(year, family), "Oriental", ORIENTAL_SPECS[family], family === "alexandrian" ? undefined : family);

export const moveableFeastsForYear = (year: number, family: OrientalFamily = "alexandrian"): FastingEventData[] =>
  [...easternMoveableFeasts(orthodoxPaschaUtc(year)), ...orientalMoveableFeasts(year, family)];

// ============================================
// TRADITION AND "WHAT IS TODAY"
// ============================================

export type CalendarTradition = "Eastern Orthodox" | "Oriental Orthodox";
export type ObservanceCategory = "feast" | "holiday" | "fast";

// Mirrors ORTHODOX_BRANCHES in src/data/profileIdentity.ts (a test keeps them in sync).
export const ORIENTAL_BRANCHES = ["Coptic", "Ethiopian Tewahedo", "Eritrean Tewahedo", "Armenian Apostolic", "Syriac Orthodox", "Malankara Orthodox", "Jacobite Syrian Orthodox", "Oriental Orthodox"];
export const EASTERN_BRANCHES = ["Greek Orthodox", "Russian Orthodox", "Antiochian Orthodox", "Serbian Orthodox", "Romanian Orthodox", "Bulgarian Orthodox", "Georgian Orthodox", "Cypriot Orthodox", "Polish Orthodox", "Albanian Orthodox", "Orthodox Church in America", "Ukrainian Orthodox", "Macedonian Orthodox", "Czech and Slovak Orthodox", "Finnish Orthodox", "Japanese Orthodox", "Eastern Orthodox"];

/** Same rule as the calendar screen: a chosen church decides; otherwise the reader's own calendar pick, else Eastern. */
export function resolveCalendarTradition(branch: string | null | undefined, savedTradition: string | null | undefined): CalendarTradition {
  if (branch && ORIENTAL_BRANCHES.includes(branch)) return "Oriental Orthodox";
  if (branch && EASTERN_BRANCHES.includes(branch)) return "Eastern Orthodox";
  return savedTradition === "Oriental Orthodox" ? "Oriental Orthodox" : "Eastern Orthodox";
}

const BRANCH_FAMILY: Record<string, OrientalFamily> = {
  "Coptic": "alexandrian", "Ethiopian Tewahedo": "alexandrian", "Eritrean Tewahedo": "alexandrian",
  "Syriac Orthodox": "syriac", "Malankara Orthodox": "syriac", "Jacobite Syrian Orthodox": "syriac",
  "Armenian Apostolic": "armenian",
};

/** A specific Oriental church decides its family; otherwise the reader's saved pick, else Alexandrian. */
export function resolveOrientalFamily(branch: string | null | undefined, saved: unknown): OrientalFamily {
  return (branch && BRANCH_FAMILY[branch]) || parseOrientalFamily(saved) || "alexandrian";
}

export interface DatedObservance {
  name: string;
  category: ObservanceCategory;
  kind: "event" | "weekly";
  isMajor: boolean;
  startDate: string;
  endDate: string;
  /** 1-based day within a multi-day period (1 for single days). */
  dayOfPeriod: number;
  totalDays: number;
}

const dateKey = (utc: number) => new Date(utc).toISOString().slice(0, 10);
const parseDateKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};

/** Every listed fast, feast or holiday that covers `localDate` (YYYY-MM-DD) for the tradition and calendar. */
export function observancesOnDate(localDate: string, tradition: CalendarTradition, calendarSystem: CalendarSystem = "Gregorian", orientalFamily: OrientalFamily = "alexandrian"): DatedObservance[] {
  const target = parseDateKey(localDate);
  const year = new Date(target).getUTCFullYear();
  const filter = tradition === "Eastern Orthodox" ? "Eastern" : "Oriental";
  const found: DatedObservance[] = [];
  const seen = new Set<string>();

  // The previous year's list contributes periods that run across New Year (e.g. Nativity Fast).
  for (const listYear of [year - 1, year]) {
    for (const event of getAllFastingEvents(listYear, calendarSystem, orientalFamily)) {
      if (event.tradition !== filter && event.tradition !== "Both") continue;
      const start = Date.UTC(listYear, event.month, event.day);
      const end = event.endMonth !== undefined && event.endDay !== undefined
        ? Date.UTC(event.endMonth < event.month ? listYear + 1 : listYear, event.endMonth, event.endDay)
        : start;
      if (target < start || target > end) continue;
      const key = `${event.name}|${start}`;
      if (seen.has(key)) continue;
      seen.add(key);
      found.push({
        name: event.name,
        category: event.type,
        kind: "event",
        isMajor: event.isMajor,
        startDate: dateKey(start),
        endDate: dateKey(end),
        dayOfPeriod: Math.round((target - start) / DAY_MS) + 1,
        totalDays: Math.round((end - start) / DAY_MS) + 1,
      });
    }
  }

  const rank: Record<ObservanceCategory, number> = { feast: 0, holiday: 1, fast: 2 };
  return found.sort((a, b) =>
    rank[a.category] - rank[b.category]
    || Number(b.isMajor) - Number(a.isMajor)
    || a.totalDays - b.totalDays
    || a.name.localeCompare(b.name));
}

/** Wednesday and Friday, as marked on the calendar grid. */
export function weeklyFastOnDate(localDate: string): DatedObservance | null {
  const weekday = new Date(parseDateKey(localDate)).getUTCDay();
  if (weekday !== 3 && weekday !== 5) return null;
  return {
    name: weekday === 3 ? "Wednesday Fast" : "Friday Fast",
    category: "fast",
    kind: "weekly",
    isMajor: false,
    startDate: localDate,
    endDate: localDate,
    dayOfPeriod: 1,
    totalDays: 1,
  };
}

/** Today's single most important observance: Feast > Holiday > Fast > Wednesday/Friday fast. */
export function primaryObservance(observances: DatedObservance[], weekly: DatedObservance | null): DatedObservance | null {
  return observances[0] ?? weekly;
}
