import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, LogIn, Church, Wheat, Shirt, Users, Globe2, ScrollText } from "lucide-react";
import { EasternCross, OrientalCross } from "@/components/crosses";
import { cn } from "@/lib/utils";
import easternHero from "@/assets/history/slides/eo4-hagia-sophia.jpg";
import orientalHero from "@/assets/history/slides/oo3-lalibela.jpg";

// A guided walk through church etiquette — one image-led header, then the
// visit unfolds as ordered steps. The guidance text is unchanged from the
// original lists.

interface Step {
  id: string;
  title: string;
  icon: typeof Clock;
  items: string[];
}

const EASTERN_STEPS: Step[] = [
  {
    id: "before-entering", title: "Before Entering", icon: Clock,
    items: [
      "Arrive early to prepare your heart for worship",
      "Turn off or silence all electronic devices",
      "Women traditionally cover their heads with a scarf",
      "Men remove hats before entering",
    ],
  },
  {
    id: "upon-entering", title: "Upon Entering", icon: LogIn,
    items: [
      "Make the sign of the cross and bow",
      "Venerate icons by making the sign of the cross and kissing them",
      "Light candles as an offering and prayer",
      "Stand quietly or find your place",
    ],
  },
  {
    id: "during-service", title: "During the Service", icon: Church,
    items: [
      "Stand for most of the service (sitting is allowed when appropriate)",
      "Make the sign of the cross at designated times",
      "Bow when the priest censes or blesses",
      "Refrain from talking or unnecessary movement",
      "Do not cross your legs when sitting",
    ],
  },
  {
    id: "holy-communion", title: "Holy Communion", icon: Wheat,
    items: [
      "Fast from midnight before receiving communion",
      "Confess your sins beforehand",
      "Approach with hands crossed over chest",
      "Open your mouth wide to receive on a spoon",
      "Consume antidoron (blessed bread) after",
    ],
  },
  {
    id: "dress-code", title: "Dress Code", icon: Shirt,
    items: [
      "Dress modestly and respectfully",
      "Women: Skirts/dresses below the knee, shoulders covered",
      "Men: Long pants, collared shirts preferred",
      "Avoid casual or revealing clothing",
    ],
  },
  {
    id: "general-conduct", title: "General Conduct", icon: Users,
    items: [
      "Children should be taught to be reverent and quiet",
      "Avoid leaving during the Gospel or consecration",
      "Wait until dismissal before departing",
      'Greet others quietly with "Christ is in our midst"',
    ],
  },
];

const ORIENTAL_STEPS: Step[] = [
  {
    id: "before-entering", title: "Before Entering", icon: Clock,
    items: [
      "Arrive before the service begins",
      "Remove shoes in some traditions (Ethiopian, Eritrean)",
      "Women cover their heads with a scarf",
      "Turn off all electronic devices",
    ],
  },
  {
    id: "upon-entering", title: "Upon Entering", icon: LogIn,
    items: [
      "Make the sign of the cross (may differ by tradition)",
      "Bow or prostrate before the altar",
      "Kiss icons and crosses respectfully",
      "Take your place quietly",
    ],
  },
  {
    id: "during-service", title: "During the Service", icon: Church,
    items: [
      "Stand for the entire service (traditional practice)",
      "Make prostrations at designated times",
      "Use prayer ropes or rosaries for personal prayer",
      "Maintain silence and focus on worship",
      "Follow the congregation in responses and hymns",
    ],
  },
  {
    id: "holy-communion", title: "Holy Communion", icon: Wheat,
    items: [
      "Fast from midnight or for designated hours",
      "Confess sins and receive absolution",
      "Men typically receive before women and children",
      "Receive with reverence and humility",
      "Some churches use a spoon, others intinction",
    ],
  },
  {
    id: "dress-code", title: "Dress Code", icon: Shirt,
    items: [
      "Dress in white or light colors for special feasts",
      "Women: Long dresses/skirts, arms and shoulders covered",
      "Men: Long pants, shirts with sleeves",
      "Traditional garments are often worn",
    ],
  },
  {
    id: "cultural-practices", title: "Cultural Practices", icon: Globe2,
    items: [
      "Kiss hands of clergy as a sign of respect",
      "Receive blessings from priests after service",
      "Participate in coffee and fellowship after liturgy",
      "Learn and use traditional greetings in the church language",
    ],
  },
  {
    id: "special-notes", title: "Special Notes", icon: ScrollText,
    items: [
      "Services are often longer than Western services",
      "Ancient languages may be used (Coptic, Armenian, Syriac, etc.)",
      "Incense and elaborate rituals are common",
      "Respect photography restrictions during services",
    ],
  },
];

interface EtiquetteViewProps {
  tradition: "eastern" | "oriental";
  onBack: () => void;
}

export const EtiquetteView = ({ tradition, onBack }: EtiquetteViewProps) => {
  const [openStep, setOpenStep] = useState<string | null>("before-entering");
  const isEastern = tradition === "eastern";
  const steps = isEastern ? EASTERN_STEPS : ORIENTAL_STEPS;

  return (
    <div className="animate-chapter-open">
      {/* Hero */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-elevated mb-5">
        <img
          src={isEastern ? easternHero : orientalHero}
          alt={isEastern
            ? "The nave of Hagia Sophia"
            : "The rock-hewn church of Bete Giyorgis, Lalibela"}
          className="w-full h-48 sm:h-60 object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <Button
          variant="ghost"
          onClick={onBack}
          className="absolute top-2 left-2 text-white hover:bg-white/15 hover:text-white"
        >
          ← Back
        </Button>
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight">
              {isEastern ? "Eastern Orthodox" : "Oriental Orthodox"}
            </h2>
            <p className="text-sm text-white/80">Visiting the church with reverence</p>
          </div>
          {isEastern
            ? <EasternCross className="h-10 w-8 text-white/90 flex-shrink-0" />
            : <OrientalCross className="h-10 w-10 text-white/90 flex-shrink-0" />}
        </div>
        <p className="absolute top-2 right-3 text-[10px] text-white/60">
          {isEastern ? "Hagia Sophia, 1852 lithograph" : "Lalibela, 1882 drawing"}
        </p>
      </div>

      {/* The visit, step by step */}
      <div className="space-y-2.5">
        {steps.map((step, idx) => {
          const isOpen = openStep === step.id;
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={cn(
                "rounded-xl border bg-card transition-colors",
                isOpen ? "border-primary/40" : "border-border"
              )}
            >
              <button
                onClick={() => setOpenStep(isOpen ? null : step.id)}
                className="w-full flex items-center gap-3 p-4 text-left min-h-[44px]"
                aria-expanded={isOpen}
              >
                <span className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border",
                  isOpen ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/40 border-border text-muted-foreground"
                )}>
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1">
                  <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                    Step {idx + 1}
                  </span>
                  <span className="block font-semibold">{step.title}</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <ul className="px-4 pb-4 pl-[4rem] space-y-2.5">
                    {step.items.map((item) => (
                      <li key={item} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                        <span className="text-primary mt-0.5 flex-shrink-0">☦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
