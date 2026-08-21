import { useState } from "react";
import StartSessionModal from "./components/StartSessionModal";
import { useSessionTimer } from "./hooks/useSessionTimer";
import { formatDuration } from "./utils/time";
import "./App.css";

function App() {
  const session = useSessionTimer();

  const [showStartModal, setShowStartModal] = useState(false);

  const handleStartSession = (activity: string) => {
    session.start(activity);
    setShowStartModal(false);
  };

  const handleFinishSession = () => {
    const completed = session.finish();

    console.log("Completed session:", completed);
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <span>Chronos</span>
        </div>

        <nav className="navigation">
          <button className="nav-item active">
            <span>⌂</span>
            Dashboard
          </button>

          <button className="nav-item">
            <span>◷</span>
            Sessions
          </button>

          <button className="nav-item">
            <span>◉</span>
            Pomodoro
          </button>

          <button className="nav-item">
            <span>▣</span>
            Calendar
          </button>

          <button className="nav-item">
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

      <main className="main">
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

        <section className="stats-grid">
          <div className="stat-card">
            <span>Focused today</span>
            <strong>5h 42m</strong>
            <small>+18% from yesterday</small>
          </div>

          <div className="stat-card">
            <span>Daily goal</span>
            <strong>7h 30m</strong>
            <div className="progress">
              <div className="progress-fill" />
            </div>
            <small>76% completed</small>
          </div>

          <div className="stat-card">
            <span>Current streak</span>
            <strong>12 days</strong>
            <small>Keep it going 🔥</small>
          </div>
        </section>

        <section className="content-grid">
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
                    Tell Chronos what you're working on and start tracking your
                    time.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => setShowStartModal(true)}
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
          </div>

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

        <section className="card">
          <div className="card-header">
            <div>
              <p className="card-label">TODAY'S TIME</p>
              <h2>Where your time went</h2>
            </div>
          </div>

          <div className="activity-list">
            <ActivityRow name="DSA" time="2h 14m" percentage="72%" />

            <ActivityRow name="Development" time="1h 48m" percentage="58%" />

            <ActivityRow name="Placement" time="51m" percentage="34%" />

            <ActivityRow name="Academics" time="42m" percentage="28%" />
          </div>
        </section>

        <section className="bottom-grid">
          <div className="card">
            <div className="card-header">
              <div>
                <p className="card-label">COMPUTER ACTIVITY</p>
                <h2>Where your time went</h2>
              </div>
            </div>

            <div className="activity-summary">
              <div>
                <strong>6h 42m</strong>
                <span>Tracked</span>
              </div>

              <div>
                <strong>1h 03m</strong>
                <span>Untracked</span>
              </div>

              <div>
                <strong>38m</strong>
                <span>Idle</span>
              </div>
            </div>
          </div>

          <div className="card review-card">
            <p className="card-label">DAILY REVIEW</p>

            <h2>You're doing well.</h2>

            <p>You've completed 76% of today's focused-time goal.</p>

            <span className="warning">⚠ 34m untracked time detected</span>
          </div>
        </section>
        {showStartModal && (
          <StartSessionModal
            onStart={handleStartSession}
            onClose={() => setShowStartModal(false)}
          />
        )}
      </main>
    </div>
  );
}

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
        <div style={{ width: percentage }} />
      </div>
    </div>
  );
}

export default App;
