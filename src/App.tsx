import { useAllSessions } from "./hooks/useAllSessions";
import SessionsPage from "./pages/SessionsPage";
import PlansPage from "./pages/PlansPage";
import CalendarPage from "./pages/CalendarPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import { useEffect, useState } from "react";
import StartSessionModal from "./components/StartSessionModal";
import { useSessionTimer } from "./hooks/useSessionTimer";
import { useTodaySessions } from "./hooks/useTodaySessions";
import { useUpcomingPlans } from "./hooks/useUpcomingPlans";
import { initializeDatabase } from "./db/schema";
import PomodoroPage from "./pages/PomodoroPage";
import {
  deleteSession,
  saveSession,
  updateSession,
  type Session,
} from "./db/sessionRepository";
import { formatDuration, formatMinutes } from "./utils/time";
import { calculateStreaks } from "./utils/analytics";

import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "sessions" | "plans" | "pomodoro" | "calendar" | "analytics"
  >("dashboard");

  const {
    sessions: allSessions,
    loading: sessionsLoading,
    refresh: refreshAllSessions,
  } = useAllSessions();
  const {
    plans,
    loading: plansLoading,
    error: plansError,
    refresh: refreshPlans,
    toggleCompleted,
    editPlan,
    removePlan,
  } = useUpcomingPlans();
  const session = useSessionTimer();

  const { sessions, loading, refresh } = useTodaySessions();

  const [showStartModal, setShowStartModal] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  /*
   * --------------------------------------------------
   * TODAY'S TOTAL FOCUSED TIME
   * --------------------------------------------------
   */

  const totalSeconds = sessions.reduce((total, currentSession) => {
    return total + currentSession.duration_seconds;
  }, 0);

  const totalMinutes = Math.floor(totalSeconds / 60);

  /*
   * --------------------------------------------------
   * ACTIVITY TOTALS
   *
   * Store everything in SECONDS first.
   * We only convert to minutes when displaying.
   * --------------------------------------------------
   */

  const activityTotals = sessions.reduce<Record<string, number>>(
    (totals, currentSession) => {
      totals[currentSession.activity] =
        (totals[currentSession.activity] || 0) +
        currentSession.duration_seconds;

      return totals;
    },
    {},
  );

  /*
   * --------------------------------------------------
   * STREAKS
   * --------------------------------------------------
   */

  const { currentStreak, longestStreak } = calculateStreaks(allSessions);

  /*
   * --------------------------------------------------
   * DAILY GOAL
   * --------------------------------------------------
   */

  const DAILY_GOAL_MINUTES = 7 * 60 + 30;

  const goalPercentage =
    DAILY_GOAL_MINUTES > 0
      ? Math.min((totalMinutes / DAILY_GOAL_MINUTES) * 100, 100)
      : 0;

  /*
   * --------------------------------------------------
   * DATABASE INITIALIZATION
   * --------------------------------------------------
   */

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        console.log("Chronos database initialized");
      })
      .catch((error) => {
        console.error("Failed to initialize database:", error);
      });
  }, []);

  /*
   * --------------------------------------------------
   * START SESSION
   * --------------------------------------------------
   */

  const handleStartSession = (activity: string) => {
    setSessionError(null);
    session.start(activity);

    setShowStartModal(false);
  };

  /*
   * --------------------------------------------------
   * FINISH SESSION
   * --------------------------------------------------
   */

  const handleFinishSession = async () => {
    setSessionError(null);
    const completed = session.finish();

    if (!completed.activity || !completed.startedAt) {
      setSessionError("Could not save session: missing session information.");
      return;
    }

    try {
      await saveSession({
        activity: completed.activity,

        started_at: new Date(completed.startedAt).toISOString(),

        ended_at: new Date(completed.endedAt).toISOString(),

        duration_seconds: Math.floor(completed.durationMs / 1000),

        created_at: new Date().toISOString(),
      });

      /*
       * Reload today's sessions from SQLite.
       */
      await refresh();

      console.log("Session saved successfully ✅");
    } catch (error) {
      console.error("Failed to save session ❌", error);
      setSessionError("Could not save this session. Please try again.");
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    await deleteSession(sessionId);
    await Promise.all([refresh(), refreshAllSessions()]);
  };

  const handleUpdateSession = async (
    sessionId: number,
    updatedSession: Omit<Session, "id" | "created_at">,
  ) => {
    await updateSession(sessionId, updatedSession);
    await Promise.all([refresh(), refreshAllSessions()]);
  };

  return (
    <div className="app">
      {/* ================================================
          SIDEBAR
          ================================================ */}

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>

          <span>Chronos</span>
        </div>

        <nav className="navigation">
          <button
            className={`nav-item ${
              currentPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${currentPage === "sessions" ? "active" : ""}`}
            onClick={() => setCurrentPage("sessions")}
          >
            <span>◷</span>
            Sessions
          </button>

          <button
            className={`nav-item ${currentPage === "plans" ? "active" : ""}`}
            onClick={() => setCurrentPage("plans")}
          >
            <span>✓</span>
            Plans
          </button>

          <button
            className={`nav-item ${currentPage === "pomodoro" ? "active" : ""}`}
            onClick={() => setCurrentPage("pomodoro")}
          >
            <span>◉</span>
            Pomodoro
          </button>

          <button
            className={`nav-item ${currentPage === "calendar" ? "active" : ""}`}
            onClick={() => setCurrentPage("calendar")}
          >
            <span>▣</span>
            Calendar
          </button>

          <button
            className={`nav-item ${currentPage === "analytics" ? "active" : ""}`}
            onClick={() => setCurrentPage("analytics")}
          >
            <span>◒</span>
            Analytics
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <span>⚙</span>
            Settings
          </button>
        </div>
      </aside>

      {/* ================================================
          MAIN
          ================================================ */}

      <main className="main">
        {currentPage === "dashboard" ? (
          <>
            {/* HEADER */}
            <header className="header">
              <div>
                <p className="eyebrow">FRIDAY, AUGUST 21</p>
                <h1>Good morning.</h1>
                <p className="subtitle">Let's make today count.</p>
              </div>

              <div className="header-actions">
                <button className="icon-button">⌘K</button>
                <div className="avatar">A</div>
              </div>
            </header>

            {/* STATS */}
            <section className="stats-grid">
              <div className="stat-card">
                <span>Focused today</span>
                <strong>{formatMinutes(totalMinutes)}</strong>
                <small>Time tracked in focused sessions</small>
              </div>

              <div className="stat-card">
                <span>Daily goal</span>
                <strong>7h 30m</strong>

                <div className="progress">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${goalPercentage}%`,
                    }}
                  />
                </div>

                <small>{Math.round(goalPercentage)}% completed</small>
              </div>

              <div className="stat-card">
                <span>Current streak</span>
                <strong>
                  {currentStreak} {currentStreak === 1 ? "day" : "days"}
                </strong>
                <small>
                  {currentStreak > 0
                    ? "Keep it going 🔥"
                    : longestStreak > 0
                      ? `Best record: ${longestStreak}d`
                      : "Start a daily habit"}
                </small>
              </div>
            </section>

            {/* CURRENT SESSION + POMODORO */}
            <section className="content-grid">
              {/* CURRENT SESSION */}
              <div className="card session-card">
                {session.status === "idle" && (
                  <>
                    <div className="card-header">
                      <div>
                        <p className="card-label">CURRENT SESSION</p>
                        <h2>No active session</h2>
                      </div>
                    </div>

                    <div className="empty-session">
                      <p>
                        Tell Chronos what you're working on and start tracking
                        your time.
                      </p>

                      <button
                        className="primary-button"
                        onClick={() => {
                          setSessionError(null);
                          setShowStartModal(true);
                        }}
                      >
                        Start session
                      </button>
                    </div>
                  </>
                )}

                {session.status !== "idle" && (
                  <>
                    <div className="card-header">
                      <div>
                        <p className="card-label">CURRENT SESSION</p>
                        <h2>{session.activity}</h2>
                      </div>

                      <span className="status-dot">
                        ● {session.status === "running" ? "Active" : "Paused"}
                      </span>
                    </div>

                    <div className="session-time">
                      {formatDuration(session.elapsedMs)}
                    </div>

                    <div className="session-actions">
                      {session.status === "running" ? (
                        <button
                          className="secondary-button"
                          onClick={session.pause}
                        >
                          Pause
                        </button>
                      ) : (
                        <button
                          className="secondary-button"
                          onClick={session.resume}
                        >
                          Resume
                        </button>
                      )}

                      <button
                        className="primary-button"
                        onClick={handleFinishSession}
                      >
                        Finish session
                      </button>
                    </div>
                  </>
                )}

                {sessionError && (
                  <p className="form-error" role="status">
                    {sessionError}
                  </p>
                )}
              </div>

              {/* POMODORO */}
              <div className="card pomodoro-card">
                <div className="card-header">
                  <div>
                    <p className="card-label">POMODORO</p>
                    <h2>Focus</h2>
                  </div>

                  <span className="pomodoro-count">3 / 4</span>
                </div>

                <div className="pomodoro-time">24:37</div>

                <div className="pomodoro-progress">
                  <div />
                </div>

                <button className="primary-button full">Pause</button>
              </div>
            </section>

            {/* TODAY'S TIME */}
            <section className="card">
              <div className="card-header">
                <div>
                  <p className="card-label">TODAY'S TIME</p>
                  <h2>Where your time went</h2>
                </div>
              </div>

              <div className="activity-list">
                {loading ? (
                  <p className="empty-text">Loading today's sessions...</p>
                ) : sessions.length === 0 ? (
                  <p className="empty-text">No sessions tracked today.</p>
                ) : (
                  Object.entries(activityTotals).map(([activity, seconds]) => {
                    const minutes = Math.floor(seconds / 60);

                    const percentage =
                      totalSeconds > 0
                        ? `${(seconds / totalSeconds) * 100}%`
                        : "0%";

                    return (
                      <ActivityRow
                        key={activity}
                        name={activity}
                        time={formatMinutes(minutes)}
                        percentage={percentage}
                      />
                    );
                  })
                )}
              </div>
            </section>

            {/* BOTTOM GRID */}
            <section className="bottom-grid">
              {/* COMPUTER ACTIVITY */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <p className="card-label">COMPUTER ACTIVITY</p>
                    <h2>Where your time went</h2>
                  </div>
                </div>

                <div className="activity-summary">
                  <div>
                    <strong>{formatMinutes(totalMinutes)}</strong>
                    <span>Tracked</span>
                  </div>

                  <div>
                    <strong>0m</strong>
                    <span>Untracked</span>
                  </div>

                  <div>
                    <strong>0m</strong>
                    <span>Idle</span>
                  </div>
                </div>
              </div>

              {/* DAILY REVIEW */}
              <div className="card review-card">
                <p className="card-label">DAILY REVIEW</p>

                <h2>
                  {goalPercentage >= 100
                    ? "Goal completed! 🎉"
                    : "You're doing well."}
                </h2>

                <p>
                  You've completed {Math.round(goalPercentage)}% of today's
                  focused-time goal.
                </p>

                <span className="warning">
                  ⚠ Computer activity tracking coming soon
                </span>
              </div>
            </section>

            {/* START SESSION MODAL */}
            {showStartModal && (
              <StartSessionModal
                onStart={handleStartSession}
                onClose={() => setShowStartModal(false)}
              />
            )}
          </>
        ) : currentPage === "sessions" ? (
          <SessionsPage
            sessions={allSessions}
            loading={sessionsLoading}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
          />
        ) : currentPage === "plans" ? (
          <PlansPage
            plans={plans}
            loading={plansLoading}
            error={plansError}
            onRefresh={refreshPlans}
            onToggleCompleted={toggleCompleted}
            onUpdatePlan={editPlan}
            onDeletePlan={removePlan}
          />
        ) : currentPage === "pomodoro" ? (
          <PomodoroPage
            onSessionSaved={async () => {
              await Promise.all([refresh(), refreshAllSessions()]);
            }}
          />
        ) : currentPage === "calendar" ? (
          <CalendarPage sessions={allSessions} plans={plans} />
        ) : (
          <AnalyticsPage
            sessions={allSessions}
            loading={sessionsLoading}
          />
        )}
      </main>
    </div>
  );
}

/* ========================================================
   ACTIVITY ROW
   ======================================================== */

interface ActivityRowProps {
  name: string;
  time: string;
  percentage: string;
}

function ActivityRow({ name, time, percentage }: ActivityRowProps) {
  return (
    <div className="activity-row">
      <div className="activity-name">
        <span>{name}</span>

        <strong>{time}</strong>
      </div>

      <div className="activity-bar">
        <div
          style={{
            width: percentage,
          }}
        />
      </div>
    </div>
  );
}

export default App;
