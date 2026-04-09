"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  Folder,
  GitFork,
  Globe,
  Loader2,
  Search,
  Star,
  TicketCheck,
  UserPlus,
} from "lucide-react";

import { useMode } from "@/lib/mode-context";
import { fetchRepos, fetchJiraProjects, fetchJiraIssues } from "@/lib/api";
import { websites, scenarios as scenarioData } from "@/lib/mock-data";
import type { JiraIssue, JiraProject, MainView, RepoSummary, SidebarTab } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Code2,
  ArrowLeftRight,
  AlertTriangle,
  UserPlus,
};

type SidebarProps = {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onSelectRepo: (repo: RepoSummary) => void;
  onSelectScenario: (id: string) => void;
  onSelectJiraIssue: (issue: JiraIssue) => void;
  onViewChange: (view: MainView) => void;
  selectedRepo: RepoSummary | null;
  owner: string;
};

const tabs: { id: SidebarTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "projects", label: "Projects", icon: Folder },
  { id: "jira", label: "Jira", icon: TicketCheck },
  { id: "websites", label: "Websites", icon: Globe },
  { id: "scenarios", label: "Scenarios", icon: BookOpen },
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
  onSelectScenario,
  onSelectJiraIssue,
  onViewChange,
  selectedRepo,
  owner,
}: SidebarProps) {
  const { isBusiness } = useMode();
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

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
    <aside className="flex h-full w-full flex-col border-r border-white/[0.08]" style={{ background: "linear-gradient(180deg, rgba(47,23,58,0.6), rgba(26,14,34,0.8))" }}>
      {/* Tab switcher */}
      <div className="flex border-b border-white/[0.08]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                if (tab.id === "scenarios") onViewChange("scenarios");
                else if (tab.id === "jira") onViewChange("jira");
                else if (tab.id === "projects") onViewChange("dashboard");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-3 text-[11px] font-medium transition-colors ${
                isActive
                  ? "accent-text border-current"
                  : "border-transparent text-fi-text/40 hover:text-fi-text/70"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-fi-text/40" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-fi-text/40">No repositories found</p>
            ) : (
              <div className="space-y-0.5 px-2 pb-3">
                {filtered.map((repo) => (
                  <button
                    key={repo.full_name}
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
                        <p className="truncate text-xs font-medium text-fi-text">{repo.name}</p>
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
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "websites" && (
          <div className="space-y-1 p-3">
            {websites.map((site) => (
              <a
                key={site.url}
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
              </a>
            ))}
          </div>
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
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-fi-text/40" />
              </div>
            ) : filteredJira.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-fi-text/40">No issues found</p>
            ) : (
              <div className="space-y-0.5 px-2 pb-3">
                {filteredJira.map((issue) => {
                  const StatusIcon = statusIcon[issue.status_category] ?? Circle;
                  const statusColor =
                    issue.status_category === "done"
                      ? "text-emerald-400"
                      : issue.status_category === "indeterminate"
                        ? "text-fi-purple"
                        : "text-fi-text/40";
                  return (
                    <button
                      key={issue.key}
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
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "scenarios" && (
          <div className="space-y-1 p-3">
            {scenarioData.map((sc) => {
              const Icon = iconMap[sc.icon] ?? BookOpen;
              return (
                <button
                  key={sc.id}
                  onClick={() => {
                    onSelectScenario(sc.id);
                    onViewChange("scenarios");
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-fi-magenta/10"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md accent-bg">
                      <Icon className="h-3 w-3 accent-text" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-fi-text">{sc.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-fi-text/40">
                        {sc.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
