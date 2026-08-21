import type { Session } from "../db/sessionRepository";
import { formatMinutes } from "../utils/time";

interface SessionsPageProps {
  sessions: Session[];
  loading: boolean;
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function SessionsPage({ sessions, loading }: SessionsPageProps) {
  const totalSeconds = sessions.reduce(
    (total, session) => total + session.duration_seconds,
    0,
  );

  const totalMinutes = Math.floor(totalSeconds / 60);

  return (
    <div>
      <header className="header">
        <div>
          <p className="eyebrow">TIME HISTORY</p>

          <h1>Sessions</h1>

          <p className="subtitle">Everything you've tracked.</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total sessions</span>

          <strong>{sessions.length}</strong>

          <small>Sessions recorded</small>
        </div>

        <div className="stat-card">
          <span>Total focused time</span>

          <strong>{formatMinutes(totalMinutes)}</strong>

          <small>Across all sessions</small>
        </div>

        <div className="stat-card">
          <span>Activities</span>

          <strong>
            {new Set(sessions.map((session) => session.activity)).size}
          </strong>

          <small>Different activities</small>
        </div>
      </section>

      <section className="card sessions-history">
        <div className="card-header">
          <div>
            <p className="card-label">SESSION HISTORY</p>

            <h2>Your tracked sessions</h2>
          </div>
        </div>

        {loading ? (
          <p className="empty-text">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="empty-text">No sessions recorded yet.</p>
        ) : (
          <div className="session-history-list">
            {sessions.map((session) => (
              <div className="session-history-row" key={session.id}>
                <div className="session-history-main">
                  <strong>{session.activity}</strong>

                  <span>{formatDate(session.started_at)}</span>
                </div>

                <div className="session-history-time">
                  <span>
                    {formatTime(session.started_at)} →{" "}
                    {formatTime(session.ended_at)}
                  </span>

                  <strong>
                    {formatMinutes(Math.floor(session.duration_seconds / 60))}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SessionsPage;
