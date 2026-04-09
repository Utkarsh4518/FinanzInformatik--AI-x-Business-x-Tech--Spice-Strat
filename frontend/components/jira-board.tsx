"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Sparkles,
  TicketCheck,
  Volume2,
  VolumeX,
} from "lucide-react";

import { useMode } from "@/lib/mode-context";
import {
  aiGenerateTicket,
  createJiraIssue,
  fetchJiraIssue,
  fetchJiraIssues,
  fetchJiraProjects,
  translateLanguage,
  translateText,
} from "@/lib/api";
import { useVoiceInput } from "@/lib/use-voice-input";
import { useTextToSpeech } from "@/lib/use-tts";
import type { JiraCreateResponse, JiraIssue, JiraProject } from "@/lib/types";
import { Button } from "@/components/ui/button";

type JiraBoardProps = {
  selectedIssue: JiraIssue | null;
  onBack: () => void;
};

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  done: CheckCircle2,
  new: Circle,
  indeterminate: Clock,
};

export function JiraBoard({ selectedIssue, onBack }: JiraBoardProps) {
  const { mode, isBusiness } = useMode();
  const voice = useVoiceInput();
  const tts = useTextToSpeech();

  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<string | null>(null);

  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [langTranslated, setLangTranslated] = useState<string | null>(null);
  const [langTranslating, setLangTranslating] = useState(false);
  const [langDirection, setLangDirection] = useState<"en-de" | "de-en">("en-de");

  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"manual" | "ai">("ai");
  const [newSummary, setNewSummary] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [aiRequirement, setAiRequirement] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<JiraCreateResponse | null>(null);

  useEffect(() => {
    if (voice.transcript) setAiRequirement(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    let c = false;
    fetchJiraProjects()
      .then((p) => {
        if (!c) {
          setProjects(p);
          if (p.length > 0 && !activeProject) setActiveProject(p[0].key);
        }
      })
      .catch(() => {});
    return () => { c = true; };
  }, []);

  const loadIssues = useCallback((key: string) => {
    setLoading(true);
    fetchJiraIssues(key)
      .then(setIssues)
      .catch(() => setIssues([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeProject) loadIssues(activeProject);
  }, [activeProject, loadIssues]);

  const handleTranslate = async (text: string) => {
    setTranslating(true);
    setTranslated(null);
    try {
      const target = isBusiness ? "business" : "developer";
      const result = await translateText(text, target);
      setTranslated(result.translated);
    } catch {
      setTranslated("Translation failed. Please try again.");
    } finally {
      setTranslating(false);
    }
  };

  const handleLangTranslate = async (text: string) => {
    setLangTranslating(true);
    setLangTranslated(null);
    try {
      const [src, tgt] = langDirection === "en-de" ? ["en", "de"] : ["de", "en"];
      const result = await translateLanguage(text.slice(0, 3000), src, tgt, mode);
      setLangTranslated(result.rewritten_text || result.translated_text);
    } catch {
      setLangTranslated("Language translation failed. Please try again.");
    } finally {
      setLangTranslating(false);
    }
  };

  const addNewTicketToBoard = async (ticketKey: string) => {
    try {
      const detail = await fetchJiraIssue(ticketKey);
      setIssues((prev) => {
        if (prev.some((i) => i.key === detail.key)) return prev;
        return [detail, ...prev];
      });
    } catch {
      // Jira detail fetch failed; do a full reload after a short delay
      setTimeout(() => { if (activeProject) loadIssues(activeProject); }, 2000);
    }
  };

  const handleCreateManual = async () => {
    if (!newSummary.trim() || !activeProject) return;
    setCreating(true);
    try {
      const result = await createJiraIssue(activeProject, newSummary, newDesc);
      setCreated(result);
      await addNewTicketToBoard(result.key);
    } catch {
      setCreated(null);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAi = async () => {
    if (!aiRequirement.trim() || !activeProject) return;
    setCreating(true);
    try {
      const result = await aiGenerateTicket(aiRequirement, activeProject, mode);
      setCreated(result);
      await addNewTicketToBoard(result.key);
    } catch {
      setCreated(null);
    } finally {
      setCreating(false);
    }
  };

  // ── Issue detail view ──────────────────────────────────────────────
  if (selectedIssue) {
    const StatusIcon = statusIcon[selectedIssue.status_category] ?? Circle;
    const statusColor =
      selectedIssue.status_category === "done"
        ? "text-emerald-400"
        : selectedIssue.status_category === "indeterminate"
          ? "text-fi-purple"
          : "text-fi-text/50";

    return (
      <div className="h-full overflow-y-auto p-5">
        <div className="mx-auto max-w-3xl space-y-5">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-fi-text/50 hover:text-fi-text transition-colors">
              <ArrowLeft className="h-3 w-3" /> All issues
            </button>
            <a
              href={selectedIssue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs accent-text hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Open in Jira
            </a>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm accent-text">{selectedIssue.key}</span>
              <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-fi-text/40">
                {selectedIssue.issue_type}
              </span>
            </div>
            <h1 className="text-xl font-semibold text-fi-text">{selectedIssue.summary}</h1>
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3">
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`h-3.5 w-3.5 ${statusColor}`} />
              <span className="text-xs text-fi-text">{selectedIssue.status}</span>
            </div>
            <div className="h-4 w-px bg-white/[0.06]" />
            <span className="text-xs text-fi-text/50">Priority: <span className="text-fi-text">{selectedIssue.priority || "None"}</span></span>
            <div className="h-4 w-px bg-white/[0.06]" />
            <span className="text-xs text-fi-text/50">Assignee: <span className="text-fi-text">{selectedIssue.assignee || "Unassigned"}</span></span>
            <div className="h-4 w-px bg-white/[0.06]" />
            <span className="text-xs text-fi-text/50">Reporter: <span className="text-fi-text">{selectedIssue.reporter || "—"}</span></span>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-fi-text">Description</h3>
              {selectedIssue.description && (
                <button
                  onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(selectedIssue.description)}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-fi-text/50 hover:text-fi-text hover:bg-fi-magenta/10 transition-colors"
                >
                  {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {tts.isSpeaking ? "Stop" : "Read aloud"}
                </button>
              )}
            </div>
            <p className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap">
              {selectedIssue.description || "No description provided."}
            </p>
          </div>

          {/* AI Translate */}
          {selectedIssue.description && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-fi-text">
                  {isBusiness ? "Business Translation" : "Technical Translation"}
                </h3>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleTranslate(selectedIssue.description)}
                  disabled={translating}
                >
                  {translating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {isBusiness ? "Translate to business" : "Translate to technical"}
                </Button>
              </div>
              {translated && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-fi-dark/40 p-3">
                    {translated}
                  </p>
                  <button
                    onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(translated)}
                    className="flex items-center gap-1 text-[10px] text-fi-text/50 hover:text-fi-text transition-colors"
                  >
                    {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {tts.isSpeaking ? "Stop" : "Listen to translation"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Language Translation EN <-> DE */}
          {selectedIssue.description && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-fi-text flex items-center gap-2">
                  <ArrowLeftRight className="h-3.5 w-3.5 accent-text" />
                  Language Translation
                </h3>
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
                    <button
                      onClick={() => { setLangDirection("en-de"); setLangTranslated(null); }}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${langDirection === "en-de" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
                    >
                      EN → DE
                    </button>
                    <button
                      onClick={() => { setLangDirection("de-en"); setLangTranslated(null); }}
                      className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${langDirection === "de-en" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
                    >
                      DE → EN
                    </button>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => handleLangTranslate(selectedIssue.description)}
                    disabled={langTranslating}
                  >
                    {langTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowLeftRight className="h-3 w-3" />}
                    {langTranslating ? "Translating..." : langDirection === "en-de" ? "Translate to German" : "Translate to English"}
                  </Button>
                </div>
              </div>
              {langTranslated && (
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-fi-dark/40 p-3">
                    {langTranslated}
                  </p>
                  <button
                    onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(langTranslated)}
                    className="flex items-center gap-1 text-[10px] text-fi-text/50 hover:text-fi-text transition-colors"
                  >
                    {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                    {tts.isSpeaking ? "Stop" : "Listen"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Labels */}
          {selectedIssue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIssue.labels.map((l) => (
                <span key={l} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-fi-text/50">{l}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Board / list view ──────────────────────────────────────────────
  const grouped = {
    todo: issues.filter((i) => i.status_category === "new"),
    inProgress: issues.filter((i) => i.status_category === "indeterminate"),
    done: issues.filter((i) => i.status_category === "done"),
  };

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="mx-auto max-w-5xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-fi-text flex items-center gap-2">
              <TicketCheck className="h-5 w-5 accent-text" />
              Jira Board
            </h2>
            <p className="text-xs text-fi-text/40">
              {isBusiness ? "Track project progress and deliverables" : "View and manage sprint issues"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {projects.length > 0 && (
              <select
                value={activeProject ?? ""}
                onChange={(e) => setActiveProject(e.target.value)}
                className="rounded-lg border border-white/[0.08] bg-fi-dark/50 px-2.5 py-1.5 text-xs text-fi-text focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.key} — {p.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="ghost" size="icon" onClick={() => activeProject && loadIssues(activeProject)}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="accent" size="sm" onClick={() => { setShowCreate(true); setCreated(null); }}>
              <Plus className="h-3 w-3" /> New Ticket
            </Button>
          </div>
        </div>

        {/* Create ticket modal */}
        {showCreate && (
          <div className="rounded-xl border accent-border bg-white/[0.04] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-fi-text">Create Ticket</h3>
              <button onClick={() => setShowCreate(false)} className="text-xs text-fi-text/40 hover:text-fi-text">Close</button>
            </div>

            <div className="flex gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
              <button
                onClick={() => setCreateMode("ai")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${createMode === "ai" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
              >
                <Sparkles className="mr-1 inline h-3 w-3" />AI Generate
              </button>
              <button
                onClick={() => setCreateMode("manual")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${createMode === "manual" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
              >
                Manual
              </button>
            </div>

            {createMode === "ai" ? (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    value={aiRequirement}
                    onChange={(e) => setAiRequirement(e.target.value)}
                    placeholder={voice.isListening ? "Listening... speak now" : "Describe the requirement in plain language, or use the mic..."}
                    className={`w-full rounded-lg border bg-fi-dark/50 px-3 py-2 pr-10 text-xs text-fi-text placeholder:text-fi-text/40 focus:outline-none min-h-[80px] resize-y ${voice.isListening ? "border-fi-red/40" : "border-white/[0.08]"}`}
                  />
                  {voice.supported && (
                    <button
                      type="button"
                      onClick={() => voice.isListening ? voice.stop() : voice.start()}
                      className={`absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        voice.isListening
                          ? "bg-fi-red/20 text-fi-red animate-pulse"
                          : "bg-white/[0.06] text-fi-text/40 hover:text-fi-text hover:bg-fi-magenta/10"
                      }`}
                    >
                      {voice.isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-fi-text/40">
                  {voice.isListening
                    ? "Listening... click mic or wait to stop"
                    : `AI will generate a ${isBusiness ? "business-focused" : "technical"} ticket with acceptance criteria`}
                </p>
                <Button variant="accent" size="sm" onClick={handleCreateAi} disabled={creating || !aiRequirement.trim()}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Generate & Create Ticket
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Summary..."
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/50 px-3 py-1.5 text-xs text-fi-text placeholder:text-fi-text/40 focus:outline-none"
                />
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description..."
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/50 px-3 py-2 text-xs text-fi-text placeholder:text-fi-text/40 focus:outline-none min-h-[60px] resize-y"
                />
                <Button variant="accent" size="sm" onClick={handleCreateManual} disabled={creating || !newSummary.trim()}>
                  {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Create Ticket
                </Button>
              </div>
            )}

            {created && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-xs text-emerald-400">
                  Created <a href={created.url} target="_blank" rel="noopener noreferrer" className="font-mono underline">{created.key}</a>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Board columns */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-fi-text/40" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["todo", "inProgress", "done"] as const).map((col) => {
              const colConfig = {
                todo: { label: "To Do", icon: Circle, color: "text-fi-text/50", count: grouped.todo.length },
                inProgress: { label: "In Progress", icon: Clock, color: "text-fi-purple", count: grouped.inProgress.length },
                done: { label: "Done", icon: CheckCircle2, color: "text-emerald-400", count: grouped.done.length },
              }[col];
              const ColIcon = colConfig.icon;
              const colIssues = grouped[col];

              return (
                <div key={col} className="rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <div className="flex items-center gap-2 border-b border-white/[0.08] px-3 py-2.5">
                    <ColIcon className={`h-3.5 w-3.5 ${colConfig.color}`} />
                    <span className="text-xs font-medium text-fi-text">{colConfig.label}</span>
                    <span className="ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-fi-text/40">
                      {colConfig.count}
                    </span>
                  </div>
                  <div className="space-y-1 p-2">
                    {colIssues.length === 0 ? (
                      <p className="py-4 text-center text-[11px] text-fi-text/30">No issues</p>
                    ) : (
                      colIssues.map((issue) => (
                        <div
                          key={issue.key}
                          className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-2.5 transition-colors hover:bg-fi-magenta/10 cursor-default"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] accent-text">{issue.key}</span>
                            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 text-[8px] text-fi-text/40">
                              {issue.issue_type}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-fi-text">{issue.summary}</p>
                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-fi-text/40">
                            <span>{issue.priority || "—"}</span>
                            <span>{issue.assignee || "Unassigned"}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
