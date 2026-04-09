"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  ExternalLink,
  GitFork,
  Loader2,
  Star,
  AlertCircle,
  ChevronLeft,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { fetchRepoDetail, translateLanguage, translateText } from "@/lib/api";
import { useTextToSpeech } from "@/lib/use-tts";
import type { RepoDetail, RepoSummary } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProjectDashboardProps = {
  selectedRepo: RepoSummary | null;
  onBack: () => void;
};

export function ProjectDashboard({ selectedRepo, onBack }: ProjectDashboardProps) {
  const { mode, isBusiness } = useMode();
  const tts = useTextToSpeech();
  const [detail, setDetail] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [translatedReadme, setTranslatedReadme] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [langTranslated, setLangTranslated] = useState<string | null>(null);
  const [langTranslating, setLangTranslating] = useState(false);
  const [langDirection, setLangDirection] = useState<"en-de" | "de-en">("en-de");

  useEffect(() => {
    if (!selectedRepo) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setTranslatedReadme(null);
    setLangTranslated(null);
    const [owner, repo] = selectedRepo.full_name.split("/");
    fetchRepoDetail(owner, repo)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch(() => { if (!cancelled) setDetail(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRepo]);

  function stripHtml(html: string): string {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || doc.body.innerText || "";
  }

  function getPlainReadme(): string {
    if (!detail?.readme) return "";
    return stripHtml(detail.readme).slice(0, 3000);
  }

  async function handleTranslate() {
    const plain = getPlainReadme();
    if (!plain) return;
    setTranslating(true);
    try {
      const target = isBusiness ? "business" : "developer";
      const result = await translateText(plain, target);
      setTranslatedReadme(result.translated);
    } catch {
      setTranslatedReadme("Translation failed. Make sure the backend is running.");
    } finally {
      setTranslating(false);
    }
  }

  async function handleLanguageTranslate() {
    const source = translatedReadme || getPlainReadme();
    if (!source) return;
    setLangTranslating(true);
    try {
      const [src, tgt] = langDirection === "en-de" ? ["en", "de"] : ["de", "en"];
      const result = await translateLanguage(source.slice(0, 3000), src, tgt, mode);
      setLangTranslated(result.rewritten_text || result.translated_text);
    } catch {
      setLangTranslated("Language translation failed. Please try again.");
    } finally {
      setLangTranslating(false);
    }
  }

  if (!selectedRepo) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl accent-bg">
            <ArrowLeftRight className="h-7 w-7 accent-text" />
          </div>
          <h2 className="text-lg font-semibold text-fi-text">Select a project</h2>
          <p className="mt-1 max-w-xs text-sm text-fi-text/40">
            Choose a repository from the sidebar to see its details through a{" "}
            {isBusiness ? "business" : "developer"} lens.
          </p>
        </div>
      </div>
    );
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
        Failed to load project details.
      </div>
    );
  }

  const totalLangBytes = Object.values(detail.languages).reduce((a, b) => a + b, 0) || 1;

  return (
    <motion.div
      key={detail.full_name}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full overflow-y-auto p-6"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 text-xs text-fi-text/40 hover:text-fi-text transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            All projects
          </button>
          <h1 className="text-2xl font-bold text-fi-text">{detail.name}</h1>
          <p className="mt-1 text-sm text-fi-text/50">{detail.description || "No description"}</p>
        </div>
        <a
          href={detail.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-fi-text/70 transition-colors hover:bg-white/[0.08]"
        >
          <ExternalLink className="h-3 w-3" />
          View on GitHub
        </a>
      </div>

      {/* Stats bar */}
      <div className="mb-6 flex flex-wrap gap-3">
        <StatPill icon={Star} label="Stars" value={detail.stargazers_count} />
        <StatPill icon={GitFork} label="Forks" value={detail.forks_count} />
        <StatPill icon={AlertCircle} label="Issues" value={detail.open_issues_count} />
        {detail.updated_at && (
          <StatPill
            icon={Calendar}
            label="Updated"
            value={new Date(detail.updated_at).toLocaleDateString()}
          />
        )}
      </div>

      {/* Language Translation EN <-> DE */}
      {(detail.readme || translatedReadme) && (
        <div className="mb-6 glass-elevated rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-fi-text flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 accent-text" />
              Language Translation
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
                <button
                  onClick={() => { setLangDirection("en-de"); setLangTranslated(null); }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${langDirection === "en-de" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
                >
                  EN → DE
                </button>
                <button
                  onClick={() => { setLangDirection("de-en"); setLangTranslated(null); }}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${langDirection === "de-en" ? "accent-bg accent-text" : "text-fi-text/40 hover:text-fi-text"}`}
                >
                  DE → EN
                </button>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={handleLanguageTranslate}
                disabled={langTranslating}
              >
                {langTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowLeftRight className="h-3 w-3" />}
                {langTranslating ? "Translating..." : `Translate ${langDirection === "en-de" ? "to German" : "to English"}`}
              </Button>
            </div>
          </div>
          {langTranslated && (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap rounded-lg border border-white/[0.08] bg-fi-dark/40 p-3">
                {langTranslated}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(langTranslated)}
                  className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                >
                  {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  {tts.isSpeaking ? "Stop" : "Listen"}
                </button>
                <button
                  onClick={() => setLangTranslated(null)}
                  className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                >
                  <ArrowLeftRight className="h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Business view: Project summary */}
        {isBusiness ? (
          <>
            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-semibold text-fi-text">Project Overview</h3>
              {translatedReadme ? (
                <div className="space-y-2">
                  <p className="text-sm leading-relaxed text-fi-text/70 whitespace-pre-wrap">{translatedReadme}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(translatedReadme)}
                      className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                    >
                      {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      {tts.isSpeaking ? "Stop" : "Listen"}
                    </button>
                    <button
                      onClick={() => setTranslatedReadme(null)}
                      className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Show original
                    </button>
                  </div>
                </div>
              ) : detail.readme ? (
                <div className="space-y-3">
                  <div
                    className="prose-markdown max-h-[300px] overflow-y-auto text-sm leading-relaxed text-fi-text/50"
                    dangerouslySetInnerHTML={{ __html: detail.readme }}
                  />
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleTranslate}
                    disabled={translating}
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {translating ? "Translating..." : "Translate to business language"}
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-fi-text/40">No README available</p>
              )}
            </div>

            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-semibold text-fi-text">Business Impact</h3>
              <div className="space-y-3">
                <InfoRow label="Category" value={detail.language || "Multi-platform"} />
                <InfoRow label="Team Activity" value={detail.open_issues_count > 0 ? "Active development" : "Stable"} />
                <InfoRow label="Community" value={`${detail.stargazers_count} stakeholders tracking`} />
                <InfoRow label="Last Activity" value={detail.updated_at ? new Date(detail.updated_at).toLocaleDateString() : "Unknown"} />
              </div>
              {detail.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {detail.topics.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Developer view */
          <>
            <div className="glass-elevated rounded-2xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-fi-text">Tech Stack</h3>
                <span className="text-[10px] text-fi-text/40">{detail.default_branch} branch</span>
              </div>
              {Object.keys(detail.languages).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(detail.languages)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, bytes]) => {
                      const pct = Math.round((bytes / totalLangBytes) * 100);
                      return (
                        <div key={lang} className="flex items-center gap-3">
                          <span className="w-20 text-xs text-fi-text/70">{lang}</span>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-fi-red via-fi-magenta to-fi-purple transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-[11px] text-fi-text/40">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-xs text-fi-text/40">No language data</p>
              )}
              {detail.topics.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {detail.topics.map((t) => (
                    <Badge key={t} className="font-mono">{t}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-elevated rounded-2xl p-5">
              <h3 className="mb-3 text-sm font-semibold text-fi-text">README</h3>
              {translatedReadme ? (
                <div className="space-y-2">
                  <pre className="max-h-[400px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-fi-text/70">{translatedReadme}</pre>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => tts.isSpeaking ? tts.stop() : tts.speak(translatedReadme)}
                      className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                    >
                      {tts.isSpeaking ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                      {tts.isSpeaking ? "Stop" : "Listen"}
                    </button>
                    <button
                      onClick={() => setTranslatedReadme(null)}
                      className="flex items-center gap-1 text-[11px] text-fi-text/40 hover:text-fi-text transition-colors"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      Show original
                    </button>
                  </div>
                </div>
              ) : detail.readme ? (
                <div className="space-y-3">
                  <div
                    className="prose-markdown max-h-[400px] overflow-y-auto text-xs leading-relaxed text-fi-text/50"
                    dangerouslySetInnerHTML={{ __html: detail.readme }}
                  />
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleTranslate}
                    disabled={translating}
                  >
                    <ArrowLeftRight className="h-3 w-3" />
                    {translating ? "Translating..." : "Translate to technical summary"}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-fi-text/40">No README available</p>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5">
      <Icon className="h-3.5 w-3.5 text-fi-text/40" />
      <span className="text-[11px] text-fi-text/40">{label}</span>
      <span className="text-xs font-medium text-fi-text">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-fi-text/40">{label}</span>
      <span className="text-xs font-medium text-fi-text/70">{value}</span>
    </div>
  );
}
