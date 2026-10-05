// Bible verses for Orthodox readings
export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

export interface BookInfo {
  title: string;
  bookName: string;
  totalChapters: number;
  category: string;
  testament: 'OT' | 'NT' | 'Additional';
}

// Complete Bible book structure organized by categories
export const BIBLE_BOOKS: BookInfo[] = [
  // OLD TESTAMENT - THE LAW
  { title: "Genesis", bookName: "Genesis", totalChapters: 50, category: "The Law", testament: "OT" },
  { title: "Exodus", bookName: "Exodus", totalChapters: 40, category: "The Law", testament: "OT" },
  { title: "Leviticus", bookName: "Leviticus", totalChapters: 27, category: "The Law", testament: "OT" },
  { title: "Numbers", bookName: "Numbers", totalChapters: 36, category: "The Law", testament: "OT" },
  { title: "Deuteronomy", bookName: "Deuteronomy", totalChapters: 34, category: "The Law", testament: "OT" },
  
  // OLD TESTAMENT - HISTORY
  { title: "Joshua", bookName: "Joshua", totalChapters: 24, category: "History", testament: "OT" },
  { title: "Judges", bookName: "Judges", totalChapters: 21, category: "History", testament: "OT" },
  { title: "Ruth", bookName: "Ruth", totalChapters: 4, category: "History", testament: "OT" },
  { title: "1 Samuel", bookName: "1 Samuel", totalChapters: 31, category: "History", testament: "OT" },
  { title: "2 Samuel", bookName: "2 Samuel", totalChapters: 24, category: "History", testament: "OT" },
  { title: "1 Kings", bookName: "1 Kings", totalChapters: 22, category: "History", testament: "OT" },
  { title: "2 Kings", bookName: "2 Kings", totalChapters: 25, category: "History", testament: "OT" },
  { title: "1 Chronicles", bookName: "1 Chronicles", totalChapters: 29, category: "History", testament: "OT" },
  { title: "2 Chronicles", bookName: "2 Chronicles", totalChapters: 36, category: "History", testament: "OT" },
  { title: "Ezra", bookName: "Ezra", totalChapters: 10, category: "History", testament: "OT" },
  { title: "Nehemiah", bookName: "Nehemiah", totalChapters: 13, category: "History", testament: "OT" },
  { title: "Esther", bookName: "Esther", totalChapters: 10, category: "History", testament: "OT" },
  
  // OLD TESTAMENT - WISDOM
  { title: "Job", bookName: "Job", totalChapters: 42, category: "Wisdom", testament: "OT" },
  { title: "Psalms", bookName: "Psalms", totalChapters: 150, category: "Wisdom", testament: "OT" },
  { title: "Proverbs", bookName: "Proverbs", totalChapters: 31, category: "Wisdom", testament: "OT" },
  { title: "Ecclesiastes", bookName: "Ecclesiastes", totalChapters: 12, category: "Wisdom", testament: "OT" },
  { title: "Song of Songs", bookName: "Song of Songs", totalChapters: 8, category: "Wisdom", testament: "OT" },
  
  // OLD TESTAMENT - PROPHETS
  { title: "Isaiah", bookName: "Isaiah", totalChapters: 66, category: "Prophets", testament: "OT" },
  { title: "Jeremiah", bookName: "Jeremiah", totalChapters: 52, category: "Prophets", testament: "OT" },
  { title: "Lamentations", bookName: "Lamentations", totalChapters: 5, category: "Prophets", testament: "OT" },
  { title: "Ezekiel", bookName: "Ezekiel", totalChapters: 48, category: "Prophets", testament: "OT" },
  { title: "Daniel", bookName: "Daniel", totalChapters: 12, category: "Prophets", testament: "OT" },
  { title: "Hosea", bookName: "Hosea", totalChapters: 14, category: "Prophets", testament: "OT" },
  { title: "Joel", bookName: "Joel", totalChapters: 3, category: "Prophets", testament: "OT" },
  { title: "Amos", bookName: "Amos", totalChapters: 9, category: "Prophets", testament: "OT" },
  { title: "Obadiah", bookName: "Obadiah", totalChapters: 1, category: "Prophets", testament: "OT" },
  { title: "Jonah", bookName: "Jonah", totalChapters: 4, category: "Prophets", testament: "OT" },
  { title: "Micah", bookName: "Micah", totalChapters: 7, category: "Prophets", testament: "OT" },
  { title: "Nahum", bookName: "Nahum", totalChapters: 3, category: "Prophets", testament: "OT" },
  { title: "Habakkuk", bookName: "Habakkuk", totalChapters: 3, category: "Prophets", testament: "OT" },
  { title: "Zephaniah", bookName: "Zephaniah", totalChapters: 3, category: "Prophets", testament: "OT" },
  { title: "Haggai", bookName: "Haggai", totalChapters: 2, category: "Prophets", testament: "OT" },
  { title: "Zechariah", bookName: "Zechariah", totalChapters: 14, category: "Prophets", testament: "OT" },
  { title: "Malachi", bookName: "Malachi", totalChapters: 4, category: "Prophets", testament: "OT" },
  
  // NEW TESTAMENT - THE GOSPELS
  { title: "Matthew", bookName: "Matthew", totalChapters: 28, category: "The Gospels", testament: "NT" },
  { title: "Mark", bookName: "Mark", totalChapters: 16, category: "The Gospels", testament: "NT" },
  { title: "Luke", bookName: "Luke", totalChapters: 24, category: "The Gospels", testament: "NT" },
  { title: "John", bookName: "John", totalChapters: 21, category: "The Gospels", testament: "NT" },
  
  // NEW TESTAMENT - CHURCH HISTORY
  { title: "Acts", bookName: "Acts", totalChapters: 28, category: "Church History", testament: "NT" },
  
  // NEW TESTAMENT - PAUL'S LETTERS
  { title: "Romans", bookName: "Romans", totalChapters: 16, category: "Paul's Letters", testament: "NT" },
  { title: "1 Corinthians", bookName: "1 Corinthians", totalChapters: 16, category: "Paul's Letters", testament: "NT" },
  { title: "2 Corinthians", bookName: "2 Corinthians", totalChapters: 13, category: "Paul's Letters", testament: "NT" },
  { title: "Galatians", bookName: "Galatians", totalChapters: 6, category: "Paul's Letters", testament: "NT" },
  { title: "Ephesians", bookName: "Ephesians", totalChapters: 6, category: "Paul's Letters", testament: "NT" },
  { title: "Philippians", bookName: "Philippians", totalChapters: 4, category: "Paul's Letters", testament: "NT" },
  { title: "Colossians", bookName: "Colossians", totalChapters: 4, category: "Paul's Letters", testament: "NT" },
  { title: "1 Thessalonians", bookName: "1 Thessalonians", totalChapters: 5, category: "Paul's Letters", testament: "NT" },
  { title: "2 Thessalonians", bookName: "2 Thessalonians", totalChapters: 3, category: "Paul's Letters", testament: "NT" },
  { title: "1 Timothy", bookName: "1 Timothy", totalChapters: 6, category: "Paul's Letters", testament: "NT" },
  { title: "2 Timothy", bookName: "2 Timothy", totalChapters: 4, category: "Paul's Letters", testament: "NT" },
  { title: "Titus", bookName: "Titus", totalChapters: 3, category: "Paul's Letters", testament: "NT" },
  { title: "Philemon", bookName: "Philemon", totalChapters: 1, category: "Paul's Letters", testament: "NT" },
  
  // NEW TESTAMENT - GENERAL LETTERS
  { title: "Hebrews", bookName: "Hebrews", totalChapters: 13, category: "General Letters", testament: "NT" },
  { title: "James", bookName: "James", totalChapters: 5, category: "General Letters", testament: "NT" },
  { title: "1 Peter", bookName: "1 Peter", totalChapters: 5, category: "General Letters", testament: "NT" },
  { title: "2 Peter", bookName: "2 Peter", totalChapters: 3, category: "General Letters", testament: "NT" },
  { title: "1 John", bookName: "1 John", totalChapters: 5, category: "General Letters", testament: "NT" },
  { title: "2 John", bookName: "2 John", totalChapters: 1, category: "General Letters", testament: "NT" },
  { title: "3 John", bookName: "3 John", totalChapters: 1, category: "General Letters", testament: "NT" },
  { title: "Jude", bookName: "Jude", totalChapters: 1, category: "General Letters", testament: "NT" },
  
  // NEW TESTAMENT - PROPHECY
  { title: "Revelation", bookName: "Revelation", totalChapters: 22, category: "Prophecy", testament: "NT" },
  
  // ORTHODOX ADDITIONAL READINGS
  { title: "1 Enoch", bookName: "1 Enoch", totalChapters: 108, category: "Additional Readings", testament: "Additional" },
  { title: "Jubilees", bookName: "Jubilees", totalChapters: 50, category: "Additional Readings", testament: "Additional" },
  { title: "1 Meqabyan", bookName: "1 Meqabyan", totalChapters: 36, category: "Additional Readings", testament: "Additional" },
  { title: "2 Meqabyan", bookName: "2 Meqabyan", totalChapters: 21, category: "Additional Readings", testament: "Additional" },
  { title: "3 Meqabyan", bookName: "3 Meqabyan", totalChapters: 10, category: "Additional Readings", testament: "Additional" },
];

