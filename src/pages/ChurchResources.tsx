import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Cross, Church, BookOpen, UserRound } from "lucide-react";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import stBasilIcon from "@/assets/st-basil-icon.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DetailedContentView } from "@/components/resources/DetailedContentView";
import { BottomNavigation } from "@/components/BottomNavigation";
import { saintsContent, SaintDetail } from "@/data/saintsContent";
import { prayersContent, PrayerDetail } from "@/data/prayersContent";
import { useToast } from "@/hooks/use-toast";

type SectionType = "eastern" | "oriental" | "prayers" | "saints" | null;

const ChurchResources = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSection, setSelectedSection] = useState<SectionType>(null);
  const [selectedSaint, setSelectedSaint] = useState<SaintDetail | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerDetail | null>(null);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (selectedSaint) {
    return (
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
          toast({ description: `Completed reading about ${selectedSaint.prefix} ${selectedSaint.name}! 🙏` });
          setSelectedSaint(null);
          setSelectedSection("saints");
        }}
      />
    );
  }

  if (selectedPrayer) {
    return (
      <DetailedContentView
        title={selectedPrayer.name}
        subtitle={selectedPrayer.title}
        content={selectedPrayer.content}
        onClose={() => {
          setSelectedPrayer(null);
          setSelectedSection("prayers");
        }}
        showProgress={false}
      />
    );
  }

  // Fullscreen expanded view for a selected section
  if (selectedSection) {
    return (
      <div className="min-h-screen gradient-peaceful">
        <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-1.5">
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">
                  {selectedSection === "eastern" && "Eastern Etiquette"}
                  {selectedSection === "oriental" && "Oriental Etiquette"}
                  {selectedSection === "prayers" && "Prayers"}
                  {selectedSection === "saints" && "Saints"}
                </h1>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSection(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {selectedSection === "eastern" && (
              <Card className="shadow-elevated border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cross className="w-5 h-5 text-primary" />
                    Eastern Orthodox Church Etiquette
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cross className="w-5 h-5 text-primary" />
                    Oriental Orthodox Church Etiquette
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Prayers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prayersContent.map((prayer) => (
                      <button
                        key={prayer.id}
                        onClick={() => setSelectedPrayer(prayer)}
                        className="w-full p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-all relative"
                      >
                        <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                          {prayer.tradition === "Oriental" && "Oriental"}
                          {prayer.tradition === "Eastern" && "Eastern"}
                          {prayer.tradition === "Eastern/Oriental" && "Eastern/Oriental"}
                        </div>
                        <div className="font-semibold text-base pr-32">{prayer.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">{prayer.title}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedSection === "saints" && (
              <Card className="shadow-elevated border-border/50">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-peaceful pb-20">

      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center p-1.5">
                  <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
                </div>
                <h1 className="text-2xl font-bold">Resources</h1>
              </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Section Selection */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <Church className="w-20 h-20 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Orthodox Church Guide</h2>
            <p className="text-muted-foreground">Learn the traditions and proper conduct in Orthodox worship</p>
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
                  <div>
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
                  <div>
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
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default ChurchResources;
