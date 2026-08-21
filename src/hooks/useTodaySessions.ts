import { useCallback, useEffect, useState } from "react";
import { getTodaySessions } from "../db/sessionRepository";
import type { Session } from "../db/sessionRepository";

export function useTodaySessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getTodaySessions();

      console.log("SQLite → today's sessions:", data);

      setSessions(data);
    } catch (error) {
      console.error("Failed to load today's sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    sessions,
    loading,
    refresh,
  };
}
