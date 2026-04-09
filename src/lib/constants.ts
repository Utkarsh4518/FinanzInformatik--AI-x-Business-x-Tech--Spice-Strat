import {
  Activity,
  BookCheck,
  Braces,
  FileSearch,
  FolderGit2,
  LayoutDashboard,
  PlayCircle,
  Settings2,
  Sparkles
} from "lucide-react";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "SpecBridge";

export const roleOptions = [
  { value: "business", label: "Business" },
  { value: "developer", label: "Developer" },
  { value: "reviewer", label: "Reviewer" }
] as const;

export const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "New Requirement", icon: Sparkles },
  { href: "/workspace#shared-spec", label: "Shared Spec", icon: BookCheck },
  { href: "/codebase", label: "Codebase", icon: FolderGit2 },
  { href: "/alignment", label: "Alignment", icon: FileSearch },
  { href: "/pr-summary", label: "PR Summary", icon: Braces },
  { href: "/activity", label: "Activity Log", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings2 },
  { href: "/demo", label: "Demo Data", icon: PlayCircle }
];

export const vaguePhrases = [
  "simple",
  "fast",
  "easy",
  "clean",
  "secure",
  "modern",
  "clear",
  "real-time"
];

export const demoRequirementText =
  "Add a loan term calculation feature to the existing loan calculator so a user can enter loan amount, interest rate, and monthly payment to calculate how many months are needed to repay the loan.";
