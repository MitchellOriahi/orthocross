import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Church, BookOpen, UserRound, Pin, ArrowLeft, MapPin, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DonateButton } from "@/components/DonateButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import orthodoxCrossLight from "@/assets/orthodox-cross-light.png";
import stBasilIcon from "@/assets/st-basil-icon.png";
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
import { prayersContent, PrayerDetail } from "@/data/prayersContent";
import { useToast } from "@/hooks/use-toast";
import { CongratulationsModal } from "@/components/CongratulationsModal";
import { useMusic } from "@/contexts/MusicContext";

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
  const [locatingChurches, setLocatingChurches] = useState(false);

  const handleFindChurchesNearMe = () => {
    // Open the tab synchronously inside the click handler so popup blockers
    // don't kill it. Start with a generic "near me" search; if we get coords
    // we'll refine the URL afterward.
    const fallbackUrl = `https://www.google.com/maps/search/${encodeURIComponent("Orthodox churches near me")}`;
    const newTab = window.open(fallbackUrl, "_blank", "noopener,noreferrer");

    if (!("geolocation" in navigator)) {
      return; // Google Maps will use its own location detection
    }

    setLocatingChurches(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingChurches(false);
        const { latitude, longitude } = position.coords;
        const query = encodeURIComponent("Orthodox Churches");
        const preciseUrl = `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`;
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


  if (selectedSaint) {
    return (
      <div className="pb-20">
        <DetailedContentView
          title={`${selectedSaint.prefix} ${selectedSaint.name}${selectedSaint.epithet ? ` ${selectedSaint.epithet}` : ''}`}
          subtitle={selectedSaint.shortDescription}
          content={selectedSaint.content}
          onClose={() => {
            setSelectedSaint(null);
            setSelectedSection("saints");
          }}
          showProgress={true}
          onComplete={() => {
            playSound('saint');
            setShowCongratulations(true);
          }}
        />
        <CongratulationsModal
          isOpen={showCongratulations}
          onClose={() => {
            setShowCongratulations(false);
            setSelectedSaint(null);
            setSelectedSection("saints");
          }}
          streakDays={0}
          isNewStreak={false}
          saintName={selectedSaint?.name}
          saintIcon={selectedSaint?.iconUrl}
          saintPrefix={selectedSaint?.prefix}
        />
        <BottomNavigation />
      </div>
    );
  }

  if (selectedPrayer) {
    return (
      <div className="pb-20">
        <PrayerDetailView
          name={selectedPrayer.name}
          title={selectedPrayer.title}
          content={selectedPrayer.content}
          prayerId={selectedPrayer.id}
          onClose={() => {
            setSelectedPrayer(null);
            setSelectedSection("prayers");
          }}
        />
        <BottomNavigation />
      </div>
    );
  }

  // Fullscreen expanded view for a selected section
  if (selectedSection) {
    return (
      <div className="min-h-screen gradient-peaceful pb-20">
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
                    <AccordionItem value="before-entering">
                      <AccordionTrigger>Before Entering</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Arrive early to prepare your heart for worship</li>
                          <li>• Turn off or silence all electronic devices</li>
                          <li>• Women traditionally cover their heads with a scarf</li>
                          <li>• Men remove hats before entering</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="upon-entering">
                      <AccordionTrigger>Upon Entering</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Make the sign of the cross and bow</li>
                          <li>• Venerate icons by making the sign of the cross and kissing them</li>
                          <li>• Light candles as an offering and prayer</li>
                          <li>• Stand quietly or find your place</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="during-service">
                      <AccordionTrigger>During the Service</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Stand for most of the service (sitting is allowed when appropriate)</li>
                          <li>• Make the sign of the cross at designated times</li>
                          <li>• Bow when the priest censes or blesses</li>
                          <li>• Refrain from talking or unnecessary movement</li>
                          <li>• Do not cross your legs when sitting</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="holy-communion">
                      <AccordionTrigger>Holy Communion</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Fast from midnight before receiving communion</li>
                          <li>• Confess your sins beforehand</li>
                          <li>• Approach with hands crossed over chest</li>
                          <li>• Open your mouth wide to receive on a spoon</li>
                          <li>• Consume antidoron (blessed bread) after</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="dress-code">
                      <AccordionTrigger>Dress Code</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Dress modestly and respectfully</li>
                          <li>• Women: Skirts/dresses below the knee, shoulders covered</li>
                          <li>• Men: Long pants, collared shirts preferred</li>
                          <li>• Avoid casual or revealing clothing</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="general-conduct">
                      <AccordionTrigger>General Conduct</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Children should be taught to be reverent and quiet</li>
                          <li>• Avoid leaving during the Gospel or consecration</li>
                          <li>• Wait until dismissal before departing</li>
                          <li>• Greet others quietly with "Christ is in our midst"</li>
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
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="before-entering">
                      <AccordionTrigger>Before Entering</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Arrive before the service begins</li>
                          <li>• Remove shoes in some traditions (Ethiopian, Eritrean)</li>
                          <li>• Women cover their heads with a scarf</li>
                          <li>• Turn off all electronic devices</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="upon-entering">
                      <AccordionTrigger>Upon Entering</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Make the sign of the cross (may differ by tradition)</li>
                          <li>• Bow or prostrate before the altar</li>
                          <li>• Kiss icons and crosses respectfully</li>
                          <li>• Take your place quietly</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="during-service">
                      <AccordionTrigger>During the Service</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Stand for the entire service (traditional practice)</li>
                          <li>• Make prostrations at designated times</li>
                          <li>• Use prayer ropes or rosaries for personal prayer</li>
                          <li>• Maintain silence and focus on worship</li>
                          <li>• Follow the congregation in responses and hymns</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="holy-communion">
                      <AccordionTrigger>Holy Communion</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Fast from midnight or for designated hours</li>
                          <li>• Confess sins and receive absolution</li>
                          <li>• Men typically receive before women and children</li>
                          <li>• Receive with reverence and humility</li>
                          <li>• Some churches use a spoon, others intinction</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="dress-code">
                      <AccordionTrigger>Dress Code</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Dress in white or light colors for special feasts</li>
                          <li>• Women: Long dresses/skirts, arms and shoulders covered</li>
                          <li>• Men: Long pants, shirts with sleeves</li>
                          <li>• Traditional garments are often worn</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="cultural-practices">
                      <AccordionTrigger>Cultural Practices</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Kiss hands of clergy as a sign of respect</li>
                          <li>• Receive blessings from priests after service</li>
                          <li>• Participate in coffee and fellowship after liturgy</li>
                          <li>• Learn and use traditional greetings in the church language</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="special-notes">
                      <AccordionTrigger>Special Notes</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>• Services are often longer than Western services</li>
                          <li>• Ancient languages may be used (Coptic, Armenian, Syriac, etc.)</li>
                          <li>• Incense and elaborate rituals are common</li>
                          <li>• Respect photography restrictions during services</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )}

            {selectedSection === "prayers" && (
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
                    <BookOpen className="w-5 h-5 text-primary" />
                    Prayers
                  </CardTitle>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant={prayerFilter === "all" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrayerFilter("all")}
                    >
                      All
                    </Button>
                    <Button
                      variant={prayerFilter === "Eastern" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrayerFilter("Eastern")}
                      className={prayerFilter === "Eastern" ? "" : "text-blue-500 hover:text-blue-600 border-blue-500/50"}
                    >
                      Eastern
                    </Button>
                    <Button
                      variant={prayerFilter === "Oriental" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPrayerFilter("Oriental")}
                      className={prayerFilter === "Oriental" ? "" : "text-orange-500 hover:text-orange-600 border-orange-500/50"}
                    >
                      Oriental
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Sort prayers: pinned first, then others, then filter */}
                    {(() => {
                      // Filter prayers based on current filter
                      const filteredPrayers = [...prayersContent].filter((prayer) => {
                        if (prayerFilter === "all") return true;
                        if (prayerFilter === "Eastern") {
                          return prayer.tradition === "Eastern" || prayer.tradition === "Eastern/Oriental";
                        }
                        if (prayerFilter === "Oriental") {
                          return prayer.tradition === "Oriental" || prayer.tradition === "Eastern/Oriental";
                        }
                        return false;
                      });

                      // Separate pinned and unpinned prayers
                      const pinnedPrayers = filteredPrayers.filter(p => pinnedPrayerIds.has(p.id));
                      const unpinnedPrayers = filteredPrayers.filter(p => !pinnedPrayerIds.has(p.id));

                      // For "all" filter, interleave unpinned Eastern and Oriental
                      let sortedUnpinned = unpinnedPrayers;
                      if (prayerFilter === "all") {
                        const easternOrthodox = unpinnedPrayers.filter(p => p.tradition === "Eastern/Oriental");
                        const eastern = unpinnedPrayers.filter(p => p.tradition === "Eastern");
                        const oriental = unpinnedPrayers.filter(p => p.tradition === "Oriental");
                        
                        // Start with Eastern/Oriental prayers
                        sortedUnpinned = [...easternOrthodox];
                        
                        // Interleave Eastern and Oriental
                        const maxLength = Math.max(eastern.length, oriental.length);
                        for (let i = 0; i < maxLength; i++) {
                          if (i < eastern.length) sortedUnpinned.push(eastern[i]);
                          if (i < oriental.length) sortedUnpinned.push(oriental[i]);
                        }
                      }

                      // Combine: all pinned prayers first, then unpinned
                      return [...pinnedPrayers, ...sortedUnpinned];
                    })()
                      .map((prayer) => {
                        const isPinned = pinnedPrayerIds.has(prayer.id);
                        // Adjust tradition display based on active filter
                        const displayTradition = prayerFilter === "all" 
                          ? prayer.tradition 
                          : prayer.tradition === "Eastern/Oriental" 
                            ? prayerFilter 
                            : prayer.tradition;
                        return (
                          <div key={prayer.id} className="relative group">
                            <button
                              onClick={() => setSelectedPrayer(prayer)}
                              className={`w-full p-4 text-left rounded-lg border hover:border-primary hover:bg-accent transition-all relative ${
                                isPinned ? 'border-primary bg-primary/5' : 'border-border'
                              }`}
                            >
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                <div className="text-xs px-2 py-1 rounded-md bg-primary/10 font-medium">
                                  {displayTradition === "Oriental" && <span className="text-orange-500">Oriental</span>}
                                  {displayTradition === "Eastern" && <span className="text-blue-500">Eastern</span>}
                                  {displayTradition === "Eastern/Oriental" && (
                                    <>
                                      <span className="text-blue-500">Eastern</span>
                                      <span className="text-primary">/</span>
                                      <span className="text-orange-500">Oriental</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="font-semibold text-base pr-32">
                                {isPinned && <Pin className="inline w-4 h-4 mr-2 text-primary fill-primary" />}
                                {prayer.name === "Coptic 'Our Father'" ? (
                                  <span className="inline-flex flex-col leading-tight">
                                    <span>Coptic</span>
                                    <span>"Our Father"</span>
                                  </span>
                                ) : (
                                  prayer.name
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">{prayer.title}</div>
                            </button>
                            {user && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 bottom-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePinPrayer(prayer.id);
                                }}
                              >
                                <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary text-primary' : ''}`} />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSection === "saints" && (
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
                    <UserRound className="w-5 h-5 text-primary" />
                    Saints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {saintsContent.map((saint) => (
                      <button
                        key={saint.id}
                        onClick={() => setSelectedSaint(saint)}
                        className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-all relative flex items-start gap-4"
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
                          <img 
                            src={saint.iconUrl} 
                            alt={`${saint.prefix} ${saint.name}`}
                            className="w-full h-full object-cover scale-125"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          {saint.prefix && <div className="text-base font-bold leading-tight">{saint.prefix}</div>}
                          <div className="font-bold text-base leading-tight">{saint.name}</div>
                          {saint.epithet && <div className="text-base font-bold leading-tight mt-0.5">{saint.epithet}</div>}
                          <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">{saint.shortDescription}</div>
                        </div>
                        <div className="absolute top-3 right-3 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md bg-primary/10 text-primary font-medium whitespace-nowrap">
                          {saint.tradition === "Oriental" && "Oriental"}
                          {saint.tradition === "Eastern" && "Eastern"}
                          {saint.tradition === "Eastern/Oriental" && "E/O"}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-20">

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
      <main className="container mx-auto px-4 py-2">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-0 mb-4">
            <div className="w-36 h-36 mx-auto relative -mb-1">
              <img 
                src={orthodoxCrossBlack} 
                alt="Orthodox Cross" 
                className="w-full h-full object-contain dark:hidden"
                style={{ filter: 'drop-shadow(0 0 16px rgba(139, 92, 246, 0.4))' }}
              />
              <img 
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
