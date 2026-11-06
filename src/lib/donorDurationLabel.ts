import type { LanguageCode } from "./i18n/translations";
import { donorDuration } from "./donorDuration";

// Whole-sentence templates keep donation tenure natural in each app language.
const labels: Record<LanguageCode, { recent: string; month: string[]; year: string[] }> = {
  en: { recent: "Faithful donator for less than a month", month: ["Faithful donator for a month", "Faithful donator for {n} months"], year: ["Faithful donator for a year", "Faithful donator for {n} years"] },
  fr: { recent: "Donateur fidèle depuis moins d’un mois", month: ["Donateur fidèle depuis {n} mois"], year: ["Donateur fidèle depuis {n} an", "Donateur fidèle depuis {n} ans"] },
  el: { recent: "Πιστός δωρητής για λιγότερο από έναν μήνα", month: ["Πιστός δωρητής εδώ και {n} μήνα", "Πιστός δωρητής εδώ και {n} μήνες"], year: ["Πιστός δωρητής εδώ και {n} χρόνο", "Πιστός δωρητής εδώ και {n} χρόνια"] },
  es: { recent: "Donante fiel desde hace menos de un mes", month: ["Donante fiel desde hace {n} mes", "Donante fiel desde hace {n} meses"], year: ["Donante fiel desde hace {n} año", "Donante fiel desde hace {n} años"] },
  pt: { recent: "Doador fiel há menos de um mês", month: ["Doador fiel há {n} mês", "Doador fiel há {n} meses"], year: ["Doador fiel há {n} ano", "Doador fiel há {n} anos"] },
  ro: { recent: "Donator fidel de mai puțin de o lună", month: ["Donator fidel de {n} lună", "Donator fidel de {n} luni"], year: ["Donator fidel de {n} an", "Donator fidel de {n} ani"] },
  bg: { recent: "Верен дарител от по-малко от месец", month: ["Верен дарител от {n} месец", "Верен дарител от {n} месеца"], year: ["Верен дарител от {n} година", "Верен дарител от {n} години"] },
  ru: { recent: "Верный жертвователь менее месяца", month: ["Верный жертвователь уже {n} месяц", "Верный жертвователь уже {n} месяца", "Верный жертвователь уже {n} месяцев"], year: ["Верный жертвователь уже {n} год", "Верный жертвователь уже {n} года", "Верный жертвователь уже {n} лет"] },
  uk: { recent: "Вірний жертводавець менше місяця", month: ["Вірний жертводавець уже {n} місяць", "Вірний жертводавець уже {n} місяці", "Вірний жертводавець уже {n} місяців"], year: ["Вірний жертводавець уже {n} рік", "Вірний жертводавець уже {n} роки", "Вірний жертводавець уже {n} років"] },
  sr: { recent: "Верни дародавац мање од месец дана", month: ["Верни дародавац већ {n} месец", "Верни дародавац већ {n} месеца", "Верни дародавац већ {n} месеци"], year: ["Верни дародавац већ {n} годину", "Верни дародавац већ {n} године", "Верни дародавац већ {n} година"] },
  ar: { recent: "متبرع وفيّ منذ أقل من شهر", month: ["متبرع وفيّ منذ شهر واحد", "متبرع وفيّ منذ {n} شهرًا", "متبرع وفيّ منذ شهرين", "متبرع وفيّ منذ {n} أشهر"], year: ["متبرع وفيّ منذ سنة واحدة", "متبرع وفيّ منذ {n} سنة", "متبرع وفيّ منذ سنتين", "متبرع وفيّ منذ {n} سنوات"] },
  he: { recent: "תורם נאמן פחות מחודש", month: ["תורם נאמן במשך חודש אחד", "תורם נאמן במשך {n} חודשים"], year: ["תורם נאמן במשך שנה אחת", "תורם נאמן במשך {n} שנים"] },
  hy: { recent: "Հավատարիմ նվիրատու՝ մեկ ամսից պակաս", month: ["Հավատարիմ նվիրատու՝ {n} ամիս"], year: ["Հավատարիմ նվիրատու՝ {n} տարի"] },
  ka: { recent: "ერთგული შემომწირველი ერთ თვეზე ნაკლები ხნის განმავლობაში", month: ["ერთგული შემომწირველი უკვე {n} თვეა"], year: ["ერთგული შემომწირველი უკვე {n} წელია"] },
  ml: { recent: "ഒരു മാസത്തിൽ താഴെയായി വിശ്വസ്ത സംഭാവനദാതാവ്", month: ["{n} മാസമായി വിശ്വസ്ത സംഭാവനദാതാവ്"], year: ["{n} വർഷമായി വിശ്വസ്ത സംഭാവനദാതാവ്"] },
  am: { recent: "ከአንድ ወር በታች ታማኝ ለጋሽ", month: ["ለ{n} ወር ታማኝ ለጋሽ"], year: ["ለ{n} ዓመት ታማኝ ለጋሽ"] },
  ti: { recent: "ንትሕቲ ሓደ ወርሒ እሙን ለጋሲ", month: ["ን{n} ወርሒ እሙን ለጋሲ"], year: ["ን{n} ዓመት እሙን ለጋሲ"] },
};

export function donorDurationLabel(donationCount: number | null | undefined, language: LanguageCode) {
  const duration = donorDuration(donationCount);
  if (!duration) return null;
  const translated = labels[language];
  if (duration.count === 0) return translated.recent;
  const forms = translated[duration.unit];
  const category = new Intl.PluralRules(language).select(duration.count);
  const index = language === "ar"
    ? category === "one" ? 0 : category === "two" ? 2 : category === "few" ? 3 : 1
    : category === "one" ? 0 : category === "few" && forms.length === 3 ? 1 : forms.length - 1;
  return (forms[index] ?? forms[0]).replace("{n}", new Intl.NumberFormat(language).format(duration.count));
}