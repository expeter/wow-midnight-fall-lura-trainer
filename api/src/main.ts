import { loadConfig } from './config.js'
import { applyMigrations, openDatabase } from './database.js'
import { createHttpServer } from './http.js'
import { migrationsDirectory } from './migrations.js'

const config = loadConfig()
const database = openDatabase(config.databasePath)
applyMigrations(database, migrationsDirectory)
const server = createHttpServer(database, config)

server.listen(config.port, config.host, () => {
  console.log(`lura-api listening on http://${config.host}:${config.port}`)
})

function shutdown(signal: string) {
  console.log(`received ${signal}; shutting down`)
  server.close(() => {
    database.close()
    process.exit(0)
  })
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
