"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useLanguageStore } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";

/**
 * Bilingual privacy policy content.
 *
 * Each section carries an English + Burmese title and a list of
 * English + Burmese paragraphs. The page renders whichever language is
 * active in the languageStore so we keep one source of truth here rather
 * than spreading long-form copy across the flat i18n JSON (which is meant
 * for short UI strings).
 */
type Section = {
  titleEn: string;
  titleMy: string;
  bodyEn: string[];
  bodyMy: string[];
};

const LAST_UPDATED_EN = "Last updated: 6 June 2026";
const LAST_UPDATED_MY = "နောက်ဆုံးပြင်ဆင်သည့်ရက်: ၂၀၂၆ ခုနှစ်၊ ဇွန်လ ၆ ရက်";

const INTRO_EN =
  "Mher Thar Ser (\u201cwe\u201d, \u201cus\u201d, or \u201cour\u201d) operates a restaurant discovery and table booking service for Myanmar restaurants in Bangkok. This Privacy Policy explains what information we collect, how we use it, and the choices you have. By using our website you agree to the practices described below.";
const INTRO_MY =
  "Mher Thar Ser (\u201cကျွန်ုပ်တို့\u201d) သည် ဘန်ကောက်ရှိ မြန်မာစားသောက်ဆိုင်များအတွက် ရှာဖွေရေးနှင့် စားပွဲကြိုတင်စာရင်းသွင်းရေး ဝန်ဆောင်မှုကို လုပ်ဆောင်ပါသည်။ ဤကိုယ်ရေးအချက်အလက် မူဝါဒတွင် ကျွန်ုပ်တို့ စုဆောင်းသော အချက်အလက်များ၊ ၎င်းတို့ကို မည်သို့အသုံးပြုသည်နှင့် သင့်တွင်ရှိသော ရွေးချယ်ခွင့်များကို ရှင်းပြထားပါသည်။ ကျွန်ုပ်တို့၏ ဝဘ်ဆိုဒ်ကို အသုံးပြုခြင်းဖြင့် အောက်ပါ လုပ်ဆောင်ချက်များကို သင်သဘောတူသည်ဟု မှတ်ယူပါမည်။";

