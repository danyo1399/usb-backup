const fs = require('fs-extra')
const { getAllBackupFilesAsync } = require('../../src/repo')
const testUtils = require('../common')
const { createBackupDevicesJobAsync } = require('../../src/jobs/backupDeviceJob')
const jobManager = require('../../src/jobs/jobManager')
const { glob } = require('glob')

describe('backup device job', function () {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {

  })

  it('shouldnt backup anything if device offline', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)

    await fs.rm(backupDevice.path, { recursive: true, force: true })

    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(true)
    expect(getAllBackupFilesAsync()).resolves.toHaveLength(0)
  })

  it('can backup files', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)

    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(false)
    const files = glob.sync(`${backupDevice.path}/**/*`, {}).map(testUtils.replaceUniqueId('replaced-foldername'))

    expect(files).toMatchInlineSnapshot(`
Array [
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/replaced-foldername.usbb",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/ico.png",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/subfolder",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/subfolder/ico2.png",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/subfolder/subfolder2",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/subfolder/subfolder2/ico3.png",
  "c:/src/usb-backup/temp/replaced-foldername/replaced-foldername/subfolder/subfolder2/ico4.jfif",
]
`)
  })
})
