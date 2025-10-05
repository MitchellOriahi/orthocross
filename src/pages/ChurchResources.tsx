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

          {/* Prayers and Saints Section */}
          <div className="mt-8 grid md:grid-cols-2 gap-6">
            {/* Prayers Section */}
            <Card className="shadow-elevated border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Prayers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="lords-prayer">
                    <AccordionTrigger>The Lord's Prayer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        Our Father, who art in heaven,
                        hallowed be thy Name.
                        Thy Kingdom come,
                        thy will be done,
                        on earth as it is in heaven.
                        Give us this day our daily bread.
                        And forgive us our trespasses,
                        as we forgive those who trespass against us.
                        And lead us not into temptation,
                        but deliver us from evil.
                        For thine is the kingdom, and the power, and the glory,
                        forever and ever. Amen.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="nicene-creed">
                    <AccordionTrigger>The Nicene Creed</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        I believe in one God, the Father Almighty, Maker of heaven and earth, and of all things visible and invisible.

                        And in one Lord Jesus Christ, the only-begotten Son of God, begotten of the Father before all ages; Light of Light, true God of true God, begotten, not made, of one essence with the Father, by whom all things were made.

                        Who for us men and for our salvation came down from heaven and was incarnate of the Holy Spirit and the Virgin Mary and became man.

                        He was crucified for us under Pontius Pilate, and suffered and was buried; And He rose on the third day, according to the Scriptures.

                        He ascended into heaven and is seated at the right hand of the Father; And He will come again with glory to judge the living and dead. His kingdom shall have no end.

                        And in the Holy Spirit, the Lord, the Creator of life, who proceeds from the Father, who together with the Father and the Son is worshipped and glorified, who spoke through the prophets.

                        In one, holy, catholic, and apostolic Church.

                        I confess one baptism for the forgiveness of sins.

                        I look for the resurrection of the dead, and the life of the age to come. Amen.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="jesus-prayer">
                    <AccordionTrigger>The Jesus Prayer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Lord Jesus Christ, Son of God, have mercy on me, a sinner.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="trisagion">
                    <AccordionTrigger>Trisagion Prayer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        Holy God, Holy Mighty, Holy Immortal, have mercy on us. (3x)

                        Glory to the Father, and to the Son, and to the Holy Spirit,
                        now and ever and unto ages of ages. Amen.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="morning-prayer">
                    <AccordionTrigger>Morning Prayer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        Having risen from sleep, I thank You, O Holy Trinity, for through Your great goodness and patience You were not angered with me, an idler and sinner, nor have You destroyed me in my sins, but have shown Your usual love for mankind. And when I was prostrate in despair, You raised me to keep the morning watch and glorify Your power. And now enlighten my mind's eyes and open my mouth to study Your words and understand Your commandments, and to do Your will, and sing to You in heartfelt adoration, and praise Your most holy Name, of the Father and of the Son and of the Holy Spirit, now and ever and unto ages of ages. Amen.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="evening-prayer">
                    <AccordionTrigger>Evening Prayer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        O Lord our God, as You are good and love mankind, forgive me wherein I have sinned today in word, deed, and thought. Grant me peaceful and undisturbed sleep. Send Your Guardian Angel to protect and guard me from every evil. For You are the guardian of our souls and bodies, and to You we give glory: to the Father and to the Son and to the Holy Spirit, now and ever and unto ages of ages. Amen.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Saints Section */}
            <Card className="shadow-elevated border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Church className="w-5 h-5 text-primary" />
                  Saints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="st-mary">
                    <AccordionTrigger>Theotokos (Virgin Mary)</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        The Mother of God, who gave birth to Jesus Christ. She is honored above all saints in Orthodox Christianity and is called upon for intercession and protection. Her title "Theotokos" means "God-bearer."
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="st-nicholas">
                    <AccordionTrigger>St. Nicholas of Myra</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Known for his generosity and miracles, St. Nicholas (270-343 AD) was a bishop who helped the poor and defended the faith. He is one of the most beloved saints and is invoked for help in difficulties.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="st-george">
                    <AccordionTrigger>St. George the Trophy-Bearer</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        A soldier and martyr (c. 280-303 AD) known for his courage and faith. The iconic image of St. George slaying the dragon represents the victory of good over evil and faith over persecution.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="st-john-chrysostom">
                    <AccordionTrigger>St. John Chrysostom</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        Archbishop of Constantinople (347-407 AD) and one of the greatest preachers in Church history. His name "Chrysostom" means "golden-mouthed." He wrote the most commonly used Divine Liturgy in Orthodox Christianity.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="st-basil">
                    <AccordionTrigger>St. Basil the Great</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        One of the three Cappadocian Fathers (330-379 AD), St. Basil was a bishop, theologian, and monastic founder. He defended Orthodox faith against heresies and established guidelines for monastic life still used today.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="st-anthony">
                    <AccordionTrigger>St. Anthony the Great</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        The Father of Monasticism (251-356 AD), St. Anthony withdrew to the desert to live a life of prayer and asceticism. His example inspired the monastic movement that spread throughout Christianity.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="apostles">
                    <AccordionTrigger>The Holy Apostles</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-muted-foreground">
                        The twelve disciples chosen by Jesus Christ to spread the Gospel: Peter, Andrew, James, John, Philip, Bartholomew, Thomas, Matthew, James son of Alphaeus, Thaddeus, Simon, and Judas (replaced by Matthias). Also honored is St. Paul, the Apostle to the Gentiles.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChurchResources;
