import { useState } from "react";
import { formatDateTime, pendingLabel } from "../lib/formatters";

export default function ClarificationBridge({ issue, thread, onCreate, onResolve, busy }) {
  const [message, setMessage] = useState("");
  const [directedTo, setDirectedTo] = useState("developer");
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [resolution, setResolution] = useState("");

  async function submitMessage(event) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    await onCreate({
      text: message,
      directedTo
    });
    setMessage("");
  }

  async function submitResolution(question) {
    if (!resolution.trim()) {
      return;
    }

    await onResolve({
      questionId: question.id,
      questionText: question.text,
      resolution
    });
    setResolution("");
    setActiveQuestionId(null);
  }

  return (
    <section className="card bridge-card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Clarification Bridge</p>
          <h2>Requester and developer Q&A</h2>
        </div>
      </div>

      <div className="bridge-meta-grid">
        <div>
          <span className="meta-label">Requester</span>
          <strong>{issue.reporter?.displayName || "Unknown"}</strong>
        </div>
        <div>
          <span className="meta-label">Assignee</span>
          <strong>{issue.assignee?.displayName || "Unassigned"}</strong>
        </div>
        <div>
          <span className="meta-label">Pending side</span>
          <strong>{pendingLabel(thread.pendingSide)}</strong>
        </div>
        <div>
          <span className="meta-label">Last response</span>
          <strong>{formatDateTime(thread.lastResponseAt)}</strong>
        </div>
      </div>

      <p className="section-copy">{thread.aiSummary}</p>

      {thread.unresolvedBlockers.length ? (
        <ul className="tag-list">
          {thread.unresolvedBlockers.map((blocker) => (
            <li key={blocker} className="tag tag-risk">
              {blocker}
            </li>
          ))}
        </ul>
      ) : null}

      <form className="bridge-form" onSubmit={submitMessage}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={4}
          placeholder="Ask a question or post a clarification update."
        />
        <div className="form-row">
          <label>
            <span>Directed to</span>
            <select value={directedTo} onChange={(event) => setDirectedTo(event.target.value)}>
              <option value="developer">Developer</option>
              <option value="requester">Requester</option>
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={busy}>
            Send via bridge
          </button>
        </div>
      </form>

      <div className="question-columns">
        <div className="question-column">
          <h3>Open questions</h3>
          {thread.openQuestions.length ? (
            thread.openQuestions.map((question) => (
              <article key={question.id} className="question-card">
                <strong>{question.text}</strong>
                <span className="table-meta">
                  Asked by {question.askedByDisplayName} for {question.directedTo}
                </span>
                {question.businessRewrite ? <p>Business rewrite: {question.businessRewrite}</p> : null}
                {question.technicalRewrite ? <p>Technical rewrite: {question.technicalRewrite}</p> : null}
                <button className="ghost-button" type="button" onClick={() => setActiveQuestionId(question.id)}>
                  Mark resolved
                </button>
                {activeQuestionId === question.id ? (
                  <div className="stack-xs">
                    <textarea
                      rows={3}
                      value={resolution}
                      onChange={(event) => setResolution(event.target.value)}
                      placeholder="Write the answer or resolution."
                    />
                    <button className="primary-button" type="button" onClick={() => submitResolution(question)} disabled={busy}>
                      Confirm resolution
                    </button>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="empty-copy">No open questions right now.</p>
          )}
        </div>

        <div className="question-column">
          <h3>Resolved questions</h3>
          {thread.resolvedQuestions.length ? (
            thread.resolvedQuestions.map((question) => (
              <article key={question.id} className="question-card resolved-card">
                <strong>{question.text}</strong>
                <p>{question.resolution}</p>
                <span className="table-meta">Resolved at {formatDateTime(question.resolvedAt)}</span>
              </article>
            ))
          ) : (
            <p className="empty-copy">Resolved clarifications will appear here.</p>
          )}
        </div>
      </div>
    </section>
  );
}