const SECTIONS: Section[] = [
  {
    titleEn: "Information We Collect",
    titleMy: "ကျွန်ုပ်တို့ စုဆောင်းသော အချက်အလက်များ",
    bodyEn: [
      "Account information: when you sign up we collect your name, email address, and phone number.",
      "Booking information: details you provide when you reserve a table, such as date, time, party size, and any notes for the restaurant.",
      "Reviews and content: ratings, reviews, and photos you choose to submit.",
      "Location data: with your permission, your approximate location so we can show restaurants near you.",
      "Usage and device data: pages you view, search terms, browser type, and similar technical information collected automatically.",
    ],
    bodyMy: [
      "အကောင့်အချက်အလက်: စာရင်းသွင်းသည့်အခါ သင့်အမည်၊ အီးမေးလ်နှင့် ဖုန်းနံပါတ်ကို စုဆောင်းပါသည်။",
      "ကြိုတင်စာရင်းသွင်းမှု အချက်အလက်: စားပွဲ ကြိုတင်စာရင်းသွင်းသည့်အခါ ပေးသော ရက်စွဲ၊ အချိန်၊ လူဦးရေနှင့် ဆိုင်အတွက် မှတ်ချက်များ။",
      "သုံးသပ်ချက်နှင့် အကြောင်းအရာ: သင်တင်သွင်းသော အဆင့်သတ်မှတ်ချက်များ၊ သုံးသပ်ချက်များနှင့် ဓာတ်ပုံများ။",
      "တည်နေရာ အချက်အလက်: သင့်ခွင့်ပြုချက်ဖြင့် သင့်အနီးနားရှိ ဆိုင်များကို ပြသနိုင်ရန် သင့်ခန့်မှန်းတည်နေရာ။",
      "အသုံးပြုမှုနှင့် စက်ပစ္စည်း အချက်အလက်: ကြည့်ရှုသော စာမျက်နှာများ၊ ရှာဖွေသည့်စကားလုံးများ၊ ဘရောက်ဆာအမျိုးအစားနှင့် အလားတူ နည်းပညာဆိုင်ရာ အချက်အလက်များကို အလိုအလျောက် စုဆောင်းပါသည်။",
    ],
  },
  {
    titleEn: "How We Use Your Information",
    titleMy: "သင့်အချက်အလက်ကို မည်သို့အသုံးပြုသနည်း",
    bodyEn: [
      "Provide and operate the service, including processing your table bookings and sharing the necessary details with the restaurant.",
      "Personalise your experience, such as showing nearby restaurants and relevant promotions.",
      "Communicate with you about bookings, account activity, and service updates.",
      "Improve, maintain, and secure our website, and to detect and prevent fraud or abuse.",
    ],
    bodyMy: [
      "ဝန်ဆောင်မှုကို ပံ့ပိုးရန်နှင့် လည်ပတ်ရန် — သင့်စားပွဲကြိုတင်စာရင်းကို ဆောင်ရွက်ပေးခြင်းနှင့် လိုအပ်သော အချက်အလက်များကို ဆိုင်သို့ မျှဝေခြင်း အပါအဝင်။",
      "သင့်အတွေ့အကြုံကို ပုဂ္ဂိုလ်ရေးသီးသန့်ပြုလုပ်ရန် — အနီးနားရှိ ဆိုင်များနှင့် သက်ဆိုင်ရာ ပရိုမိုးရှင်းများ ပြသခြင်း။",
      "ကြိုတင်စာရင်းသွင်းမှု၊ အကောင့်လှုပ်ရှားမှုနှင့် ဝန်ဆောင်မှု အသိပေးချက်များအတွက် သင်နှင့် ဆက်သွယ်ရန်။",
      "ကျွန်ုပ်တို့၏ ဝဘ်ဆိုဒ်ကို တိုးတက်စေရန်၊ ထိန်းသိမ်းရန်နှင့် လုံခြုံစေရန်၊ လိမ်လည်မှု သို့မဟုတ် အလွဲသုံးမှုကို တွေ့ရှိ၍ ကာကွယ်ရန်။",
    ],
  },
  {
    titleEn: "Sharing Your Information",
    titleMy: "သင့်အချက်အလက်ကို မျှဝေခြင်း",
    bodyEn: [
      "Restaurants: when you make a booking we share the relevant booking details with that restaurant so they can prepare for your visit.",
      "Service providers: trusted vendors who help us host the site, send messages, and analyse usage on our behalf.",
      "Legal reasons: where required by law, regulation, or valid legal process.",
      "We do not sell your personal information.",
    ],
    bodyMy: [
      "စားသောက်ဆိုင်များ: ကြိုတင်စာရင်းသွင်းသည့်အခါ သက်ဆိုင်ရာ အချက်အလက်များကို ဆိုင်သို့ မျှဝေ၍ သင့်ရောက်ရှိမှုအတွက် ပြင်ဆင်နိုင်စေပါသည်။",
      "ဝန်ဆောင်မှုပေးသူများ: ဆိုဒ်ကို လည်ပတ်ရန်၊ မက်ဆေ့ချ်များ ပေးပို့ရန်နှင့် အသုံးပြုမှုကို သုံးသပ်ရန် ကူညီပေးသော ယုံကြည်စိတ်ချရသည့် မိတ်ဖက်များ။",
      "ဥပဒေအရ အကြောင်းရင်းများ: ဥပဒေ၊ စည်းမျဉ်း သို့မဟုတ် တရားဝင် ဥပဒေဆိုင်ရာ လုပ်ငန်းစဉ်အရ လိုအပ်သည့်အခါ။",
      "သင့်ကိုယ်ရေးအချက်အလက်ကို ကျွန်ုပ်တို့ ရောင်းချခြင်းမပြုပါ။",
    ],
  },
  {
    titleEn: "Cookies and Tracking",
    titleMy: "ကွတ်ကီးနှင့် ခြေရာခံခြင်း",
    bodyEn: [
      "We use cookies and similar technologies to keep you signed in, remember your language and theme preferences, and understand how the site is used. You can control cookies through your browser settings, though some features may not work without them.",
    ],
    bodyMy: [
      "သင့်ကို ဝင်ရောက်ထားမှု ဆက်လက်ထိန်းသိမ်းရန်၊ သင့်ဘာသာစကားနှင့် အပြင်အဆင် ရွေးချယ်မှုများကို မှတ်သားရန်နှင့် ဆိုဒ်ကို မည်သို့အသုံးပြုသည်ကို နားလည်ရန် ကွတ်ကီးနှင့် အလားတူ နည်းပညာများကို အသုံးပြုပါသည်။ ကွတ်ကီးများကို ဘရောက်ဆာ ဆက်တင်များမှ ထိန်းချုပ်နိုင်သော်လည်း အချို့လုပ်ဆောင်ချက်များ အလုပ်မလုပ်နိုင်ပါ။",
    ],
  },
  {
    titleEn: "Data Retention and Security",
    titleMy: "အချက်အလက် သိမ်းဆည်းခြင်းနှင့် လုံခြုံရေး",
    bodyEn: [
      "We keep your information for as long as your account is active or as needed to provide the service and meet legal obligations. We use reasonable technical and organisational measures to protect your data, but no method of transmission or storage is completely secure.",
    ],
    bodyMy: [
      "သင့်အကောင့် အသက်ဝင်နေသမျှ သို့မဟုတ် ဝန်ဆောင်မှုပေးရန်နှင့် ဥပဒေဆိုင်ရာ တာဝန်များ ဖြည့်ဆည်းရန် လိုအပ်သမျှ သင့်အချက်အလက်ကို သိမ်းဆည်းထားပါသည်။ သင့်အချက်အလက်ကို ကာကွယ်ရန် သင့်လျော်သော နည်းပညာနှင့် စီမံခန့်ခွဲမှု အစီအမံများ အသုံးပြုသော်လည်း မည်သည့် ပေးပို့မှု သို့မဟုတ် သိမ်းဆည်းမှုနည်းလမ်းမျှ လုံးဝလုံခြုံသည် မဟုတ်ပါ။",
    ],
  },
  {
    titleEn: "Your Rights and Choices",
    titleMy: "သင့်အခွင့်အရေးနှင့် ရွေးချယ်မှုများ",
    bodyEn: [
      "You can access, update, or delete your account information at any time from your profile. You may also opt out of non-essential communications. To request deletion of your data or to exercise other privacy rights, contact us using the details below.",
    ],
    bodyMy: [
      "သင့်ပရိုဖိုင်မှ သင့်အကောင့်အချက်အလက်ကို အချိန်မရွေး ကြည့်ရှု၊ ပြင်ဆင် သို့မဟုတ် ဖျက်နိုင်ပါသည်။ မရှိမဖြစ်မဟုတ်သော ဆက်သွယ်မှုများကိုလည်း ပယ်ဖျက်နိုင်ပါသည်။ သင့်အချက်အလက်ဖျက်ရန် သို့မဟုတ် အခြားကိုယ်ရေးအခွင့်အရေးများ ကျင့်သုံးရန် အောက်ပါအချက်အလက်များဖြင့် ဆက်သွယ်ပါ။",
    ],
  },
  {
    titleEn: "Children\u2019s Privacy",
    titleMy: "ကလေးများ၏ ကိုယ်ရေးအချက်အလက်",
    bodyEn: [
      "Our service is not directed to children under 13, and we do not knowingly collect personal information from them. If you believe a child has provided us with personal data, please contact us so we can remove it.",
    ],
    bodyMy: [
      "ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုသည် အသက် ၁၃ နှစ်အောက် ကလေးများအတွက် မဟုတ်ပါ။ ၎င်းတို့ထံမှ ကိုယ်ရေးအချက်အလက်ကို သိလျက်နှင့် မစုဆောင်းပါ။ ကလေးတစ်ဦးက အချက်အလက်ပေးထားသည်ဟု ယူဆပါက ဖယ်ရှားနိုင်ရန် ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ။",
    ],
  },
  {
    titleEn: "Changes to This Policy",
    titleMy: "ဤမူဝါဒ၏ ပြောင်းလဲမှုများ",
    bodyEn: [
      "We may update this Privacy Policy from time to time. When we do, we will revise the \u201cLast updated\u201d date above and, where appropriate, notify you through the service.",
    ],
    bodyMy: [
      "ဤကိုယ်ရေးအချက်အလက် မူဝါဒကို အခါအားလျော်စွာ မွမ်းမံနိုင်ပါသည်။ ထိုသို့ပြုလုပ်သည့်အခါ အထက်ပါ \u201cနောက်ဆုံးပြင်ဆင်သည့်ရက်\u201d ကို ပြင်ဆင်မည်ဖြစ်ပြီး သင့်လျော်သည့်အခါ ဝန်ဆောင်မှုမှတဆင့် အသိပေးပါမည်။",
    ],
  },
  {
    titleEn: "Contact Us",
    titleMy: "ဆက်သွယ်ရန်",
    bodyEn: [
      "If you have questions about this Privacy Policy or how we handle your information, contact us at admin@mhertharser.com.",
    ],
    bodyMy: [
      "ဤကိုယ်ရေးအချက်အလက် မူဝါဒ သို့မဟုတ် သင့်အချက်အလက်ကို ကျွန်ုပ်တို့ မည်သို့ကိုင်တွယ်သည်နှင့်ပတ်သက်၍ မေးခွန်းရှိပါက admin@mhertharser.com သို့ ဆက်သွယ်ပါ။",
    ],
  },
];

