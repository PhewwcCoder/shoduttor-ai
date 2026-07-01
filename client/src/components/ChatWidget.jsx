// ChatWidget — the React chat UI used inside the app (demo page).
// The standalone embeddable version lives in client/public/widget.js.
import { useState, useRef, useEffect } from "react";
import { sendChat } from "../lib/api";
import IntentBadge from "./IntentBadge";

export default function ChatWidget({
  businessId = "grameenphone",
  primaryColor = "#00A550",
  greeting = "Apnar ki help lagbe?",
  icon = "💬",
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: greeting },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, typing]);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;
    setMessages((m) => [...m, { from: "user", text }]);
    setInput("");
    setTyping(true);
    try {
      const res = await sendChat(businessId, text);
      // Small artificial delay so the typing indicator is visible.
      await new Promise((r) => setTimeout(r, 600));
      setMessages((m) => [
        ...m,
        {
          from: "bot",
          text: res.reply,
          intent: res.intent,
          sentiment: res.sentiment,
          status: res.status,
          ticketId: res.ticket_id,
        },
      ]);
    } catch (err) {
      // Server sends friendly text for rate-limit / quota / too-long (429/400);
      // fall back to a generic line for unexpected errors.
      setMessages((m) => [
        ...m,
        { from: "bot", text: err.message || "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 flex h-[520px] w-[360px] max-w-[calc(100vw-40px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: primaryColor }}>
            <div>
              <div className="text-sm font-semibold">সদুত্তর.ai Support</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/90 hover:text-white" aria-label="Close">✕</button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-gray-50 p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                    m.from === "user" ? "text-white" : "bg-white text-gray-800 shadow-sm"
                  }`}
                  style={m.from === "user" ? { background: primaryColor } : undefined}
                >
                  {m.text}
                </div>
                {(m.intent || m.status) && (
                  <div className="mt-1 flex items-center gap-1.5">
                    {m.intent && <IntentBadge value={m.intent} kind="intent" />}
                    {m.sentiment && <IntentBadge value={m.sentiment} kind="sentiment" />}
                    {m.status === "escalated" && m.ticketId && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                        Ticket #{String(m.ticketId).slice(0, 8)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
            {typing && (
              <div className="flex items-center gap-1 self-start rounded-2xl bg-white px-3 py-2 shadow-sm">
                <Dot /> <Dot delay="150ms" /> <Dot delay="300ms" />
              </div>
            )}
          </div>

          {/* input */}
          <div className="flex items-center gap-2 border-t border-gray-100 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Type a message in Banglish or English…"
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-400"
            />
            <button
              onClick={send}
              className="flex h-10 w-10 items-center justify-center rounded-full text-white"
              style={{ background: primaryColor }}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex h-15 w-15 items-center justify-center rounded-full text-2xl text-white shadow-lg"
        style={{ background: primaryColor, width: 60, height: 60 }}
        aria-label="Open chat"
      >
        {open ? "✕" : icon}
      </button>
    </div>
  );
}

function Dot({ delay = "0ms" }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-gray-400"
      style={{ animationDelay: delay }}
    />
  );
}
