"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  SendHorizonal,
  Sparkles,
  TicketPlus,
  User2,
  X,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { chatWithAI, aiGenerateTicket, fetchJiraProjects } from "@/lib/api";
import { useVoiceInput } from "@/lib/use-voice-input";
import type { ChatMessage, JiraProject } from "@/lib/types";
import { Button } from "@/components/ui/button";

type ContextualChatProps = {
  context: string;
  contextLabel: string;
  quickPrompts?: string[];
};

function createMsg(role: ChatMessage["role"], content: string): ChatMessage {
  return { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, content };
}

export function ContextualChat({ context, contextLabel, quickPrompts }: ContextualChatProps) {
  const { mode, isBusiness } = useMode();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMsg("assistant", `I have context about ${contextLabel}. Ask me anything about it!`),
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const voice = useVoiceInput();

  // ── Jira ticket creation state ──
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketRequirement, setTicketRequirement] = useState("");
  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ticketCreating, setTicketCreating] = useState(false);
  const [ticketResult, setTicketResult] = useState<{ key: string; url: string } | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [jiraLoading, setJiraLoading] = useState(false);

  const defaultPrompts = isBusiness
    ? ["What does this change mean for the product?", "Any risks I should know about?", "Summarize for leadership"]
    : ["Explain the architecture impact", "Any tech debt introduced?", "What patterns are used here?"];

  const prompts = quickPrompts ?? defaultPrompts;

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  // Reset messages when context changes
  useEffect(() => {
    setMessages([
      createMsg("assistant", `I have context about ${contextLabel}. Ask me anything about it!`),
    ]);
    setShowTicketForm(false);
    setTicketResult(null);
    setTicketError(null);
  }, [context, contextLabel]);

  // Load Jira projects when ticket form is opened
  useEffect(() => {
    if (!showTicketForm || jiraProjects.length > 0) return;
    setJiraLoading(true);
    fetchJiraProjects()
      .then((projects) => {
        setJiraProjects(projects);
        if (projects.length > 0 && !selectedProject) {
          setSelectedProject(projects[0].key);
        }
      })
      .catch(() => setJiraProjects([]))
      .finally(() => setJiraLoading(false));
  }, [showTicketForm]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;

    voice.reset();
    setInput("");
    setMessages((m) => [...m, createMsg("user", msg)]);
    setBusy(true);

    try {
      const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
      const result = await chatWithAI(msg, mode, context, history);
      setMessages((m) => [...m, createMsg("assistant", result.reply)]);
    } catch {
      setMessages((m) => [
        ...m,
        createMsg("assistant", "Could not reach the AI service. Make sure the backend is running."),
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateTicket() {
    if (!ticketRequirement.trim() || !selectedProject) return;
    setTicketCreating(true);
    setTicketError(null);
    setTicketResult(null);

    try {
      const result = await aiGenerateTicket(ticketRequirement, selectedProject, mode, context);
      setTicketResult({ key: result.key, url: result.url });
      setTicketRequirement("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create ticket";
      setTicketError(message);
    } finally {
      setTicketCreating(false);
    }
  }

  if (!expanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-5 right-5 z-40 flex gap-2"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-gradient-to-r from-fi-red/20 via-fi-magenta/20 to-fi-purple/20 backdrop-blur-xl px-4 py-3 text-sm font-medium text-fi-text shadow-2xl shadow-fi-magenta/10 transition-all hover:shadow-fi-magenta/20 hover:border-fi-magenta/30"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fi-gradient">
            <MessageSquare className="h-3.5 w-3.5 text-white" />
          </div>
          <span>Ask about this</span>
          <ChevronUp className="h-3.5 w-3.5 text-fi-text/50" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setExpanded(true); setShowTicketForm(true); }}
          className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 backdrop-blur-xl px-4 py-3 text-sm font-medium text-fi-text shadow-2xl transition-all hover:border-amber-500/30"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <TicketPlus className="h-3.5 w-3.5 text-white" />
          </div>
          <span>Create Ticket</span>
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed bottom-5 right-5 z-50 flex w-[440px] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-white/[0.1] shadow-2xl shadow-black/40 overflow-hidden"
      style={{ background: isBusiness ? "linear-gradient(160deg, rgba(47,23,58,0.97), rgba(26,14,34,0.99))" : "rgba(14,14,16,0.98)", maxHeight: "min(600px, calc(100vh - 6rem))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-fi-gradient">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-fi-text">Context Chat</h3>
            <p className="text-[10px] text-fi-text/40 leading-tight">{contextLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setShowTicketForm((v) => !v); setTicketResult(null); setTicketError(null); }}
            className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              showTicketForm
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                : "border-white/[0.08] bg-white/[0.04] text-fi-text/50 hover:text-fi-text hover:bg-white/[0.06]"
            }`}
          >
            <TicketPlus className="h-3 w-3" />
            Jira Ticket
          </button>
          <button
            onClick={() => setExpanded(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-fi-text/40 hover:text-fi-text hover:bg-white/[0.06] transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Jira Ticket Creator */}
      <AnimatePresence>
        {showTicketForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-b border-white/[0.08] bg-gradient-to-r from-amber-500/[0.04] to-orange-500/[0.04] p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-500 to-orange-600">
                  <TicketPlus className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-fi-text">AI Jira Ticket Creator</span>
              </div>
              <p className="text-[11px] text-fi-text/40 leading-relaxed">
                Describe what you need in plain words. The AI will analyze the codebase context and generate a detailed technical Jira ticket.
              </p>

              {/* Project selector */}
              <div>
                <label className="block text-[10px] font-medium text-fi-text/50 mb-1 uppercase tracking-wider">Project</label>
                {jiraLoading ? (
                  <div className="flex items-center gap-2 text-xs text-fi-text/40">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading projects...
                  </div>
                ) : jiraProjects.length > 0 ? (
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 px-2.5 py-1.5 text-xs text-fi-text focus:outline-none focus:border-amber-500/30"
                  >
                    {jiraProjects.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.key} — {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[11px] text-fi-text/30">No Jira projects available. Check Jira connection.</p>
                )}
              </div>

              {/* Requirement input */}
              <div>
                <label className="block text-[10px] font-medium text-fi-text/50 mb-1 uppercase tracking-wider">Your Requirement</label>
                <textarea
                  value={ticketRequirement}
                  onChange={(e) => setTicketRequirement(e.target.value)}
                  placeholder={isBusiness
                    ? "e.g., We need better error messages when users enter wrong data..."
                    : "e.g., Add input validation with proper error boundaries..."
                  }
                  rows={3}
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 px-3 py-2 text-xs text-fi-text placeholder:text-fi-text/30 focus:outline-none focus:border-amber-500/30 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreateTicket}
                  disabled={ticketCreating || !ticketRequirement.trim() || !selectedProject}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 border-0"
                >
                  {ticketCreating ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <TicketPlus className="h-3 w-3" />
                  )}
                  {ticketCreating ? "AI is generating..." : "Generate & Create Ticket"}
                </Button>
                <button
                  onClick={() => { setShowTicketForm(false); setTicketResult(null); setTicketError(null); }}
                  className="text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Success */}
              <AnimatePresence>
                {ticketResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-emerald-300">Ticket created!</p>
                      <p className="text-[11px] text-fi-text/50 truncate">{ticketResult.key}</p>
                    </div>
                    {ticketResult.url && (
                      <a
                        href={ticketResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline shrink-0"
                      >
                        Open <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {ticketError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-300">
                  {ticketError}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/[0.06] px-3 py-2.5">
        {prompts.map((qp) => (
          <button
            key={qp}
            onClick={() => send(qp)}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[10px] text-fi-text/45 transition-all hover:bg-fi-magenta/10 hover:text-fi-text hover:border-fi-magenta/20"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
        style={{ minHeight: 120, maxHeight: 280 }}
      >
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isAi = m.role === "assistant";
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className={`flex gap-2 ${isAi ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                    isAi ? "bg-fi-gradient text-white" : "bg-white/[0.06] text-fi-text/50"
                  }`}
                >
                  {isAi ? <Bot className="h-2.5 w-2.5" /> : <User2 className="h-2.5 w-2.5" />}
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                    isAi
                      ? "rounded-tl-sm border border-white/[0.08] bg-white/[0.04] text-fi-text/75"
                      : "rounded-tr-sm accent-bg accent-border border text-fi-text"
                  }`}
                >
                  {m.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {busy && (
          <div className="flex gap-2">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-fi-gradient text-white">
              <Bot className="h-2.5 w-2.5" />
            </div>
            <div className="rounded-xl rounded-tl-sm border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-fi-text/40">
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
      <div className="border-t border-white/[0.08] p-3">
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
              placeholder={voice.isListening ? "Listening..." : "Ask about this..."}
              className="flex-1 bg-transparent py-2 text-xs text-fi-text placeholder:text-fi-text/30 focus:outline-none"
            />
            {voice.supported && (
              <button
                type="button"
                onClick={() => voice.isListening ? voice.stop() : voice.start()}
                className={`ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors ${
                  voice.isListening
                    ? "bg-fi-red/20 text-fi-red animate-pulse"
                    : "text-fi-text/30 hover:text-fi-text hover:bg-fi-magenta/10"
                }`}
              >
                {voice.isListening ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={busy || !input.trim()}
            variant="primary"
            size="icon"
            className="h-8 w-8"
          >
            <SendHorizonal className="h-3 w-3" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
