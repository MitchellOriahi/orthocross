import { prayerAdditions } from "./prayerAdditions";

// Context describes the saved text, not a replacement or a newly composed prayer.
export const PRAYER_EXPLANATION_TOPICS = {
  spirit: "This prayer addresses the Holy Spirit, asking for His presence, cleansing and help. It brings the worshipper's need for spiritual renewal before God.",
  trinity: "This prayer glorifies the Father, Son and Holy Spirit. Its words join praise of the Holy Trinity with a humble appeal for mercy.",
  repentance: "This prayer expresses repentance and dependence on God's mercy. Rather than claiming personal righteousness, the worshipper asks for forgiveness and a renewed heart.",
  morning: "This morning prayer begins the day with praise and a request for God's guidance. It asks that the day's thoughts and actions be directed toward Him.",
  evening: "This evening or bedtime prayer entrusts the worshipper to God's care. It brings the need for mercy, protection and peaceful rest before Him.",
  thanksgiving: "This prayer gives thanks for God's care and gifts. Gratitude is joined with the desire to continue living under His guidance.",
  mary: "This prayer honours Mary, the Mother of God, in relation to Christ and His work of salvation. Where it asks for her intercession, it asks her to pray for us.",
  saints: "This prayer asks a saint or guardian angel for prayer and help before God. Its petitions seek protection and a life pleasing to Him.",
  communionBefore: "This prayer prepares the worshipper for Holy Communion through repentance and faith. It asks that receiving Christ's Holy Mysteries bring healing and life, not condemnation.",
  communionAfter: "This prayer gives thanks after Holy Communion. It asks that the gift received bear fruit in the worshipper's life through holiness, healing and faithfulness to God.",
  worship: "This text belongs to the prayer and praise of the Church. Its words direct attention toward God and join the worshipper's petitions with the Church's worship.",
  cross: "This prayer recalls Christ's Cross and asks for His help. The Cross is remembered in connection with His victory and the protection of His people.",
  resurrection: "This hymn celebrates Christ's Resurrection and His victory over death. Its praise expresses the Church's joy in the life He gives.",
  feast: "This hymn commemorates the event named in its title. It brings that event into the Church's prayer through praise of Christ and remembrance of His saving work.",
  needs: "This prayer brings the particular person or need named in its title before God. It asks for His mercy and care rather than treating prayer as a guarantee of a particular outcome.",
  meals: "This meal prayer places food and daily nourishment within thanksgiving to God. It joins the ordinary act of eating with remembrance of His gifts.",
  work: "This prayer asks for God's help before work or the reading of Scripture. It seeks understanding, guidance and actions in harmony with His will.",
  psalm: "This prayer is a complete psalm from the Book of Psalms. The reference identifies the biblical text; where two numbers are given, they reflect different Hebrew and Septuagint numbering, not two different psalms.",
  scripture: "This text comes from the biblical passage identified in its reference. Its words are presented in their scriptural setting as a canticle, prayer or teaching used in Christian devotion.",
  agpeya: "This prayer comes from the Agpeya, the Coptic book of the prayers of the hours. The hour or section named in its title identifies its place within that daily cycle of prayer.",
  nerses: "This text belongs to I Confess with Faith by St. Nerses Shnorhali of the Armenian Church. The full collection has twenty-four prayers; the separately named selections are individual prayers from that collection.",
  malankara: "This text comes from the daily prayers published by the Malankara Archdiocese of the Syrian Orthodox Church. Its title identifies its place in the morning, evening or bedtime office.",
  wudase: "This text comes from the Monday praises of Wudase Maryam in the Ethiopian and Eritrean tradition, in the translation named above. Its praise of Mary is centred on Christ's Incarnation and salvation.",
  years: "This blessing belongs to the Polychronion, the prayer for many years in the Slavonic tradition. It asks for a peaceful life, health and salvation on a birthday or name day.",
} as const;

