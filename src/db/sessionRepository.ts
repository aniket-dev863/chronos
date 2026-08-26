import { getDatabase } from "./database";
import { initializeDatabase } from "./schema";

export interface Session {
  id?: number;
  activity: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  created_at: string;
}

/*
 * --------------------------------------------------
 * SAVE SESSION
 * --------------------------------------------------
 */

export async function saveSession(session: Omit<Session, "id">) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      INSERT INTO sessions (
        activity,
        started_at,
        ended_at,
        duration_seconds,
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      session.activity,
      session.started_at,
      session.ended_at,
      session.duration_seconds,
      session.created_at,
    ],
  );
}

/*
 * --------------------------------------------------
 * GET TODAY'S SESSIONS
 * --------------------------------------------------
 */

export async function getTodaySessions(): Promise<Session[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Session[]>(`
    SELECT
      id,
      activity,
      started_at,
      ended_at,
      duration_seconds,
      created_at
    FROM sessions
    WHERE date(started_at, 'localtime') = date('now', 'localtime')
    ORDER BY started_at DESC
  `);
}

/*
 * --------------------------------------------------
 * GET ALL SESSIONS
 * --------------------------------------------------
 */

export async function getAllSessions(): Promise<Session[]> {
  await initializeDatabase();

  const db = await getDatabase();

  return db.select<Session[]>(`
    SELECT
      id,
      activity,
      started_at,
      ended_at,
      duration_seconds,
      created_at
    FROM sessions
    ORDER BY started_at DESC
  `);
}

/*
 * --------------------------------------------------
 * UPDATE SESSION
 * --------------------------------------------------
 */

export async function updateSession(
  sessionId: number,
  session: Omit<Session, "id" | "created_at">,
) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      UPDATE sessions
      SET
        activity = ?,
        started_at = ?,
        ended_at = ?,
        duration_seconds = ?
      WHERE id = ?
    `,
    [
      session.activity,
      session.started_at,
      session.ended_at,
      session.duration_seconds,
      sessionId,
    ],
  );
}

/*
 * --------------------------------------------------
 * DELETE SESSION
 * --------------------------------------------------
 */

export async function deleteSession(sessionId: number) {
  await initializeDatabase();

  const db = await getDatabase();

  await db.execute(
    `
      DELETE FROM sessions
      WHERE id = ?
    `,
    [sessionId],
  );
}
