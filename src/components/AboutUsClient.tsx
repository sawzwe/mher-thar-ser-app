"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BowlFood,
  Storefront,
} from "@phosphor-icons/react";
import { useLanguageStore } from "@/stores/languageStore";
import { t } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

/**
 * Bilingual "About Us" page for Mher Thar Ser.
 *
 * Long-form copy lives here (not in the flat i18n JSON, which is for short UI
 * strings) as paired English/Burmese fields. Whichever language is active in
 * the languageStore is rendered, and every Burmese text node carries the `.my`
 * class so it picks up the Myanmar font + line-height tokens from globals.css.
 */

type Bilingual = { en: string; my: string };

type Milestone = {
  dateEn: string;
  dateMy: string;
  titleEn: string;
  titleMy: string;
  bodyEn: string;
  bodyMy: string;
  isNow?: boolean;
};

type Member = {
  initials: string;
  name: string;
  roleEn: string;
  roleMy: string;
  /** Alternate the avatar accent between brand and ink for visual rhythm. */
  ink?: boolean;
};

const HERO_BADGE: Bilingual = {
  en: "Founded February 2026 · Bangkok, Thailand",
  my: "၂၀၂၆ ခုနှစ်၊ ဖေဖော်ဝါရီလတွင် တည်ထောင် · ဘန်ကောက်၊ ထိုင်းနိုင်ငံ",
};
const HERO_TITLE: Bilingual = {
  en: "We Built This Because We Missed Home.",
  my: "ကိုယ့်အိမ်ကို လွမ်းလို့ ဒါကို တည်ဆောက်ခဲ့တာပါ။",
};
const HERO_SUB: Bilingual = {
  en: "A Myanmar restaurant directory built by Myanmar people — for every Myanmar person in Thailand who has ever searched for a taste of home and come up empty.",
  my: "မြန်မာလူမျိုးတွေ ကိုယ်တိုင်တည်ဆောက်ထားတဲ့ မြန်မာစားသောက်ဆိုင် လမ်းညွှန်တစ်ခုပါ — ထိုင်းနိုင်ငံမှာ ကိုယ့်အိမ်အရသာကို ရှာဖွေပြီး ရှာမတွေ့ဖူးတဲ့ မြန်မာတိုင်းအတွက် ဖန်တီးထားပါတယ်။",
};

