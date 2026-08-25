import { getDatabase } from "./database";
import { initializeDatabase } from "./schema";

export interface Plan {
  id: number;
  title: string;
  planned_for: string;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
}

export async function createPlan(title: string, plannedFor: string) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO plans (title, planned_for, created_at)
      VALUES (?, ?, ?)
    `,
    [title.trim(), plannedFor, new Date().toISOString()],
  );
}

export async function getUpcomingPlans(): Promise<Plan[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Plan[]>(`
    SELECT *
    FROM plans
    WHERE planned_for > date('now', 'localtime')
    ORDER BY planned_for ASC, is_completed ASC, id DESC
  `);
}

export async function setPlanCompleted(planId: number, completed: boolean) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      UPDATE plans
      SET is_completed = ?, completed_at = ?
      WHERE id = ?
    `,
    [completed ? 1 : 0, completed ? new Date().toISOString() : null, planId],
  );
}
