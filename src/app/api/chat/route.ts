import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transformDbRestaurant } from "@/lib/restaurants/transform";
import { resolveDishTagSlugsByRestaurant } from "@/lib/dishTags";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const priceLabel = (tier: number) => "฿".repeat(tier);

function buildSystemPrompt(restaurantContext: { id: string; name: string; area: string; cuisine: string; price: string; rating: number; reviewCount: number; deals: number; description: string; transit: string }[]) {
  return `You are a warm, knowledgeable Bangkok food advisor for the Mher Thar Ser restaurant booking app. Your job is to help users figure out where to eat based on their situation, mood, budget, or occasion.

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
}

interface GeminiMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

type RestaurantForChat = { id: string; name: string; area: string; cuisineTags: string[]; priceTier: number; rating: number; deals: unknown[]; description: string; transitNearby?: { name: string; type: string; walkingMinutes: number }[] };

/** Demo fallback when API fails or quota exceeded. Returns text + RECS line. */
function getDemoResponse(userMessage: string, restaurants: RestaurantForChat[]): string {
  const lower = userMessage.toLowerCase();
  const rec = (id: string, reason: string, highlight?: string) =>
    `{"id":"${id}","reason":"${reason}"${highlight ? `,"highlight":"${highlight}"` : ""}}`;

  const pick = (n: number) => restaurants.slice(0, Math.min(n, restaurants.length));
  const [a, b, c] = pick(3);

  if (restaurants.length === 0) {
    return `I'd love to help you find a restaurant, but we don't have any spots in our system yet. Check back soon!`;
  }

  // Valentine / date / romantic
  if (/valentine|date night|romantic|partner|anniversary/.test(lower) && a && b) {
    return `Oh, Valentine's is the best excuse to splurge a little! 🥂 For a memorable night in Bangkok, you want atmosphere, great food, and a spot where the lighting does the work. Here are my top picks:

RECS:[${rec(a.id, `${a.name}: ${a.description.slice(0, 80)}...`, "Book ahead")}${b ? `,${rec(b.id, `${b.name}: ${b.description.slice(0, 60)}...`)}` : ""}]`;
  }

  // Spicy / cheap / solo
  if (/spicy|cheap|solo|lunch|budget|affordable/.test(lower) && a && b) {
    return `Solo spicy lunch — respect. Bangkok does this better than anywhere. Quick and no-fuss:

RECS:[${rec(a.id, `${a.name}: ${a.description.slice(0, 70)}.`)}${b ? `,${rec(b.id, `${b.name}: ${b.description.slice(0, 60)}.`)}` : ""}]`;
  }

  // Team / group
  if (/team|group|people|party|dinner for|8 |6 people/.test(lower) && a && b && c) {
    return `Team dinner — nice. You want a place that can handle a big table and mixed tastes. Here are spots that work:

RECS:[${rec(a.id, `${a.name}: good for groups. ${a.area}.`)},${rec(b.id, `${b.name}: ${b.description.slice(0, 50)}...`)},${rec(c.id, `${c.name}: ${c.area}.`)}]`;
  }

  // Hangover / casual / comfort
  if (/hangover|comfort|casual|chill|relax/.test(lower) && a && b) {
    return `Hangover mode — we've all been there. You want something uncomplicated and satisfying:

RECS:[${rec(a.id, `${a.name}: ${a.description.slice(0, 60)}...`)},${rec(b.id, `${b.name}: ${b.description.slice(0, 60)}.`)}]`;
  }

  // Business / quiet / impressive
  if (/business|lunch|quiet|impressive|sathorn|professional/.test(lower) && a && b) {
    return `Business lunch — you need somewhere that feels polished but not stiff. These work well:

RECS:[${rec(a.id, `${a.name}: ${a.area}. ${a.description.slice(0, 50)}...`)},${rec(b.id, `${b.name}: professional setting.`)}]`;
  }

  // Family / parents / not too spicy
  if (/family|parents|visiting|myanmar|burmese|not too spicy|mild/.test(lower) && a && b) {
    return `Family dinner with visitors — you want welcoming, varied menu, and spice levels you can control. Try:

RECS:[${rec(a.id, `${a.name}: authentic, you can ask for mild.`)},${rec(b.id, `${b.name}: safe bet for mixed groups.`)}]`;
  }

  // Burmese text (မြန်မာ)
  if (/[\u1000-\u109F]/.test(userMessage) && a && b) {
    return `ညနေစာစားချင်ရင် ဒီဆိုင်တွေကောင်းတယ်။ ဘန်ကောက်မှာ ထိုင်းနဲ့ အပြည်ပြည်ဆိုင်ရာ ဟင်းတွေ ရှိတယ်။

RECS:[${rec(a.id, `${a.name} — ${a.description.slice(0, 40)}...`)},${rec(b.id, `${b.name} — လေ့လာကြည့်ပါ။`)}]`;
  }

  // Surprise me / something new
  if (/surprise|something new|never had|recommend|suggest/.test(lower) && a && b && c) {
    return `Okay, I'll mix it up. Three very different vibes — pick your mood:

RECS:[${rec(a.id, `${a.name}: ${a.description.slice(0, 50)}...`)},${rec(b.id, `${b.name}: ${b.description.slice(0, 50)}...`)},${rec(c.id, `${c.name}: ${c.description.slice(0, 50)}.`)}]`;
  }

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

  let restaurants: RestaurantForChat[] = [];
  try {
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("restaurants")
      .select("*, deals(id, title, type, description, price, discount, discount_pct, conditions)")
      .eq("status", "active")
      .order("name");
    const dishTagsByRestaurant = await resolveDishTagSlugsByRestaurant(
      supabase,
      (rows ?? []).map((r) => ({
        id: (r as { id: string }).id,
        name: (r as { name?: string }).name ?? "",
      })),
    );
    restaurants = (rows ?? []).map((row) => {
      const dealsRaw = (row as { deals?: unknown }).deals ?? [];
      const deals = Array.isArray(dealsRaw) ? dealsRaw : [];
      const r = transformDbRestaurant(row as Parameters<typeof transformDbRestaurant>[0], {
        deals: deals.map((d: Record<string, unknown>) => ({
          id: String(d.id ?? ""),
          title: String(d.title ?? ""),
          type: String(d.type ?? "discount"),
          description: String(d.description ?? ""),
          price: d.price as number | undefined,
          discount: d.discount as number | undefined,
          discount_pct: d.discount_pct as number | undefined,
          conditions: d.conditions as string | undefined,
        })),
        dishTags:
          dishTagsByRestaurant.get((row as { id: string }).id) ?? [],
      });
      return { ...r, deals: r.deals };
    });
  } catch {
    // continue with empty list; demo will handle it
  }

  const restaurantContext = restaurants.map((r) => ({
    id: r.id,
    name: r.name,
    area: r.area,
    cuisine: r.cuisineTags.join(", "),
    price: priceLabel(r.priceTier),
    rating: r.rating,
    reviewCount: 0,
    deals: r.deals.length,
    description: r.description,
    transit: (r.transitNearby ?? []).map((t) => `${t.type} ${t.name} (${t.walkingMinutes}min)`).join(", "),
  }));

  const SYSTEM_PROMPT = buildSystemPrompt(restaurantContext);

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
    const text = getDemoResponse(lastUserContent, restaurants);
    return NextResponse.json({ text });
  } catch {
    const text = getDemoResponse(lastUserContent, restaurants);
    return NextResponse.json({ text });
  }
}
