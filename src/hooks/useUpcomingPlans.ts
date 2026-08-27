import { useCallback, useEffect, useState } from "react";

import {
  deletePlan,
  getAllPlans,
  setPlanCompleted,
  updatePlan,
} from "../db/planRepository";

import type { Plan, UpdatePlanInput } from "../db/planRepository";

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

  const editPlan = useCallback(
    async (planId: number, input: UpdatePlanInput) => {
      try {
        await updatePlan(planId, input);

        await refresh();
      } catch (err) {
        console.error("Failed to update plan:", err);

        setError(err instanceof Error ? err.message : "Failed to update plan");

        throw err;
      }
    },
    [refresh],
  );

  const removePlan = useCallback(async (planId: number) => {
    try {
      console.log("DELETE: starting", planId);

      await deletePlan(planId);

      console.log("DELETE: database operation completed", planId);

      const updatedPlans = await getAllPlans();

      console.log("DELETE: plans after delete", updatedPlans);

      setPlans(updatedPlans);
    } catch (err) {
      console.error("DELETE: failed", err);

      setError(err instanceof Error ? err.message : "Failed to delete plan");

      throw err;
    }
  }, []);

  return {
    plans,
    loading,
    error,
    refresh,
    toggleCompleted,
    editPlan,
    removePlan,
  };
}
