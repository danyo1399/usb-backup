const { runAsync, allAsync } = require('../src/db')
const { getCurrentVersionAsync, migrateDbAsync, getRequiredDbVersion, addDbMigration, restoreDbBackup } = require('../src/migrations')
const { setupTestEnvironment } = require('./common')
describe('db tests', () => {
  const env = setupTestEnvironment()
  env.setupDb({ maxDbVersion: null })

  it('Initial db version should be -1', async () => {
    const version = await getCurrentVersionAsync()
    expect(version).toBe(-1)
  })

  it('should apply all migrations when migrating', async () => {
    await migrateDbAsync()
    const version = await getCurrentVersionAsync()
    expect(version).toBe(getRequiredDbVersion())
  })

  it('should backup existing db when upgrading', async () => {
    addDbMigration(async () => {
      await runAsync('ALTER TABLE files RENAME TO files2')
    })

    await migrateDbAsync(0)
    await allAsync('select 1 from files')
    await migrateDbAsync(1)
    await allAsync('select 1 from files2')
    await restoreDbBackup(0)
    await allAsync('select 1 from files')
  })
})