const STORY_EYEBROW: Bilingual = { en: "Our Story", my: "ကျွန်ုပ်တို့၏ ဇာတ်လမ်း" };
const STORY_HEADING: Bilingual = {
  en: "Four years in Thailand. One craving that changed everything.",
  my: "ထိုင်းနိုင်ငံမှာ လေးနှစ်။ အရာအားလုံးကို ပြောင်းလဲစေတဲ့ တမ်းတမှုတစ်ခု။",
};
const STORY_PARAS: Bilingual[] = [
  {
    en: "Ye Man Pyae had been living in Thailand for over four years. The life, the energy, the city — he loved it. But some evenings, all he wanted was a bowl of Mohinga. A taste of home.",
    my: "ရဲမန်းပြည့် ထိုင်းနိုင်ငံမှာ လေးနှစ်ကျော် နေထိုင်ခဲ့ပါတယ်။ ဘဝ၊ အရှိန်အဟုန်နဲ့ မြို့ကြီးကို သူနှစ်သက်ခဲ့ပါတယ်။ ဒါပေမဲ့ ညနေခင်းတချို့မှာ သူလိုချင်တာက မုန့်ဟင်းခါးတစ်ပွဲပဲ။ ကိုယ့်အိမ်အရသာ။",
  },
  {
    en: "He'd open Grab or Lineman — and scroll through pages of Thai food with barely a Myanmar restaurant in sight. He'd try Facebook — and find scattered posts, broken links, no menus, no prices. Just frustration where there should have been comfort.",
    my: "Grab ဒါမှမဟုတ် Lineman ကိုဖွင့်ရင် ထိုင်းအစားအစာစာမျက်နှာတွေချည်း တွေ့ရပြီး မြန်မာဆိုင်ဆိုလို့ မရှိသလောက်ပဲ။ Facebook မှာ ရှာရင်လည်း ပြန့်ကျဲနေတဲ့ ပို့စ်တွေ၊ ပျက်နေတဲ့ လင့်ခ်တွေ၊ မီနူးမရှိ၊ ဈေးနှုန်းမရှိ။ စိတ်သက်သာရာ ရသင့်တဲ့နေရာမှာ စိတ်ပျက်စရာတွေချည်းပါ။",
  },
];
const STORY_TURN: Bilingual = {
  en: "So in February 2026, Ye and his team asked a simple question: what do Myanmar people in Thailand actually need? They surveyed the community. They listened. And then they built.",
  my: "ဒါနဲ့ ၂၀၂၆ ဖေဖော်ဝါရီမှာ ရဲနဲ့ သူ့အဖွဲ့က ရိုးရှင်းတဲ့ မေးခွန်းတစ်ခုကို မေးခဲ့ပါတယ် — ထိုင်းနိုင်ငံက မြန်မာတွေ တကယ်လိုအပ်တာ ဘာလဲ? သူတို့ ပြည်သူ့အသိုက်အဝန်းကို စစ်တမ်းကောက်ခဲ့တယ်။ နားထောင်ခဲ့တယ်။ ပြီးတော့ တည်ဆောက်ခဲ့ပါတယ်။",
};
const STORY_PULL: Bilingual = {
  en: "Mher Thar Ser — \u201ceat delicious food\u201d — was born from that longing. And we built it for every Myanmar person who has ever felt it too.",
  my: "မြသာစေး — \u201cအရသာရှိရှိ စားပါ\u201d — ဆိုတဲ့ နာမည်က အဲဒီတမ်းတမှုကနေ မွေးဖွားလာခဲ့တာပါ။ ဒီလိုခံစားဖူးတဲ့ မြန်မာတိုင်းအတွက် ကျွန်ုပ်တို့ တည်ဆောက်ခဲ့ပါတယ်။",
};

const MISSION_EYEBROW: Bilingual = { en: "Our Mission", my: "ကျွန်ုပ်တို့၏ ရည်မှန်းချက်" };
const MISSION_HEADING: Bilingual = {
  en: "We serve two communities. With the same love.",
  my: "ကျွန်ုပ်တို့ အသိုက်အဝန်းနှစ်ခုကို ဝန်ဆောင်မှုပေးပါတယ်။ တူညီတဲ့ ချစ်ခြင်းမေတ္တာနဲ့။",
};
const MISSION_USERS_TITLE: Bilingual = {
  en: "For Myanmar People in Thailand",
  my: "ထိုင်းနိုင်ငံက မြန်မာလူမျိုးများအတွက်",
};
const MISSION_USERS_BODY: Bilingual = {
  en: "Whether you're craving Shan noodles or Sanwin Makin — find it in seconds, with full menus and real prices. No more guessing. No more empty searches.",
  my: "ရှမ်းခေါက်ဆွဲ ဖြစ်ဖြစ်၊ ဆနွင်းမကင်း ဖြစ်ဖြစ် တမ်းတနေတယ်ဆိုရင် — မီနူးအပြည့်အစုံ၊ ဈေးနှုန်းအမှန်နဲ့ စက္ကန့်ပိုင်းအတွင်း ရှာတွေ့နိုင်ပါတယ်။ မှန်းဆဖို့ မလိုတော့ဘူး။ ရှာမတွေ့တာ မရှိတော့ဘူး။",
};
const MISSION_OWNERS_TITLE: Bilingual = {
  en: "For Myanmar Restaurant Owners",
  my: "မြန်မာစားသောက်ဆိုင် ပိုင်ရှင်များအတွက်",
};
const MISSION_OWNERS_BODY: Bilingual = {
  en: "You pour your heart into every dish. We handle your online presence — listings, menus, prices — so you can focus on the one thing that matters: the food.",
  my: "ဟင်းတစ်ခွက်ချင်းစီမှာ သင့်စိတ်ရင်းကို သွန်းလောင်းထားပါတယ်။ သင့်အွန်လိုင်းရှိနေမှု — စာရင်းသွင်းခြင်း၊ မီနူး၊ ဈေးနှုန်းတွေ — ကို ကျွန်ုပ်တို့ တာဝန်ယူပေးမယ်။ ဒါမှ သင်က အရေးကြီးဆုံးအရာ — အစားအစာ — ပေါ်မှာပဲ အာရုံစိုက်နိုင်မှာပါ။",
};

