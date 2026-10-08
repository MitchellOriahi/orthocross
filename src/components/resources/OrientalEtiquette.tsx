import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Section = { title: string; items: string[] };
type OrientalChurch = { id: string; name: string; short: string; language: string; sections: Section[] };

const COMMON: Section[] = [
  { title: "Shared by All Oriental Churches", items: [
    "Six ancient churches in one faith: Coptic, Ethiopian, Eritrean, Armenian, Syriac and Malankara (Indian)",
    "Arrive early, dress modestly and turn off your phone",
    "Communion is only for baptized and chrismated members, after fasting and confession",
    "Ask the priest before taking photos",
    "Visitors are welcome to watch quietly; you never have to copy bows or prostrations",
  ] },
];

const CHURCHES: OrientalChurch[] = [
  { id: "coptic", name: "Coptic", short: "Egypt", language: "Coptic & Arabic", sections: [
    { title: "Entering", items: ["Many remove shoes before approaching the altar area", "Bow toward the altar and kiss the icons and the cross", "Women traditionally sit on one side, men on the other"] },
    { title: "Dress", items: ["Women cover their heads, often with a white veil", "Long sleeves and skirts; men in long pants"] },
    { title: "During the Liturgy", items: ["Services can last 2–3 hours; hymns are sung with cymbals and triangle", "The sign of the cross is made from left to right", "Stand at the Gospel and at the Anaphora"] },
    { title: "Communion & After", items: ["Fast at least 9 hours beforehand", "Remove shoes before receiving", "Blessed bread (eulogia) is shared at the end", "Kiss the priest's hand-cross and receive his blessing"] },
  ] },
  { id: "ethiopian", name: "Ethiopian", short: "Tewahedo", language: "Ge'ez & Amharic", sections: [
    { title: "Entering", items: ["Always remove shoes before entering", "Kiss the door, the walls or the ground in reverence", "Churches have three rings; laity stay in the outer areas"] },
    { title: "Dress", items: ["Wear white: the netela (thin shawl) for women, gabi for men", "Women fully cover their heads"] },
    { title: "During the Liturgy", items: ["Services are long and mostly standing; prayer staffs (mequamia) help you lean", "Priests and debteras chant with drums and sistrums", "Many follow outside the building on feast days"] },
    { title: "Communion & After", items: ["Fast from the night before; Wednesdays and Fridays are fasting days", "Only those prepared and with a clean conscience receive", "Bow and kiss the hand-cross held by the priest"] },
  ] },
  { id: "eritrean", name: "Eritrean", short: "Tewahedo", language: "Ge'ez & Tigrinya", sections: [
    { title: "Entering", items: ["Remove shoes at the door", "Bow and kiss the doorpost or the church wall", "Men and women stand on separate sides"] },
    { title: "Dress", items: ["White traditional clothing; women wear the netsela over the head", "Modest, covering clothes for everyone"] },
    { title: "During the Liturgy", items: ["Chanting in Ge'ez with drums (kebero) and sistrums", "Prayer sticks support long periods of standing", "Prostrations are common, especially during fasting seasons"] },
    { title: "Communion & After", items: ["Fast from midnight before receiving", "Receive the priest's blessing with the hand-cross", "Blessed bread (mbaarek) may be shared afterward"] },
  ] },
  { id: "armenian", name: "Armenian", short: "Apostolic", language: "Classical Armenian (Grabar)", sections: [
    { title: "Entering", items: ["Light a thin candle in the sand tray at the entrance", "Make the sign of the cross and kiss the icons or Gospel", "Shoes stay on; only clergy remove them near the altar"] },
    { title: "Dress", items: ["Women often cover their heads with a lace scarf", "Smart, modest clothing for everyone"] },
    { title: "During the Liturgy", items: ["A curtain closes the altar at certain times, like during Lent", "Pews are common; stand at the Gospel and key prayers", "The sign of the cross is made from left to right"] },
    { title: "Communion & After", items: ["Fast and confess beforehand", "The priest places the Body dipped in the Blood directly in the mouth", "Unleavened bread and unmixed wine are used", "Visitors may receive blessed bread (mas) after the service"] },
  ] },
  { id: "syriac", name: "Syriac", short: "Antioch", language: "Syriac (Aramaic) & Arabic", sections: [
    { title: "Entering", items: ["Bow to the altar and kiss the cross or the Gospel", "Some churches remove shoes; follow local practice", "Men and women may sit separately"] },
    { title: "Dress", items: ["Women often cover their heads", "Modest clothing with covered shoulders"] },
    { title: "During the Liturgy", items: ["Prayers face east, in the language Christ spoke", "The kiss of peace is passed hand to hand from the altar", "The sign of the cross is made with one finger or three, from left to right"] },
    { title: "Communion & After", items: ["Fast from midnight before receiving", "The priest gives Communion directly into the mouth", "Kiss the priest's hand-cross and receive blessed bread"] },
  ] },
  { id: "malankara", name: "Malankara", short: "India", language: "Malayalam & Syriac", sections: [
    { title: "Entering", items: ["Remove shoes outside the church", "Bow toward the altar and make the sign of the cross", "Men sit on the right, women on the left"] },
    { title: "Dress", items: ["Women wear saris or modest dresses and cover their heads", "Men wear long pants or a mundu, often white"] },
    { title: "During the Liturgy", items: ["The Holy Qurbana uses the West Syriac rite", "The kiss of peace (kaimuth) is passed hand to hand", "Prostrations are made during Lent"] },
    { title: "Communion & After", items: ["Fast from midnight and confess beforehand", "Receive the blessing (kaimuth) of the priest at the end", "Blessed bread or rice may be shared after special feasts"] },
  ] },
];

const List = ({ sections, prefix }: { sections: Section[]; prefix: string }) => (
  <Accordion type="single" collapsible className="w-full">
    {sections.map((s) => (
      <AccordionItem key={s.title} value={`${prefix}-${s.title}`}>
        <AccordionTrigger>{s.title}</AccordionTrigger>
        <AccordionContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {s.items.map((i) => <li key={i}>• {i}</li>)}
          </ul>
        </AccordionContent>
      </AccordionItem>
    ))}
  </Accordion>
);

export const OrientalEtiquette = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const church = CHURCHES.find((c) => c.id === selected);

  if (church) {
    return (
      <div className="space-y-3">
        <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>← All churches</Button>
        <div className="text-center">
          <div className="text-xl font-semibold text-foreground">{church.name} Orthodox</div>
          <div className="text-xs text-muted-foreground">{church.language}</div>
        </div>
        <List sections={church.sections} prefix={church.id} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <List sections={COMMON} prefix="common" />
      <p className="text-sm text-muted-foreground text-center">Choose a church to see its own customs</p>
      <div className="grid grid-cols-2 gap-3">
        {CHURCHES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className="aspect-square rounded-xl border border-border/60 bg-card hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 p-3"
          >
            <span className="text-3xl text-primary leading-none">☩</span>
            <span className="text-base font-semibold text-foreground">{c.name}</span>
            <span className="text-xs text-muted-foreground">{c.short}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
