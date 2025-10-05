// Sample Bible verses - in a real app, this would come from an API or comprehensive database
export interface Verse {
  number: number;
  text: string;
}

export interface Chapter {
  book: string;
  chapter: number;
  verses: Verse[];
}

// Sample content for demonstration
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
  "Psalms": {
    23: [
      { number: 1, text: "The Lord is my shepherd; I shall not want." },
      { number: 2, text: "He makes me to lie down in green pastures; He leads me beside the still waters." },
      { number: 3, text: "He restores my soul; He leads me in the paths of righteousness For His name's sake." },
      { number: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil; For You are with me; Your rod and Your staff, they comfort me." },
      { number: 5, text: "You prepare a table before me in the presence of my enemies; You anoint my head with oil; My cup runs over." },
      { number: 6, text: "Surely goodness and mercy shall follow me All the days of my life; And I will dwell in the house of the Lord Forever." },
    ],
    1: [
      { number: 1, text: "Blessed is the man Who walks not in the counsel of the ungodly, Nor stands in the path of sinners, Nor sits in the seat of the scornful;" },
      { number: 2, text: "But his delight is in the law of the Lord, And in His law he meditates day and night." },
      { number: 3, text: "He shall be like a tree Planted by the rivers of water, That brings forth its fruit in its season, Whose leaf also shall not wither; And whatever he does shall prosper." },
      { number: 4, text: "The ungodly are not so, But are like the chaff which the wind drives away." },
      { number: 5, text: "Therefore the ungodly shall not stand in the judgment, Nor sinners in the congregation of the righteous." },
      { number: 6, text: "For the Lord knows the way of the righteous, But the way of the ungodly shall perish." },
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
