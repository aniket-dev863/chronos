import { useEffect, useRef } from "react";
import { saveSession } from "../db/sessionRepository";
import { usePomodoro } from "../hooks/usePomodoro";

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
  onSessionSaved?: () => Promise<void>;
}

function PomodoroPage({ onSessionSaved }: PomodoroPageProps) {
  const pomodoro = usePomodoro();

  const {
    mode,
    status,
    remainingSeconds,
    completedFocusSessions,
    focusStartedAt,
    start,
    pause,
    reset,
    changeMode,
    skip,
    nextSession,
  } = pomodoro;

  /*
   * Used to make sure a completed Focus session
   * is saved only once.
   */
  const completionHandled = useRef(false);

  const savePartialFocusSession = async () => {
    if (mode === "focus" && focusStartedAt) {
      const durationSeconds = Math.max(
        0,
        getModeDuration("focus") - remainingSeconds,
      );

      if (durationSeconds > 0) {
        completionHandled.current = true;
        const endedAt = Date.now();

        try {
          await saveSession({
            activity: "Pomodoro Focus",

            started_at: new Date(focusStartedAt).toISOString(),

            ended_at: new Date(endedAt).toISOString(),

            duration_seconds: durationSeconds,

            created_at: new Date().toISOString(),
          });
          await onSessionSaved?.();
          console.log("Partial Pomodoro Focus session saved successfully ✅");
        } catch (error) {
          console.error("Failed to save partial Pomodoro session ❌", error);
        }
      }
    }
  };

  const handleReset = async () => {
    if (
      (status === "running" || status === "paused") &&
      mode === "focus" &&
      focusStartedAt
    ) {
      await savePartialFocusSession();
    }
    reset();
  };

  const handleSkip = async () => {
    if (
      (status === "running" || status === "paused") &&
      mode === "focus" &&
      focusStartedAt
    ) {
      await savePartialFocusSession();
    }
    skip();
  };

  const handleChangeMode = async (
    newMode: "focus" | "shortBreak" | "longBreak",
  ) => {
    if (newMode === mode) {
      return;
    }
    if (
      (status === "running" || status === "paused") &&
      mode === "focus" &&
      focusStartedAt
    ) {
      await savePartialFocusSession();
    }
    changeMode(newMode);
  };

  /*
   * --------------------------------------------------
   * FOCUS COMPLETION
   * --------------------------------------------------
   */

  useEffect(() => {
    if (
      mode !== "focus" ||
      status !== "idle" ||
      remainingSeconds !== 0 ||
      !focusStartedAt
    ) {
      return;
    }

    if (completionHandled.current) {
      return;
    }

    completionHandled.current = true;

    const finishFocusSession = async () => {
      const endedAt = Date.now();

      const durationSeconds = Math.max(
        0,
        getModeDuration("focus") - remainingSeconds,
      );

      try {
        await saveSession({
          activity: "Pomodoro Focus",

          started_at: new Date(focusStartedAt).toISOString(),

          ended_at: new Date(endedAt).toISOString(),

          duration_seconds: durationSeconds,

          created_at: new Date().toISOString(),
        });
        await onSessionSaved?.();
        console.log("Pomodoro Focus session saved successfully ✅");
      } catch (error) {
        console.error("Failed to save Pomodoro session ❌", error);
      } finally {
        /*
         * Move to the appropriate break.
         */
        nextSession();
      }
    };

    void finishFocusSession();
  }, [mode, status, remainingSeconds, focusStartedAt, nextSession, onSessionSaved]);

  /*
   * Reset the completion guard whenever a new
   * Focus session starts.
   */
  useEffect(() => {
    if (mode === "focus" && status === "running" && focusStartedAt) {
      completionHandled.current = false;
    }
  }, [mode, status, focusStartedAt]);

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
              onClick={() => handleChangeMode("focus")}
              type="button"
              disabled={status === "running"}
            >
              Focus
            </button>

            <button
              className={mode === "shortBreak" ? "active" : ""}
              onClick={() => handleChangeMode("shortBreak")}
              type="button"
              disabled={status === "running"}
            >
              Short Break
            </button>

            <button
              className={mode === "longBreak" ? "active" : ""}
              onClick={() => handleChangeMode("longBreak")}
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
                onClick={pause}
                type="button"
              >
                Pause
              </button>
            ) : (
              <button className="primary-button" onClick={start} type="button">
                {status === "paused" ? "Resume" : "Start"}
              </button>
            )}

            <button
              className="secondary-button"
              onClick={handleReset}
              type="button"
            >
              Reset
            </button>

            <button
              className="secondary-button"
              onClick={handleSkip}
              type="button"
            >
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
