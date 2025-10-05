import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Church, BookOpen } from "lucide-react";
import orthodoxCross from "@/assets/orthodox-cross.jpg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const ChurchResources = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-peaceful">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-background rounded-lg flex items-center justify-center p-1">
                <img src={orthodoxCross} alt="Orthodox Cross" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-bold">Church Resources</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="text-center space-y-2 mb-8">
            <Church className="w-12 h-12 mx-auto text-primary" />
            <h2 className="text-3xl font-bold">Orthodox Church Etiquette Guide</h2>
            <p className="text-muted-foreground">Learn the traditions and proper conduct in Orthodox worship</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Eastern Orthodox Etiquette */}
            <Card className="shadow-elevated border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church className="w-5 h-5 text-primary" />
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

            {/* Oriental Orthodox Etiquette */}
            <Card className="shadow-elevated border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church className="w-5 h-5 text-primary" />
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
          </div>

          {/* Additional Readings Section */}
          <div className="mt-8">
            <Card className="shadow-elevated border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Additional Readings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Additional books recognized in various Orthodox traditions:
                </p>
                <ul className="grid md:grid-cols-2 gap-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    1 Enoch
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Jubilees
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    1 Meqabyan (Ethiopian Maccabees)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    2 Meqabyan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    3 Meqabyan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Paralipomena of Jeremiah
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Joseph ben Gorion
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    The Book of the Covenant
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Didascalia
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    The Shepherd of Hermas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Sinodos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Clement (Ethiopic Clement)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Ethiopic Book of the Nativity
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Ethiopic Book of the Resurrection
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChurchResources;
