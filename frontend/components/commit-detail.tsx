"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCode,
  FileMinus,
  FilePlus,
  FileText,
  Loader2,
  Minus,
  Plus,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { explainCommit, fetchCommitDetail, translateLanguage } from "@/lib/api";
import { useTextToSpeech } from "@/lib/use-tts";
import type { CommitDetail as CommitDetailType, CommitFile, CommitSummary, RepoSummary } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ContextualChat } from "@/components/contextual-chat";

type CommitDetailProps = {
  commit: CommitSummary;
  repo: RepoSummary;
  onBack: () => void;
};

const statusLabel: Record<string, { label: string; icon: typeof FilePlus; color: string }> = {
  added: { label: "Added", icon: FilePlus, color: "text-emerald-400" },
  removed: { label: "Removed", icon: FileMinus, color: "text-red-400" },
  modified: { label: "Modified", icon: FileCode, color: "text-amber-400" },
  renamed: { label: "Renamed", icon: FileText, color: "text-blue-400" },
};

export function CommitDetail({ commit, repo, onBack }: CommitDetailProps) {
  const { mode, isBusiness } = useMode();
  const tts = useTextToSpeech();

  const [detail, setDetail] = useState<CommitDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [langTranslated, setLangTranslated] = useState<string | null>(null);
  const [langTranslating, setLangTranslating] = useState(false);

  const [owner, repoName] = repo.full_name.split("/");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setExplanation(null);
    setLangTranslated(null);
    fetchCommitDetail(owner, repoName, commit.sha)
      .then((d) => { if (!cancelled) setDetail(d); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [owner, repoName, commit.sha]);

  async function handleExplain() {
    setExplaining(true);
    try {
      const result = await explainCommit(owner, repoName, commit.sha, mode);
      setExplanation(result.explanation);
    } catch {
      setExplanation("Could not generate explanation. Please try again.");
    } finally {
      setExplaining(false);
    }
  }

  async function handleTranslateExplanation() {
    if (!explanation) return;
    setLangTranslating(true);
    try {
      const result = await translateLanguage(explanation.slice(0, 3000), "en", "de", mode);
      setLangTranslated(result.rewritten_text || result.translated_text);
    } catch {
      setLangTranslated("Translation failed.");
    } finally {
      setLangTranslating(false);
    }
  }

  function toggleFile(filename: string) {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-fi-text/40" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-fi-text/40">
        Failed to load commit details.
      </div>
    );
  }

  const firstLine = detail.message.split("\n")[0];
  const restLines = detail.message.split("\n").slice(1).join("\n").trim();

  // Build context for the contextual chat
  const chatContext = [
    `Repository: ${repo.full_name}`,
    `Commit: ${detail.sha.slice(0, 7)} by ${detail.author_name}`,
    `Message: ${detail.message}`,
    `Stats: +${detail.additions} -${detail.deletions} across ${detail.file_count} files`,
    `\nFiles changed:`,
    ...detail.files.slice(0, 15).map(f =>
      `- ${f.filename} (${f.status}): +${f.additions} -${f.deletions}${f.patch ? `\n${f.patch.slice(0, 500)}` : ""}`
    ),
  ].join("\n");

  const commitQuickPrompts = isBusiness
    ? ["What does this update mean for the product?", "Any risks for users?", "Summarize for my report"]
    : ["Review the code quality", "What patterns are used?", "Any tech debt introduced?"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto p-5"
    >
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-fi-text/50 hover:text-fi-text transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back
          </button>
          <a
            href={detail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs accent-text hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> View on GitHub
          </a>
        </div>

        {/* Commit header */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-start gap-3">
            {detail.author_avatar_url ? (
              <img src={detail.author_avatar_url} alt="" className="h-10 w-10 rounded-full" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-fi-text/50 text-sm font-bold">
                {detail.author_name[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-semibold text-fi-text leading-snug">{firstLine}</h1>
              {restLines && (
                <pre className="mt-2 whitespace-pre-wrap text-xs text-fi-text/50 leading-relaxed">{restLines}</pre>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-fi-text/40">
                <span className="font-mono accent-text">{detail.sha.slice(0, 7)}</span>
                <span>{detail.author_name}</span>
                <span>{detail.date ? new Date(detail.date).toLocaleString() : ""}</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-3 flex items-center gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <Plus className="h-3 w-3" />{detail.additions}
            </span>
            <span className="flex items-center gap-1 text-red-400">
              <Minus className="h-3 w-3" />{detail.deletions}
            </span>
            <span className="text-fi-text/40">{detail.file_count} file{detail.file_count !== 1 ? "s" : ""} changed</span>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-fi-text flex items-center gap-2">
              <Sparkles className="h-4 w-4 accent-text" />
              {isBusiness ? "What Changed (Plain English)" : "Technical Analysis"}
            </h3>
            {!explanation && (
              <Button variant="accent" size="sm" onClick={handleExplain} disabled={explaining}>
                {explaining ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {explaining ? "Analyzing..." : "Explain this commit"}
              </Button>
            )}
          </div>

          {explanation && (
            <div className="space-y-3">
              <div className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-fi-dark/40 p-3">
                {explanation}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(explanation)}
                  className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                >
                  {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {tts.isSpeaking ? "Stop" : "Listen"}
                </button>
                <button
                  onClick={handleTranslateExplanation}
                  disabled={langTranslating}
                  className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors disabled:opacity-50"
                >
                  {langTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowLeftRight className="h-3 w-3" />}
                  Translate to German
                </button>
                <button
                  onClick={() => { setExplanation(null); setLangTranslated(null); }}
                  className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                >
                  Re-analyze
                </button>
              </div>
              {langTranslated && (
                <div className="text-sm leading-relaxed text-fi-text/60 whitespace-pre-wrap rounded-lg border border-fi-magenta/20 bg-fi-dark/40 p-3">
                  <span className="mb-1 block text-[9px] font-medium uppercase tracking-wider text-fi-magenta/60">German</span>
                  {langTranslated}
                </div>
              )}
            </div>
          )}

          {!explanation && !explaining && (
            <p className="text-xs text-fi-text/30">
              {isBusiness
                ? "Click to get a plain-language explanation of what this update means for the product."
                : "Click to get a technical code review and architecture analysis."}
            </p>
          )}
        </div>

        {/* Files changed */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-fi-text">
            {isBusiness ? "What was updated" : "Files changed"}
          </h3>

          {detail.files.map((file) => {
            const info = statusLabel[file.status] || statusLabel.modified;
            const Icon = info.icon;
            const isExpanded = expandedFiles.has(file.filename);

            return (
              <motion.div
                key={file.filename}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden"
              >
                <button
                  onClick={() => toggleFile(file.filename)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-fi-text/40 shrink-0" /> : <ChevronRight className="h-3 w-3 text-fi-text/40 shrink-0" />}
                  <Icon className={`h-3.5 w-3.5 shrink-0 ${info.color}`} />

                  {isBusiness ? (
                    <span className="flex-1 text-xs text-fi-text">
                      <span className={info.color}>{info.label}</span>{" "}
                      {file.filename.split("/").pop()}
                    </span>
                  ) : (
                    <span className="flex-1 font-mono text-xs text-fi-text truncate">{file.filename}</span>
                  )}

                  <span className="flex items-center gap-2 text-[10px] shrink-0">
                    {file.additions > 0 && <span className="text-emerald-400">+{file.additions}</span>}
                    {file.deletions > 0 && <span className="text-red-400">-{file.deletions}</span>}
                  </span>
                </button>

                {isExpanded && file.patch && (
                  <div className="border-t border-white/[0.06] bg-fi-dark/30 p-0 overflow-x-auto">
                    {isBusiness ? (
                      <div className="p-3 text-xs text-fi-text/50">
                        <p>
                          This file had <span className="text-emerald-400">{file.additions} addition{file.additions !== 1 ? "s" : ""}</span>
                          {file.deletions > 0 && <> and <span className="text-red-400">{file.deletions} removal{file.deletions !== 1 ? "s" : ""}</span></>}.
                        </p>
                      </div>
                    ) : (
                      <DiffView patch={file.patch} />
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Contextual Chat */}
      <ContextualChat
        context={chatContext}
        contextLabel={`Commit ${detail.sha.slice(0, 7)} in ${repo.name}`}
        quickPrompts={commitQuickPrompts}
      />
    </motion.div>
  );
}

function DiffView({ patch }: { patch: string }) {
  const lines = patch.split("\n");
  return (
    <pre className="text-[11px] leading-relaxed font-mono">
      {lines.map((line, i) => {
        let bg = "";
        let textColor = "text-fi-text/50";
        if (line.startsWith("+") && !line.startsWith("+++")) {
          bg = "bg-emerald-400/8";
          textColor = "text-emerald-300/80";
        } else if (line.startsWith("-") && !line.startsWith("---")) {
          bg = "bg-red-400/8";
          textColor = "text-red-300/80";
        } else if (line.startsWith("@@")) {
          bg = "bg-blue-400/8";
          textColor = "text-blue-300/60";
        }
        return (
          <div key={i} className={`px-3 py-0.5 ${bg} ${textColor}`}>
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
