export default function StatePanel({ title, body, actionLabel, onAction }) {
  return (
    <section className="state-panel">
      <h2>{title}</h2>
      <p>{body}</p>
      {actionLabel && onAction ? (
        <button className="ghost-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
