"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRestaurantStore } from "@/stores/restaurantStore";
import { getRestaurantPath } from "@/lib/restaurants/url";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recs?: RecCard[];
}

interface RecCard {
  id: string;
  reason: string;
  highlight?: string;
}

interface Conversation {
  id: string;
  title: string;
  date: string;
  messages: ChatMessage[];
}

const SUGGESTIONS = [
  { emoji: "💕", label: "Valentine's date night", msg: "It's Valentine's Day and I have no idea where to take my partner 😅" },
  { emoji: "🌶️", label: "Spicy solo lunch", msg: "I want something spicy and cheap near Silom, just me for lunch" },
  { emoji: "🎉", label: "Team dinner", msg: "Team dinner for 8 people, mix of Thai and foreigners, budget ฿600/person" },
  { emoji: "🛋️", label: "Hangover food", msg: "I'm hungover and need comfort food, somewhere very casual" },
  { emoji: "💼", label: "Business lunch", msg: "Business lunch, need somewhere quiet and impressive near Sathorn, max 90 minutes" },
  { emoji: "👨‍👩‍👧", label: "Family dinner", msg: "My parents are visiting from Myanmar, want authentic Thai food that's not too spicy" },
  { emoji: "🇲🇲", label: "မြန်မာဆိုင်", msg: "ညနေ ဆိုင် ရှာနေတယ်၊ မြန်မာ လမ်းဘေး ဟင်းစားချင်တယ်" },
  { emoji: "✨", label: "Surprise me", msg: "I want to try something totally new, surprise me with a cuisine I've never had" },
];

const priceLabel: Record<number, string> = { 1: "฿", 2: "฿฿", 3: "฿฿฿", 4: "฿฿฿฿" };

function parseRecs(raw: string): { text: string; recs: RecCard[] } {
  const recsIdx = raw.lastIndexOf("RECS:");
  let recs: RecCard[] = [];
  let text = raw;

  if (recsIdx >= 0) {
    const jsonPart = raw.slice(recsIdx + 5).trim();
    const bracketStart = jsonPart.indexOf("[");
    const bracketEnd = jsonPart.lastIndexOf("]");
    if (bracketStart >= 0 && bracketEnd > bracketStart) {
      try {
        const parsed = JSON.parse(jsonPart.slice(bracketStart, bracketEnd + 1)) as { id: string; reason: string; highlight?: string }[];
        recs = parsed.map((rec) => ({ id: rec.id, reason: rec.reason, highlight: rec.highlight }));
      } catch { /* parse failed, no recs */ }
      text = raw.slice(0, recsIdx).trim();
    }
  }

  return { text, recs };
}

