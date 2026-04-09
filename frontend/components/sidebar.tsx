"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  Folder,
  GitCommitHorizontal,
  GitFork,
  Globe,
  Loader2,
  Search,
  Star,
  TicketCheck,
} from "lucide-react";

import { motion } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchRepos, fetchJiraProjects, fetchJiraIssues, fetchCommits } from "@/lib/api";
import { websites } from "@/lib/mock-data";
import type { CommitSummary, JiraIssue, JiraProject, MainView, RepoSummary, SidebarTab } from "@/lib/types";



type SidebarProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelectRepo: (repo: RepoSummary) => void;
  onSelectJiraIssue: (issue: JiraIssue) => void;
  onSelectCommit: (commit: CommitSummary, repo: RepoSummary) => void;
  onViewChange: (view: MainView) => void;
  selectedRepo: RepoSummary | null;
  owner: string;
};

const tabs: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "commits", label: "Commits", icon: GitCommitHorizontal },
  { id: "jira", label: "Jira", icon: TicketCheck },
  { id: "websites", label: "Websites", icon: Globe },
];

const statusIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  done: CheckCircle2,
  new: Circle,
  indeterminate: Clock,
};

export function Sidebar({
  activeTab,
  onTabChange,
  onSelectRepo,
  onSelectJiraIssue,
  onSelectCommit,
  onViewChange,
  selectedRepo,
  owner,
}: SidebarProps) {
  const { isBusiness } = useMode();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [commits, setCommits] = useState<CommitSummary[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [commitsRepo, setCommitsRepo] = useState<string | null>(null);

  const [jiraProjects, setJiraProjects] = useState<JiraProject[]>([]);
  const [jiraIssues, setJiraIssues] = useState<JiraIssue[]>([]);
  const [selectedJiraProject, setSelectedJiraProject] = useState<string | null>(null);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraSearch, setJiraSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRepos(owner)
      .then((data) => {
        if (!cancelled) setRepos(data);
      })
      .catch(() => {
        if (!cancelled) setRepos([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [owner]);

  useEffect(() => {
    if (activeTab !== "jira") return;
    let cancelled = false;
    setJiraLoading(true);
    fetchJiraProjects()
      .then((p) => {
        if (!cancelled) {
          setJiraProjects(p);
          if (p.length > 0 && !selectedJiraProject) setSelectedJiraProject(p[0].key);
        }
      })
      .catch(() => { if (!cancelled) setJiraProjects([]); })
      .finally(() => { if (!cancelled) setJiraLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    if (!selectedJiraProject) return;
    let cancelled = false;
    setJiraLoading(true);
    fetchJiraIssues(selectedJiraProject)
      .then((issues) => { if (!cancelled) setJiraIssues(issues); })
      .catch(() => { if (!cancelled) setJiraIssues([]); })
      .finally(() => { if (!cancelled) setJiraLoading(false); });
    return () => { cancelled = true; };
  }, [selectedJiraProject]);

  useEffect(() => {
    if (activeTab !== "commits" || !commitsRepo) return;
    const [o, r] = commitsRepo.split("/");
    if (!o || !r) return;
    let cancelled = false;
    setCommitsLoading(true);
    fetchCommits(o, r, 7)
      .then((c) => { if (!cancelled) setCommits(c); })
      .catch(() => { if (!cancelled) setCommits([]); })
      .finally(() => { if (!cancelled) setCommitsLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, commitsRepo]);

  useEffect(() => {
    if (activeTab === "commits" && repos.length > 0 && !commitsRepo) {
      setCommitsRepo(repos[0].full_name);
    }
  }, [activeTab, repos, commitsRepo]);

  const filteredJira = jiraIssues.filter(
    (i) =>
      i.summary.toLowerCase().includes(jiraSearch.toLowerCase()) ||
      i.key.toLowerCase().includes(jiraSearch.toLowerCase()),
  );

  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <aside className="flex h-full w-full flex-col border-r border-white/[0.08]" style={{ background: isBusiness ? "linear-gradient(180deg, rgba(47,23,58,0.6), rgba(26,14,34,0.8))" : "rgba(10,10,10,0.9)" }}>
      {/* Tab switcher */}
      <div className="overflow-x-auto border-b border-white/[0.08]">
        <div className="flex w-max min-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  if (tab.id === "jira") onViewChange("jira");
                  else if (tab.id === "commits") onViewChange("dashboard");
                  else if (tab.id === "projects") onViewChange("dashboard");
                }}
                className={`flex shrink-0 items-center justify-center gap-1.5 border-b-2 px-3.5 py-3 text-[11px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "accent-text border-current"
                    : "border-transparent text-fi-text/40 hover:text-fi-text/70"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {activeTab === "projects" && (
          <div className="flex flex-col">
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fi-text/40" />
                <input
                  type="text"
                  placeholder="Search repos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 py-1.5 pl-8 pr-3 text-xs text-fi-text placeholder:text-fi-text/40 focus:outline-none focus:border-[rgb(var(--accent)/0.3)]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-2 px-3 py-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-6 w-6 shrink-0 rounded-md" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-fi-text/40">No repositories found</p>
            ) : (
              <motion.div
                className="space-y-0.5 px-2 pb-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {filtered.map((repo) => (
                  <motion.button
                    key={repo.full_name}
                    variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    onClick={() => {
                      onSelectRepo(repo);
                      onViewChange("project-detail");
                    }}
                    className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                      selectedRepo?.full_name === repo.full_name
                        ? "accent-bg accent-border border"
                        : "hover:bg-fi-magenta/10"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
                        <Code2 className="h-3 w-3 text-fi-text/50" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-medium text-fi-text leading-snug break-words" title={repo.name}>{repo.name}</p>
                          {repo.fork && (
                            <span className="flex shrink-0 items-center gap-0.5 rounded border border-fi-magenta/20 bg-fi-magenta/10 px-1 py-0.5 text-[9px] font-medium text-fi-magenta">
                              <GitFork className="h-2 w-2" />
                              Fork
                            </span>
                          )}
                        </div>
                        {isBusiness ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-fi-text/40">
                            {repo.description || "Software project"}
                          </p>
                        ) : (
                          <div className="mt-1 flex items-center gap-2 text-[10px] text-fi-text/40">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-fi-purple" />
                                {repo.language}
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Star className="h-2.5 w-2.5" />
                              {repo.stargazers_count}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <GitFork className="h-2.5 w-2.5" />
                              {repo.forks_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {activeTab === "websites" && (
          <motion.div
            className="space-y-1 p-3"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {websites.map((site) => (
              <motion.a
                key={site.url}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.25 }}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-colors hover:bg-fi-magenta/10"
              >
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.05]">
                  <Globe className="h-3 w-3 text-fi-text/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-fi-text">{site.name}</span>
                    <ExternalLink className="h-2.5 w-2.5 text-fi-text/40" />
                  </div>
                  <p className="mt-0.5 text-[11px] text-fi-text/40">{site.description}</p>
                </div>
                <span className="mt-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-fi-text/40">
                  {site.category}
                </span>
              </motion.a>
            ))}
          </motion.div>
        )}

        {activeTab === "jira" && (
          <div className="flex flex-col">
            {/* Project selector */}
            {jiraProjects.length > 0 && (
              <div className="border-b border-white/[0.08] p-3">
                <select
                  value={selectedJiraProject ?? ""}
                  onChange={(e) => setSelectedJiraProject(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 px-2.5 py-1.5 text-xs text-fi-text focus:outline-none"
                >
                  {jiraProjects.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.key} — {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fi-text/40" />
                <input
                  type="text"
                  placeholder="Search issues..."
                  value={jiraSearch}
                  onChange={(e) => setJiraSearch(e.target.value)}
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 py-1.5 pl-8 pr-3 text-xs text-fi-text placeholder:text-fi-text/40 focus:outline-none"
                />
              </div>
            </div>

            {jiraLoading ? (
              <div className="space-y-2 px-3 py-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-3.5 w-3.5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredJira.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-fi-text/40">No issues found</p>
            ) : (
              <motion.div
                className="space-y-0.5 px-2 pb-3"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {filteredJira.map((issue) => {
                  const StatusIcon = statusIcon[issue.status_category] ?? Circle;
                  const statusColor =
                    issue.status_category === "done"
                      ? "text-emerald-400"
                      : issue.status_category === "indeterminate"
                        ? "text-fi-purple"
                        : "text-fi-text/40";
                  return (
                    <motion.button
                      key={issue.key}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      onClick={() => {
                        onSelectJiraIssue(issue);
                        onViewChange("jira");
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fi-magenta/10"
                    >
                      <div className="flex items-start gap-2">
                        <StatusIcon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${statusColor}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono accent-text">{issue.key}</span>
                            <span className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 text-[9px] text-fi-text/40">
                              {issue.issue_type}
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-fi-text">{issue.summary}</p>
                          {isBusiness ? (
                            <p className="mt-0.5 text-[10px] text-fi-text/40">{issue.status} · {issue.assignee || "Unassigned"}</p>
                          ) : (
                            <p className="mt-0.5 text-[10px] text-fi-text/40">{issue.priority} · {issue.status}</p>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}



        {activeTab === "commits" && (
          <div className="flex flex-col">
            {repos.length > 0 && (
              <div className="border-b border-white/[0.08] p-3">
                <select
                  value={commitsRepo ?? ""}
                  onChange={(e) => { setCommitsRepo(e.target.value); setCommits([]); }}
                  className="w-full rounded-lg border border-white/[0.08] bg-fi-dark/60 px-2.5 py-1.5 text-xs text-fi-text focus:outline-none"
                >
                  {repos.map((r) => (
                    <option key={r.full_name} value={r.full_name}>{r.name}</option>
                  ))}
                </select>
              </div>
            )}

            {commitsLoading ? (
              <div className="space-y-2 px-3 py-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-2.5 w-16" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : commits.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-fi-text/40">
                {commitsRepo ? "No commits found" : "Select a repository"}
              </p>
            ) : (
              <motion.div
                className="space-y-0.5 px-2 pb-3 pt-1"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              >
                {commits.map((c) => {
                  const repoObj = repos.find((r) => r.full_name === commitsRepo);
                  const shortSha = c.sha.slice(0, 7);
                  const firstLine = c.message.split("\n")[0];
                  const relDate = timeAgo(c.date);
                  return (
                    <motion.button
                      key={c.sha}
                      variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      onClick={() => { if (repoObj) { onSelectCommit(c, repoObj); onViewChange("commit-detail"); } }}
                      className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fi-magenta/10"
                    >
                      <div className="flex items-start gap-2">
                        {c.author_avatar_url ? (
                          <img src={c.author_avatar_url} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
                        ) : (
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                            <GitCommitHorizontal className="h-2.5 w-2.5 text-fi-text/50" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] accent-text">{shortSha}</span>
                            <span className="text-[10px] text-fi-text/30">{relDate}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-fi-text leading-snug">{firstLine}</p>
                          <p className="mt-0.5 text-[10px] text-fi-text/40">{c.author_name}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