const MILESTONES_EYEBROW: Bilingual = { en: "Milestones", my: "မှတ်တိုင်များ" };
const MILESTONES_HEADING: Bilingual = {
  en: "From an idea to 82 restaurants — in just a few months.",
  my: "စိတ်ကူးတစ်ခုကနေ ဆိုင် ၈၂ ဆိုင်အထိ — လအနည်းငယ်အတွင်းမှာပဲ။",
};
const MILESTONES: Milestone[] = [
  {
    dateEn: "FEBRUARY 2026",
    dateMy: "၂၀၂၆ ဖေဖော်ဝါရီ",
    titleEn: "Mher Thar Ser is founded",
    titleMy: "မြသာစေး တည်ထောင်ခြင်း",
    bodyEn: "On February 12, we launched a community survey to understand what Myanmar people in Thailand truly needed from a platform like ours.",
    bodyMy: "ဖေဖော်ဝါရီ ၁၂ ရက်နေ့မှာ ထိုင်းနိုင်ငံက မြန်မာတွေ ကျွန်ုပ်တို့လို ပလက်ဖောင်းတစ်ခုဆီက တကယ်လိုအပ်တာကို နားလည်ဖို့ ပြည်သူ့အသိုက်အဝန်း စစ်တမ်းတစ်ခု စတင်ခဲ့ပါတယ်။",
  },
  {
    dateEn: "MARCH 2026",
    dateMy: "၂၀၂၆ မတ်လ",
    titleEn: "First website goes live. Team expands.",
    titleMy: "ပထမဆုံး ဝဘ်ဆိုဒ် စတင်လည်ပတ်။ အဖွဲ့ ချဲ့ထွင်ခြင်း။",
    bodyEn: "Our first functioning website launched — the most organized Myanmar restaurant directory in Thailand. We grew the team to accelerate development and restaurant partnerships.",
    bodyMy: "ကျွန်ုပ်တို့၏ ပထမဆုံး အလုပ်လုပ်တဲ့ ဝဘ်ဆိုဒ် စတင်ခဲ့ပါတယ် — ထိုင်းနိုင်ငံမှာ အစီအစဉ်အကျနဆုံး မြန်မာစားသောက်ဆိုင် လမ်းညွှန်ပါ။ ဖွံ့ဖြိုးမှုနဲ့ ဆိုင်များနှင့် ပူးပေါင်းဆောင်ရွက်မှုကို အရှိန်မြှင့်ဖို့ အဖွဲ့ကို တိုးချဲ့ခဲ့ပါတယ်။",
  },
  {
    dateEn: "MAY 2026",
    dateMy: "၂၀၂၆ မေလ",
    titleEn: "788 users in a single month",
    titleMy: "တစ်လတည်းမှာ အသုံးပြုသူ ၇၈၈ ဦး",
    bodyEn: "The community found us — and kept coming back. 788 online users visited Mher Thar Ser in May alone.",
    bodyMy: "ပြည်သူ့အသိုက်အဝန်းက ကျွန်ုပ်တို့ကို ရှာတွေ့ခဲ့ပြီး — ထပ်ခါထပ်ခါ ပြန်လာခဲ့ပါတယ်။ မေလတစ်လတည်းမှာ အွန်လိုင်းအသုံးပြုသူ ၇၈၈ ဦး မြသာစေးကို လာရောက်ခဲ့ပါတယ်။",
  },
  {
    dateEn: "TODAY · JUNE 2026",
    dateMy: "ယနေ့ · ၂၀၂၆ ဇွန်လ",
    titleEn: "82 restaurants — and growing every week",
    titleMy: "ဆိုင် ၈၂ ဆိုင် — အပတ်တိုင်း တိုးတက်နေဆဲ",
    bodyEn: "82 Myanmar restaurants are now listed on Mher Thar Ser with full menus and real prices. We're just getting started.",
    bodyMy: "မြန်မာစားသောက်ဆိုင် ၈၂ ဆိုင်ကို မီနူးအပြည့်အစုံနဲ့ ဈေးနှုန်းအမှန်တွေနဲ့အတူ မြသာစေးမှာ ယခု စာရင်းသွင်းထားပါပြီ။ ကျွန်ုပ်တို့ အခုမှ စတင်နေတုန်းပါ။",
    isNow: true,
  },
];

