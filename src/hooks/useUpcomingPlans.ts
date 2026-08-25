import { useCallback, useEffect, useState } from "react";

import {
  getUpcomingPlans,
  setPlanCompleted,
  type Plan,
} from "../db/planRepository";

export function useUpcomingPlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setPlans(await getUpcomingPlans());
    } catch (loadError) {
      console.error("Failed to load upcoming plans:", loadError);
      setError("Could not load your plans. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleCompleted = useCallback(
    async (planId: number, completed: boolean) => {
      await setPlanCompleted(planId, completed);
      await refresh();
    },
    [refresh],
  );

  return { plans, loading, error, refresh, toggleCompleted };
}