export function PrivacyPolicyClient() {
  const lang = useLanguageStore((s) => s.lang);
  const isMy = lang === "my";

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 md:px-8 md:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        <span className={isMy ? "my" : undefined}>{t(lang, "home")}</span>
      </Link>

      <h1
        className={cnTitle(isMy)}
      >
        {t(lang, "privacyPolicy")}
      </h1>
      <p className={`text-sm text-text-muted mb-10 ${isMy ? "my" : ""}`}>
        {isMy ? LAST_UPDATED_MY : LAST_UPDATED_EN}
      </p>

      <p className={`text-base text-text-secondary leading-relaxed mb-10 ${isMy ? "my" : ""}`}>
        {isMy ? INTRO_MY : INTRO_EN}
      </p>

      <div className="flex flex-col gap-10">
        {SECTIONS.map((section, i) => {
          const body = isMy ? section.bodyMy : section.bodyEn;
          return (
            <section key={i}>
              <h2
                className={`text-lg font-semibold text-text-primary mb-3 ${isMy ? "my" : ""}`}
              >
                {isMy ? section.titleMy : section.titleEn}
              </h2>
              {body.length > 1 ? (
                <ul className="flex flex-col gap-2 list-disc pl-5">
                  {body.map((line, j) => (
                    <li
                      key={j}
                      className={`text-base text-text-secondary leading-relaxed ${isMy ? "my" : ""}`}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className={`text-base text-text-secondary leading-relaxed ${isMy ? "my" : ""}`}
                >
                  {body[0]}
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function cnTitle(isMy: boolean): string {
  return `text-2xl md:text-3xl font-bold text-text-primary mb-2 ${isMy ? "my" : ""}`;
}
