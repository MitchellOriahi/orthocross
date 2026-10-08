import { OrientalEtiquette } from "@/components/resources/OrientalEtiquette";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Church, BookOpen, UserRound, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";
import { useTheme } from "next-themes";
import orthodoxCrossBlack from "@/assets/orthodox-cross-black-new.png";
import orthodoxCrossWhite from "@/assets/orthodox-cross-white-new.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DetailedContentView } from "@/components/resources/DetailedContentView";
import { PrayerDetailView } from "@/components/resources/PrayerDetailView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { saintsContent, SaintDetail } from "@/data/saintsContent";
import { SaintsBrowser } from "@/components/resources/SaintsBrowser";
import type { PrayerDetail } from "@/data/prayersContent";
import { PrayersBrowser } from "@/components/resources/PrayersBrowser";
import { useToast } from "@/hooks/use-toast";
import { CongratulationsModal } from "@/components/CongratulationsModal";
import { useMusic } from "@/contexts/MusicContext";
import { useSaintReadingProgress } from "@/hooks/useSaintReadingProgress";

type SectionType = "eastern" | "oriental" | "prayers" | "saints" | null;
type PrayerFilterType = "all" | "Eastern" | "Oriental";

const ChurchResources = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { playSound } = useMusic();
  const [selectedSection, setSelectedSection] = useState<SectionType>(null);
  const [selectedSaint, setSelectedSaint] = useState<SaintDetail | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerDetail | null>(null);
  const [pinnedPrayerIds, setPinnedPrayerIds] = useState<Set<string>>(new Set());
  const [prayerFilter, setPrayerFilter] = useState<PrayerFilterType>("all");
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [showAllSaintsAward, setShowAllSaintsAward] = useState(false);
  const [saintReturn, setSaintReturn] = useState<{ saintId: string; sequence: number } | null>(null);
  const { completion } = useSaintReadingProgress();
  const [locatingChurches, setLocatingChurches] = useState(false);
  const saintsScrollRef = useRef(0);

  const closeSaintStory = () => {
    setSelectedSaint(null);
    setSelectedSection("saints");
    const y = saintsScrollRef.current;
    // Wait for the saints browser to un-hide and restore page height first.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.scrollTo(0, y));
    });
  };
  const handleFindChurchesNearMe = () => {
    // Apple devices default to Apple Maps; everyone else gets Google Maps.
    const isApple =
      /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // Open the tab synchronously inside the click handler so popup blockers
    // don't kill it. Start with a generic "near me" search; if we get coords
    // we'll refine the URL afterward.
    const fallbackUrl = isApple
      ? `https://maps.apple.com/?q=${encodeURIComponent("Orthodox churches near me")}`
      : `https://www.google.com/maps/search/${encodeURIComponent("Orthodox churches near me")}`;
    const newTab = window.open(fallbackUrl, "_blank", "noopener,noreferrer");

    if (!("geolocation" in navigator)) {
      return; // The maps app will use its own location detection
    }

    setLocatingChurches(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingChurches(false);
        const { latitude, longitude } = position.coords;
        const query = encodeURIComponent("Orthodox Churches");
        const preciseUrl = isApple
          ? `https://maps.apple.com/?q=${query}&ll=${latitude},${longitude}&z=14`
          : `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`;
        // Try to refine the already-opened tab; ignore if blocked cross-origin.
        try {
          if (newTab && !newTab.closed) {
            newTab.location.href = preciseUrl;
          }
        } catch {
          /* cross-origin nav not allowed once Google Maps loaded — fine */
        }
      },
      (error) => {
        setLocatingChurches(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast({
            description: "Location denied — showing a general nearby search instead.",
          });
        }
        // The fallback tab is already open with "near me" search; nothing else to do.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Always open the prayers section at the top of the page, with a fresh search
  useEffect(() => {
    if (selectedSection === "prayers" && !selectedPrayer) {
      window.scrollTo(0, 0);
    }
  }, [selectedSection, selectedPrayer]);


  // Load pinned prayers
  useEffect(() => {
    if (!user) return;
    
    const loadPinnedPrayers = async () => {
      const { data } = await supabase
        .from('pinned_prayers')
        .select('prayer_id, filter_context')
        .eq('user_id', user.id);
      
      if (data) {
        // For the current filter, only show pins that match
        const currentFilterPins = data
          .filter(p => p.filter_context === prayerFilter)
          .map(p => p.prayer_id);
        
        setPinnedPrayerIds(new Set(currentFilterPins));
      }
    };
    
    loadPinnedPrayers();
  }, [user, prayerFilter]);

  const handlePinPrayer = async (prayerId: string) => {
    if (!user) {
      toast({ description: "Please sign in to pin prayers", variant: "destructive" });
      return;
    }

    const isPinned = pinnedPrayerIds.has(prayerId);

    if (isPinned) {
      // Unpin for current filter context
      await supabase
        .from('pinned_prayers')
        .delete()
        .eq('user_id', user.id)
        .eq('prayer_id', prayerId)
        .eq('filter_context', prayerFilter);
      
      const newPinned = new Set(pinnedPrayerIds);
      newPinned.delete(prayerId);
      setPinnedPrayerIds(newPinned);
      toast({ description: "Prayer unpinned!", duration: 1500 });
    } else {
      // Check limit for current filter context
      const { count } = await supabase
        .from('pinned_prayers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('filter_context', prayerFilter);
      
      if (count && count >= 3) {
        toast({ description: `You can only pin up to 3 prayers in the ${prayerFilter === "all" ? "All" : prayerFilter} section`, variant: "destructive" });
        return;
      }

      // Pin for current filter context
      await supabase
        .from('pinned_prayers')
        .insert({ user_id: user.id, prayer_id: prayerId, filter_context: prayerFilter });
      
      const newPinned = new Set(pinnedPrayerIds);
      newPinned.add(prayerId);
      setPinnedPrayerIds(newPinned);
      toast({ description: "Prayer pinned to top!", duration: 1500 });
    }
  };


  const saintStoryOverlay = selectedSaint && (
    <div className="fixed inset-0 z-[60] bg-background">
      <DetailedContentView
        title={`${selectedSaint.prefix} ${selectedSaint.name}${selectedSaint.epithet ? ` ${selectedSaint.epithet}` : ''}`}
        subtitle={selectedSaint.shortDescription}
        content={selectedSaint.content}
        iconCredit={selectedSaint.iconCredit}
        onClose={closeSaintStory}
        showProgress={true}
        completing={completion.isPending}
        onComplete={async () => {
          if (completion.isPending) return;
          try {
            const { earnedAward } = await completion.mutateAsync(selectedSaint.id);
            playSound('saint');
            setShowAllSaintsAward(earnedAward);
            setShowCongratulations(true);
          } catch (error) {
            toast({ description: error instanceof Error ? error.message : "Your progress could not be saved. Please try again.", variant: "destructive" });
          }
        }}
      />
      <CongratulationsModal
        isOpen={showCongratulations}
        onClose={() => {
          setShowCongratulations(false);
          if (!showAllSaintsAward) {
            setSaintReturn(previous => ({ saintId: selectedSaint.id, sequence: (previous?.sequence ?? 0) + 1 }));
            setSelectedSaint(null);
          }
        }}
        streakDays={0}
        isNewStreak={false}
        saintName={selectedSaint?.name}
        saintIcon={selectedSaint?.iconUrl}
        saintPrefix={selectedSaint?.prefix}
        saintId={selectedSaint.id}
      />
      <CongratulationsModal
        isOpen={!showCongratulations && showAllSaintsAward}
        onClose={() => {
          setShowAllSaintsAward(false);
          setSaintReturn(previous => ({ saintId: selectedSaint.id, sequence: (previous?.sequence ?? 0) + 1 }));
          setSelectedSaint(null);
        }}
        streakDays={0}
        isNewStreak={false}
        allSaintStories
      />
      <BottomNavigation />
    </div>
  );

  // Fullscreen expanded view for a selected section
  if (selectedSection) {
    return (
      <div className={`min-h-screen pb-nav ${selectedSection === "saints" ? "bg-background" : "gradient-peaceful"}`}>
        {/* Header */}
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
          <div className="container mx-auto px-4 lg:px-2 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">Church</h1>
              </div>
              <nav className="flex items-center gap-1">
                <DonateButton />
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                  <SettingsIcon className="w-5 h-5" />
                </Button>
              </nav>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {selectedSection === "eastern" && (
              <Card className="shadow-elevated border-border/50">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedSection(null)}
                  >
                    ← Back
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Church className="w-5 h-5 text-primary" />
                    <div>
                      <div>Eastern Orthodox</div>
                      <div className="text-sm text-muted-foreground font-normal">Church Etiquette</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="arriving">
                      <AccordionTrigger>Arriving at Church</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Arrive before the service begins to pray, light a candle, venerate icons, and settle in</li>
                          <li>• Silence all electronic devices before entering</li>
                          <li>• If you arrive late, enter quietly; if the priest stands before the Holy Doors, wait until he returns to the altar</li>
                          <li>• Avoid leaving during the Gospel or the consecration; wait for the dismissal before departing</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="dress-code">
                      <AccordionTrigger>What to Wear</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Dress modestly — the goal is to worship God, not to draw attention</li>
                          <li>• Men: dress pants with a collared shirt or sweater; ties and coats encouraged but not required</li>
                          <li>• Women: avoid tight, low-cut or sleeveless tops, open backs, and skirts above the knee; no denim, sweats, or shorts</li>
                          <li>• Some women cover their heads in worship — usually optional, but a cherished expression of humility</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sign-of-cross">
                      <AccordionTrigger>The Sign of the Cross</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Join the thumb, index, and middle fingertips of your right hand; rest the other two fingers against your palm</li>
                          <li>• Touch your forehead, then your abdomen, then your right shoulder, then your left</li>
                          <li>• There are no strict rules about when to cross yourself — it is left to the individual</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="venerating-icons">
                      <AccordionTrigger>Venerating Icons</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Cross yourself twice, kiss the icon (or bow toward it), then cross yourself a third time</li>
                          <li>• Kiss the hands or feet of the saint pictured, not the face</li>
                          <li>• You may also kiss the Gospel book, scroll, or cross held in the saint's hand</li>
                          <li>• Do not venerate icons while wearing lipstick or lip balm — it damages them</li>
                          <li>• Non-Orthodox visitors are never required to venerate; it is entirely voluntary</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="greeting-priest">
                      <AccordionTrigger>Greeting the Priest</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Traditionally, Orthodox faithful greet priests and bishops by kissing their right hand</li>
                          <li>• Take the hand he extends as if to shake it, then kiss the back of it</li>
                          <li>• This honors his holy office — don't just shake his hand; ask for his blessing</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="seating-worship">
                      <AccordionTrigger>During the Service</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Stand for most of the service where standing is customary; sit or stand wherever you are comfortable</li>
                          <li>• In churches without pews, taller worshippers may stand toward the back to avoid blocking others' view</li>
                          <li>• Questions are welcome — whisper them, and wait until after Liturgy to socialize</li>
                          <li>• You may notice bowing or prostrations; as a visitor you are not obligated to copy them</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="holy-communion">
                      <AccordionTrigger>Holy Communion</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Only baptized and chrismated Orthodox Christians may receive Holy Communion</li>
                          <li>• Fast from midnight and confess your sins beforehand</li>
                          <li>• Approach with arms crossed over your chest and open your mouth to receive from the spoon</li>
                          <li>• Guests may usually receive antidoron (blessed bread), offered by the priest after the dismissal</li>
                          <li>• In some traditions a cup of warm watered wine or juice is also offered alongside the antidoron</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="children">
                      <AccordionTrigger>Bringing Children</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Children are always welcome, even on a first visit</li>
                          <li>• If a child cries or grows noisy, step out until they calm down; many parishes have "cry rooms"</li>
                          <li>• Avoid snacks for children older than 18 months, as all are preparing for Communion by fasting</li>
                          <li>• If you bring toys, choose quiet ones</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="tradition-differences">
                      <AccordionTrigger>Small Differences by Tradition</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• <span className="text-foreground font-medium">Greek:</span> standing is the norm through most of the service; head coverings are optional; prostrations are rare outside Lent</li>
                          <li>• <span className="text-foreground font-medium">Russian and other Slavic:</span> expect frequent prostrations during Lent, women's head coverings commonly worn, and coffee or a meal shared after Liturgy</li>
                          <li>• <span className="text-foreground font-medium">Antiochian:</span> sitting is more common, prostrations are kept in Lent, and the name-day and patronal feast of a parish carry special weight</li>
                          <li>• <span className="text-foreground font-medium">Romanian:</span> more seated participation, and the antidoron is often broken and distributed by the faithful themselves</li>
                          <li>• <span className="text-foreground font-medium">Georgian:</span> head coverings are widely observed, chanting and polyphony are distinctive, and the priest's blessing is received with cupped hands</li>
                          <li>• <span className="text-foreground font-medium">American and OCA parishes:</span> customs blend from many homelands, so practice varies parish to parish — ask your own priest</li>
                          <li>• The golden rule everywhere: watch what those around you do, or simply ask the priest — no one is offended by the question</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {selectedSection === "oriental" && (
              <Card className="shadow-elevated border-border/50">
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedSection(null)}
                  >
                    ← Back
                  </Button>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Church className="w-5 h-5 text-primary" />
                    <div>
                      <div>Oriental Orthodox</div>
                      <div className="text-sm text-muted-foreground font-normal">Church Etiquette</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OrientalEtiquette />
                </CardContent>
              </Card>
            )}

            {selectedSection === "prayers" && (
              <div className={selectedPrayer ? "hidden" : undefined}>
                <PrayersBrowser
                  onSelect={setSelectedPrayer}
                  onClose={() => setSelectedSection(null)}
                  tradition={prayerFilter}
                  onTraditionChange={setPrayerFilter}
                  pinnedIds={pinnedPrayerIds}
                  onPin={user ? handlePinPrayer : undefined}
                />
              </div>
            )}

            {selectedSection === "saints" && (
              <div className={selectedSaint ? "hidden" : undefined}>
                <SaintsBrowser returnToSaint={saintReturn} onSelect={(saint) => { saintsScrollRef.current = window.scrollY; setSelectedSaint(saint); }} onClose={() => setSelectedSection(null)} />
              </div>
            )}
          </div>
        </main>
        {saintStoryOverlay}
        {selectedPrayer && <PrayerDetailView
          key={selectedPrayer.id}
          name={selectedPrayer.name}
          title={selectedPrayer.title}
          content={selectedPrayer.content}
          prayerId={selectedPrayer.id}
          onClose={() => setSelectedPrayer(null)}
        />}
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-nav">

      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm safe-top">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 flex items-center justify-center p-1.5 ${theme === 'light' ? 'bg-black rounded-2xl' : 'bg-background rounded-lg'}`}>
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">Church</h1>
              </div>
            <nav className="flex items-center gap-1">
              <DonateButton />
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <SettingsIcon className="w-5 h-5" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content - Section Selection */}
      <main className="container mx-auto px-4 pt-2 pb-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-0 mb-4">
            <div className="w-36 h-36 mx-auto relative -mb-1">
              <img loading="eager" decoding="sync" 
                src={orthodoxCrossBlack} 
                alt="Orthodox Cross" 
                className="w-full h-full object-contain dark:hidden"
                style={{ filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }}
              />
              <img loading="eager" decoding="sync" 
                src={orthodoxCrossWhite} 
                alt="Orthodox Cross" 
                className="w-full h-full object-contain hidden dark:block"
                style={{ filter: 'drop-shadow(0 0 16px rgba(255, 255, 255, 0.5))' }}
              />
            </div>
            <h2 className="text-3xl font-bold">Orthodox Church Guide</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Eastern Orthodox Etiquette Card */}
            <Card 
              className="shadow-elevated border-border/50 cursor-pointer hover:border-primary transition-all p-8"
              onClick={() => setSelectedSection("eastern")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Church className="w-20 h-20 text-primary" />
                  <div className="text-center">
                    <div className="text-3xl">Eastern Orthodox</div>
                    <div className="text-sm text-muted-foreground font-normal">Church Etiquette</div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Oriental Orthodox Etiquette Card */}
            <Card 
              className="shadow-elevated border-border/50 cursor-pointer hover:border-primary transition-all p-8"
              onClick={() => setSelectedSection("oriental")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Church className="w-20 h-20 text-primary" />
                  <div className="text-center">
                    <div className="text-3xl">Oriental Orthodox</div>
                    <div className="text-sm text-muted-foreground font-normal">Church Etiquette</div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Prayers Card */}
            <Card 
              className="shadow-elevated border-border/50 cursor-pointer hover:border-primary transition-all p-8"
              onClick={() => setSelectedSection("prayers")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BookOpen className="w-16 h-16 text-primary" />
                  <div>
                    <div className="text-3xl">Prayers</div>
                    <div className="text-sm text-muted-foreground font-normal">Orthodox Prayer Collection</div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Saints Card */}
            <Card 
              className="shadow-elevated border-border/50 cursor-pointer hover:border-primary transition-all p-8"
              onClick={() => setSelectedSection("saints")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <UserRound className="w-16 h-16 text-primary" />
                  <div>
                    <div className="text-3xl">Saints</div>
                    <div className="text-sm text-muted-foreground font-normal">Lives of Orthodox Saints</div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Orthodox Churches Near Me */}
            <Card
              className="shadow-elevated border-border/50 cursor-pointer hover:border-primary transition-all p-8"
              onClick={() => !locatingChurches && handleFindChurchesNearMe()}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  {locatingChurches ? (
                    <Loader2 className="w-20 h-20 text-primary animate-spin" />
                  ) : (
                    <MapPin className="w-20 h-20 text-primary" />
                  )}
                  <div className="text-center">
                    <div className="text-3xl leading-tight">
                      <div>Churches</div>
                      <div>Near Me</div>
                    </div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {locatingChurches ? "Locating you…" : "Find Orthodox churches"}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ChurchResources;
