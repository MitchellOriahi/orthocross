// Symbolic artwork for each prayer, drawn from art already bundled with the
// app (public-domain icons and photographs). Chosen to reflect what each
// prayer IS — quiet, fitting, never decorative for its own sake.
import rublevSavior from "@/assets/history/rublev-savior.jpg";
import rublevTrinity from "@/assets/history/rublev-trinity.jpg";
import rublevResurrection from "@/assets/history/rublev-resurrection.jpg";
import nicaea from "@/assets/history/slides/eo2-nicaea.jpg";
import transfiguration from "@/assets/history/slides/eo5-transfiguration.jpg";
import christMenas from "@/assets/history/slides/oo6-christ-menas.jpg";
import ethiopianMary from "@/assets/history/slides/oo6-ethiopian-mary.jpg";
import roslinCanon from "@/assets/history/slides/oo8-roslin.jpg";
import censer from "@/assets/history/slides/oo8-censer.jpg";
import morningLight from "@/assets/verse-backgrounds/mountain-sunrise.jpg";
import eveningLight from "@/assets/verse-backgrounds/galilee-dusk.jpg";
import orthodoxCross from "@/assets/orthodox-cross.jpg";

export const PRAYER_IMAGES: Record<string, { src: string; alt: string }> = {
  "lords-prayer": { src: rublevSavior, alt: "Icon of Christ the Saviour by Andrei Rublev" },
  "jesus-prayer": { src: transfiguration, alt: "Icon of the Transfiguration, the uncreated light" },
  "nicene-creed": { src: nicaea, alt: "Icon of the First Council of Nicaea" },
  "trisagion": { src: rublevTrinity, alt: "Icon of the Holy Trinity by Andrei Rublev" },
  "morning-prayer": { src: morningLight, alt: "Sunrise over the mountains" },
  "coptic-our-father": { src: christMenas, alt: "Coptic icon of Christ and Abbot Mena" },
  "evening-prayer": { src: eveningLight, alt: "Evening light over the Sea of Galilee" },
  "thanksgiving": { src: rublevResurrection, alt: "Icon of the Resurrection" },
  "armenian-prayer": { src: roslinCanon, alt: "Armenian illuminated canon table by Toros Roslin" },
  "ethiopian-prayer": { src: ethiopianMary, alt: "Ethiopian icon of the Mother of God" },
  "syrian-prayer": { src: censer, alt: "A liturgical censer" },
  "prayer-cross": { src: orthodoxCross, alt: "The Orthodox cross" },
};
