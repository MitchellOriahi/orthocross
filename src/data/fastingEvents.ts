export interface FastingEventData {
  name: string;
  month: number; // 0-11
  day: number;
  endMonth?: number; // 0-11
  endDay?: number;
  tradition: "Eastern" | "Oriental";
  type: "fast" | "feast";
  isMajor: boolean;
  // For moveable feasts that depend on the year
  isMoveable?: boolean;
}

// Fixed date events that apply to any year
export const fixedFastingEvents: FastingEventData[] = [
  // Eastern Orthodox Fasts
  { name: "Nativity Fast", month: 10, day: 15, endMonth: 11, endDay: 24, tradition: "Eastern", type: "fast", isMajor: true },
  { name: "Dormition Fast", month: 7, day: 1, endMonth: 7, endDay: 14, tradition: "Eastern", type: "fast", isMajor: true },
  
  // Eastern Orthodox Feasts
  { name: "Nativity of Christ", month: 11, day: 25, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Theophany (Epiphany)", month: 0, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Presentation of Christ", month: 1, day: 2, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Annunciation", month: 2, day: 25, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Transfiguration", month: 7, day: 6, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Dormition of Theotokos", month: 7, day: 15, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Nativity of Theotokos", month: 8, day: 8, tradition: "Eastern", type: "feast", isMajor: true },
  { name: "Elevation of the Cross", month: 8, day: 14, tradition: "Eastern", type: "feast", isMajor: true },
  
  // Oriental Orthodox Fasts
  { name: "Nativity Fast", month: 10, day: 25, endMonth: 0, endDay: 6, tradition: "Oriental", type: "fast", isMajor: true },
  { name: "Nineveh Fast", month: 1, day: 3, endMonth: 1, endDay: 5, tradition: "Oriental", type: "fast", isMajor: true },
  { name: "Great Lent", month: 1, day: 10, endMonth: 3, endDay: 19, tradition: "Oriental", type: "fast", isMajor: true },
  { name: "Apostles' Fast", month: 5, day: 16, endMonth: 6, endDay: 11, tradition: "Oriental", type: "fast", isMajor: true },
  { name: "Dormition Fast", month: 7, day: 7, endMonth: 7, endDay: 21, tradition: "Oriental", type: "fast", isMajor: true },
  
  // Oriental Orthodox Feasts
  { name: "Nativity of Christ", month: 0, day: 7, tradition: "Oriental", type: "feast", isMajor: true },
];

// Moveable feasts for 2025 (Eastern Orthodox)
export const moveableFeastsEastern2025: FastingEventData[] = [
  { name: "Great Lent", month: 2, day: 3, endMonth: 3, endDay: 19, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
  { name: "Palm Sunday", month: 3, day: 13, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pascha (Easter)", month: 3, day: 20, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Ascension", month: 4, day: 29, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Pentecost", month: 5, day: 8, tradition: "Eastern", type: "feast", isMajor: true, isMoveable: true },
  { name: "Apostles' Fast", month: 5, day: 15, endMonth: 5, endDay: 28, tradition: "Eastern", type: "fast", isMajor: true, isMoveable: true },
];

export const getAllFastingEvents = (year: number): FastingEventData[] => {
  // For 2025, include moveable feasts
  if (year === 2025) {
    return [...fixedFastingEvents, ...moveableFeastsEastern2025];
  }
  return fixedFastingEvents;
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
