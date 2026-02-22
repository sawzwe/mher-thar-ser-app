import { NextRequest, NextResponse } from "next/server";
import { restaurants } from "@/data/seed";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const restaurantContext = restaurants.map((r) => ({
  id: r.id,
  name: r.name,
  area: r.area,
  cuisine: r.cuisineTags.join(", "),
  price: "฿".repeat(r.priceTier),
  rating: r.rating,
  reviewCount: r.reviewCount,
  deals: r.deals.length,
  description: r.description,
  transit: r.transitNearby.map((t) => `${t.type} ${t.name} (${t.walkingMinutes}min)`).join(", "),
}));

const SYSTEM_PROMPT = `You are a warm, knowledgeable Bangkok food advisor for the Hmar Thar Sar restaurant booking app. Your job is to help users figure out where to eat based on their situation, mood, budget, or occasion.

You have access to these Bangkok restaurants:
${JSON.stringify(restaurantContext, null, 2)}

Guidelines:
- Be conversational, warm, and a little fun — not robotic
- Ask 1-2 clarifying questions if needed (party size, budget, area, occasion)
- When making recommendations, respond with a JSON block at the END of your message in this EXACT format on its own line:
  RECS:[{"id":"r1","reason":"Perfect for a romantic dinner...","highlight":"Book the corner table"}]
  
  Include 2-4 restaurants max. Use the exact restaurant IDs from the list above.
- If the user writes in Burmese (Myanmar), respond in Burmese too
- Keep text replies SHORT (2-4 sentences before recommendations) — let the restaurant cards do the heavy lifting
- Always sound like a local friend who knows Bangkok well
- If they mention Valentine's/date night → prioritize romantic places
- If budget is mentioned → respect it strictly
- If area is mentioned → prioritize nearby places with transit info
- After giving recommendations, suggest 2-3 natural follow-up questions the user might ask`;

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