const STATS: { value: string; labelEn: string; labelMy: string }[] = [
  { value: "82", labelEn: "Restaurants listed", labelMy: "စာရင်းသွင်းထားသော ဆိုင်များ" },
  { value: "788", labelEn: "Users in May 2026", labelMy: "၂၀၂၆ မေလ အသုံးပြုသူများ" },
  { value: "4mo", labelEn: "Since founding", labelMy: "တည်ထောင်ပြီးနောက်" },
];

const TEAM_EYEBROW: Bilingual = { en: "The Team", my: "အဖွဲ့သား များ" };
const TEAM_HEADING: Bilingual = { en: "Small team. Big mission.", my: "အဖွဲ့သေး သေး။ ရည်မှန်းချက် ကြီးကြီး။" };
const TEAM_SUB: Bilingual = {
  en: "Every one of us has felt the longing that comes with being far from home. That's exactly why we built this.",
  my: "ကျွန်ုပ်တို့ တစ်ဦးချင်းစီဟာ အိမ်နဲ့ဝေးနေရတဲ့ တမ်းတမှုကို ခံစားဖူးကြပါတယ်။ ဒါကြောင့်ပဲ ဒါကို တည်ဆောက်ခဲ့တာပါ။",
};
const MEMBERS: Member[] = [
  { initials: "YMP", name: "Ye Man Pyae", roleEn: "Founder", roleMy: "တည်ထောင်သူ" },
  { initials: "PPM", name: "Pyae Paing Myo", roleEn: "Head of Marketing", roleMy: "စျေးကွက်ရှာဖွေရေး အကြီးအကဲ", ink: true },
  { initials: "STP", name: "Sai Thet Paing Phyo", roleEn: "Restaurant Relations", roleMy: "ဆိုင်ဆက်ဆံရေး မန်နေဂျာ" },
  { initials: "SZW", name: "Saw Zwe Wai Yan", roleEn: "CTO", roleMy: "နည်းပညာချုပ်", ink: true },
  { initials: "SA", name: "Samuel", roleEn: "Social Media", roleMy: "ဆိုရှယ်မီဒီယာ မန်နေဂျာ" },
  { initials: "NI", name: "Niko", roleEn: "Graphic Designer", roleMy: "ဂရပ်ဖစ် ဒီဇိုင်နာ", ink: true },
  { initials: "GUA", name: "Guarvino Assion", roleEn: "Restaurant Finder", roleMy: "ဆိုင်ရှာဖွေသူ" },
];

