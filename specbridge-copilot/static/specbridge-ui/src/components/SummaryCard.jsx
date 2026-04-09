export default function SummaryCard({ workspace, onPublishSummary, busy }) {
  return (
    <section className="card summary-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Latest AI Summary</p>
          <h2>What SpecBridge sees right now</h2>
        </div>
        <button className="ghost-button" type="button" onClick={onPublishSummary} disabled={busy}>
          Publish Jira comment
        </button>
      </div>

      <p className="section-copy">{workspace.ticketIntelligence.lastAISummary}</p>

      {workspace.clarificationThread.acceptanceCriteriaSuggestions.length ? (
        <div className="stack-xs">
          <strong className="subtle-heading">Acceptance criteria suggestions</strong>
          <ul className="list">
            {workspace.clarificationThread.acceptanceCriteriaSuggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {workspace.ticketIntelligence.availableTransitions?.length ? (
        <div className="stack-xs">
          <strong className="subtle-heading">Available transitions</strong>
          <ul className="tag-list">
            {workspace.ticketIntelligence.availableTransitions.map((transition) => (
              <li key={transition.id} className="tag tag-neutral">
                {transition.toStatus}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
