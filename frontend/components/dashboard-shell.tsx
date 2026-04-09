"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Code2, Menu, MessageSquare, X } from "lucide-react";

import { useMode } from "@/lib/mode-context";
import { defaultOwner } from "@/lib/mock-data";
import type { CommitSummary, JiraIssue, MainView, RepoSummary, SidebarTab } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { ProjectDashboard } from "@/components/project-dashboard";
import { ScenarioLibrary } from "@/components/scenario-library";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { JiraBoard } from "@/components/jira-board";
import { CommitDetail } from "@/components/commit-detail";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function DashboardShell() {
  const { mode, toggle, isBusiness } = useMode();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("projects");
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [selectedRepo, setSelectedRepo] = useState<RepoSummary | null>(null);
  const [selectedJiraIssue, setSelectedJiraIssue] = useState<JiraIssue | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<CommitSummary | null>(null);
  const [commitRepo, setCommitRepo] = useState<RepoSummary | null>(null);
  const [chatPrefill, setChatPrefill] = useState<string | undefined>();
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleSelectScenario = useCallback((_id: string) => {
    setMainView("scenarios");
  }, []);

  const handleTryScenario = useCallback((prompt: string) => {
    setChatPrefill(prompt);
    setMainView("chat");
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRepo(null);
    setMainView("dashboard");
  }, []);

  const handleJiraBack = useCallback(() => {
    setSelectedJiraIssue(null);
  }, []);

  const handleSelectCommit = useCallback((commit: CommitSummary, repo: RepoSummary) => {
    setSelectedCommit(commit);
    setCommitRepo(repo);
    setMainView("commit-detail");
  }, []);

  const handleCommitBack = useCallback(() => {
    setSelectedCommit(null);
    setCommitRepo(null);
    setMainView("dashboard");
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Navbar */}
      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4 backdrop-blur-2xl md:px-6"
        style={{ background: isBusiness ? "linear-gradient(90deg, rgba(47,23,58,0.85), rgba(38,25,77,0.85))" : "rgba(10,10,10,0.95)" }}
      >
        {/* Left: Logo + mobile toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenu((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-fi-text/60 md:hidden"
          >
            {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <motion.div
            className="flex items-center gap-2.5"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-md transition-all duration-500 ${isBusiness ? "bg-fi-gradient shadow-fi-red/20" : "bg-white shadow-white/10"}`}>
              <span className={`text-sm font-bold ${isBusiness ? "text-white" : "text-black"}`}>B</span>
            </div>
            <span className="font-display text-base font-semibold text-fi-text">
              Bridge
            </span>
          </motion.div>
        </div>

        {/* Center: Mode toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.04] p-1">
          <button
            onClick={() => { if (!isBusiness) toggle(); }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
              isBusiness
                ? "bg-fi-red/15 text-fi-red shadow-sm shadow-fi-red/10"
                : "text-fi-text/40 hover:text-fi-text/70"
            }`}
          >
            <Briefcase className="h-3 w-3" />
            Business
          </button>
          <button
            onClick={() => { if (isBusiness) toggle(); }}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
              !isBusiness
                ? "bg-white/15 text-white shadow-sm shadow-white/5"
                : "text-fi-text/40 hover:text-fi-text/70"
            }`}
          >
            <Code2 className="h-3 w-3" />
            Developer
          </button>
        </div>

        {/* Right: Chat toggle + avatar */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMainView(mainView === "chat" ? "dashboard" : "chat")}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                  mainView === "chat"
                    ? "accent-bg accent-text"
                    : "bg-white/[0.06] text-fi-text/50 hover:text-fi-text"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {mainView === "chat" ? "Close chat" : "Open AI chat"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="h-7 w-7 cursor-default">
                <AvatarFallback className="bg-fi-gradient text-[11px] font-bold text-white">
                  U
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">Utkarsh</TooltipContent>
          </Tooltip>
        </div>
      </motion.header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar -- desktop */}
        <motion.div
          initial={{ x: -64, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          className="hidden w-64 shrink-0 md:block xl:w-72"
        >
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onSelectRepo={setSelectedRepo}
            onSelectScenario={handleSelectScenario}
            onSelectJiraIssue={setSelectedJiraIssue}
            onSelectCommit={handleSelectCommit}
            onViewChange={setMainView}
            selectedRepo={selectedRepo}
            owner={defaultOwner}
          />
        </motion.div>

        {/* Sidebar -- mobile overlay */}
        <AnimatePresence>
          {mobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 md:hidden"
                onClick={() => setMobileMenu(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-13 bottom-0 z-50 w-72 md:hidden"
              >
                <Sidebar
                  activeTab={sidebarTab}
                  onTabChange={(tab) => { setSidebarTab(tab); setMobileMenu(false); }}
                  onSelectRepo={(repo) => { setSelectedRepo(repo); setMobileMenu(false); }}
                  onSelectScenario={(id) => { handleSelectScenario(id); setMobileMenu(false); }}
                  onSelectJiraIssue={(issue) => { setSelectedJiraIssue(issue); setMobileMenu(false); }}
                  onSelectCommit={(c, r) => { handleSelectCommit(c, r); setMobileMenu(false); }}
                  onViewChange={(view) => { setMainView(view); setMobileMenu(false); }}
                  selectedRepo={selectedRepo}
                  owner={defaultOwner}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {mainView === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                <AiChatPanel
                  prefillPrompt={chatPrefill}
                  clearPrefill={() => setChatPrefill(undefined)}
                />
              </motion.div>
            ) : mainView === "scenarios" ? (
              <motion.div
                key="scenarios"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                <ScenarioLibrary onTryScenario={handleTryScenario} />
              </motion.div>
            ) : mainView === "commit-detail" && selectedCommit && commitRepo ? (
              <motion.div
                key="commit-detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                <CommitDetail
                  commit={selectedCommit}
                  repo={commitRepo}
                  onBack={handleCommitBack}
                />
              </motion.div>
            ) : mainView === "jira" ? (
              <motion.div
                key="jira"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="h-full"
              >
                <JiraBoard
                  selectedIssue={selectedJiraIssue}
                  onBack={handleJiraBack}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full"
              >
                <ProjectDashboard
                  selectedRepo={selectedRepo}
                  onBack={handleBack}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
    </TooltipProvider>
  );
}
