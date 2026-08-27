import { getDatabase } from "./database";
import { initializeDatabase } from "./schema";

export type PlanPriority = "low" | "medium" | "high";

export type PlanCategory =
  | "DSA"
  | "Development"
  | "Placement"
  | "Academics"
  | "Other";

export interface Plan {
  id: number;
  title: string;
  description: string | null;
  planned_for: string;
  priority: PlanPriority;
  category: PlanCategory;
  estimated_minutes: number;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  planned_for: string;
  priority: PlanPriority;
  category: PlanCategory;
  estimated_minutes: number;
}

export interface UpdatePlanInput {
  title: string;
  description?: string;
  planned_for: string;
  priority: PlanPriority;
  category: PlanCategory;
  estimated_minutes: number;
}

/*
 * --------------------------------------------------
 * CREATE PLAN
 * --------------------------------------------------
 */

export async function createPlan(input: CreatePlanInput) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO plans (
        title,
        description,
        planned_for,
        priority,
        category,
        estimated_minutes,
        is_completed,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.planned_for,
      input.priority,
      input.category,
      input.estimated_minutes,
      new Date().toISOString(),
    ],
  );
}

/*
 * --------------------------------------------------
 * UPDATE  PLANS
 * --------------------------------------------------
 */

export async function updatePlan(planId: number, input: UpdatePlanInput) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      UPDATE plans
      SET
        title = ?,
        description = ?,
        planned_for = ?,
        priority = ?,
        category = ?,
        estimated_minutes = ?
      WHERE id = ?
    `,
    [
      input.title.trim(),
      input.description?.trim() || null,
      input.planned_for,
      input.priority,
      input.category,
      input.estimated_minutes,
      planId,
    ],
  );
}
/*
 * --------------------------------------------------
 * GET ALL PLANS
 * --------------------------------------------------
 */

export async function getAllPlans(): Promise<Plan[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Plan[]>(`
    SELECT
      id,
      title,
      description,
      planned_for,
      priority,
      category,
      estimated_minutes,
      is_completed,
      completed_at,
      created_at
    FROM plans
    ORDER BY
      planned_for ASC,
      is_completed ASC,
      CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END,
      id DESC
  `);
}

/*
 * --------------------------------------------------
 * GET TODAY'S PLANS
 * --------------------------------------------------
 */

export async function getTodayPlans(): Promise<Plan[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Plan[]>(`
    SELECT
      id,
      title,
      description,
      planned_for,
      priority,
      category,
      estimated_minutes,
      is_completed,
      completed_at,
      created_at
    FROM plans
    WHERE planned_for = date('now', 'localtime')
    ORDER BY
      is_completed ASC,
      CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END,
      id DESC
  `);
}

/*
 * --------------------------------------------------
 * GET UPCOMING PLANS
 * --------------------------------------------------
 */

export async function getUpcomingPlans(): Promise<Plan[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Plan[]>(`
    SELECT
      id,
      title,
      description,
      planned_for,
      priority,
      category,
      estimated_minutes,
      is_completed,
      completed_at,
      created_at
    FROM plans
    WHERE planned_for > date('now', 'localtime')
    ORDER BY
      planned_for ASC,
      is_completed ASC,
      CASE priority
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        ELSE 3
      END,
      id DESC
  `);
}

/*
 * --------------------------------------------------
 * COMPLETE / UNCOMPLETE PLAN
 * --------------------------------------------------
 */

export async function setPlanCompleted(planId: number, completed: boolean) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      UPDATE plans
      SET
        is_completed = ?,
        completed_at = ?
      WHERE id = ?
    `,
    [completed ? 1 : 0, completed ? new Date().toISOString() : null, planId],
  );
}

/*
 * --------------------------------------------------
 * DELETE PLAN
 * --------------------------------------------------
 */

export async function deletePlan(planId: number) {
  await initializeDatabase();

  const db = await getDatabase();

  console.log("DB DELETE:", planId);

  const result = await db.execute(
    `
      DELETE FROM plans
      WHERE id = ?
    `,
    [planId],
  );

  console.log("DB DELETE RESULT:", result);
}
