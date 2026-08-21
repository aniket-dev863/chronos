import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase() {
  if (!db) {
    db = await Database.load("sqlite:chronos.db");
  }

  return db;
}
