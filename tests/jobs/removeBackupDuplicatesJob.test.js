const fs = require('fs-extra')
const { getFilesByDeviceAsync } = require('../../src/repo')
const testUtils = require('../common')
const jobManager = require('../../src/jobs/jobManager')
const { createRemoveBackupDuplicatesJobAsync } = require('../../src/jobs/removeBackupDuplicatesJob')

describe('remove backup duplicates job tests', function () {
  const ctx = testUtils.createContext()
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env, '8f4929d058d3f3bfde84945ccff36977', '8f4929d058d3f3bfde84945ccff36978')
    ctx.append({ backupDevice, sourceDevice })
  })

  it('Should not allow source devices', async function () {
    const job = await createRemoveBackupDuplicatesJobAsync(ctx.sourceDevice.id)
    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)
    expect(logs.filter((x) => x.type === 'error').map((x) => x.message)).toMatchInlineSnapshot(`
Array [
  "job failed removeBackupDuplicatesJob: 1, incorrect device type. Expected backup, received source",
]
`)
  })

  it('should remove duplicate files', async function () {
    const file = 'backup/testfile'
    const fullName = await env.createDummyFileAsync(file, 1024)
    await fs.copyFile(fullName, fullName + '-copy')
    await testUtils.scanDeviceAsync(ctx.backupDevice.id)

    const job = await createRemoveBackupDuplicatesJobAsync(ctx.backupDevice.id)
    await jobManager.runJobAsync(job)
    testUtils.assertJobLogHasNoErrors(job.id)

    const files = await fs.readdir(ctx.backupDevice.path)
    const dbFiles = await getFilesByDeviceAsync(ctx.backupDevice.id, { includeDeleted: true })

    expect(files).toMatchInlineSnapshot(`
Array [
  "${ctx.backupDevice.id}.usbb",
  "testfile-copy",
]
`)
    expect(dbFiles.map(({ relativePath, deleted }) => ({ relativePath, deleted }))).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 0,
    "relativePath": "testfile-copy",
  },
  Object {
    "deleted": 1,
    "relativePath": "testfile",
  },
]
`)
  })
})
