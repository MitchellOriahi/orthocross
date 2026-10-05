export const SAMPLE_VERSES = [
  { reference: "John 3:16", text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life." },
  { reference: "Philippians 4:13", text: "I can do all things through Christ who strengthens me." },
  { reference: "Psalm 23:1", text: "The Lord is my shepherd; I shall not want." },
  { reference: "Proverbs 3:5-6", text: "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight." },
  { reference: "Romans 8:28", text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose." },
  { reference: "Isaiah 41:10", text: "Fear not, for I am with you; be not dismayed, for I am your God; I will strengthen you, I will help you, I will uphold you with my righteous right hand." },
  { reference: "Matthew 11:28", text: "Come to me, all who labor and are heavy laden, and I will give you rest." },
  { reference: "Jeremiah 29:11", text: "For I know the plans I have for you, declares the Lord, plans for welfare and not for evil, to give you a future and a hope." },
];

export const getVerseOfTheDay = (date: Date = new Date()) => {
  // Get date as a string (YYYY-MM-DD)
  const dateString = date.toISOString().split('T')[0];
  
  // Create a deterministic seed from the date
  // This ensures the same verse is shown for everyone on the same day
  const dateSeed = dateString.split('-').reduce((acc, num) => acc + parseInt(num), 0);
  const verseIndex = dateSeed % SAMPLE_VERSES.length;
  
  return SAMPLE_VERSES[verseIndex];
};
