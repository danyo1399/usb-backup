const jobManager = require('../../src/jobs/jobManager')
const ScanDeviceJob = require('../../src/jobs/scanDeviceJob')
const fs = require('fs-extra')
const { getFilesByDeviceAsync, getDeviceByIdAsync } = require('../../src/repo')

const testUtils = require('../common')
const path = require('path')
const { project } = require('../../src/utils')

function getStableFileProps ({ size, relativePath, hash, mtimeMs }) {
  return { size, relativePath, hash }
}

describe('ScanDeviceJob', function () {
  const env = testUtils.setupTestEnvironment()
  const ctx = testUtils.createContext()
  env.setupDb()

  beforeEach(async function () {
    jobManager.reset()
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)
    ctx.append({ backupDevice, sourceDevice })
  })

  function commonTests () {
    it('updating file fingerprint should create a new file', async function () {
      const { sourceDevice, job } = ctx.state
      await jobManager.runJobAsync(job)

      const filePath = path.join(sourceDevice.path, 'ico.png')
      const date = new Date(2000, 0, 1)
      await fs.utimes(filePath, date, date)
      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)
      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true })).filter(x => x.relativePath === 'ico.png')
      expect(project(['relativePath', 'deleted', 'mtimeMs'], files)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 1,
    "mtimeMs": 1645346484463,
    "relativePath": "ico.png",
  },
  Object {
    "deleted": 0,
    "mtimeMs": 946638000000,
    "relativePath": "ico.png",
  },
]
`)
    })

    it('Should mark existing file deleted and create new file record when a file is modified', async function () {
      const { sourceDevice, job } = ctx.state
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)
      const filePath = path.join(sourceDevice.path, 'ico.png')
      await fs.writeJson(filePath, 'some changed file')

      const secondJob = await ScanDeviceJob.createScanDeviceJobAsync({
        sourceDeviceIds: [sourceDevice.id]
      })
      await jobManager.runJobAsync(secondJob)
      testUtils.assertJobLogHasNoErrors(secondJob.id)

      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true })).filter(x => x.relativePath === 'ico.png')
      expect(project(['deleted', 'id', 'relativePath', 'size'], files)).toMatchInlineSnapshot(`
  Array [
    Object {
      "deleted": 1,
      "id": 1,
      "relativePath": "ico.png",
      "size": 4118,
    },
    Object {
      "deleted": 0,
      "id": 6,
      "relativePath": "ico.png",
      "size": 20,
    },
  ]
  `)
    })

    it('should create new undeleted file when same file is deleted then added', async () => {
      const { sourceDevice, job, backupDevice } = ctx.state

      const sourcePath = path.join(sourceDevice.path, 'ico.png')
      const backupPath = path.join(backupDevice.path, 'ico.png')

      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      await fs.move(sourcePath, backupPath)
      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      await fs.move(backupPath, sourcePath)
      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true })).filter(x => x.relativePath === 'ico.png')
      expect(project(['relativePath', 'deleted', 'id'], files)).toMatchInlineSnapshot(`
  Array [
    Object {
      "deleted": 1,
      "id": 1,
      "relativePath": "ico.png",
    },
    Object {
      "deleted": 0,
      "id": 6,
      "relativePath": "ico.png",
    },
  ]
  `)
    })

    it('should mark a file as deleted when a file is removed', async () => {
      const { sourceDevice, job } = ctx.state

      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      await fs.rm(path.join(sourceDevice.path, 'ico.png'))
      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const files = await getFilesByDeviceAsync(sourceDevice.id)

      expect(files).toHaveLength(4)
      expect(files.some(x => x.relativePath === 'ico.png')).toBe(false)
    })

    it('makes no changes when scan job is run twice with no file system changes', async function () {
      const { sourceDevice, backupDevice, job } = ctx.state
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)
      const firstFiles = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true }))

      const secondJob = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [sourceDevice.id], backupDeviceId: backupDevice.id })
      await jobManager.runJobAsync(secondJob)
      testUtils.assertJobLogHasNoErrors(secondJob.id)
      const secondFiles = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true }))

      expect(firstFiles).toEqual(secondFiles)
    })

    it('Can scan device files', async function () {
      const { sourceDevice, job } = ctx.state

      const promise = jobManager.runJobAsync(job)
      const state = jobManager.getJobState(job)
      expect(state.status).toBe('pending')
      await promise

      const updatedSourceDevice = await getDeviceByIdAsync(sourceDevice.id)

      expect(updatedSourceDevice.lastScanDate).toBeGreaterThan(0)
      expect(jobManager.getJobState(job).status).toBe('success')
      const files = (await getFilesByDeviceAsync(sourceDevice.id)).map(getStableFileProps)

      const log = jobManager.getJobLog(job.id)

      testUtils.assertJobLogHasNoErrors(job.id)
      expect(log.length).toBeGreaterThan(0)
      expect(log[0].type).toBe('info')

      expect(files).toMatchInlineSnapshot(`
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
      "hash": "bc2f9ba0b1ae43677c3951194026665c",
      "relativePath": "subfolder/ico2 copy.png",
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
  }
  describe('full scan tests', function () {
    beforeEach(async function () {
      const job = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [ctx.sourceDevice.id], backupDeviceId: ctx.backupDevice.id, useFullScan: true })
      ctx.append({ job })
    })
    commonTests()

    it('Updating file contents and not fingerprint should update file', async function () {
      const { sourceDevice, job } = ctx.state
      const tempFilename = path.join(sourceDevice.path, 'test.json')
      const date = new Date(2000, 0, 1)
      await fs.writeJson(tempFilename, 'a')
      await fs.utimes(tempFilename, date, date)

      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      await fs.writeJson(tempFilename, 'b')
      await fs.utimes(tempFilename, date, date)

      job.id++
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)

      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true })).filter(x => x.relativePath === 'test.json')
      expect(project(['relativePath', 'deleted', 'mtimeMs'], files)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 1,
    "mtimeMs": 946638000000,
    "relativePath": "test.json",
  },
  Object {
    "deleted": 0,
    "mtimeMs": 946638000000,
    "relativePath": "test.json",
  },
]
`)
    })
  })

  describe('partial scan tests', function () {
    beforeEach(async function () {
      const job = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [ctx.sourceDevice.id], backupDeviceId: ctx.backupDevice.id })
      ctx.append({ job })
    })

    it('Updating file contents and not fingerprint should not update file', async function () {
      const { sourceDevice, job } = ctx.state
      const tempFilename = path.join(sourceDevice.path, 'test.json')
      const date = new Date(2000, 0, 1)
      await fs.writeJson(tempFilename, 'a')
      await fs.utimes(tempFilename, date, date)

      await jobManager.runJobAsync(job)

      await fs.writeJson(tempFilename, 'b')
      await fs.utimes(tempFilename, date, date)

      job.id++
      await jobManager.runJobAsync(job)

      testUtils.assertJobLogHasNoErrors(job.id)
      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true })).filter(x => x.relativePath === 'test.json')
      expect(project(['relativePath', 'deleted', 'mtimeMs'], files)).toMatchInlineSnapshot(`
