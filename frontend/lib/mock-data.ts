import type { ChatMessage, Website } from "@/lib/types";

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
