import { formatConfidence } from "../lib/formatters";

export default function AssignmentAdvisor({ workspace, onAssign, onRefresh, onSeedProfiles, busy }) {
  const topCandidate = workspace.recommendation.topCandidates[0];
  const clarifyFirst = workspace.recommendation.clarifyFirst;

  return (
    <section className="card assignment-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Assignment Advisor</p>
          <h2>{clarifyFirst ? "Clarification recommended before assignment" : topCandidate ? topCandidate.displayName : "No recommendation yet"}</h2>
        </div>
        <div className="section-actions">
          <button className="ghost-button" type="button" onClick={onRefresh} disabled={busy}>
            Refresh analysis
          </button>
          <button className="ghost-button" type="button" onClick={onSeedProfiles} disabled={busy}>
            Refresh profiles
          </button>
        </div>
      </div>

      <div className="stack-sm">
        <div className="pill-row">
          <span className={`pill ${clarifyFirst ? "pill-warn" : "pill-good"}`}>
            {clarifyFirst ? "Clarify first" : "Recommendation ready"}
          </span>
          <span className="pill pill-neutral">Confidence: {formatConfidence(workspace.ticketIntelligence.confidence)}</span>
          {topCandidate ? <span className="pill pill-neutral">Match score: {topCandidate.totalScore}/100</span> : null}
        </div>

        <p className="section-copy">{workspace.ticketIntelligence.assignmentReason}</p>

        {workspace.ticketIntelligence.assignmentRisks.length ? (
          <div className="stack-xs">
            <strong className="subtle-heading">Risks</strong>
            <ul className="tag-list">
              {workspace.ticketIntelligence.assignmentRisks.map((risk) => (
                <li key={risk} className="tag tag-risk">
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {clarifyFirst && workspace.recommendation.missingQuestions.length ? (
          <div className="stack-xs">
            <strong className="subtle-heading">Missing questions</strong>
            <ul className="list">
              {workspace.recommendation.missingQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {!clarifyFirst && topCandidate?.isAssignable ? (
          <button className="primary-button" type="button" onClick={() => onAssign(topCandidate.accountId)} disabled={busy}>
            Assign {topCandidate.displayName}
          </button>
        ) : null}
      </div>
    </section>
  );
}
