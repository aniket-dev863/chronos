import { useCallback, useEffect, useState } from "react";

import {
  deletePlan,
  getAllPlans,
  setPlanCompleted,
} from "../db/planRepository";

import type { Plan } from "../db/planRepository";

export function useUpcomingPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getAllPlans();

      setPlans(data);
    } catch (err) {
      console.error("Failed to load plans:", err);

      // Tauri/SQLite errors aren't always instances of Error.
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : JSON.stringify(err);

      setError(message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleCompleted = useCallback(
    async (planId: number, completed: boolean) => {
      try {
        await setPlanCompleted(planId, completed);
        await refresh();
      } catch (err) {
        console.error("Failed to update plan:", err);

        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : JSON.stringify(err);

        setError(message || "Failed to update plan");
      }
    },
    [refresh],
  );

  const removePlan = useCallback(
    async (planId: number) => {
      try {
        await deletePlan(planId);
        await refresh();
      } catch (err) {
        console.error("Failed to delete plan:", err);

        const message =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : JSON.stringify(err);

        setError(message || "Failed to delete plan");
      }
    },
    [refresh],
  );

  return {
    plans,
    loading,
    error,
    refresh,
    toggleCompleted,
    removePlan,
  };
}
