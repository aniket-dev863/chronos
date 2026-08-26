import { getDatabase } from "./database";

async function addColumnIfMissing(
  db: Awaited<ReturnType<typeof getDatabase>>,
  table: string,
  column: string,
  definition: string,
) {
  const columns = await db.select<Array<{ name: string }>>(
    `PRAGMA table_info(${table})`,
  );

  const exists = columns.some((item) => item.name === column);

  if (!exists) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function initializeDatabase() {
  const db = await getDatabase();

  /*
   * --------------------------------------------------
   * SESSIONS
   * --------------------------------------------------
   */

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  /*
   * --------------------------------------------------
   * PLANS
   * --------------------------------------------------
   */

  await db.execute(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      planned_for TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      created_at TEXT NOT NULL
    )
  `);

  /*
   * --------------------------------------------------
   * PLAN MIGRATION
   *
   * These columns are added automatically for users
   * who already have the old plans table.
   * --------------------------------------------------
   */

  await addColumnIfMissing(db, "plans", "description", "TEXT");

  await addColumnIfMissing(
    db,
    "plans",
    "priority",
    "TEXT NOT NULL DEFAULT 'medium'",
  );

  await addColumnIfMissing(
    db,
    "plans",
    "category",
    "TEXT NOT NULL DEFAULT 'other'",
  );

  await addColumnIfMissing(
    db,
    "plans",
    "estimated_minutes",
    "INTEGER NOT NULL DEFAULT 0",
  );

  /*
   * --------------------------------------------------
   * INDEXES
   * --------------------------------------------------
   */

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_plans_planned_for
    ON plans (planned_for)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_plans_completed
    ON plans (is_completed)
  `);
}
