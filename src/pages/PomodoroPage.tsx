function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds,
  ).padStart(2, "0")}`;
}

function getModeLabel(mode: "focus" | "shortBreak" | "longBreak") {
  switch (mode) {
    case "focus":
      return "Focus";

    case "shortBreak":
      return "Short Break";

    case "longBreak":
      return "Long Break";
  }
}

function getModeDuration(mode: "focus" | "shortBreak" | "longBreak") {
  switch (mode) {
    case "focus":
      return 25 * 60;

    case "shortBreak":
      return 5 * 60;

    case "longBreak":
      return 15 * 60;
  }
}

interface PomodoroPageProps {
  pomodoro: {
    mode: "focus" | "shortBreak" | "longBreak";
    status: "idle" | "running" | "paused";
    remainingSeconds: number;
    completedFocusSessions: number;
  };
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onChangeMode: (mode: "focus" | "shortBreak" | "longBreak") => void;
}

function PomodoroPage({
  pomodoro,
  onStart,
  onPause,
  onReset,
  onSkip,
  onChangeMode,
}: PomodoroPageProps) {
  const { mode, status, remainingSeconds, completedFocusSessions } = pomodoro;

  const totalSeconds = getModeDuration(mode);

  const progress =
    totalSeconds > 0
      ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
      : 0;

  const completedInCycle = completedFocusSessions % 4;

  return (
    <div>
      <header className="header">
        <div>
          <p className="eyebrow">FOCUS TIMER</p>

          <h1>Pomodoro</h1>

          <p className="subtitle">Work with intention. Rest without guilt.</p>
        </div>
      </header>

      <section className="pomodoro-page-grid">
        {/* ============================================
            MAIN TIMER
            ============================================ */}

        <div className="card pomodoro-main-card">
          <div className="pomodoro-mode-tabs">
            <button
              className={mode === "focus" ? "active" : ""}
              onClick={() => onChangeMode("focus")}
              type="button"
              disabled={status === "running"}
            >
              Focus
            </button>

            <button
              className={mode === "shortBreak" ? "active" : ""}
              onClick={() => onChangeMode("shortBreak")}
              type="button"
              disabled={status === "running"}
            >
              Short Break
            </button>

            <button
              className={mode === "longBreak" ? "active" : ""}
              onClick={() => onChangeMode("longBreak")}
              type="button"
              disabled={status === "running"}
            >
              Long Break
            </button>
          </div>

          <div className="pomodoro-display">
            <p className="card-label">{getModeLabel(mode)}</p>

            <div className="pomodoro-large-time">
              {formatTime(remainingSeconds)}
            </div>

            <div className="pomodoro-large-progress">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="pomodoro-controls">
            {status === "running" ? (
              <button
                className="secondary-button"
                onClick={onPause}
                type="button"
              >
                Pause
              </button>
            ) : (
              <button
                className="primary-button"
                onClick={onStart}
                type="button"
              >
                {status === "paused" ? "Resume" : "Start"}
              </button>
            )}

            <button
              className="secondary-button"
              onClick={onReset}
              type="button"
            >
              Reset
            </button>

            <button className="secondary-button" onClick={onSkip} type="button">
              Skip
            </button>
          </div>
        </div>

        {/* ============================================
            CYCLE INFORMATION
            ============================================ */}

        <aside className="card pomodoro-info-card">
          <p className="card-label">TODAY'S CYCLE</p>

          <h2>Focus sessions</h2>

          <div className="pomodoro-session-count">
            <strong>{completedInCycle}</strong>

            <span>/ 4</span>
          </div>

          <p>Complete four focus sessions to earn a longer break.</p>

          <div className="pomodoro-cycle">
            {[0, 1, 2, 3].map((index) => (
              <span
                key={index}
                className={index < completedInCycle ? "completed" : ""}
              >
                {index < completedInCycle ? "✓" : index + 1}
              </span>
            ))}
          </div>

          {status === "paused" && (
            <p className="pomodoro-paused-message">
              Timer paused. Resume when you're ready.
            </p>
          )}

          {mode === "shortBreak" && (
            <p className="pomodoro-break-message">
              Nice work. Take a short break.
            </p>
          )}

          {mode === "longBreak" && (
            <p className="pomodoro-break-message">
              Four focus sessions complete. Enjoy your long break.
            </p>
          )}
        </aside>
      </section>
    </div>
  );
}

export default PomodoroPage;
