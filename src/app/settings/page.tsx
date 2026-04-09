"use client";

import { ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConnectionCard } from "@/components/settings/connection-card";
import type { ConnectionCardState } from "@/lib/types/domain";

const connections: ConnectionCardState[] = [
  {
    id: "llm",
    title: "LLM Provider",
    provider: "AI",
    description: "Primary text generation and embedding provider for analysis, diff explanation, and alignment.",
    configured: false,
    status: "warning",
    envKeys: ["LLM_PROVIDER", "LLM_API_KEY"]
  },
  {
    id: "elevenlabs",
    title: "ElevenLabs Voice",
    provider: "ElevenLabs",
    description: "Speech-to-text, text-to-speech, realtime voice collaboration, and dubbing services.",
    configured: false,
    status: "warning",
    envKeys: [
      "ELEVENLABS_API_KEY",
      "ELEVENLABS_VOICE_ID",
      "ELEVENLABS_TTS_MODEL",
      "ELEVENLABS_TTS_QUALITY_MODEL",
      "ELEVENLABS_STT_MODEL"
    ]
  },
  {
    id: "github",
    title: "GitHub",
    provider: "GitHub",
    description: "Repository indexing, PR fetching, and diff retrieval.",
    configured: false,
    status: "warning",
    envKeys: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"]
  },
  {
    id: "database",
    title: "Database",
    provider: "Postgres",
    description: "Workspace persistence, activity history, and shared spec versioning.",
    configured: false,
    status: "warning",
    envKeys: ["DATABASE_URL", "SESSION_SECRET"]
  },
  {
    id: "vector",
    title: "Vector Store",
    provider: "pgvector",
    description: "Semantic search for repository chunks and traceability evidence.",
    configured: false,
    status: "warning",
    envKeys: ["VECTOR_DB_URL", "VECTOR_DB_API_KEY"]
  },
  {
    id: "search",
    title: "Optional Search Provider",
    provider: "Search",
    description: "Optional enrichment for repository and documentation lookup.",
    configured: false,
    status: "missing",
    envKeys: ["OPTIONAL_SEARCH_PROVIDER_KEY"]
  },
  {
    id: "realtime",
    title: "Optional Realtime Service",
    provider: "Realtime",
    description: "Optional future transport for richer collaboration and shared cursors.",
    configured: false,
    status: "missing",
    envKeys: ["OPTIONAL_REALTIME_URL", "OPTIONAL_REALTIME_KEY"]
  }
];

export default function SettingsPage() {
  return (
    <AppShell title="Settings and Connections">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]} />
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-title">Security and Privacy</p>
                <h2 className="mt-2 text-xl font-semibold text-text">Server-side credentials only</h2>
              </div>
              <Badge variant="success">
                <ShieldCheck className="mr-1 size-3" />
                Secure by design
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-text-muted">
              Secrets are never exposed in the client. When providers are not configured, SpecBridge falls back to demo-safe mock responses so the prototype remains fully interactive.
            </p>
            <div className="rounded-xl border border-border/70 bg-muted-surface p-4 text-sm text-text">
              Privacy notice: repository contents and requirement text should be treated as confidential business information. Use server-side environment variables, rate-limited routes, and explicit user messaging when live providers are unavailable.
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          {connections.map((connection) => (
            <ConnectionCard key={connection.id} connection={connection} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
