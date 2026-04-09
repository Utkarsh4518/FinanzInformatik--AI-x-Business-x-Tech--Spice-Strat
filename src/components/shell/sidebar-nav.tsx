"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-1 px-3 py-4">
      {navItems.map((item) => {
        const active = item.href === "/"
          ? pathname === "/"
          : pathname?.startsWith(item.href.replace("#shared-spec", ""));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
              active ? "bg-primary text-white shadow-card" : "text-text-muted hover:bg-muted-surface hover:text-text"
            )}
          >
            <item.icon className="size-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
