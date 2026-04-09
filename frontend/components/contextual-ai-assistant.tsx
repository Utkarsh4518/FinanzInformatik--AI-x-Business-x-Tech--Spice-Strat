"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, SendHorizonal, Sparkles, User2 } from "lucide-react";

import { chatWithAI } from "@/lib/api";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/types";
import { Button } from "@/components/ui/button";

type ContextualAiAssistantProps = {
  title: string;
  subtitle: string;
  intro: string;
  context: string;
  contextKey: string;
  quickPrompts: string[];
  placeholder: string;
  className?: string;
};

function createMsg(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
  };
}

export function ContextualAiAssistant({
  title,
  subtitle,
  intro,
  context,
  contextKey,
  quickPrompts,
  placeholder,
  className,
}: ContextualAiAssistantProps) {
  const { mode, isBusiness } = useMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [createMsg("assistant", intro)]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMessages([createMsg("assistant", intro)]);
    setInput("");
  }, [contextKey, intro]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  async function send(text?: string) {
    const message = (text ?? input).trim();
    if (!message || busy) return;

    const history = messages.slice(-6).map((item) => ({
      role: item.role,
      content: item.content,
    }));

    setInput("");
    setMessages((current) => [...current, createMsg("user", message)]);
    setBusy(true);

    try {
      const result = await chatWithAI(message, mode, context, history);
      setMessages((current) => [...current, createMsg("assistant", result.reply)]);
    } catch {
      setMessages((current) => [
        ...current,
        createMsg(
          "assistant",
          "I could not reach the AI service. Make sure the backend is running on http://127.0.0.1:8000.",
        ),
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cn("glass-elevated rounded-2xl p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-fi-text">
            <Sparkles className="h-4 w-4 accent-text" />
            {title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-fi-text/45">{subtitle}</p>
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-fi-text/35">
          {isBusiness ? "Business mode" : "Developer mode"}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => send(prompt)}
            disabled={busy}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-fi-text/55 transition-colors hover:border-[rgb(var(--accent)/0.3)] hover:bg-white/[0.06] hover:text-fi-text disabled:opacity-40"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="mt-4 flex max-h-[360px] flex-col gap-2 overflow-y-auto rounded-2xl border border-white/[0.08] bg-fi-dark/40 p-3"
      >
        {messages.map((message) => {
          const isAssistant = message.role === "assistant";
          return (
            <div key={message.id} className={`flex gap-2.5 ${isAssistant ? "" : "flex-row-reverse"}`}>
              <div
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isAssistant ? "bg-fi-gradient text-white" : "bg-white/[0.06] text-fi-text/55"
                }`}
              >
                {isAssistant ? <Bot className="h-3.5 w-3.5" /> : <User2 className="h-3.5 w-3.5" />}
              </div>
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  isAssistant
                    ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-fi-text/80"
                    : "rounded-tr-sm accent-bg accent-border border text-fi-text"
                }`}
              >
                {message.content}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fi-gradient text-white">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-fi-text/45">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
        className="mt-4 flex gap-2"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl border border-white/[0.08] bg-fi-dark/60 px-3 py-2 text-sm text-fi-text placeholder:text-fi-text/30 focus:border-[rgb(var(--accent)/0.3)] focus:outline-none"
        />
        <Button type="submit" variant="accent" size="icon" disabled={busy || !input.trim()} className="h-10 w-10">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        </Button>
      </form>
    </section>
  );
}