export const getCategorizedBooks = () => {
  const oldTestament: Record<string, BookInfo[]> = {};
  const newTestament: Record<string, BookInfo[]> = {};
  const additional: BookInfo[] = [];

  BIBLE_BOOKS.forEach(book => {
    if (book.testament === 'OT') {
      if (!oldTestament[book.category]) {
        oldTestament[book.category] = [];
      }
      oldTestament[book.category].push(book);
    } else if (book.testament === 'NT') {
      if (!newTestament[book.category]) {
        newTestament[book.category] = [];
      }
      newTestament[book.category].push(book);
    } else {
      additional.push(book);
    }
  });

  return { oldTestament, newTestament, additional };
};

// Content for Orthodox additional readings and canonical books
// NOTE: For complete Bible text, integrate with a Bible API like api.bible or bible-api.com
export const bibleContent: Record<string, Record<number, Verse[]>> = {
  "John": {
    1: [
      { number: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
      { number: 2, text: "He was in the beginning with God." },
      { number: 3, text: "All things were made through Him, and without Him nothing was made that was made." },
      { number: 4, text: "In Him was life, and the life was the light of men." },
      { number: 5, text: "And the light shines in the darkness, and the darkness did not comprehend it." },
      { number: 6, text: "There was a man sent from God, whose name was John." },
      { number: 7, text: "This man came for a witness, to bear witness of the Light, that all through him might believe." },
      { number: 8, text: "He was not that Light, but was sent to bear witness of that Light." },
      { number: 9, text: "That was the true Light which gives light to every man coming into the world." },
      { number: 10, text: "He was in the world, and the world was made through Him, and the world did not know Him." },
      { number: 11, text: "He came to His own, and His own did not receive Him." },
      { number: 12, text: "But as many as received Him, to them He gave the right to become children of God, to those who believe in His name:" },
      { number: 13, text: "who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God." },
      { number: 14, text: "And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth." },
    ],
    3: [
      { number: 1, text: "There was a man of the Pharisees named Nicodemus, a ruler of the Jews." },
      { number: 2, text: "This man came to Jesus by night and said to Him, 'Rabbi, we know that You are a teacher come from God; for no one can do these signs that You do unless God is with him.'" },
      { number: 3, text: "Jesus answered and said to him, 'Most assuredly, I say to you, unless one is born again, he cannot see the kingdom of God.'" },
      { number: 4, text: "Nicodemus said to Him, 'How can a man be born when he is old? Can he enter a second time into his mother's womb and be born?'" },
      { number: 5, text: "Jesus answered, 'Most assuredly, I say to you, unless one is born of water and the Spirit, he cannot enter the kingdom of God.'" },
      { number: 6, text: "That which is born of the flesh is flesh, and that which is born of the Spirit is spirit." },
      { number: 7, text: "Do not marvel that I said to you, 'You must be born again.'" },
      { number: 8, text: "The wind blows where it wishes, and you hear the sound of it, but cannot tell where it comes from and where it goes. So is everyone who is born of the Spirit." },
      { number: 16, text: "For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life." },
      { number: 17, text: "For God did not send His Son into the world to condemn the world, but that the world through Him might be saved." },
    ],
  },
  "1 Enoch": {
    1: [
      { number: 1, text: "The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed." },
      { number: 2, text: "And he took up his parable and said—Enoch a righteous man, whose eyes were opened by God, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come." },
      { number: 3, text: "Concerning the elect I said, and took up my parable concerning them: The Holy Great One will come forth from His dwelling," },
      { number: 4, text: "And the eternal God will tread upon the earth, (even) on Mount Sinai, And appear from His camp And appear in the strength of His might from the heaven of heavens." },
      { number: 5, text: "And all shall be smitten with fear And the Watchers shall quake, And great fear and trembling shall seize them unto the ends of the earth." },
      { number: 6, text: "And the high mountains shall be shaken, And the high hills shall be made low, And shall melt like wax before the flame." },
      { number: 7, text: "And the earth shall be wholly rent in sunder, And all that is upon the earth shall perish, And there shall be a judgement upon all (men)." },
      { number: 8, text: "But with the righteous He will make peace. And will protect the elect, And mercy shall be upon them. And they shall all belong to God, And they shall be prospered, And they shall all be blessed. And He will help them all, And light shall appear unto them, And He will make peace with them." },
      { number: 9, text: "And behold! He cometh with ten thousands of His holy ones To execute judgement upon all, And to destroy all the ungodly: And to convict all flesh Of all the works of their ungodliness which they have ungodly committed, And of all the hard things which ungodly sinners have spoken against Him." },
    ],
    2: [
      { number: 1, text: "Observe ye everything that takes place in the heaven, how they do not change their orbits, and the luminaries which are in the heaven, how they all rise and set in order each in its season, and transgress not against their appointed order." },
      { number: 2, text: "Behold ye the earth, and give heed to the things which take place upon it from first to last, how steadfast they are, how none of the things upon earth change, but all the works of God appear to you." },
      { number: 3, text: "Behold the summer and the winter, how the whole earth is filled with water, and clouds and dew and rain lie upon it." },
    ],
  },
  "Jubilees": {
    1: [
      { number: 1, text: "And it came to pass in the first year of the exodus of the children of Israel out of Egypt, in the third month, on the sixteenth day of the month, that God spake to Moses, saying: 'Come up to Me on the Mount, and I will give thee two tables of stone of the law and of the commandment, which I have written, that thou mayst teach them.'" },
      { number: 2, text: "And Moses went up into the mount of God, and the glory of the Lord abode on Mount Sinai, and a cloud overshadowed it six days." },
      { number: 3, text: "And He called to Moses on the seventh day out of the midst of the cloud, and the appearance of the glory of the Lord was like a flaming fire on the top of the mount." },
      { number: 4, text: "And Moses was on the Mount forty days and forty nights, and God taught him the earlier and the later history of the division of all the days of the law and of the testimony." },
      { number: 5, text: "And He said: 'Incline thine heart to every word which I shall speak to thee on this mount, and write them in a book in order that their generations may see how I have not forsaken them for all the evil which they have wrought in transgressing the covenant which I establish between Me and thee for their generations this day on Mount Sinai." },
      { number: 6, text: "And thus it will come to pass when all these things come upon them, that they will recognise that I am more righteous than they in all their judgments and in all their actions, and they will recognise that I have been truly with them." },
      { number: 7, text: "And do thou write for thyself all these words which I declare unto thee this day, for I know their rebellion and their stiff neck, before I bring them into the land of which I sware to their fathers, to Abraham and to Isaac and to Jacob, saying: 'Unto your seed will I give a land flowing with milk and honey.'" },
    ],
  },
  "1 Meqabyan": {
    1: [
      { number: 1, text: "There was one man whose name was called Tseerutsaydan and who loved sin; he would boast in his horses' abundance and his troops' firmness beneath his authority." },
      { number: 2, text: "He had many priests who served his idols whom he worshipped and to whom he bowed and sacrificed sacrifices by night and by daylight." },
      { number: 3, text: "But in his heart's dullness it would seem to him that they gave him firmness and power." },
      { number: 4, text: "And in his heart it would seem to him that they gave him authority in all his rule." },
      { number: 5, text: "And again in formation time it would seem to him that they gave him all the desired authority also." },
      { number: 6, text: "And he would sacrifice sacrifices to them day and night." },
      { number: 7, text: "He appointed priests who served his idols." },
      { number: 8, text: "While they ate from that defiled sacrifice, they would tell him pretending that the idols ate night and day." },
    ],
    2: [
      { number: 1, text: "There was one man birthed from the tribe of Benjamin whose name was called Meqabees;" },
      { number: 2, text: "He had three children who were handsome and totally warriors; they had been beloved alongside all persons in that Midyam and Miedon country that was Tseerutsaydan's rule." },
      { number: 3, text: "And like unto the king commanded them on the time he found them: 'Won't you bow to Tseerutsaydan's creators? How about won't you sacrifice sacrifice?'" },
      { number: 4, text: "But if you refuse, we will seize and take you toward the king, and we will destroy all your money like unto the king commanded." },
      { number: 5, text: "These youths who were handsome replied to him saying, 'As for Him to Whom we bow, there is our Father Creator Who created Earth and Heaven and what is within her, and the sea, moon and Sun and clouds and stars; He is the True Creator Whom we worship and in Whom we believe.'" },
    ],
  },
  "2 Meqabyan": {
    1: [
      { number: 1, text: "In the days of King Maqorba, there arose a great persecution against the faithful ones who kept the law of the Lord." },
      { number: 2, text: "The king sent forth decrees throughout all his kingdom that all should worship the idols he had set up." },
      { number: 3, text: "But there were many who remained faithful to the Lord and would not bow down to false gods." },
      { number: 4, text: "Among these were the brothers who stood firm in their faith, refusing to compromise with the king's demands." },
      { number: 5, text: "They said, 'We will serve the Lord our God, and Him only shall we worship, for He is the true and living God.'" },
    ],
  },
  "3 Meqabyan": {
    1: [
      { number: 1, text: "Now when peace had been restored to the land, the faithful ones gathered together to give thanks to the Lord." },
      { number: 2, text: "They praised God for His deliverance and for His mercy that endures forever." },
      { number: 3, text: "The elders spoke to the people, saying, 'Remember the works of the Lord and do not forget His commandments.'" },
      { number: 4, text: "For the Lord is faithful to those who keep His covenant and walk in His ways." },
      { number: 5, text: "Let us hold fast to our faith and not turn aside to the left or to the right, but continue in the path of righteousness." },
    ],
  },
  "Paralipomena of Jeremiah": {
    1: [
      { number: 1, text: "In the fifth year of King Jehoiakim son of Josiah, king of Judah, this word came to Jeremiah from the Lord:" },
      { number: 2, text: "'Go and speak to the people of Judah and the inhabitants of Jerusalem, saying, Will you not receive instruction and listen to my words? declares the Lord.'" },
      { number: 3, text: "And the word of the Lord came to me, saying, 'Behold, I will bring upon this city and upon all its towns all the disaster that I have pronounced against it, because they have stiffened their neck, refusing to hear my words.'" },
    ],
  },
  "The Shepherd of Hermas": {
    1: [
      { number: 1, text: "The master who reared me had sold me to one Rhoda in Rome. After many years, I met her again, and began to love her as a sister." },
      { number: 2, text: "After a certain time I saw her bathing in the river Tiber; and I gave her my hand, and led her out of the river. So, seeing her beauty, I reasoned in my heart, saying, 'Happy were I, if I had such a one to wife both in beauty and in character.'" },
      { number: 3, text: "I merely reflected on this and nothing more. After a certain time, as I was journeying to Cumae, and glorifying God's creatures for their greatness and splendor and power, as I walked I fell asleep." },
      { number: 4, text: "And a Spirit took me, and bore me away through a pathless tract, through which no man could pass: for the place was precipitous, and broken into clefts by reason of the waters." },
    ],
  },
  "Ethiopic Clement": {
    1: [
      { number: 1, text: "Clement to James, the Lord's brother, peace be with you always." },
      { number: 2, text: "I give thanks to God who has granted me to see and hear the wonderful things which I am about to relate to you concerning the true Prophet." },
      { number: 3, text: "For He who is the Prophet of truth has appeared to us, teaching all things clearly, and showing us the way of salvation." },
      { number: 4, text: "Blessed are they who seek and find the truth, for they shall inherit eternal life." },
    ],
  },
  "Psalms": {
    1: [
      { number: 1, text: "Blessed is the man Who walks not in the counsel of the ungodly, Nor stands in the path of sinners, Nor sits in the seat of the scornful;" },
      { number: 2, text: "But his delight is in the law of the Lord, And in His law he meditates day and night." },
      { number: 3, text: "He shall be like a tree Planted by the rivers of water, That brings forth its fruit in its season, Whose leaf also shall not wither; And whatever he does shall prosper." },
      { number: 4, text: "The ungodly are not so, But are like the chaff which the wind drives away." },
      { number: 5, text: "Therefore the ungodly shall not stand in the judgment, Nor sinners in the congregation of the righteous." },
      { number: 6, text: "For the Lord knows the way of the righteous, But the way of the ungodly shall perish." },
    ],
    23: [
      { number: 1, text: "The Lord is my shepherd; I shall not want." },
      { number: 2, text: "He makes me to lie down in green pastures; He leads me beside the still waters." },
      { number: 3, text: "He restores my soul; He leads me in the paths of righteousness For His name's sake." },
      { number: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil; For You are with me; Your rod and Your staff, they comfort me." },
      { number: 5, text: "You prepare a table before me in the presence of my enemies; You anoint my head with oil; My cup runs over." },
      { number: 6, text: "Surely goodness and mercy shall follow me All the days of my life; And I will dwell in the house of the Lord Forever." },
    ],
  },
  "Matthew": {
    1: [
      { number: 1, text: "The book of the genealogy of Jesus Christ, the Son of David, the Son of Abraham:" },
      { number: 2, text: "Abraham begot Isaac, Isaac begot Jacob, and Jacob begot Judah and his brothers." },
      { number: 18, text: "Now the birth of Jesus Christ was as follows: After His mother Mary was betrothed to Joseph, before they came together, she was found with child of the Holy Spirit." },
      { number: 19, text: "Then Joseph her husband, being a just man, and not wanting to make her a public example, was minded to put her away secretly." },
      { number: 20, text: "But while he thought about these things, behold, an angel of the Lord appeared to him in a dream, saying, 'Joseph, son of David, do not be afraid to take to you Mary your wife, for that which is conceived in her is of the Holy Spirit.'" },
      { number: 21, text: "And she will bring forth a Son, and you shall call His name Jesus, for He will save His people from their sins.'" },
    ],
  },
  "Romans": {
    1: [
      { number: 1, text: "Paul, a bondservant of Jesus Christ, called to be an apostle, separated to the gospel of God" },
      { number: 16, text: "For I am not ashamed of the gospel of Christ, for it is the power of God to salvation for everyone who believes, for the Jew first and also for the Greek." },
      { number: 17, text: "For in it the righteousness of God is revealed from faith to faith; as it is written, 'The just shall live by faith.'" },
    ],
  },
  "Proverbs": {
    1: [
      { number: 1, text: "The proverbs of Solomon the son of David, king of Israel:" },
      { number: 7, text: "The fear of the Lord is the beginning of knowledge, But fools despise wisdom and instruction." },
    ],
    3: [
      { number: 5, text: "Trust in the Lord with all your heart, And lean not on your own understanding;" },
      { number: 6, text: "In all your ways acknowledge Him, And He shall direct your paths." },
    ],
  },
  "James": {
    1: [
      { number: 1, text: "James, a bondservant of God and of the Lord Jesus Christ, To the twelve tribes which are scattered abroad: Greetings." },
      { number: 2, text: "My brethren, count it all joy when you fall into various trials," },
      { number: 3, text: "knowing that the testing of your faith produces patience." },
      { number: 4, text: "But let patience have its perfect work, that you may be perfect and complete, lacking nothing." },
      { number: 5, text: "If any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him." },
    ],
  },
};

// Helper function to get total chapters for a book
export const getTotalChapters = (book: string): number => {
  const bookContent = bibleContent[book];
  if (!bookContent) return 1;
  return Object.keys(bookContent).length;
};
