"use client";

import { Command, PanelRightOpen, Settings2, Wifi } from "lucide-react";
import Link from "next/link";
import { APP_NAME, roleOptions } from "@/lib/constants";
import { formatLastUpdated } from "@/lib/utils";
import { useWorkspaceStore } from "@/lib/state/workspace-store";
import { useUIStore } from "@/lib/state/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function HeaderBar({ title }: { title: string }) {
  const workspace = useWorkspaceStore((state) => state.activeWorkspace);
  const roleMode = useWorkspaceStore((state) => state.roleMode);
  const setRoleMode = useWorkspaceStore((state) => state.setRoleMode);
  const setCommandPaletteOpen = useUIStore((state) => state.setCommandPaletteOpen);
  const timelineOpen = useUIStore((state) => state.timelineOpen);
  const setTimelineOpen = useUIStore((state) => state.setTimelineOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex min-h-[76px] items-center gap-4 px-5">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-white">
            SB
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Trusted Delivery</p>
            <p className="text-sm font-semibold text-text">{APP_NAME}</p>
          </div>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Workspace Context</p>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-xl font-semibold text-text">{title}</h1>
            <span className="hidden text-sm text-text-muted lg:inline">
              Last updated {formatLastUpdated(workspace.updatedAt)}
            </span>
          </div>
        </div>

        <div className="hidden items-center gap-2 xl:flex">
          <Badge variant="success">
            <Wifi className="mr-1 size-3" />
            Demo Ready
          </Badge>
          <Badge variant={process.env.NEXT_PUBLIC_SUPABASE_URL ? "success" : "warning"}>Database</Badge>
          <Badge variant="warning">LLM</Badge>
        </div>

        <div className="w-40">
          <Select value={roleMode} onChange={(value) => setRoleMode(value as typeof roleMode)} options={roleOptions.map((option) => ({ ...option }))} />
        </div>

        <Button variant="secondary" size="sm" onClick={() => setCommandPaletteOpen(true)}>
          <Command className="size-4" />
          Palette
        </Button>

        <Button variant="secondary" size="sm" onClick={() => setTimelineOpen(!timelineOpen)}>
          <PanelRightOpen className="size-4" />
          Timeline
        </Button>

        <Button asChild variant="ghost" size="sm">
          <Link href="/settings">
            <Settings2 className="size-4" />
            Settings
          </Link>
        </Button>
      </div>
    </header>
  );
}
