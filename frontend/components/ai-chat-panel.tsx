"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Bot, Loader2, Mic, MicOff, SendHorizonal, User2, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { chatWithAI, translateLanguage } from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { businessQuickPrompts, developerQuickPrompts, seedMessages } from "@/lib/mock-data";
import { useVoiceInput } from "@/lib/use-voice-input";
import { useTextToSpeech } from "@/lib/use-tts";
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
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [langTranslations, setLangTranslations] = useState<Record<string, string>>({});
  const [langTranslatingId, setLangTranslatingId] = useState<string | null>(null);
  const voice = useVoiceInput();
  const tts = useTextToSpeech();

  const quickPrompts = isBusiness ? businessQuickPrompts : developerQuickPrompts;

  useEffect(() => {
    if (prefillPrompt) {
      setInput(prefillPrompt);
      clearPrefill?.();
    }
  }, [prefillPrompt, clearPrefill]);

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function handleMsgTranslate(msgId: string, content: string) {
    if (langTranslations[msgId]) {
      setLangTranslations((prev) => {
        const next = { ...prev };
        delete next[msgId];
        return next;
      });
      return;
    }
    setLangTranslatingId(msgId);
    try {
      const result = await translateLanguage(content.slice(0, 3000), "en", "de", mode);
      setLangTranslations((prev) => ({
        ...prev,
        [msgId]: result.rewritten_text || result.translated_text,
      }));
    } catch {
      setLangTranslations((prev) => ({
        ...prev,
        [msgId]: "Translation failed.",
      }));
    } finally {
      setLangTranslatingId(null);
    }
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;

    voice.reset();
    setInput("");
    setMessages((m) => [...m, createMsg("user", msg)]);
    setBusy(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const result = await chatWithAI(msg, mode, undefined, history);
      setMessages((m) => [...m, createMsg("assistant", result.reply)]);
      if (autoSpeak) tts.speak(result.reply);
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-fi-text">Bridge AI Chat</h2>
          <p className="text-xs text-fi-text/40">
            Ask anything -- I&apos;ll respond in {isBusiness ? "business" : "technical"} language.
          </p>
        </div>
        <button
          onClick={() => setAutoSpeak((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
            autoSpeak
              ? "border-fi-magenta/30 bg-fi-magenta/10 text-fi-magenta"
              : "border-white/[0.08] bg-white/[0.04] text-fi-text/40 hover:text-fi-text"
          }`}
        >
          {autoSpeak ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          Auto-speak
        </button>
      </div>

      <Separator className="mb-3 bg-white/[0.06]" />

      {/* Quick prompts */}
      <motion.div
        className="mb-3 flex flex-wrap gap-1.5"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04, delayChildren: 0.2 } } }}
      >
        {quickPrompts.map((qp) => (
          <motion.button
            key={qp}
            variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => send(qp)}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 py-1.5 text-[11px] text-fi-text/50 transition-colors hover:bg-fi-magenta/10 hover:text-fi-text hover:border-fi-magenta/20"
          >
            {qp}
          </motion.button>
        ))}
      </motion.div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mask-fade mb-4 flex flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl border border-white/[0.08] p-3"
        style={{ background: "rgba(26, 14, 34, 0.5)" }}
      >
        <AnimatePresence initial={false}>
        {messages.map((m) => {
          const isAi = m.role === "assistant";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`group flex gap-2.5 ${isAi ? "" : "flex-row-reverse"}`}
            >
              <div
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                  isAi ? "bg-fi-gradient text-white" : "bg-white/[0.06] text-fi-text/50"
                }`}
              >
                {isAi ? <Bot className="h-3 w-3" /> : <User2 className="h-3 w-3" />}
              </div>
              <div className="flex max-w-[85%] flex-col gap-1">
                <div
                  className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                    isAi
                      ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-fi-text/80"
                      : "rounded-tr-sm accent-bg accent-border border text-fi-text"
                  }`}
                >
                  {m.content}
                </div>
                {isAi && (
                  <div className="flex items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
                    <button
                      onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(langTranslations[m.id] || m.content)}
                      className="flex w-fit items-center gap-1 rounded px-1 py-0.5 text-[10px] text-fi-text/30 hover:text-fi-text/60"
                    >
                      {tts.isSpeaking ? <VolumeX className="h-2.5 w-2.5" /> : <Volume2 className="h-2.5 w-2.5" />}
                      {tts.isSpeaking ? "Stop" : "Listen"}
                    </button>
                    <button
                      onClick={() => handleMsgTranslate(m.id, m.content)}
                      disabled={langTranslatingId === m.id}
                      className="flex w-fit items-center gap-1 rounded px-1 py-0.5 text-[10px] text-fi-text/30 hover:text-fi-text/60 disabled:opacity-50"
                    >
                      {langTranslatingId === m.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="h-2.5 w-2.5" />
                      )}
                      {langTranslations[m.id] ? "Show original" : "DE"}
                    </button>
                  </div>
                )}
                {langTranslations[m.id] && isAi && (
                  <div className="rounded-lg border border-fi-magenta/20 bg-fi-dark/40 px-3 py-2 text-[12px] leading-relaxed text-fi-text/70">
                    <span className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-fi-magenta/60">German</span>
                    {langTranslations[m.id]}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>

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
        <div className={`flex flex-1 items-center rounded-xl border bg-fi-dark/60 px-3 ${voice.isListening ? "border-fi-red/40" : "border-white/[0.08] focus-within:border-fi-magenta/30"}`}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voice.isListening ? "Listening... speak now" : isBusiness ? "Ask about business impact..." : "Ask about tech details..."}
            className="flex-1 bg-transparent py-2 text-sm text-fi-text placeholder:text-fi-text/30 focus:outline-none"
          />
          {voice.supported && (
            <button
              type="button"
              onClick={() => voice.isListening ? voice.stop() : voice.start()}
              className={`ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                voice.isListening
                  ? "bg-fi-red/20 text-fi-red animate-pulse"
                  : "text-fi-text/30 hover:text-fi-text hover:bg-fi-magenta/10"
              }`}
            >
              {voice.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
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