type Topic = keyof typeof PRAYER_EXPLANATION_TOPICS;
const topics: Partial<Record<Topic, readonly string[]>> = {
  spirit: ["o-heavenly-king", "evening-prayer-to-the-holy-spirit"],
  trinity: ["prayer-to-the-most-holy-trinity"],
  repentance: ["prayer-of-st-ephrem"],
  morning: ["morning-prayer-to-the-holy-trinity", "morning-prayer-to-the-father", "o-christ-the-true-light", "to-thee-o-master", "prayer-at-the-beginning-of-the-day", "prayer-of-metropolitan-philaret"],
  evening: ["into-thy-hands", "evening-prayer-to-the-father", "evening-prayer-to-jesus-christ", "prayer-for-rest-of-body-and-soul"],
  thanksgiving: ["prayers-of-thanksgiving"],
  mary: ["morning-prayer-to-the-theotokos", "rejoice-o-virgin-theotokos", "it-is-truly-meet", "beneath-thy-compassion", "paschal-hymn-to-the-theotokos", "o-victorious-leader"],
  saints: ["morning-prayer-to-the-guardian-angel", "prayer-to-ones-patron-saint", "o-angel-of-god", "o-angel-of-christ", "apolytikion-st-john-chrysostom", "apolytikion-st-basil"],
  communionBefore: ["i-believe-o-lord", "of-thy-mystical-supper", "may-the-communion", ...Array.from({ length: 9 }, (_, index) => `prayer-before-communion-${index + 1}`)],
  communionAfter: ["thanksgiving-after-communion", "prayer-of-st-basil-after-communion", "prayer-of-st-symeon-after-communion", "all-holy-lady-theotokos"],
  worship: ["glory-to-the-father", "o-gladsome-light", "we-have-seen-the-true-light", "come-let-us-worship", "prayer-of-the-hours", "through-the-prayers-of-our-holy-fathers", "cherubic-hymn", "only-begotten-son", "the-great-litany"],
  cross: ["troparion-of-the-cross"],
  resurrection: ["hymn-of-the-resurrection", "christ-is-risen"],
  feast: ["troparion-of-the-nativity", "troparion-of-theophany", "troparion-of-the-annunciation", "troparion-of-the-transfiguration", "troparion-of-the-ascension", "troparion-of-pentecost"],
  needs: ["for-the-sick", "prayer-for-travel", "prayer-for-the-departed", "prayer-for-parents", "prayer-of-parents-for-their-children"],
  meals: ["prayer-before-meals", "prayer-after-meals"],
  work: ["before-reading-holy-scripture", "before-any-work"],
  psalm: ["psalm-1", "psalm-23", "psalm-27", "psalm-34", "psalm-46", "psalm-50", "psalm-91", "psalm-103", "psalm-104", "psalm-117", "psalm-121", "psalm-130", "psalm-141", "psalm-150"],
  scripture: ["prayer-of-the-publican", "prayer-of-the-thief", "magnificat", "benedictus", "nunc-dimittis", "song-of-moses", "song-of-hannah", "the-beatitudes"],
  agpeya: ["agpeya-thanksgiving", "agpeya-trisagion", "introduction-to-the-creed", "the-orthodox-creed-coptic", "the-praise-of-the-angels", "agpeya-first-hour-litanies", "agpeya-first-hour-absolution", "agpeya-third-hour-litanies", "agpeya-third-hour-absolution", "agpeya-sixth-hour-litanies", "agpeya-sixth-hour-absolution", "agpeya-ninth-hour-litanies", "agpeya-ninth-hour-absolution", "agpeya-eleventh-hour-absolution", "agpeya-twelfth-hour-litanies", "agpeya-twelfth-hour-absolution", "agpeya-veil-absolution", "agpeya-hail-to-you-mary", "agpeya-concluding-prayer"],
  nerses: ["i-confess-with-faith", "nerses-prayer-1", "nerses-prayer-13", "nerses-prayer-24"],
  malankara: ["malankara-trisagion", "malankara-morning-enyono", "malankara-bootho-mor-yaqub", "malankara-evening-incense", "malankara-intercession-theotokos", "malankara-bedtime-supplication", "ephrem-night-hymn"],
  wudase: ["wudase-maryam-monday"],
  years: ["god-grant-you-many-years"],
};

const topicById = new Map(Object.entries(topics).flatMap(([topic, ids]) =>
  ids.map(id => [id, topic as Topic] as const)
));
const additionsById = new Map(prayerAdditions.map(prayer => [prayer.id, prayer]));

export function getAddedPrayerExplanation(prayerId: string, translate: (text: string) => string) {
  const prayer = additionsById.get(prayerId);
  const topic = topicById.get(prayerId);
  if (!prayer || !topic) return [];
  return [
    translate(PRAYER_EXPLANATION_TOPICS[topic]),
    `${translate("Source and liturgical context:")} ${translate(prayer.title)}`,
  ];
}