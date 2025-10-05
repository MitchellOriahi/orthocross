import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, Type, ChevronLeft, ChevronRight, Scroll } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CongratulationsModal } from "@/components/CongratulationsModal";
import { ThemeToggle } from "@/components/ThemeToggle";

const Reading = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState(0);
  const [fontSize, setFontSize] = useState([16]);
  const [currentReading, setCurrentReading] = useState({
    title: "Gospel of John",
    passage: "John 1:1-14"
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [readingMode, setReadingMode] = useState<"scroll" | "pages">("pages");
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [isNewStreak, setIsNewStreak] = useState(false);

  // Reading content mapping
  const readingContent: Record<string, string> = {
    "John 3:1-21": `Now there was a Pharisee, a man named Nicodemus who was a member of the Jewish ruling council. He came to Jesus at night and said, "Rabbi, we know that you are a teacher who has come from God. For no one could perform the signs you are doing if God were not with him."

Jesus replied, "Very truly I tell you, no one can see the kingdom of God unless they are born again."

"How can someone be born when they are old?" Nicodemus asked. "Surely they cannot enter a second time into their mother's womb to be born!"

Jesus answered, "Very truly I tell you, no one can enter the kingdom of God unless they are born of water and the Spirit. Flesh gives birth to flesh, but the Spirit gives birth to spirit. You should not be surprised at my saying, 'You must be born again.' The wind blows wherever it pleases. You hear its sound, but you cannot tell where it comes from or where it is going. So it is with everyone born of the Spirit."

For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.`,
    
    "Psalm 23": `The Lord is my shepherd, I lack nothing. He makes me lie down in green pastures, he leads me beside quiet waters, he refreshes my soul. He guides me along the right paths for his name's sake.

Even though I walk through the darkest valley, I will fear no evil, for you are with me; your rod and your staff, they comfort me.

You prepare a table before me in the presence of my enemies. You anoint my head with oil; my cup overflows. Surely your goodness and love will follow me all the days of my life, and I will dwell in the house of the Lord forever.`,
    
    "Proverbs 3:1-12": `My son, do not forget my teaching, but keep my commands in your heart, for they will prolong your life many years and bring you peace and prosperity.

Let love and faithfulness never leave you; bind them around your neck, write them on the tablet of your heart. Then you will win favor and a good name in the sight of God and man.

Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.

Do not be wise in your own eyes; fear the Lord and shun evil. This will bring health to your body and nourishment to your bones.`,
    
    "John 1:1-14": `In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through Him, and without Him nothing was made that was made. In Him was life, and the life was the light of men. And the light shines in the darkness, and the darkness did not comprehend it.

There was a man sent from God, whose name was John. This man came for a witness, to bear witness of the Light, that all through him might believe. He was not that Light, but was sent to bear witness of that Light. That was the true Light which gives light to every man coming into the world.

He was in the world, and the world was made through Him, and the world did not know Him. He came to His own, and His own did not receive Him. But as many as received Him, to them He gave the right to become children of God, to those who believe in His name: who were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God.

And the Word became flesh and dwelt among us, and we beheld His glory, the glory as of the only begotten of the Father, full of grace and truth.`,
    
    // Additional readings
    "1 Enoch 1-5": `The words of the blessing of Enoch, wherewith he blessed the elect and righteous, who will be living in the day of tribulation, when all the wicked and godless are to be removed. And he took up his parable and said—Enoch a righteous man, whose eyes were opened by God, saw the vision of the Holy One in the heavens, which the angels showed me, and from them I heard everything, and from them I understood as I saw, but not for this generation, but for a remote one which is for to come.

Concerning the elect I said, and took up my parable concerning them: The Holy Great One will come forth from His dwelling, and the eternal God will tread upon the earth, even on Mount Sinai, and appear from His camp and appear in the strength of His might from the heaven of heavens.

And all shall be smitten with fear and the Watchers shall quake, and great fear and trembling shall seize them unto the ends of the earth. And the high mountains shall be shaken, and the high hills shall be made low, and shall melt like wax before the flame.

And the earth shall be wholly rent in sunder, and all that is upon the earth shall perish, and there shall be a judgement upon all men. But with the righteous He will make peace, and will protect the elect, and mercy shall be upon them.`,
    
    "Jubilees 1": `And it came to pass in the first year of the exodus of the children of Israel out of Egypt, in the third month, on the sixteenth day of the month, that God spake to Moses, saying: 'Come up to Me on the Mount, and I will give thee two tables of stone of the law and of the commandment, which I have written, that thou mayst teach them.'

And Moses went up into the mount of God, and the glory of the Lord abode on Mount Sinai, and a cloud overshadowed it six days. And He called to Moses on the seventh day out of the midst of the cloud, and the appearance of the glory of the Lord was like a flaming fire on the top of the mount.

And Moses was on the Mount forty days and forty nights, and God taught him the earlier and the later history of the division of all the days of the law and of the testimony. And He said: 'Incline thine heart to every word which I shall speak to thee on this mount, and write them in a book in order that their generations may see how I have not forsaken them for all the evil which they have wrought in transgressing the covenant which I establish between Me and thee for their generations this day on Mount Sinai.'`,
    
    "1 Meqabyan 1": `In the name of the Father and the Son and the Holy Spirit, one God. We begin to write the book of Maccabees, and we ask from our Lord Jesus Christ to help us and to be with us always. Amen.

The word of God came to the prophets in the days of old, and they spoke His words to the people. And the people of Israel were tested many times, but the Lord delivered them from their enemies. In those days, there arose a king who did not know the Lord, and he oppressed the people of God.

But there were righteous men who stood firm in their faith, who would not bow down to idols or forsake the commandments of the Lord. They chose to suffer rather than to sin, and the Lord was with them in their trials. Their faith was tested like gold in the fire, and they emerged pure and strong.

The Lord said to His servants: 'Be faithful unto death, and I will give you the crown of life.' And so they persevered, knowing that the sufferings of this present time are not worthy to be compared with the glory that shall be revealed.`,
    
    "2 Meqabyan 1": `The second book of the covenant tells of the faith of the martyrs and the steadfastness of the righteous. In those days, persecution arose against the people of God, but they did not waver in their commitment to the truth.

There was a woman with seven sons, and they were brought before the king to be forced to eat unclean food. But they refused, saying: 'We are ready to die rather than transgress the laws of our fathers.' And one by one, they were martyred for their faith.

The mother encouraged each of her sons, saying: 'I do not know how you came into being in my womb. It was not I who gave you life and breath, nor I who set in order the elements within each of you. Therefore the Creator of the world, who shaped the beginning of man and devised the origin of all things, will in his mercy give life and breath back to you again, since you now forget yourselves for the sake of his laws.'

This testimony of faith has been preserved for all generations, that we might learn from their example and remain steadfast in our own trials.`,
    
    "3 Meqabyan 1": `The third book speaks of wisdom and righteousness, and of the ways in which God guides His people. It is written: The fear of the Lord is the beginning of wisdom, and knowledge of the Holy One is understanding.

In those days, the righteous sought the Lord with all their hearts, and He revealed His ways to them. They walked in His commandments and did not turn aside to the right or to the left. The Lord was their light and their salvation, and they trusted in Him alone.

The wicked persecuted them and sought to make them stumble, but they stood firm in their faith. They remembered the words of the prophets and held fast to the covenant that God had made with their fathers. The Lord tested them and found them worthy, like gold refined in the furnace.

Therefore, let all who read these words take courage and remain faithful, for the Lord is with those who trust in Him. He will never leave them nor forsake them, and in the end, they will receive the crown of righteousness that He has promised to all who love Him.`,
    
    "Paralipomena 1": `The rest of the words of Baruch the son of Neriah, which he spoke after the destruction of Jerusalem. When the people were carried away captive to Babylon, Baruch remained in the ruins of the city, weeping over the desolation.

And the angel of the Lord appeared to him and said: 'Go, gather the sacred vessels and bury them in the earth, for Jerusalem shall be rebuilt in the latter days.' And Baruch did as he was commanded, and he hid the vessels where no one could find them.

Then the Lord showed him a vision of the future, when the people would return from captivity and rebuild the temple. He saw the glory of the Lord returning to His house, and the people worshiping in righteousness. And Baruch was comforted, knowing that God had not forsaken His people forever.

These are the words that Baruch wrote in a book, that future generations might know the faithfulness of the Lord and trust in His promises. For He is merciful and gracious, slow to anger and abounding in steadfast love.`,
    
    "Joseph ben Gorion 1": `The history of the Jewish people as recorded by Joseph the son of Gorion, who lived in the days after the destruction of the Second Temple. He wrote these words to preserve the memory of his people and to teach future generations about their heritage.

In the beginning, God created the heavens and the earth, and He formed man in His own image. He chose Abraham and made a covenant with him, promising to make his descendants as numerous as the stars of heaven. And so it came to pass, that the people of Israel became a great nation.

Through many trials and tribulations, the Lord guided His people. He delivered them from slavery in Egypt with a mighty hand and an outstretched arm. He gave them the law on Mount Sinai and brought them into the promised land. When they were faithful, He blessed them; when they turned away, He disciplined them, but He never abandoned them.

This history is written so that we may remember the mighty acts of God and teach them to our children, that they may not forget the wonders He has performed and may keep His commandments forever.`,
    
    "Book of Covenant 1": `The Book of the Covenant contains the laws and ordinances that God gave to His people, that they might live righteously before Him. These commandments are a light to guide us and a lamp for our path.

The Lord said: 'If you will indeed obey My voice and keep My covenant, then you shall be a special treasure to Me above all people; for all the earth is Mine. And you shall be to Me a kingdom of priests and a holy nation.' These are the words that we must speak to our children and teach them diligently.

The first commandment is this: You shall love the Lord your God with all your heart, with all your soul, and with all your strength. And the second is like it: You shall love your neighbor as yourself. On these two commandments hang all the law and the prophets.

Let us therefore walk in obedience to these commandments, keeping them in our hearts and practicing them in our daily lives, that we may be pleasing to the Lord and may receive His blessing.`,
    
    "Didascalia 1": `The teaching of the twelve apostles to the nations, concerning the way of life and the way of death. There are two ways, one of life and one of death, and there is a great difference between them.

The way of life is this: First, you shall love God who made you; second, love your neighbor as yourself. And all things that you would not have done to you, do not do to another. The teaching of these words is this: Bless those who curse you, and pray for your enemies. Fast for those who persecute you.

For what credit is it if you love those who love you? Do not even the tax collectors do the same? But love those who hate you, and you will have no enemy. Abstain from fleshly and worldly lusts. If anyone strikes you on the right cheek, turn the other to him also, and you will be perfect.

This is the way of life. Walk in it with all your heart and with all your soul, and you will be saved in the day of judgment.`,
    
    "Shepherd of Hermas 1": `The shepherd who spoke with me said: 'I have been sent to live with you the remaining days of your life, to show you all things that are right, that you may be saved and may teach others the way of righteousness.'

And he showed me a vision of a great tower being built upon the waters, and many stones were being laid for its foundation. Some stones were square and white, fitting perfectly together. Others were round and did not fit into the building, and were cast aside.

Then he explained to me: 'This tower is the Church, built upon the foundation of faith in Christ. The square stones are the apostles and teachers who have built according to the truth. The round stones are those who have faith but have not yet been perfected in righteousness.'

'Therefore,' he said, 'repent while there is still time, and make yourselves ready for the building. For the day is coming when the tower will be completed, and then no more stones can be added. Be vigilant, therefore, and pure in heart, that you may be found worthy to be part of God's dwelling place.'`,
    
    "Sinodos 1": `The gathering of the fathers and the decisions of the councils, preserved for the instruction of the faithful. In the days of the apostles, the Church gathered to settle matters of faith and practice, guided by the Holy Spirit.

It was decided that certain customs should be observed by all believers, for the unity of the Church and the glory of God. The bishops met and prayed together, seeking the will of the Lord in all things. They laid down teachings concerning baptism, the Eucharist, fasting, and prayer.

The apostolic traditions were handed down from generation to generation, carefully preserved by those who had received them from the apostles themselves. These teachings are not to be taken lightly, for they come from the very mouth of our Lord through His chosen servants.

Let all who read these words take them to heart and follow them faithfully, for they lead to life everlasting. The Church is built upon the foundation of the apostles and prophets, with Christ Jesus Himself as the cornerstone.`,
    
    "Ethiopic Clement 1": `The letter of Clement to the Corinthians, translated into the Ethiopian language for the instruction of the faithful in that land. Grace and peace be multiplied to you from God Almighty through Jesus Christ.

We write to you concerning the divisions that have arisen among you, for it has been reported to us that there is strife and jealousy in your midst. This ought not to be so among those who bear the name of Christ. Let us remember the examples of the righteous who have gone before us, who lived in harmony and peace.

Consider the apostles: Peter and Paul labored together for the gospel, though they were different in temperament and calling. They did not contend with one another, but supported each other in the work of the Lord. So also should it be with you.

Therefore, put away all bitterness and wrath and anger, and be kind to one another, tenderhearted, forgiving one another, as God in Christ forgave you. Walk in love, as Christ loved us and gave Himself up for us, a fragrant offering and sacrifice to God.`,
    
    "Nativity 1": `The story of the nativity of our Lord Jesus Christ, as it has been handed down in the Ethiopian tradition. In those days, Caesar Augustus sent out a decree that all the world should be registered. This was the first registration when Quirinius was governor of Syria.

And Joseph went up from Galilee, from the town of Nazareth, to Judea, to the city of David, which is called Bethlehem, because he was of the house and lineage of David, to be registered with Mary, his betrothed, who was with child.

And while they were there, the time came for her to give birth. And she gave birth to her firstborn son and wrapped Him in swaddling cloths and laid Him in a manger, because there was no place for them in the inn. And the angels of heaven rejoiced, singing: 'Glory to God in the highest, and on earth peace among those with whom He is pleased!'

This child who was born is the Savior of the world, Christ the Lord. Let all the earth rejoice and give thanks to God for His great mercy, for He has visited and redeemed His people.`,
    
    "Resurrection 1": `The account of the resurrection of our Lord Jesus Christ, preserved in the Ethiopian tradition. On the first day of the week, at early dawn, the women went to the tomb, taking the spices they had prepared. And they found the stone rolled away from the tomb, but when they went in they did not find the body of the Lord Jesus.

While they were perplexed about this, behold, two men stood by them in dazzling apparel. And as they were frightened and bowed their faces to the ground, the men said to them: 'Why do you seek the living among the dead? He is not here, but has risen. Remember how He told you, while He was still in Galilee, that the Son of Man must be delivered into the hands of sinful men and be crucified and on the third day rise.'

And they remembered His words, and returning from the tomb they told all these things to the eleven and to all the rest. The apostles rejoiced with great joy, for they knew that Christ had conquered death and had opened the way to eternal life for all who believe.

Therefore, let us also rejoice and give thanks, for Christ is risen indeed! He is the firstfruits of those who have fallen asleep, the firstborn from the dead, and through Him we have hope of resurrection and everlasting life.`
  };

  // Load reading from location state or database
  useEffect(() => {
    if (location.state?.title && location.state?.passage) {
      setCurrentReading({
        title: location.state.title,
        passage: location.state.passage
      });
      setProgress(location.state.progress || 0);
    }
  }, [location.state]);

  // Save progress and update streak
  const saveProgress = async (newProgress: number) => {
    if (!user) return;

    try {
      const { data: existing } = await supabase
        .from('reading_progress')
        .select('id')
        .eq('user_id', user.id)
        .eq('scripture_title', currentReading.title)
        .eq('scripture_passage', currentReading.passage)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('reading_progress')
          .update({
            progress: newProgress,
            completed: newProgress >= 100,
            last_read_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('reading_progress')
          .insert({
            user_id: user.id,
            scripture_title: currentReading.title,
            scripture_passage: currentReading.passage,
            progress: newProgress,
            completed: newProgress >= 100
          });
      }

      // Update streak if completed
      if (newProgress >= 100) {
        await updateStreak();
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Update user streak
  const updateStreak = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: existingStreak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existingStreak) {
        // First time completing
        await supabase
          .from('user_streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_completion_date: today
          });
        setStreakDays(1);
        setIsNewStreak(true);
        setShowCongratulations(true);
      } else {
        const lastDate = existingStreak.last_completion_date;
        
        // Check if already completed today
        if (lastDate === today) {
          setStreakDays(existingStreak.current_streak);
          setIsNewStreak(false);
          setShowCongratulations(true);
          return;
        }

        // Check if yesterday or streak broken
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newStreak = lastDate === yesterdayStr 
          ? existingStreak.current_streak + 1 
          : 1;
        
        const newLongest = Math.max(newStreak, existingStreak.longest_streak);

        await supabase
          .from('user_streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_completion_date: today
          })
          .eq('user_id', user.id);

        setStreakDays(newStreak);
        setIsNewStreak(true);
        setShowCongratulations(true);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const displayText = readingContent[currentReading.passage] || readingContent["John 1:1-14"];
  
  // Split text into pages (roughly 500 characters per page)
  const pages = useMemo(() => {
    const paragraphs = displayText.split('\n\n');
    const pagesArray: string[][] = [[]];
    let currentPageChars = 0;
    let currentPageIndex = 0;

    paragraphs.forEach(paragraph => {
      const paragraphLength = paragraph.length;
      
      if (currentPageChars + paragraphLength > 500 && pagesArray[currentPageIndex].length > 0) {
        currentPageIndex++;
        pagesArray[currentPageIndex] = [];
        currentPageChars = 0;
      }
      
      pagesArray[currentPageIndex].push(paragraph);
      currentPageChars += paragraphLength;
    });

    return pagesArray;
  }, [displayText]);

  const totalPages = pages.length;

  const handleNextPage = async () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      const newProgress = Math.round(((currentPage + 2) / totalPages) * 100);
      setProgress(newProgress);
      await saveProgress(newProgress);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      const newProgress = Math.round((currentPage / totalPages) * 100);
      setProgress(newProgress);
    }
  };

  const handleFinish = async () => {
    setProgress(100);
    await saveProgress(100);
  };

  return (
    <div className="min-h-screen gradient-peaceful">
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          navigate('/index');
        }}
        streakDays={streakDays}
        isNewStreak={isNewStreak}
      />

      {/* Reading Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">{currentReading.title}</h1>
                <p className="text-sm text-muted-foreground">{currentReading.passage}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setReadingMode(readingMode === "scroll" ? "pages" : "scroll")}
                title={readingMode === "scroll" ? "Switch to pages" : "Switch to scroll"}
              >
                {readingMode === "scroll" ? (
                  <BookOpen className="w-5 h-5" />
                ) : (
                  <Scroll className="w-5 h-5" />
                )}
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-1" />
            {readingMode === "pages" && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Page {currentPage + 1} of {totalPages}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Reading Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 shadow-elevated">
          {readingMode === "scroll" ? (
            <article 
              className="prose prose-lg max-w-none leading-relaxed text-foreground"
              style={{ fontSize: `${fontSize}px` }}
            >
              {displayText.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 first:mt-0">
                  {paragraph}
                </p>
              ))}
            </article>
          ) : (
            <>
              <article 
                className="prose prose-lg max-w-none leading-relaxed text-foreground min-h-[400px]"
                style={{ fontSize: `${fontSize}px` }}
              >
                {pages[currentPage]?.map((paragraph, index) => (
                  <p key={index} className="mb-6 first:mt-0">
                    {paragraph}
                  </p>
                ))}
              </article>
              
              {/* Page Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Reading Controls */}
        <div className="mt-8 flex flex-col gap-6">
          <Card className="p-6 shadow-elevated">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  Font Size
                </label>
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider
                value={fontSize}
                onValueChange={setFontSize}
                min={12}
                max={24}
                step={1}
                className="w-full"
              />
            </div>
          </Card>

          {readingMode === "scroll" ? (
            <Button 
              variant="sacred" 
              size="lg" 
              className="w-full"
              onClick={handleFinish}
            >
              Finish Reading
            </Button>
          ) : (
            <Button 
              variant="sacred" 
              size="lg" 
              className="w-full"
              onClick={currentPage === totalPages - 1 ? handleFinish : handleNextPage}
            >
              {currentPage === totalPages - 1 ? 'Finish' : 'Continue'}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reading;
