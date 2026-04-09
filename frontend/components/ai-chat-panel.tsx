"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, SendHorizonal, User2 } from "lucide-react";

import { useMode } from "@/lib/mode-context";
import { chatWithAI } from "@/lib/api";
import { businessQuickPrompts, developerQuickPrompts, seedMessages } from "@/lib/mock-data";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";

type AiChatPanelProps = {
  prefillPrompt?: string;
  clearPrefill?: () => void;
};

function createMsg(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, content };
}

export function AiChatPanel({ prefillPrompt, clearPrefill }: AiChatPanelProps) {
  const { mode, isBusiness } = useMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(seedMessages);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const quickPrompts = isBusiness ? businessQuickPrompts : developerQuickPrompts;

  useEffect(() => {
    if (prefillPrompt) {
      setInput(prefillPrompt);
      clearPrefill?.();
    }
  }, [prefillPrompt, clearPrefill]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;

    setInput("");
    setMessages((m) => [...m, createMsg("user", msg)]);
    setBusy(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const result = await chatWithAI(msg, mode, undefined, history);
      setMessages((m) => [...m, createMsg("assistant", result.reply)]);
    } catch {
      setMessages((m) => [
        ...m,
        createMsg("assistant", "Could not reach the AI service. Make sure the backend is running on http://127.0.0.1:8000."),
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-fi-text">Bridge AI Chat</h2>
        <p className="text-xs text-fi-text/40">
          Ask anything -- I&apos;ll respond in {isBusiness ? "business" : "technical"} language.
        </p>
      </div>

      {/* Quick prompts */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => send(qp)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-fi-text/50 transition-colors hover:bg-fi-magenta/10 hover:text-fi-text hover:border-fi-magenta/20"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mask-fade mb-4 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl border border-white/[0.08] p-3"
        style={{ background: "rgba(26, 14, 34, 0.5)" }}
      >
        {messages.map((m) => {
          const isAi = m.role === "assistant";
          return (
            <div key={m.id} className={`flex gap-2.5 ${isAi ? "" : "flex-row-reverse"}`}>
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  isAi ? "bg-fi-gradient text-white" : "bg-white/[0.06] text-fi-text/50"
                }`}
              >
                {isAi ? <Bot className="h-3 w-3" /> : <User2 className="h-3 w-3" />}
              </div>
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  isAi
                    ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-fi-text/80"
                    : "rounded-tr-sm accent-bg accent-border border text-fi-text"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-fi-gradient text-white">
              <Bot className="h-3 w-3" />
            </div>
            <div className="rounded-xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-fi-text/40">
              <span className="inline-flex gap-0.5">
                <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isBusiness ? "Ask about business impact..." : "Ask about tech details..."}
          className="flex-1 rounded-xl border border-white/[0.08] bg-fi-dark/60 px-3 py-2 text-sm text-fi-text placeholder:text-fi-text/30 focus:outline-none focus:border-fi-magenta/30"
        />
        <Button
          type="submit"
          disabled={busy || !input.trim()}
          variant="primary"
          size="icon"
          className="h-9 w-9"
        >
          <SendHorizonal className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
