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
}

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
  { name: "Armenian Christmas", month: 0, day: 6, tradition: "Oriental", type: "holiday", isMajor: true },
  { name: "St. Frumentius (Ethiopia)", month: 10, day: 30, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "St. Yared (Ethiopia)", month: 4, day: 11, tradition: "Oriental", type: "holiday", isMajor: false },
  { name: "Cathedral of St. Mark (Feast)", month: 10, day: 24, tradition: "Oriental", type: "holiday", isMajor: false },
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

// Moveable feasts for 2025 (Oriental Orthodox)
export const moveableFeastsOriental2025: FastingEventData[] = [
  { name: "Nineveh Fast", month: 1, day: 10, endMonth: 1, endDay: 12, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Great Lent", month: 1, day: 24, endMonth: 3, endDay: 12, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Holy Week", month: 3, day: 7, endMonth: 3, endDay: 12, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Palm Sunday", month: 3, day: 6, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pascha (Easter)", month: 3, day: 13, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Ascension", month: 4, day: 22, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pentecost", month: 5, day: 1, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Apostles' Fast", month: 5, day: 2, endMonth: 6, endDay: 11, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
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

// Moveable feasts for 2026 (Oriental Orthodox)
export const moveableFeastsOriental2026: FastingEventData[] = [
  { name: "Nineveh Fast", month: 1, day: 2, endMonth: 1, endDay: 4, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Great Lent", month: 1, day: 16, endMonth: 3, endDay: 4, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Palm Sunday", month: 2, day: 29, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Holy Week", month: 2, day: 30, endMonth: 3, endDay: 4, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
  { name: "Pascha (Easter)", month: 3, day: 5, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Ascension", month: 4, day: 14, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pentecost", month: 4, day: 24, tradition: "Oriental", type: "feast", isMajor: true, isMoveable: true },
  { name: "Apostles' Fast", month: 4, day: 25, endMonth: 6, endDay: 11, tradition: "Oriental", type: "fast", isMajor: true, isMoveable: true },
];

export type CalendarSystem = "New" | "Julian";

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

export const getAllFastingEvents = (
  year: number,
  calendarSystem: CalendarSystem = "New"
): FastingEventData[] => {
  const base = [...fixedFastingEvents];

  let all: FastingEventData[];
  if (year === 2025) {
    all = [...base, ...moveableFeastsEastern2025, ...moveableFeastsOriental2025];
  } else if (year === 2026) {
    all = [...base, ...moveableFeastsEastern2026, ...moveableFeastsOriental2026];
  } else {
    all = base;
  }

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
