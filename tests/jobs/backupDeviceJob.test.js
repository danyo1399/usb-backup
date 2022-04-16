const fs = require('fs-extra')
const path = require('path')
const { getAllBackupFilesAsync, getFilesByDeviceAsync, getDeviceByIdAsync } = require('../../src/repo')
const testUtils = require('../common')
const { createBackupDevicesJobAsync } = require('../../src/jobs/backupDeviceJob')
const jobManager = require('../../src/jobs/jobManager')
const { glob } = require('glob')
const { createScanDeviceJobAsync } = require('../../src/jobs/scanDeviceJob')
const { getMetaFilePath } = require('../../src/device')

describe('backup device job', function () {
  const ctx = testUtils.createContext()
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env, '8f4929d058d3f3bfde84945ccff36977', '8f4929d058d3f3bfde84945ccff36978')
    const job = await createBackupDevicesJobAsync([sourceDevice.id], backupDevice.id)
    ctx.append({ backupDevice, sourceDevice, job })
  })

  it('shouldn\'t backup anything if device offline', async function () {
    const { backupDevice, job } = ctx.state
    await fs.rm(backupDevice.path, { recursive: true, force: true })

    await jobManager.runJobAsync(job)
    const logs = jobManager.getJobLog(job.id)

    expect(logs.some(x => x.type === 'error')).toBe(true)
    expect(getAllBackupFilesAsync()).resolves.toHaveLength(0)
  })

  it('shouldn\'t try to backup deleted source files', async function () {
    const { sourceDevice, job } = ctx.state

    const scanJob = await createScanDeviceJobAsync({ sourceDeviceIds: [sourceDevice.id] })

    await jobManager.runJobAsync(scanJob)

    const metafilePath = getMetaFilePath(sourceDevice)
    const tempMetafilePath = path.join(env.tempPath, path.basename(metafilePath))
    await fs.move(metafilePath, tempMetafilePath)
    await fs.rm(sourceDevice.path, { recursive: true, force: true })
    await fs.mkdir(sourceDevice.path)
    await fs.move(tempMetafilePath, metafilePath)

    scanJob.id++
    await jobManager.runJobAsync(scanJob)

    await jobManager.runJobAsync(job)
    testUtils.assertJobLogHasNoErrors(job.id)
    expect(getAllBackupFilesAsync()).resolves.toHaveLength(0)
  })

  describe('backup all files', function () {
    beforeEach(async function () {
      await jobManager.runJobAsync(ctx.job)
      testUtils.assertJobLogHasNoErrors(ctx.job.id)
      ctx.logs = jobManager.getJobLog(ctx.job.id)
    })

    it('create database files records and updates device info, and files backed up without duplicates', async function () {
      const { sourceDevice, backupDevice } = ctx.state
      const backupDeviceFiles = await getFilesByDeviceAsync(backupDevice.id)

      const updatedSourceDevice = await getDeviceByIdAsync(sourceDevice.id)
      expect(updatedSourceDevice.lastBackupDate).toBeGreaterThan(0)
      expect(updatedSourceDevice.lastScanDate).toBeGreaterThan(0)

      const updatedBackupDevice = await getDeviceByIdAsync(backupDevice.id)
      expect(updatedBackupDevice.lastScanDate).toBeGreaterThan(0)

      for (const file of backupDeviceFiles) {
        expect(file.deviceId).toEqual(backupDevice.id)
        expect(file.addDate).toBeGreaterThan(1648240150900)
        expect(file.birthtimeMs).toBeLessThanOrEqual(file.addDate)
        expect(file.mtimeMs).toBeLessThanOrEqual(file.addDate)
        expect(file.deviceType).toBe('backup')
      }
      const fileSnapshotToCompare = backupDeviceFiles.map(({ relativePath, size, hash }) => ({ relativePath, size, hash }))
      const tempPath = env.tempPathNormalised.substring(1) // remove leading slash/
      expect(fileSnapshotToCompare).toMatchInlineSnapshot(`
Array [
  Object {
    "hash": "c00e0c01987a268341fab87973d366f0",
    "relativePath": "${tempPath}/source/ico.png",
    "size": 4118,
  },
  Object {
    "hash": "bc2f9ba0b1ae43677c3951194026665c",
    "relativePath": "${tempPath}/source/subfolder/ico2.png",
    "size": 3490,
  },
  Object {
    "hash": "954cb5e230cd88e80a9b6960ed77d6e6",
    "relativePath": "${tempPath}/source/subfolder/subfolder2/ico4.jfif",
    "size": 6312,
  },
  Object {
    "hash": "f3d25ea025f48138b294449b60aacf41",
    "relativePath": "${tempPath}/source/subfolder/subfolder2/ico3.png",
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
      const { backupDevice, job } = ctx.state

      testUtils.assertJobLogHasNoErrors(job.id)
      const files = glob.sync(`${backupDevice.path}/**/*`, {})
        .filter(filename => path.extname(filename) !== '') // Remove folders

      expect(files).toMatchInlineSnapshot(`
Array [
  "${env.tempPath}/backup/8f4929d058d3f3bfde84945ccff36978.usbb",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/ico.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/ico2.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/subfolder2/ico3.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/subfolder2/ico4.jfif",
]
`)
    })

    it('should not change backup files if job ran twice', async function () {
      const { backupDevice, job } = ctx.state
      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)
      const files = glob.sync(`${backupDevice.path}/**/*`, {})
        .filter(filename => path.extname(filename) !== '') // Remove folders

      expect(files).toMatchInlineSnapshot(`
Array [
  "${env.tempPath}/backup/8f4929d058d3f3bfde84945ccff36978.usbb",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/ico.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/ico2.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/subfolder2/ico3.png",
  "${env.tempPath}/backup${env.tempPathNormalised}/source/subfolder/subfolder2/ico4.jfif",
]
`)
    })
  })
})
