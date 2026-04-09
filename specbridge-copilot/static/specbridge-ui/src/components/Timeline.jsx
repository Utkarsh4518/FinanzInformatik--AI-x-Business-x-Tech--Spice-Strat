import { formatDateTime } from "../lib/formatters";

export default function Timeline({ events }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">Ticket Watcher</p>
          <h2>Lifecycle timeline</h2>
        </div>
      </div>

      <div className="timeline">
        {events.map((event) => (
          <article key={`${event.eventType}-${event.timestamp}`} className="timeline-item">
            <div className="timeline-marker" />
            <div className="timeline-content">
              <div className="timeline-head">
                <strong>{event.eventType.replace(/_/g, " ")}</strong>
                <span>{formatDateTime(event.timestamp)}</span>
              </div>
              <p>{event.aiInterpretation}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
