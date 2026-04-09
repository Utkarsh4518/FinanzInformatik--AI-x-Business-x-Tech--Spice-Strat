export default function CandidateTable({ candidates, clarifyFirst, onAssign, busy }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Candidate Ranking</p>
          <h2>Top developer matches</h2>
        </div>
      </div>

      <div className="table-wrap">
        <table className="candidate-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Score</th>
              <th>Reasons</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr key={candidate.accountId}>
                <td>
                  <div className="stack-xxs">
                    <strong>{candidate.displayName}</strong>
                    <span className="table-meta">{candidate.profileSource || "configured"} profile</span>
                  </div>
                </td>
                <td>{candidate.role}</td>
                <td>{candidate.totalScore}/100</td>
                <td>
                  <div className="stack-xxs">
                    {candidate.reasons.slice(0, 2).map((reason) => (
                      <span key={reason} className="table-meta">
                        {reason}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    className="ghost-button"
                    type="button"
                    disabled={busy || clarifyFirst || !candidate.isAssignable}
                    onClick={() => onAssign(candidate.accountId)}
                  >
                    {candidate.isAssignable ? "Assign" : "Demo only"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
