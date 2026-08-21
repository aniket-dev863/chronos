import { useEffect, useState } from "react";

export type SessionStatus = "idle" | "running" | "paused";

interface SessionState {
  status: SessionStatus;
  activity: string | null;
  startedAt: number | null;
  elapsedMs: number;
}

export function useSessionTimer() {
  const [session, setSession] = useState<SessionState>({
    status: "idle",
    activity: null,
    startedAt: null,
    elapsedMs: 0,
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (session.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 250);

    return () => window.clearInterval(interval);
  }, [session.status]);

  const elapsedMs =
    session.status === "running" && session.startedAt
      ? session.elapsedMs + (Date.now() - session.startedAt)
      : session.elapsedMs;

  const start = (activity: string) => {
    setSession({
      status: "running",
      activity,
      startedAt: Date.now(),
      elapsedMs: 0,
    });
  };

  const pause = () => {
    if (session.status !== "running" || !session.startedAt) {
      return;
    }

    const elapsed = session.elapsedMs + (Date.now() - session.startedAt);

    setSession((current) => ({
      ...current,
      status: "paused",
      startedAt: null,
      elapsedMs: elapsed,
    }));
  };

  const resume = () => {
    if (session.status !== "paused") {
      return;
    }

    setSession((current) => ({
      ...current,
      status: "running",
      startedAt: Date.now(),
    }));
  };

  const finish = () => {
    const finalElapsed =
      session.status === "running" && session.startedAt
        ? session.elapsedMs + (Date.now() - session.startedAt)
        : session.elapsedMs;

    const completedSession = {
      activity: session.activity,
      durationMs: finalElapsed,
    };

    setSession({
      status: "idle",
      activity: null,
      startedAt: null,
      elapsedMs: 0,
    });

    return completedSession;
  };

  // Prevent the compiler from considering tick unused.
  void tick;

  return {
    status: session.status,
    activity: session.activity,
    elapsedMs,
    start,
    pause,
    resume,
    finish,
  };
}
