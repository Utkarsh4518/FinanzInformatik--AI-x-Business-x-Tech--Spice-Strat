import type { ReactNode } from "react";

type ShellPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function ShellPanel({ title, description, children }: ShellPanelProps) {
  return (
    <section className="rounded-xl2 border border-line bg-panel p-5 shadow-panel">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
