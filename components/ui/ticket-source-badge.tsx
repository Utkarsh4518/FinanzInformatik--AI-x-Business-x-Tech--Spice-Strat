import type { Ticket } from "@/lib/domain/models";

type TicketSourceBadgeProps = {
  ticket: Pick<
    Ticket,
    "sourceType" | "externalKey" | "lastSyncedAt"
  >;
  showTimestamp?: boolean;
};

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not synced yet";
  }

  return new Date(value).toLocaleString();
}

export function TicketSourceBadge({
  ticket,
  showTimestamp = false
}: TicketSourceBadgeProps) {
  const isJira = ticket.sourceType === "jira";
  const label = isJira ? ticket.externalKey ?? "Jira" : "Local";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
        isJira
          ? "border-accent/15 bg-accentSoft text-accent"
          : "border-line bg-panelSoft text-slate-600"
      }`}
      title={
        showTimestamp
          ? `${isJira ? "Imported from Jira" : "Created inside BridgeFlow"} - ${formatTimestamp(ticket.lastSyncedAt)}`
          : undefined
      }
    >
      <span>{label}</span>
      {showTimestamp ? (
        <span className="font-medium normal-case tracking-normal text-slate-500">
          {formatTimestamp(ticket.lastSyncedAt)}
        </span>
      ) : null}
    </span>
  );
}
