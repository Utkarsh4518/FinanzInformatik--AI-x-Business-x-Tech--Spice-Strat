import type { ReactNode } from "react";

type ShellPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ShellPanel({ title, description, children }: ShellPanelProps) {
  return (
    <section className="rounded-xl2 border border-line bg-panel/95 p-5 shadow-panel backdrop-blur-sm">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Workspace Panel
          </div>
          <h2 className="mt-2 text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