const CTA_HEADING: Bilingual = {
  en: "Ready to find your Myanmar food?",
  my: "သင့်မြန်မာအစားအစာကို ရှာတော့မလား?",
};
const CTA_SUB: Bilingual = {
  en: "82 restaurants. Full menus. Real prices. All in one place — in Burmese.",
  my: "ဆိုင် ၈၂ ဆိုင်။ မီနူးအပြည့်အစုံ။ ဈေးနှုန်းအမှန်။ အားလုံး တစ်နေရာတည်းမှာ — မြန်မာဘာသာဖြင့်။",
};
const CTA_PRIMARY: Bilingual = { en: "Explore Restaurants", my: "ဆိုင်များ ရှာဖွေရန်" };
const CTA_SECONDARY: Bilingual = { en: "List Your Restaurant", my: "သင့်ဆိုင်ကို စာရင်းသွင်းရန်" };

export function AboutUsClient() {
  const lang = useLanguageStore((s) => s.lang);
  const isMy = lang === "my";
  const my = (extra?: string) => cn(extra, isMy && "my");

  return (
    <div className="overflow-hidden">
      {/* Back link */}
      <div className="max-w-3xl mx-auto px-6 pt-8 md:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span className={isMy ? "my" : undefined}>{t(lang, "home")}</span>
        </Link>
      </div>

      {/* HERO */}
      <section className="bg-brand text-center px-6 py-14 md:py-16 mt-6">
        <p className={my("text-xs font-semibold tracking-[0.14em] uppercase text-white/70 mb-5")}>
          {HERO_BADGE[lang]}
        </p>
        <h1 className={my("text-3xl md:text-4xl font-bold text-white leading-tight max-w-xl mx-auto mb-5")}>
          {HERO_TITLE[lang]}
        </h1>
        <p className={my("text-base text-white/90 max-w-lg mx-auto leading-relaxed")}>
          {HERO_SUB[lang]}
        </p>
        <div className="mt-8 w-16 h-[3px] bg-white/35 mx-auto rounded-full" />
      </section>

      {/* STORY */}
      <section className="bg-card px-6 py-14 md:px-8">
        <div className="max-w-2xl mx-auto">
          <p className={my("text-xs font-bold tracking-[0.14em] uppercase text-brand mb-3")}>
            {STORY_EYEBROW[lang]}
          </p>
          <h2 className={my("text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-6")}>
            {STORY_HEADING[lang]}
          </h2>
          {STORY_PARAS.map((p, i) => (
            <p key={i} className={my("text-base text-text-secondary leading-relaxed mb-4")}>
              {p[lang]}
            </p>
          ))}
          <p className={my("text-base text-text-secondary leading-relaxed mb-4")}>
            {STORY_TURN[lang]}
          </p>
          <p className={my("text-base font-semibold text-text-primary leading-relaxed border-l-[3px] border-brand pl-4 mt-6")}>
            {STORY_PULL[lang]}
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-surface px-6 py-14 md:px-8">
        <div className="max-w-2xl mx-auto">
          <p className={my("text-xs font-bold tracking-[0.14em] uppercase text-brand mb-3 text-center")}>
            {MISSION_EYEBROW[lang]}
          </p>
          <h2 className={my("text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-8 text-center")}>
            {MISSION_HEADING[lang]}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-[var(--radius-lg)] p-6 border-l-4 border-brand">
              <BowlFood size={24} className="text-brand mb-3" />
              <h3 className={my("font-bold text-base text-text-primary mb-2 leading-snug")}>
                {MISSION_USERS_TITLE[lang]}
              </h3>
              <p className={my("text-sm text-text-secondary leading-relaxed")}>
                {MISSION_USERS_BODY[lang]}
              </p>
            </div>
            <div className="bg-brand rounded-[var(--radius-lg)] p-6">
              <Storefront size={24} className="text-white mb-3" />
              <h3 className={my("font-bold text-base text-white mb-2 leading-snug")}>
                {MISSION_OWNERS_TITLE[lang]}
              </h3>
              <p className={my("text-sm text-white/90 leading-relaxed")}>
                {MISSION_OWNERS_BODY[lang]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MILESTONES */}
      <section className="bg-[#1a1a1a] px-6 py-14 md:px-8">
        <div className="max-w-2xl mx-auto">
          <p className={my("text-xs font-bold tracking-[0.14em] uppercase text-brand mb-3")}>
            {MILESTONES_EYEBROW[lang]}
          </p>
          <h2 className={my("text-2xl md:text-3xl font-bold text-white leading-snug mb-9")}>
            {MILESTONES_HEADING[lang]}
          </h2>

          <ol className="flex flex-col">
            {MILESTONES.map((m, i) => {
              const last = i === MILESTONES.length - 1;
              return (
                <li key={i} className={cn("flex gap-5", !last && "pb-8")}>
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className={cn(
                        "rounded-full shrink-0",
                        m.isNow
                          ? "w-4 h-4 bg-white border-[3px] border-brand mt-0.5"
                          : "w-3.5 h-3.5 bg-brand mt-1",
                      )}
                    />
                    {!last && <span className="flex-1 w-0.5 bg-brand/30 mt-1.5" />}
                  </div>
                  <div className={cn(!last && "pb-1")}>
                    <p className={my("text-xs font-bold text-brand tracking-wide mb-1")}>
                      {isMy ? m.dateMy : m.dateEn}
                    </p>
                    <p className={my("text-base font-bold text-white mb-1.5")}>
                      {isMy ? m.titleMy : m.titleEn}
                    </p>
                    <p className={my("text-sm text-white/60 leading-relaxed")}>
                      {isMy ? m.bodyMy : m.bodyEn}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10 border-t border-white/10 pt-8">
            {STATS.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "text-center",
                  i === 1 && "border-x border-white/10",
                )}
              >
                <div className="text-3xl font-bold text-brand leading-none">{s.value}</div>
                <div className={my("text-xs text-white/55 mt-1.5")}>
                  {isMy ? s.labelMy : s.labelEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="bg-card px-6 py-14 md:px-8">
        <div className="max-w-2xl mx-auto">
          <p className={my("text-xs font-bold tracking-[0.14em] uppercase text-brand mb-3 text-center")}>
            {TEAM_EYEBROW[lang]}
          </p>
          <h2 className={my("text-2xl md:text-3xl font-bold text-text-primary leading-snug mb-2 text-center")}>
            {TEAM_HEADING[lang]}
          </h2>
          <p className={my("text-center text-text-muted text-sm leading-relaxed mb-9 max-w-md mx-auto")}>
            {TEAM_SUB[lang]}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MEMBERS.map((m) => (
              <div
                key={m.initials}
                className="bg-surface rounded-[var(--radius-lg)] p-5 text-center border border-border"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold text-sm",
                    m.ink ? "bg-[#1a1a1a]" : "bg-brand",
                  )}
                >
                  {m.initials}
                </div>
                <div className="font-bold text-sm text-text-primary mb-1 leading-snug">
                  {m.name}
                </div>
                <div className={my("text-xs text-brand font-bold uppercase tracking-wide")}>
                  {isMy ? m.roleMy : m.roleEn}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand text-center px-6 py-12">
        <h2 className={my("text-2xl md:text-3xl font-bold text-white mb-3 leading-tight")}>
          {CTA_HEADING[lang]}
        </h2>
        <p className={my("text-white/85 text-base mb-8 leading-relaxed max-w-md mx-auto")}>
          {CTA_SUB[lang]}
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/restaurants"
            className={my(
              "inline-flex items-center gap-2 bg-white text-brand font-bold text-sm px-7 py-3 rounded-[10px] hover:bg-white/90 transition-colors",
            )}
          >
            {CTA_PRIMARY[lang]}
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/claim"
            className={my(
              "inline-flex items-center bg-transparent text-white font-semibold text-sm px-7 py-3 rounded-[10px] border-[1.5px] border-white/45 hover:bg-white/10 transition-colors",
            )}
          >
            {CTA_SECONDARY[lang]}
          </Link>
        </div>
      </section>
    </div>
  );
}
