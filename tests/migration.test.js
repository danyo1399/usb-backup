const { runAsync, allAsync, execAsync } = require('../src/db')
const { getCurrentVersionAsync, migrateDbAsync, getRequiredDbVersion, addDbMigration, restoreDbBackup, removeMigration } = require('../src/migration')
const { setupTestEnvironment } = require('./common')

describe('migration tests', () => {
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

  it('should be able to migrate from v1 to v2', async function () {
    await migrateDbAsync(1)
    await execAsync(`
    INSERT INTO devices (id, deviceType, name, description, path, lastScanDate, lastBackupDate, addDate) VALUES ('65195ae46a9fea775cdb1422ff8fae9e', 'backup', 'backup device', '2', 'c:\\temp\\backup2', 1648253710898, 0, 1647894852870);
    INSERT INTO devices (id, deviceType, name, description, path, lastScanDate, lastBackupDate, addDate) VALUES ('99310e8589d91098d762336a7305943c', 'source', 'test', 'ss', 'c:\\temp\\test', 1648703184336, 1648346246573, 1648344187480);
    INSERT INTO devices (id, deviceType, name, description, path, lastScanDate, lastBackupDate, addDate) VALUES ('2a20e7d1a2cacc31be116a08e939bdca', 'source', 'test 2', '', 'c:\\temp\\test2', 1648703184347, 1648346246937, 1648345862288);

    INSERT INTO files (id, deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate) VALUES ('["65195ae46a9fea775cdb1422ff8fae9e","temp/test/subfolder/7z2107-x64.zip",1648252981812,1811303,1648252981808]', '65195ae46a9fea775cdb1422ff8fae9e', 'backup', 'temp/test/subfolder/7z2107-x64.zip', 1648252981812, 1648252981808, 1811303, 'e8866243f315aad12c589cc5ff428092', 0, 1648252981814, 1648252981814);
    INSERT INTO files (id, deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate) VALUES ('["65195ae46a9fea775cdb1422ff8fae9e","temp/test/7z2107-x64.msi",1648253818678,1863168,1648253818673]', '65195ae46a9fea775cdb1422ff8fae9e', 'backup', 'temp/test/7z2107-x64.msi', 1648253818678, 1648253818673, 1863168, '6a996b544a03917dee5c590b9d5043af', 0, 1648253818680, 1648253818680);
    INSERT INTO files (id, deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate) VALUES ('["99310e8589d91098d762336a7305943c","7z2107-x64.msi",1645002464107,1863168,1647845604259]', '99310e8589d91098d762336a7305943c', 'source', '7z2107-x64.msi', 1645002464107, 1647845604259, 1863168, '6a996b544a03917dee5c590b9d5043af', 0, 1648344192716, 1648344192716);
    INSERT INTO files (id, deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate) VALUES ('["99310e8589d91098d762336a7305943c","subfolder/7z2107-x64.zip",1648252975206,1811303,1648252975159]', '99310e8589d91098d762336a7305943c', 'source', 'subfolder/7z2107-x64.zip', 1648252975206, 1648252975159, 1811303, 'e8866243f315aad12c589cc5ff428092', 0, 1648344192728, 1648344192728);
    INSERT INTO files (id, deviceId, deviceType, relativePath, mtimeMs, birthtimeMs, size, hash, deleted, addDate, editDate) VALUES ('["2a20e7d1a2cacc31be116a08e939bdca","7z2107-x64.msi",1647845609863,1863168,1647845609858]', '2a20e7d1a2cacc31be116a08e939bdca', 'source', '7z2107-x64.msi', 1647845609863, 1647845609858, 1863168, '6a996b544a03917dee5c590b9d5043af', 0, 1648345879235, 1648345879235);
    `)

    await migrateDbAsync()
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
