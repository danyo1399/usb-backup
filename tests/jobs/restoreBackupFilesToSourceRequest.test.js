const fs = require('fs-extra')
const path = require('path')
const testUtils = require('../common')
const { createBackupDevicesJobAsync } = require('../../src/jobs/backupDeviceJob')
const jobManager = require('../../src/jobs/jobManager')
const { allAsync } = require('../../src/db')
const { project } = require('../../src/utils')
const { createRestoreBackupFilesToSourceRequest } = require('../../src/jobs/restoreBackupFilesToSourceRequest')
const { writeDeviceMetaFileAsync } = require('../../src/device')

describe('copy files from backup device job tests', function () {
  const ctx = testUtils.createContext()
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env, '8f4929d058d3f3bfde84945ccff36977', '8f4929d058d3f3bfde84945ccff36978')
    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    ctx.append({ backupDevice, sourceDevice, job })
  })

  it('can copy whole folders', async function () {
    await env.createDummyFileAsync('backup/dummyfolder/testfile', 1024)
    await env.createDummyFileAsync('backup/dummyfolder/testfile2', 512)

    await testUtils.clearDirAsync(ctx.sourceDevice.path)
    await writeDeviceMetaFileAsync(ctx.sourceDevice)

    await testUtils.scanDeviceAsync(ctx.backupDevice.id, ctx.sourceDevice.id)
    const job = await createRestoreBackupFilesToSourceRequest(ctx.backupDevice.id, ctx.sourceDevice.id, '', ['dummyfolder/'])
    await jobManager.runJobAsync(job)
    testUtils.assertJobLogHasNoErrors(job.id)

    const dbFiles = await allAsync(`
    select * from files where deviceId = ?`, ctx.sourceDevice.id)
    const files = await fs.readdir(path.join(ctx.sourceDevice.path, 'dummyfolder'))

    expect(dbFiles.map((x) => x.relativePath)).toMatchInlineSnapshot(`
Array [
  "dummyfolder/testfile2",
  "dummyfolder/testfile",
]
`)
    expect(files).toMatchInlineSnapshot(`
Array [
  "testfile",
  "testfile2",
]
`)
  })

  it('can copy files from backup to source', async function () {
    await env.createDummyFileAsync('backup/dummyfolder/testfile', 1024)
    await testUtils.scanDeviceAsync(ctx.backupDevice.id)
    const job = await createRestoreBackupFilesToSourceRequest(ctx.backupDevice.id, ctx.sourceDevice.id, 'copied-files/somewhere', ['dummyfolder/testfile'])
    await jobManager.runJobAsync(job)
    testUtils.assertJobLogHasNoErrors(job.id)

    const dbFiles = await allAsync(`
    select * from files where relativePath like 'copied-files%'`)
    const files = await fs.readdir(path.join(ctx.sourceDevice.path, 'copied-files/somewhere/dummyfolder'))

    expect(project(['deleted', 'deviceType', 'size', 'relativePath', 'id'], dbFiles)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 0,
    "deviceType": "source",
    "id": 2,
    "relativePath": "copied-files/somewhere/dummyfolder/testfile",
    "size": 1024,
  },
]
`)
    expect(files).toMatchInlineSnapshot(`
Array [
  "testfile",
]
`)
  })
})
