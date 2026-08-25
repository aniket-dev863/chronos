import { useState, type FormEvent } from "react";

import type { Session } from "../db/sessionRepository";
import { formatMinutes } from "../utils/time";

interface SessionsPageProps {
  sessions: Session[];
  loading: boolean;
  onDeleteSession: (sessionId: number) => Promise<void>;
  onUpdateSession: (
    sessionId: number,
    updatedSession: Omit<Session, "id" | "created_at">,
  ) => Promise<void>;
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

function toDateInputValue(dateString: string) {
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toTimeInputValue(dateString: string) {
  const date = new Date(dateString);

  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

function SessionsPage({
  sessions,
  loading,
  onDeleteSession,
  onUpdateSession,
}: SessionsPageProps) {
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [activity, setActivity] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [startedTime, setStartedTime] = useState("");
  const [endedTime, setEndedTime] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!sessionToDelete?.id) {
      return;
    }

    try {
      setDeleting(true);
      setFeedback(null);
      await onDeleteSession(sessionToDelete.id);
      setSessionToDelete(null);
      setFeedback("Session deleted successfully.");
    } catch (error) {
      console.error("Failed to delete session:", error);
      setFeedback("Could not delete this session. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (session: Session) => {
    setFeedback(null);
    setSessionToEdit(session);
    setActivity(session.activity);
    setSessionDate(toDateInputValue(session.started_at));
    setStartedTime(toTimeInputValue(session.started_at));
    setEndedTime(toTimeInputValue(session.ended_at));
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!sessionToEdit?.id) {
      return;
    }

    const trimmedActivity = activity.trim();
    const startedAt = new Date(`${sessionDate}T${startedTime}`);
    const endedAt = new Date(`${sessionDate}T${endedTime}`);

    if (!trimmedActivity || !sessionDate || !startedTime || !endedTime) {
      setFeedback("Complete every session field before saving.");
      return;
    }

    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
      setFeedback("Enter a valid session date and time.");
      return;
    }

    if (endedAt <= startedAt) {
      setFeedback("The end time must be later than the start time.");
      return;
    }

    try {
      setSavingEdit(true);
      setFeedback(null);
      await onUpdateSession(sessionToEdit.id, {
        activity: trimmedActivity,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000),
      });
      setSessionToEdit(null);
      setFeedback("Session updated successfully.");
    } catch (error) {
      console.error("Failed to update session:", error);
      setFeedback("Could not update this session. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

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

                <button
                  className="edit-session-button"
                  disabled={deleting || savingEdit}
                  onClick={() => openEditModal(session)}
                  type="button"
                >
                  Edit
                </button>

                <button
                  aria-label={`Delete ${session.activity} session`}
                  className="delete-session-button"
                  disabled={deleting || savingEdit}
                  onClick={() => {
                    setFeedback(null);
                    setSessionToDelete(session);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {feedback && (
        <p
          className={feedback.startsWith("Could not") ? "form-error" : "success-message"}
          role="status"
        >
          {feedback}
        </p>
      )}

      {sessionToDelete && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="delete-session-title"
            aria-modal="true"
            className="session-modal delete-session-modal"
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <p className="card-label">DELETE SESSION</p>
                <h2 id="delete-session-title">Delete this session?</h2>
              </div>
            </div>

            <p className="delete-session-copy">
              This will permanently delete the {sessionToDelete.activity} session
              from {formatDate(sessionToDelete.started_at)}. This action cannot
              be undone.
            </p>

            {feedback?.startsWith("Could not") && (
              <p className="form-error">{feedback}</p>
            )}

            <div className="session-actions delete-session-actions">
              <button
                className="secondary-button"
                disabled={deleting}
                onClick={() => setSessionToDelete(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="danger-button"
                disabled={deleting}
                onClick={handleDelete}
                type="button"
              >
                {deleting ? "Deleting..." : "Delete session"}
              </button>
            </div>
          </section>
        </div>
      )}

      {sessionToEdit && (
        <div className="modal-backdrop" role="presentation">
          <form
            aria-labelledby="edit-session-title"
            aria-modal="true"
            className="session-modal edit-session-modal"
            onSubmit={handleUpdate}
            role="dialog"
          >
            <div className="modal-header">
              <div>
                <p className="card-label">EDIT SESSION</p>
                <h2 id="edit-session-title">Update session details</h2>
              </div>
            </div>

            <label className="form-label" htmlFor="session-activity">
              Activity
            </label>
            <input
              className="text-input"
              id="session-activity"
              maxLength={80}
              onChange={(event) => setActivity(event.target.value)}
              value={activity}
            />

            <label className="form-label" htmlFor="session-date">
              Date
            </label>
            <input
              className="text-input"
              id="session-date"
              onChange={(event) => setSessionDate(event.target.value)}
              type="date"
              value={sessionDate}
            />

            <div className="time-input-grid">
              <div>
                <label className="form-label" htmlFor="session-start-time">
                  Started at
                </label>
                <input
                  className="text-input"
                  id="session-start-time"
                  onChange={(event) => setStartedTime(event.target.value)}
                  type="time"
                  value={startedTime}
                />
              </div>
              <div>
                <label className="form-label" htmlFor="session-end-time">
                  Ended at
                </label>
                <input
                  className="text-input"
                  id="session-end-time"
                  onChange={(event) => setEndedTime(event.target.value)}
                  type="time"
                  value={endedTime}
                />
              </div>
            </div>

            {feedback && <p className="form-error">{feedback}</p>}

            <div className="session-actions delete-session-actions">
              <button
                className="secondary-button"
                disabled={savingEdit}
                onClick={() => setSessionToEdit(null)}
                type="button"
              >
                Cancel
              </button>
              <button className="primary-button" disabled={savingEdit} type="submit">
                {savingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SessionsPage;