/** Demo fallback when API fails or quota exceeded. Returns text + RECS line. */
function getDemoResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const rec = (id: string, reason: string, highlight?: string) =>
    `{"id":"${id}","reason":"${reason}"${highlight ? `,"highlight":"${highlight}"` : ""}}`;

  // Valentine / date / romantic
  if (/valentine|date night|romantic|partner|anniversary/.test(lower)) {
    const r2 = restaurants.find((r) => r.id === "r2")!;
    const r3 = restaurants.find((r) => r.id === "r3")!;
    const r1 = restaurants.find((r) => r.id === "r1")!;
    return `Oh, Valentine's is the best excuse to splurge a little! 🥂 For a memorable night in Bangkok, you want atmosphere, great food, and a spot where the lighting does the work. Here are my top picks:

RECS:[${rec("r2", "La Piazza is *the* Valentine's move — candlelit Italian, an excuse to share pasta and split a bottle. Book the corner table.", "Request corner table")},${rec("r3", "Sakura Garden's omakase is an experience, not just dinner. Intimate counter, chef's selection. Book ahead.", "Omakase ฿2,800/pp")},${rec("r1", "Saffron Thai for something romantic but not stuffy — cozy setting, 20% off dinner Sun–Thu.")}]`;
  }

  // Spicy / cheap / solo
  if (/spicy|cheap|solo|lunch|budget|affordable/.test(lower)) {
    const r1 = restaurants.find((r) => r.id === "r1")!;
    const r5 = restaurants.find((r) => r.id === "r5")!;
    const r4 = restaurants.find((r) => r.id === "r4")!;
    return `Solo spicy lunch — respect. Bangkok does this better than anywhere. Quick and no-fuss:

RECS:[${rec("r1", "Saffron Thai: solid Thai in Sukhumvit, lunch set under ฿450. Tom yum and pad thai hit the spot.")},${rec("r5", "Spice Route for real heat — tandoori and biryani, ฿฿. Great for a filling solo meal.")},${rec("r4", "Burger Republic near Siam BTS: burger + beer combo ฿350. Casual, fast.")}]`;
  }

  // Team / group
  if (/team|group|people|party|dinner for|8 |6 people/.test(lower)) {
    const r2 = restaurants.find((r) => r.id === "r2")!;
    const r1 = restaurants.find((r) => r.id === "r1")!;
    const r5 = restaurants.find((r) => r.id === "r5")!;
    return `Team dinner — nice. You want a place that can handle a big table and mixed tastes. Here are spots that work:

RECS:[${rec("r2", "La Piazza: pizza & pasta buffet ฿890/head, easy to please everyone. Silom, near BTS.")},${rec("r1", "Saffron Thai: 20% off dinner for 2+ guests. Cozy, good for groups.")},${rec("r5", "Spice Route: vibrant Indian, live music on weekends. Great for groups who like flavor.")}]`;
  }

  // Hangover / casual / comfort
  if (/hangover|comfort|casual|chill|relax/.test(lower)) {
    const r4 = restaurants.find((r) => r.id === "r4")!;
    const r1 = restaurants.find((r) => r.id === "r1")!;
    return `Hangover mode — we've all been there. You want something uncomplicated and satisfying:

RECS:[${rec("r4", "Burger Republic: burgers, loaded fries, craft beer. Open late, no dress code.")},${rec("r1", "Saffron Thai: tom yum and pad thai in a cozy spot. Comfort in a bowl.")}]`;
  }

  // Business / quiet / impressive
  if (/business|lunch|quiet|impressive|sathorn|professional/.test(lower)) {
    const r3 = restaurants.find((r) => r.id === "r3")!;
    const r2 = restaurants.find((r) => r.id === "r2")!;
    return `Business lunch — you need somewhere that feels polished but not stiff. These work well:

RECS:[${rec("r3", "Sakura Garden: premium Japanese, omakase or à la carte. Quiet, impressive.")},${rec("r2", "La Piazza Silom: Italian, professional setting. Pizza & pasta buffet 12–3 if you want value.")}]`;
  }

  // Family / parents / not too spicy
  if (/family|parents|visiting|myanmar|burmese|not too spicy|mild/.test(lower)) {
    const r1 = restaurants.find((r) => r.id === "r1")!;
    const r2 = restaurants.find((r) => r.id === "r2")!;
    return `Family dinner with visitors — you want welcoming, varied menu, and spice levels you can control. Try:

RECS:[${rec("r1", "Saffron Thai: authentic but you can ask for mild. Cozy, good for sharing.")},${rec("r2", "La Piazza: Italian is a safe bet for mixed groups. Pasta and pizza please everyone.")}]`;
  }

  // Burmese text (မြန်မာ)
  if (/[\u1000-\u109F]/.test(userMessage)) {
    const r1 = restaurants.find((r) => r.id === "r1")!;
    const r2 = restaurants.find((r) => r.id === "r2")!;
    return `ညနေစာစားချင်ရင် ဒီဆိုင်တွေကောင်းတယ်။ ဘန်ကောက်မှာ ထိုင်းနဲ့ အပြည်ပြည်ဆိုင်ရာ ဟင်းတွေ ရှိတယ်။

RECS:[${rec("r1", "Saffron Thai — ထိုင်းဟင်းလျာများ၊ နွေးထွေးတဲ့ပတ်ဝန်းကျင်။")},${rec("r2", "La Piazza — အီတလီ ပီဇာနဲ့ ခေါက်ဆွဲ၊ လေ့လာကြည့်ပါ။")}]`;
  }

  // Surprise me / something new
  if (/surprise|something new|never had|recommend|suggest/.test(lower)) {
    const r3 = restaurants.find((r) => r.id === "r3")!;
    const r5 = restaurants.find((r) => r.id === "r5")!;
    const r2 = restaurants.find((r) => r.id === "r2")!;
    return `Okay, I'll mix it up. Three very different vibes — pick your mood:

RECS:[${rec("r3", "Sakura Garden: omakase Japanese. Let the chef decide. Trust the process.")},${rec("r5", "Spice Route: bold Indian, tandoori and biryani. Live sitar on weekends.")},${rec("r2", "La Piazza: wood-fired pizza and pasta. Classic Italian done right.")}]`;
  }

  // Default: ask a bit more
  return `I'd love to help you find the perfect spot! To narrow it down — are you thinking **lunch or dinner**, and roughly how many people? Any area of Bangkok you're near (e.g. Silom, Sukhumvit, Siam)?`;
}

export async function POST(request: NextRequest) {
  let messages: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const body = await request.json();
    messages = body.messages ?? [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const lastUser = messages.filter((m) => m.role === "user").pop();
  const lastUserContent = lastUser?.content ?? "";

  try {

    // Try real API first if key exists
    if (GEMINI_API_KEY) {
      const geminiMessages: GeminiMessage[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: geminiMessages,
            generationConfig: {
              maxOutputTokens: 1024,
              temperature: 0.8,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) return NextResponse.json({ text });
      }
      // If not ok (e.g. 429 quota), fall through to demo
    }

    // Demo mode: keyword-based responses with real restaurant recs
    const text = getDemoResponse(lastUserContent);
    return NextResponse.json({ text });
  } catch {
    const text = getDemoResponse(lastUserContent);
    return NextResponse.json({ text });
  }
}
