"use client";

import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BookOpen,
  Briefcase,
  Code2,
  UserPlus,
} from "lucide-react";
import { motion } from "framer-motion";

import { useMode } from "@/lib/mode-context";
import { scenarios } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Briefcase,
  Code2,
  ArrowLeftRight,
  AlertTriangle,
  UserPlus,
};

type ScenarioLibraryProps = {
  onTryScenario: (prompt: string) => void;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export function ScenarioLibrary({ onTryScenario }: ScenarioLibraryProps) {
  const { mode, isBusiness } = useMode();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-fi-text">Scenario Library</h2>
        <p className="mt-1 text-sm text-fi-text/50">
          Pre-built collaboration scenarios for bridging {isBusiness ? "business" : "technical"} understanding.
          Click &quot;Try it&quot; to open any scenario in the AI chat.
        </p>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {scenarios.map((sc) => {
          const Icon = iconMap[sc.icon] ?? BookOpen;
          const prompt = isBusiness ? sc.businessPrompt : sc.developerPrompt;

          return (
            <motion.div
              key={sc.id}
              variants={item}
              className="glass-elevated flex flex-col rounded-2xl p-5"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl accent-bg">
                  <Icon className="h-5 w-5 accent-text" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-fi-text">{sc.title}</h3>
                </div>
              </div>

              <p className="mb-4 flex-1 text-xs leading-relaxed text-fi-text/50">
                {sc.description}
              </p>

              <div className="mb-3 rounded-lg border border-white/[0.08] bg-fi-dark/50 p-3">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-fi-text/40">
                  {isBusiness ? "Business" : "Developer"} prompt
                </span>
                <p className="text-xs leading-relaxed text-fi-text/70">{prompt}</p>
              </div>

              <Button
                variant="accent"
                size="sm"
                className="w-full justify-between"
                onClick={() => onTryScenario(prompt)}
              >
                <span>Try it in chat</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
