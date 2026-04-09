import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({
  items
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-2 text-sm text-text-muted" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {item.href ? <Link href={item.href}>{item.label}</Link> : <span className="text-text">{item.label}</span>}
          {index < items.length - 1 ? <ChevronRight className="size-4" /> : null}
        </span>
      ))}
    </nav>
  );
}