function formatMarkdown(text: string) {
  return text
    .split("\n\n")
    .map((p) =>
      p
        .replace(/\n/g, "<br>")
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
    )
    .map((p) => `<p>${p}</p>`)
    .join("");
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("hts_chat_convos") || "[]");
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem("hts_chat_convos", JSON.stringify(convos));
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sidebarOpen = true;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const persist = useCallback(
    (msgs: ChatMessage[], convoId: string | null) => {
      if (!convoId || msgs.length === 0) return;
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convoId);
        let updated: Conversation[];
        if (idx >= 0) {
          updated = [...prev];
          updated[idx] = { ...updated[idx], messages: msgs };
        } else {
          const title = msgs[0]?.content.slice(0, 40) + "…";
          updated = [
            { id: convoId, title, date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }), messages: msgs },
            ...prev,
          ];
        }
        saveConversations(updated);
        return updated;
      });
    },
    []
  );

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const convoId = currentId || Date.now().toString();
    if (!currentId) setCurrentId(convoId);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to get response");

      const { recs } = parseRecs(data.text);
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.text,
        recs,
      };

      // Store display text separately for rendering but keep raw for context
      assistantMsg.content = data.text;
      assistantMsg.recs = recs;

      const final = [...nextMessages, assistantMsg];
      setMessages(final);
      persist(final, convoId);
    } catch (err) {
      const errorMsg: ChatMessage = {
        role: "assistant",
        content: `Sorry, I hit an error: ${err instanceof Error ? err.message : "Something went wrong"}. Please try again.`,
      };
      const final = [...nextMessages, errorMsg];
      setMessages(final);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const loadConversation = (id: string) => {
    const convo = conversations.find((c) => c.id === id);
    if (!convo) return;
    setCurrentId(id);
    const restored = convo.messages.map((m) => {
      if (m.role === "assistant") {
        const { recs } = parseRecs(m.content);
        return { ...m, recs };
      }
      return m;
    });
    setMessages(restored);
  };

  const startNewChat = () => {
    setCurrentId(null);
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const quickReplies = messages.length > 0
    ? ["Show me the menu", "Closer to BTS?", "Cheaper options?", "Book one of these"]
    : [];

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "w-[260px] shrink-0 border-r border-border bg-surface flex flex-col overflow-hidden transition-all duration-[var(--dur-base)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full absolute -left-[260px]",
          "max-md:hidden"
        )}
      >
        <div className="px-4 py-4 border-b border-border flex items-center justify-between">
          <span className="text-[11px] font-bold text-text-muted tracking-[0.06em] uppercase">
            History
          </span>
          <button
            onClick={startNewChat}
            className="w-7 h-7 rounded-[var(--radius-sm)] bg-brand-dim border border-brand-border text-brand-light text-base cursor-pointer flex items-center justify-center transition-all duration-[var(--dur-fast)] hover:bg-brand hover:text-white"
            title="New conversation"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {conversations.length === 0 ? (
            <p className="text-center text-[12px] text-text-muted py-5 px-3">
              No conversations yet.
              <br />
              Start by asking what to eat!
            </p>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-[var(--radius-md)] cursor-pointer transition-colors duration-[var(--dur-fast)] mb-0.5 border border-transparent",
                  c.id === currentId
                    ? "bg-brand-dim border-brand-border"
                    : "hover:bg-card"
                )}
              >
                <p className="text-[13px] text-text-primary font-medium truncate">
                  {c.title}
                </p>
                <p className="text-[11px] text-text-muted">{c.date}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Ambient glow */}
        <div
          className="absolute -top-[100px] -right-[100px] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{
            background: "radial-gradient(circle, rgba(211,36,36,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto relative z-[1]">
          {isEmpty ? (
            <EmptyState onChip={(msg) => sendMessage(msg)} />
          ) : (
            <div className="py-8 flex flex-col gap-0">
              {messages.map((msg, i) => (
                <MessageRow key={i} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick replies */}
        {quickReplies.length > 0 && !loading && !isEmpty && (
          <div className="flex gap-1.5 flex-wrap px-8 py-2 relative z-[5]">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => sendMessage(qr)}
                className="px-3.5 py-1.5 rounded-[var(--radius-full)] border border-border-strong bg-card text-[12px] font-medium text-text-secondary cursor-pointer transition-all duration-[var(--dur-fast)] hover:border-brand hover:text-brand-light hover:bg-brand-dim whitespace-nowrap"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="px-8 max-md:px-4 pt-4 pb-5 border-t border-border bg-[rgba(10,10,8,0.7)] backdrop-blur-[12px] relative z-10">
          <div className="flex items-end gap-2.5 bg-card border border-border-strong rounded-[var(--radius-lg)] p-2.5 pl-[18px] transition-[border-color,box-shadow] duration-[var(--dur-fast)] focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(211,36,36,0.08)]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What are you in the mood for?"
              rows={1}
              className="flex-1 bg-transparent border-none outline-none text-[15px] text-text-primary placeholder:text-text-muted resize-none leading-relaxed max-h-[120px] min-h-[24px] overflow-y-auto"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-[38px] h-[38px] rounded-[var(--radius-md)] bg-brand border-none cursor-pointer flex items-center justify-center transition-all duration-[var(--dur-fast)] text-white shrink-0 hover:bg-brand-hover hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="white" />
              </svg>
            </button>
          </div>
          <p className="text-[11px] text-text-muted text-center mt-2">
            AI-powered by Gemini · Recommendations from our Bangkok restaurant database
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function EmptyState({ onChip }: { onChip: (msg: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center min-h-full">
      <div className="w-[72px] h-[72px] rounded-[var(--radius-xl)] bg-brand-dim border border-brand-border flex items-center justify-center text-[32px] mb-6 animate-[float_3s_ease-in-out_infinite]">
        🍜
      </div>
      <h1 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-1.5px] text-text-primary mb-2.5 leading-[1.1]">
        Not sure what to <em className="italic text-brand-light">eat?</em>
      </h1>
      <p className="text-[15px] text-text-secondary max-w-[400px] leading-[1.65] mb-2">
        Tell me the vibe — date night, lunch with friends, late-night craving —
        and I&apos;ll find the perfect spot in Bangkok.
      </p>
      <p className="font-my text-[13px] text-text-muted leading-[1.9] mb-8">
        ဘာစားမလဲဆိုတာ မသိဘူးလား? ပြောလိုက်ပါ၊ ကျွန်ုပ် ရှာပေးပါမည်
      </p>
      <div className="flex flex-wrap gap-2 justify-center max-w-[560px]">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            onClick={() => onChip(s.msg)}
            className="px-[18px] py-2.5 rounded-[var(--radius-full)] border border-border-strong bg-card text-[13px] font-medium text-text-secondary cursor-pointer transition-all duration-[var(--dur-base)] hover:border-brand hover:text-text-primary hover:bg-brand-dim hover:-translate-y-px flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="text-base">{s.emoji}</span>
            {s.label}
          </button>
        ))}
      </div>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

function MessageRow({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const { text: displayText, recs } = isUser
    ? { text: msg.content, recs: [] }
    : parseRecs(msg.content);
  const finalRecs = msg.recs || recs;

  return (
    <div
      className={cn(
        "flex gap-3 px-8 max-md:px-4 py-1 animate-[msgIn_0.3s_ease_both]",
        isUser ? "flex-row-reverse" : ""
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm mt-0.5",
          isUser
            ? "bg-card-hover border border-border-strong text-base"
            : "bg-brand font-sans font-bold text-white text-[12px]"
        )}
      >
        {isUser ? "🙂" : "H"}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "px-[18px] py-3.5 text-[14px] leading-[1.7] break-words",
          isUser
            ? "bg-brand text-white rounded-[18px_18px_4px_18px] max-w-[480px]"
            : "bg-card border border-border-strong rounded-[18px_18px_18px_4px] max-w-[680px]"
        )}
      >
        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(displayText) }} className="[&>p]:mb-2 [&>p:last-child]:mb-0" />

        {finalRecs.length > 0 && (
          <div className="flex flex-col gap-2.5 mt-3">
            {finalRecs.map((rec) => (
              <RecCardComponent key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function RecCardComponent({ rec }: { rec: RecCard }) {
  const restaurants = useRestaurantStore((s) => s.restaurants);
  const r = restaurants.find((res) => res.id === rec.id);
  const name = r?.name ?? "Restaurant";
  const area = r?.area ?? "";
  const cuisine = r?.cuisineTags?.join(", ") ?? "";
  const imageUrl = r?.imageUrl ?? "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&auto=format&fit=crop&q=80";

  return (
    <Link
      href={`/restaurant/${r ? getRestaurantPath(r) : rec.id}`}
      className="flex items-stretch bg-surface border border-border-strong rounded-[14px] overflow-hidden transition-all duration-[var(--dur-base)] hover:border-brand hover:translate-x-[3px] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] no-underline group"
    >
      <div className="w-[90px] shrink-0 overflow-hidden relative">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="90px"
        />
      </div>
      <div className="p-3 flex-1 min-w-0">
        <p className="text-[14px] font-bold text-text-primary mb-[3px] truncate">
          {name}
        </p>
        {(area || cuisine) && (
          <div className="flex items-center gap-1.5 text-[12px] text-text-muted mb-1.5">
            {area && <span>{area}</span>}
            {area && cuisine && <span>·</span>}
            {cuisine && <span>{cuisine}</span>}
          </div>
        )}
        <p className="text-[12px] text-text-secondary leading-[1.5] line-clamp-2">
          {rec.reason}
        </p>
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
          {r && (
            <>
              <span className="text-gold text-[11px]">★ {r.rating || "—"}</span>
              <span className="text-text-muted text-[11px]">·</span>
              <span className="text-gold text-[11px] font-semibold">{priceLabel[r.priceTier]}</span>
              {r.deals.length > 0 && (
                <span className="px-2 py-[2px] rounded-[var(--radius-full)] text-[10px] font-bold bg-brand-dim text-brand-light border border-brand-border whitespace-nowrap">
                  {r.deals.length} Deal{r.deals.length > 1 ? "s" : ""}
                </span>
              )}
            </>
          )}
          {rec.highlight && (
            <span className="text-[11px] text-brand-light italic ml-auto truncate">
              {rec.highlight}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-8 max-md:px-4 py-1 animate-[msgIn_0.3s_ease_both]">
      <div className="w-8 h-8 rounded-full bg-brand font-bold text-white text-[12px] shrink-0 flex items-center justify-center mt-0.5">
        H
      </div>
      <div className="flex items-center gap-1 px-[18px] py-3.5 bg-card border border-border-strong rounded-[18px_18px_18px_4px] w-fit">
        <span className="w-[7px] h-[7px] rounded-full bg-text-muted animate-[typingPulse_1.4s_ease_infinite]" />
        <span className="w-[7px] h-[7px] rounded-full bg-text-muted animate-[typingPulse_1.4s_ease_infinite_0.2s]" />
        <span className="w-[7px] h-[7px] rounded-full bg-text-muted animate-[typingPulse_1.4s_ease_infinite_0.4s]" />
      </div>
      <style jsx>{`
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes typingPulse {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
