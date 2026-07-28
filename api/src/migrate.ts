import { loadConfig } from './config.js'
import { applyMigrations, openDatabase } from './database.js'
import { migrationsDirectory } from './migrations.js'

const config = loadConfig()
const database = openDatabase(config.databasePath)
const applied = applyMigrations(database, migrationsDirectory)
database.close()
console.log(applied.length ? `applied migrations: ${applied.join(', ')}` : 'database already current')
