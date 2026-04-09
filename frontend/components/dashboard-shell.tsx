"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, Code2, Menu, MessageSquare, X } from "lucide-react";

import { useMode } from "@/lib/mode-context";
import { defaultOwner } from "@/lib/mock-data";
import type { JiraIssue, MainView, RepoSummary, SidebarTab } from "@/lib/types";
import { Sidebar } from "@/components/sidebar";
import { ProjectDashboard } from "@/components/project-dashboard";
import { ScenarioLibrary } from "@/components/scenario-library";
import { AiChatPanel } from "@/components/ai-chat-panel";
import { JiraBoard } from "@/components/jira-board";

export function DashboardShell() {
  const { mode, toggle, isBusiness } = useMode();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("projects");
  const [mainView, setMainView] = useState<MainView>("dashboard");
  const [selectedRepo, setSelectedRepo] = useState<RepoSummary | null>(null);
  const [selectedJiraIssue, setSelectedJiraIssue] = useState<JiraIssue | null>(null);
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

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Navbar */}
      <header className="relative z-50 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.08] px-4 backdrop-blur-2xl md:px-6" style={{ background: "linear-gradient(90deg, rgba(47,23,58,0.85), rgba(38,25,77,0.85))" }}>
        {/* Left: Logo + mobile toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenu((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-fi-text/60 md:hidden"
          >
            {mobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fi-gradient shadow-md shadow-fi-red/20">
              <span className="text-sm font-bold text-white">B</span>
            </div>
            <span className="font-display text-base font-semibold text-fi-text">
              Bridge
            </span>
          </div>
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
                ? "bg-fi-purple/20 text-fi-purple shadow-sm shadow-fi-purple/10"
                : "text-fi-text/40 hover:text-fi-text/70"
            }`}
          >
            <Code2 className="h-3 w-3" />
            Developer
          </button>
        </div>

        {/* Right: Chat toggle + avatar */}
        <div className="flex items-center gap-2">
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
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-fi-gradient text-[11px] font-bold text-white">
            U
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar -- desktop */}
        <div className="hidden w-64 shrink-0 md:block xl:w-72">
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onSelectRepo={setSelectedRepo}
            onSelectScenario={handleSelectScenario}
            onSelectJiraIssue={setSelectedJiraIssue}
            onViewChange={setMainView}
            selectedRepo={selectedRepo}
            owner={defaultOwner}
          />
        </div>

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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ScenarioLibrary onTryScenario={handleTryScenario} />
              </motion.div>
            ) : mainView === "jira" ? (
              <motion.div
                key="jira"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
  );
}
