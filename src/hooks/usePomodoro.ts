import { useCallback, useEffect, useState } from "react";

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";
export type PomodoroStatus = "idle" | "running" | "paused";

interface PomodoroState {
  mode: PomodoroMode;
  status: PomodoroStatus;
  remainingSeconds: number;
  completedFocusSessions: number;
  focusStartedAt: number | null;
  targetEndTime: number | null;
}

const FOCUS_SECONDS = 25 * 60;
const SHORT_BREAK_SECONDS = 5 * 60;
const LONG_BREAK_SECONDS = 15 * 60;

function getDuration(mode: PomodoroMode) {
  switch (mode) {
    case "focus":
      return FOCUS_SECONDS;

    case "shortBreak":
      return SHORT_BREAK_SECONDS;

    case "longBreak":
      return LONG_BREAK_SECONDS;
  }
}

export function usePomodoro() {
  const [pomodoro, setPomodoro] = useState<PomodoroState>({
    mode: "focus",
    status: "idle",
    remainingSeconds: FOCUS_SECONDS,
    completedFocusSessions: 0,
    focusStartedAt: null,
    targetEndTime: null,
  });

  const {
    mode,
    status,
    completedFocusSessions,
    focusStartedAt,
  } = pomodoro;

  const remainingSeconds =
    status === "running" && pomodoro.targetEndTime
      ? Math.max(0, Math.round((pomodoro.targetEndTime - Date.now()) / 1000))
      : pomodoro.remainingSeconds;

  /*
   * --------------------------------------------------
   * TIMER
   * --------------------------------------------------
   */

  useEffect(() => {
    if (status !== "running") {
      return;
    }

    const updateTimer = () => {
      setPomodoro((current) => {
        if (current.status !== "running" || !current.targetEndTime) {
          return current;
        }

        const secondsLeft = Math.max(
          0,
          Math.round((current.targetEndTime - Date.now()) / 1000),
        );

        if (secondsLeft <= 0) {
          return {
            ...current,
            status: "idle",
            remainingSeconds: 0,
            targetEndTime: null,
          };
        }

        if (secondsLeft === current.remainingSeconds) {
          return current;
        }

        return {
          ...current,
          remainingSeconds: secondsLeft,
        };
      });
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 250);

    return () => {
      window.clearInterval(interval);
    };
  }, [status]);

  /*
   * --------------------------------------------------
   * START
   * --------------------------------------------------
   */

  const start = useCallback(() => {
    setPomodoro((current) => {
      const now = Date.now();
      const targetEndTime = now + current.remainingSeconds * 1000;

      return {
        ...current,
        status: "running",
        targetEndTime,
        focusStartedAt:
          current.mode === "focus" && current.focusStartedAt === null
            ? now
            : current.focusStartedAt,
      };
    });
  }, []);

  /*
   * --------------------------------------------------
   * PAUSE
   * --------------------------------------------------
   */

  const pause = useCallback(() => {
    setPomodoro((current) => {
      if (current.status !== "running") {
        return current;
      }

      const secondsLeft = current.targetEndTime
        ? Math.max(0, Math.round((current.targetEndTime - Date.now()) / 1000))
        : current.remainingSeconds;

      return {
        ...current,
        status: "paused",
        remainingSeconds: secondsLeft,
        targetEndTime: null,
      };
    });
  }, []);

  /*
   * --------------------------------------------------
   * RESET
   * --------------------------------------------------
   */

  const reset = useCallback(() => {
    setPomodoro((current) => ({
      ...current,
      status: "idle",
      remainingSeconds: getDuration(current.mode),
      targetEndTime: null,
      focusStartedAt: current.mode === "focus" ? null : current.focusStartedAt,
    }));
  }, []);

  /*
   * --------------------------------------------------
   * CHANGE MODE
   * --------------------------------------------------
   */

  const changeMode = useCallback((newMode: PomodoroMode) => {
    setPomodoro((current) => ({
      ...current,
      mode: newMode,
      status: "idle",
      remainingSeconds: getDuration(newMode),
      targetEndTime: null,
      focusStartedAt: null,
    }));
  }, []);

  /*
   * --------------------------------------------------
   * NEXT SESSION
   * --------------------------------------------------
   */

  const nextSession = useCallback(() => {
    setPomodoro((current) => {
      if (current.mode === "focus") {
        const completed = current.completedFocusSessions + 1;

        const nextMode = completed % 4 === 0 ? "longBreak" : "shortBreak";

        return {
          ...current,
          mode: nextMode,
          status: "idle",
          remainingSeconds: getDuration(nextMode),
          completedFocusSessions: completed,
          targetEndTime: null,
          focusStartedAt: null,
        };
      }

      return {
        ...current,
        mode: "focus",
        status: "idle",
        remainingSeconds: FOCUS_SECONDS,
        targetEndTime: null,
        focusStartedAt: null,
      };
    });
  }, []);

  /*
   * --------------------------------------------------
   * SKIP
   * --------------------------------------------------
   */

  const skip = useCallback(() => {
    nextSession();
  }, [nextSession]);

  return {
    mode,
    status,
    remainingSeconds,
    completedFocusSessions,
    focusStartedAt,
    start,
    pause,
    reset,
    changeMode,
    nextSession,
    skip,
  };
}
