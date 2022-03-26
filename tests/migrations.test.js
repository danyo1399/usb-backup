const { runAsync, allAsync } = require('../src/db')
const { getCurrentVersionAsync, migrateDbAsync, getRequiredDbVersion, addDbMigration, restoreDbBackup, removeMigration } = require('../src/migrations')
const { setupTestEnvironment } = require('./common')

describe('db tests', () => {
  const env = setupTestEnvironment()
  env.setupDb({ maxDbVersion: null })

  afterEach(() => removeMigration(testMigration))

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
    const currentVersion = getRequiredDbVersion()
    addDbMigration(testMigration)

    await migrateDbAsync(currentVersion)
    await allAsync('select 1 from files')
    await migrateDbAsync(currentVersion + 1)
    await allAsync('select 1 from files2')
    await restoreDbBackup(currentVersion)
    await allAsync('select 1 from files')
  })
})

const testMigration = async () => {
  await runAsync('ALTER TABLE files RENAME TO files2')
}
