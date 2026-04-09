import type { ReactNode } from "react";

type ShellPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ShellPanel({ title, description, children }: ShellPanelProps) {
  return (
    <section className="rounded-xl2 border border-line bg-panel p-6 shadow-panel">
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-line/90 pb-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accentMuted">
            Workspace Panel
          </div>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}