Array [
  Object {
    "deleted": 0,
    "mtimeMs": 946638000000,
    "relativePath": "test.json",
  },
]
`)
    })
    it('should update the existing row and not delete and recreate a new row when a file is moved', async function () {
      const { sourceDevice, backupDevice, job } = ctx.state
      await jobManager.runJobAsync(job)
      testUtils.assertJobLogHasNoErrors(job.id)
      const filePath = path.join(sourceDevice.path, 'ico.png')
      const destPath = path.join(sourceDevice.path, 'new-path', 'ico.png')
      await fs.move(filePath, destPath)

      const secondJob = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [sourceDevice.id], backupDeviceId: backupDevice.id })
      await jobManager.runJobAsync(secondJob)
      testUtils.assertJobLogHasNoErrors(secondJob.id)

      const files = (await getFilesByDeviceAsync(sourceDevice.id, { includeDeleted: true }))
        .map(({ deleted, relativePath, hash }) => ({ deleted, relativePath, hash }))

      expect(files).toMatchInlineSnapshot(`
  Array [
    Object {
      "deleted": 0,
      "hash": "bc2f9ba0b1ae43677c3951194026665c",
      "relativePath": "subfolder/ico2.png",
    },
    Object {
      "deleted": 0,
      "hash": "bc2f9ba0b1ae43677c3951194026665c",
      "relativePath": "subfolder/ico2 copy.png",
    },
    Object {
      "deleted": 0,
      "hash": "954cb5e230cd88e80a9b6960ed77d6e6",
      "relativePath": "subfolder/subfolder2/ico4.jfif",
    },
    Object {
      "deleted": 0,
      "hash": "f3d25ea025f48138b294449b60aacf41",
      "relativePath": "subfolder/subfolder2/ico3.png",
    },
    Object {
      "deleted": 0,
      "hash": "c00e0c01987a268341fab87973d366f0",
      "relativePath": "new-path/ico.png",
    },
  ]
  `)
    })

    commonTests()
  })
})
