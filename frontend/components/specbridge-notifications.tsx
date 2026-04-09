"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Loader2, Sparkles } from "lucide-react";

import { fetchSpecBridgeNotifications } from "@/lib/api";
import type { SpecBridgeNotificationResponse } from "@/lib/types";

function formatRelativeTime(value: string) {
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(0, Math.round((Date.now() - date) / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

export function SpecBridgeNotifications() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SpecBridgeNotificationResponse | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (!cancelled) {
          setError(null);
        }
        const next = await fetchSpecBridgeNotifications();
        if (!cancelled) {
          setPayload(next);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load notifications");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-fi-text/50 transition hover:text-fi-text"
        aria-label="Open SpecBridge notifications"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        {payload && payload.count > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-fi-gradient px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {payload.count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-[360px] rounded-3xl border border-white/[0.08] bg-[#120b1d]/95 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-fi-text">SpecBridge Notifications</p>
              <p className="mt-1 text-xs text-fi-text/45">
                Live Jira attention items for {payload?.viewer.displayName ?? "the connected user"}
              </p>
            </div>
            <Link
              href="/specbridge"
              className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-fi-text/70 transition hover:text-fi-text"
            >
              <Sparkles className="h-3 w-3" />
              Open
            </Link>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100/90">
              {error}
            </div>
          ) : null}

          {!loading && !error && (!payload || payload.items.length === 0) ? (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-fi-text/60">
              No active assignment or clarification alerts right now.
            </div>
          ) : null}

          {payload?.items.length ? (
            <div className="mt-4 space-y-3">
              {payload.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.07]"
                  onClick={() => setOpen(false)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-fi-text">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-fi-text/60">{item.message}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-fi-text/45">
                      {item.issueKey}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-fi-text/40">{formatRelativeTime(item.createdAt)}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
