const fs = require('fs-extra')
const { getAllBackupFilesAsync } = require('../src/repo')
const app = require('../src/app')
const testUtils = require('./common')
const { createBackupDevicesJobAsync } = require('../src/jobs/backupDeviceJob')
const jobManager = require('../src/jobs/jobManager')
const { glob } = require('glob')

describe('backup device job', function () {
  jest.setTimeout(100000)
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {

  })

  it('shouldnt backup anything if device offline', async function () {
    const backupSourcePath = await env.createBackupSource()
    const backupDestinationPath = await env.createDummyFolder()

    const sourceDevice = await app.createSourceDeviceAsync({ name: 'source', path: backupSourcePath })
    const backupDevice = await app.createBackupDeviceAsync({ name: 'destination', path: backupDestinationPath })

    await fs.rm(backupDestinationPath, { recursive: true, force: true })

    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(true)
    expect(getAllBackupFilesAsync()).resolves.toHaveLength(0)
  })

  it('can backup files', async function () {
    const backupSourcePath = await env.createBackupSource()
    const backupDestinationPath = await env.createDummyFolder()

    const sourceDevice = await app.createSourceDeviceAsync({ name: 'source', path: backupSourcePath })
    const backupDevice = await app.createBackupDeviceAsync({ name: 'destination', path: backupDestinationPath })

    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(false)
    const files = glob.sync(`${backupDestinationPath}/**/*`, {}).map(testUtils.replaceUniqueId('replaced-foldername'))

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
