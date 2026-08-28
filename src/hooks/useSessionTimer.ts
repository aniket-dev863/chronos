import { useEffect, useState } from "react";

export type SessionStatus = "idle" | "running" | "paused";

interface SessionState {
  status: SessionStatus;
  activity: string | null;
  startedAt: number | null;
  originalStartedAt: number | null;
  elapsedMs: number;
}

export interface CompletedSession {
  activity: string | null;
  startedAt: number | null;
  endedAt: number;
  durationMs: number;
}

export function useSessionTimer() {
  const [session, setSession] = useState<SessionState>({
    status: "idle",
    activity: null,
    startedAt: null,
    originalStartedAt: null,
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
    const now = Date.now();
    setSession({
      status: "running",
      activity,
      startedAt: now,
      originalStartedAt: now,
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

  const finish = (): CompletedSession => {
    const endedAt = Date.now();

    const finalElapsed =
      session.status === "running" && session.startedAt
        ? session.elapsedMs + (endedAt - session.startedAt)
        : session.elapsedMs;

    const completedSession: CompletedSession = {
      activity: session.activity,
      startedAt: session.originalStartedAt ?? session.startedAt,
      endedAt,
      durationMs: finalElapsed,
    };

    setSession({
      status: "idle",
      activity: null,
      startedAt: null,
      originalStartedAt: null,
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
