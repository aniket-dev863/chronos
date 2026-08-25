import { getDatabase } from "./database";

export interface Session {
  id?: number;
  activity: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  created_at: string;
}

export async function saveSession(session: Omit<Session, "id">) {
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

export async function getTodaySessions(): Promise<Session[]> {
  const db = await getDatabase();

  return await db.select<Session[]>(`
    SELECT *
    FROM sessions
    WHERE date(started_at, 'localtime') = date('now', 'localtime')
    ORDER BY started_at DESC
  `);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDatabase();

  return await db.select<Session[]>(`
    SELECT *
    FROM sessions
    ORDER BY started_at DESC
  `);
}

export async function deleteSession(sessionId: number) {
  const db = await getDatabase();

  await db.execute("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

export async function updateSession(
  sessionId: number,
  session: Omit<Session, "id" | "created_at">,
) {
  const db = await getDatabase();

  await db.execute(
    `
      UPDATE sessions
      SET activity = ?, started_at = ?, ended_at = ?, duration_seconds = ?
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
