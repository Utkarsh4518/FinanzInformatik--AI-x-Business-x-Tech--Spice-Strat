import type { ChatMessage, Scenario, Website } from "@/lib/types";

export const defaultOwner = "Utkarsh4518";

export const websites: Website[] = [
  {
    name: "ChefTreff Hackathon",
    url: "https://cheftreff.net",
    description: "The official ChefTreff community and hackathon hub",
    category: "Community",
  },
  {
    name: "FI Group Portal",
    url: "https://fi-group.com",
    description: "FI Group corporate site for innovation funding",
    category: "Corporate",
  },
  {
    name: "GitHub Organization",
    url: "https://github.com/Utkarsh4518",
    description: "Your GitHub profile with all repositories",
    category: "Development",
  },
  {
    name: "Internal Docs",
    url: "https://docs.example.com",
    description: "Internal engineering and product documentation wiki",
    category: "Documentation",
  },
];

export const scenarios: Scenario[] = [
  {
    id: "pm-architecture",
    title: "PM needs to understand a microservice",
    description:
      "A product manager reviews a new microservice repo and needs a plain-language summary of what it does, who it impacts, and the timeline risk.",
    businessPrompt: "Explain this project's purpose and business impact in simple terms. What problem does it solve for our customers?",
    developerPrompt: "Give me a technical architecture overview: what services does this interact with, what's the tech stack, and what are the key API endpoints?",
    icon: "Briefcase",
  },
  {
    id: "dev-requirements",
    title: "Developer translates business requirements",
    description:
      "A developer receives a business requirements doc and needs to break it down into technical tasks, user stories, and architecture decisions.",
    businessPrompt: "Summarize these technical tasks as business deliverables with expected outcomes and timelines.",
    developerPrompt: "Break this business requirement into technical user stories with acceptance criteria and architecture notes.",
    icon: "Code2",
  },
  {
    id: "jira-translation",
    title: "Translating Jira tickets across teams",
    description:
      "A Jira ticket written by the business team is unclear to developers. Bridge translates it into actionable technical scope.",
    businessPrompt: "Rewrite this ticket so a non-technical stakeholder can track progress and understand the impact.",
    developerPrompt: "Rewrite this ticket with clear technical acceptance criteria, edge cases, and API contract expectations.",
    icon: "ArrowLeftRight",
  },
  {
    id: "incident-report",
    title: "Incident report for both audiences",
    description:
      "After a production incident, create a summary that both executives and the engineering team can use.",
    businessPrompt: "Write an executive summary: what happened, customer impact, and what we're doing to prevent it.",
    developerPrompt: "Write a technical post-mortem: root cause analysis, timeline of events, and remediation steps with code references.",
    icon: "AlertTriangle",
  },
  {
    id: "onboarding",
    title: "New team member onboarding",
    description:
      "Help a new hire understand a project from their perspective -- business context for PMs, technical depth for engineers.",
    businessPrompt: "Give me a business overview of this project: goals, stakeholders, KPIs, and how success is measured.",
    developerPrompt: "Give me a developer onboarding guide: repo structure, how to run locally, key abstractions, and where to start reading code.",
    icon: "UserPlus",
  },
];

export const businessQuickPrompts = [
  "What does this project do in simple terms?",
  "What's the business impact and ROI?",
  "Summarize the project status for leadership.",
];

export const developerQuickPrompts = [
  "What's the tech stack and architecture?",
  "Show me the API endpoints and data models.",
  "How do I set up the dev environment?",
];

export const seedMessages: ChatMessage[] = [
  {
    id: "assistant-intro",
    role: "assistant",
    content:
      "Hi! I'm Bridge AI. I help business and tech teams understand each other. Ask me anything about your projects -- I'll explain it in a way that makes sense for your role.",
  },
];
