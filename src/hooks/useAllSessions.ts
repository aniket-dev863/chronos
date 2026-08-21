import { useCallback, useEffect, useState } from "react";

import { getAllSessions } from "../db/sessionRepository";

import type { Session } from "../db/sessionRepository";

export function useAllSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await getAllSessions();

      console.log("SQLite → all sessions:", data);

      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
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
