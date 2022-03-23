const jobManager = require('../../src/jobs/jobManager')
const ScanDeviceJob = require('../../src/jobs/scanDeviceJob')
const fs = require('fs-extra')
const { getFilesByDeviceAsync, getDeviceByIdAsync } = require('../../src/repo')

const testUtils = require('../common')
const path = require('path')

function getStableFileProps ({ size, relativePath, hash, mtimeMs }) {
  return { size, relativePath, hash }
}

describe('ScanDeviceJob', function () {
  const env = testUtils.setupTestEnvironment()
  env.setupDb()

  beforeEach(async function () {
    jobManager.reset()
  })

  it('deletes orphan files', async () => {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)

    const job = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [sourceDevice.id], backupDeviceId: backupDevice.id })

    await jobManager.runJobAsync(job)
    await fs.rm(path.join(sourceDevice.path, 'ico.png'))
    await jobManager.runJobAsync(job)

    const files = await getFilesByDeviceAsync(sourceDevice.id)

    expect(files).toHaveLength(4)
    expect(files.some(x => x.relativePath === 'ico.png')).toBe(false)
  })

  it('Can scan device files', async function () {
    const { backupDevice, sourceDevice } = await testUtils.createDevicesAsync(env)

    const job = await ScanDeviceJob.createScanDeviceJobAsync({ sourceDeviceIds: [sourceDevice.id], backupDeviceId: backupDevice.id })

    const promise = jobManager.runJobAsync(job)
    const state = jobManager.getJobState(job)
    expect(state.status).toBe('pending')
    await promise

    const updatedSourceDevice = await getDeviceByIdAsync(sourceDevice.id)

    expect(updatedSourceDevice.lastScanDate).toBeGreaterThan(0)
    expect(jobManager.getJobState(job).status).toBe('success')
    const files = (await getFilesByDeviceAsync(sourceDevice.id)).map(getStableFileProps)

    const log = jobManager.getJobLog(job.id)

    expect(log.some(x => x.type === 'error')).toBe(false)
    expect(log.length).toBeGreaterThan(0)
    expect(log[0].type).toBe('info')

    expect(files).toHaveLength(5)

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
})
