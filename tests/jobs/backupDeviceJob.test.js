const fs = require('fs-extra')
const { getAllBackupFilesAsync, getFilesByDeviceAsync, getDeviceByIdAsync } = require('../../src/repo')
const testUtils = require('../common')
const { createBackupDevicesJobAsync } = require('../../src/jobs/backupDeviceJob')
const jobManager = require('../../src/jobs/jobManager')
const { glob } = require('glob')

describe('backup device job', function () {
  const ctx = testUtils.createContext()
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)
    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    ctx.append({ backupDevice, sourceDevice, job })
  })

  it('shouldnt backup anything if device offline', async function () {
    const { backupDevice, job } = ctx.state
    await fs.rm(backupDevice.path, { recursive: true, force: true })

    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(true)
    expect(getAllBackupFilesAsync()).resolves.toHaveLength(0)
  })

  describe('backup all files', function () {
    beforeEach(async function () {
      await jobManager.runJobAsync(ctx.job)
      ctx.logs = jobManager.getJobLog(ctx.job.id)
    })

    it('create database files records', async function () {
      const { backupDevice } = ctx.state
      const deviceFiles = await getFilesByDeviceAsync(backupDevice.id)

      for (const file of deviceFiles) {
        expect(file.deviceId).toEqual(backupDevice.id)
        expect(file.addDate).toBeGreaterThan(1648240150900)
        expect(file.birthtimeMs).toBeLessThanOrEqual(file.addDate)
        expect(file.mtimeMs).toBeLessThanOrEqual(file.addDate)
        expect(file.deviceType).toBe('backup')
      }
      const fileSnapshotToCompare = deviceFiles.map(({ relativePath, size, hash }) => ({ relativePath, size, hash }))
      expect(fileSnapshotToCompare).toMatchInlineSnapshot(`
Array [
  Object {
    "hash": "c00e0c01987a268341fab87973d366f0",
    "relativePath": "ico.png",
    "size": 4118,
  },
  Object {
    "hash": "bc2f9ba0b1ae43677c3951194026665c",
    "relativePath": "subfolder/ico2.png",
    "size": 3490,
  },
  Object {
    "hash": "954cb5e230cd88e80a9b6960ed77d6e6",
    "relativePath": "subfolder/subfolder2/ico4.jfif",
    "size": 6312,
  },
  Object {
    "hash": "f3d25ea025f48138b294449b60aacf41",
    "relativePath": "subfolder/subfolder2/ico3.png",
    "size": 7858,
  },
]
`)
    })

    it('should set last backup date', async function () {
      const reloadedSourceDevice = await getDeviceByIdAsync(ctx.sourceDevice.id)
      expect(reloadedSourceDevice.lastBackupDate).toBeGreaterThan(0)
    })

    it('should backup files to disk', async function () {
      const { backupDevice, logs } = ctx.state

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
})
