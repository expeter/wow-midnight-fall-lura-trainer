import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export type Database = DatabaseSync

export function openDatabase(path: string): Database {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true })
  const database = new DatabaseSync(path)
  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA busy_timeout = 5000')
  if (path !== ':memory:') database.exec('PRAGMA journal_mode = WAL')
  return database
}

export function applyMigrations(database: Database, migrationsDirectory: string): number[] {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `)
  const applied = new Set(
    database.prepare('SELECT version FROM schema_migrations').all()
      .map(row => Number(row.version)),
  )
  const completed: number[] = []
  const files = readdirSync(migrationsDirectory)
    .filter(file => /^\d+_.+\.sql$/.test(file))
    .sort()
  for (const file of files) {
    const version = Number(file.slice(0, file.indexOf('_')))
    if (applied.has(version)) continue
    const sql = readFileSync(resolve(migrationsDirectory, file), 'utf8')
    database.exec('BEGIN IMMEDIATE')
    try {
      database.exec(sql)
      database.prepare(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
      ).run(version, new Date().toISOString())
      database.exec('COMMIT')
      completed.push(version)
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }
  return completed
}
