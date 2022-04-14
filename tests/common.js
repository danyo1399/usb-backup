const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const db = require('../src/db')
const { newId, _resetNumberRange, curry } = require('../src/utils')
const jobManager = require('../src/jobs/jobManager')
const cwd = process.cwd()
const { migrateDbAsync } = require('../src/migration')
const { createScanDeviceJobAsync } = require('../src/jobs/scanDeviceJob')
const { ensureFilePathExistsAsync, joinPaths } = require('../src/path')
const device = require('../src/device')

const tempRootPath = path.resolve(cwd, 'temp')
const testDataPath = exports.testDataPath = path.resolve(cwd, 'testdata')
const testBackupSourcePath = exports.testBackupSourcePath = path.resolve(testDataPath, 'backup-source')

exports.assertJobLogHasNoErrors = (jobId) => {
  const logs = jobManager.getJobLog(jobId)
  expect(logs.filter(x => x.type === 'error')).toEqual([])
}

exports.sleep = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

/**
 * Creates a this like context to store test contextual state assigned during test setup
 *
 * Remarks:
 * Created as jest does not support context aware this anymore.
 */
exports.createContext = () => {
  let state = {}
  const context = {
    append (obj) { state = { ...state, ...obj } },
    reset () { state = {} }
  }

  beforeEach(async function () {
    context.reset()
  })

  const handler = {
    get (obj, prop) {
      if (prop === 'state') return state
      return prop in state
        ? state[prop]
        : obj[prop]
    },
    set (obj, prop, value) {
      state[prop] = value
    }
  }
  return new Proxy(context, handler)
}

exports.replaceUniqueId = curry((replacement, inStr) => {
  return inStr.replaceAll(/[0-9a-f]{32}/g, replacement)
})

/**
 * Iterates over an iterator until callback method returns false
 */
async function convertIteratorToCallbackAsync (iterator, cb) {
  while (true) {
    const nextValue = await iterator.next()
    if (cb(nextValue) === false) break
  }
}

exports.convertIteratorToCallbackAsync = convertIteratorToCallbackAsync

/**
 * Supports a real edge case where i need to test noting is emitted after cancel is called.
 * its not fullproof by any means.
 * not really sure how to better handle this given theres no way to cancel a promise.
 * @param {*} promise
 * @param {*} timeoutMs
 * @returns
 */
exports.waitForPromise = (promise, timeoutMs) => {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      resolve()
    }, timeoutMs)

    promise.then(x => {
      clearTimeout(id)
      resolve(x)
    }).catch(err => reject(err))
  })
}

exports.createBackupDeviceAsync = async (env, backupDeviceId) => {
  const backupPath = await env.createBackupPath()
  return await device.createBackupDeviceAsync({ name: 'backup', path: backupPath, id: backupDeviceId })
}

exports.createDevicesAsync = async (env, sourceDeviceId, backupDeviceId) => {
  const sourcePath = await env.createSourcePath()

  const sourceDevice = await device.createSourceDeviceAsync({ name: 'source', path: sourcePath, id: sourceDeviceId })
  const backupDevice = await this.createBackupDeviceAsync(env, backupDeviceId)
  return { sourceDevice, backupDevice }
}

exports.scanDeviceAsync = async (...ids) => {
  const scanJob = await createScanDeviceJobAsync({ sourceDeviceIds: ids })
  await jobManager.runJobAsync(scanJob)
  exports.assertJobLogHasNoErrors(scanJob.id)
}

exports.clearDirAsync = async (dirPath) => {
  await fs.rm(dirPath, { force: true, recursive: true })
  await fs.mkdir(dirPath, { recursive: true })
}

// dates that are consistent regardless of region
exports.testDate2000 = new Date(946638000000)
exports.testDate2001 = new Date(978260400000)

exports.setupTestEnvironment = (id) => {
  id = id || newId()
  const tempPath = path.resolve(tempRootPath, id).replaceAll('\\', '/')
  let isDbSetup = false

  const createSourcePath = async () => {
    const tempSourcePath = path.join(tempPath, 'source')
    await fs.copy(testBackupSourcePath, tempSourcePath, { recursive: true })
    return tempSourcePath
  }

  /**
   * Creates similar paths on windows and linux eg
   * c:/test
   * and /test
   * should return the same temp path /test
   *
   * This is used for testing
   */
  const tempPathNormalised = process.platform === 'win32' ? tempPath.substring(2) : tempPath

  const createBackupPath = async () => {
    const backupPath = joinPaths(tempPath, 'backup')
    await fs.mkdir(backupPath)
    return backupPath
  }

  const createDummyFolder = async () => {
    const folder = joinPaths(tempPath, newId())
    await fs.mkdir(folder)
    return folder
  }

  const setupDb = ({ maxDbVersion } = {}) => {
    beforeEach(async () => {
      isDbSetup = true
      await db.setDbFilePath(joinPaths(tempPath, 'app.db'))
      maxDbVersion !== null && await migrateDbAsync(maxDbVersion)
      await db.openDbAsync()
    })
  }

  const createDummyFileAsync = (filePath, size) => {
    return new Promise((resolve, reject) => {
      const filename = joinPaths(tempPath, filePath)
      ensureFilePathExistsAsync(filename).then(() => {
        const data = new Uint8Array(size)
        data.fill(1)
        const stream = fs.createWriteStream(filename)
        stream.end(data, (err, _) => {
          if (err) {
            reject(err)
          } else resolve(filename)
        })
      }).catch(err => reject(err))
    })
  }

  beforeEach(async () => {
    jobManager.reset()
    _resetNumberRange()
    await fs.mkdir(tempPath, { recursive: true })
  })

  afterEach(async () => {
    if (isDbSetup) await db.closeDbAsync()
    await fs.rm(tempPath, { force: true, recursive: true, maxRetries: 3, retryDelay: 100 })
  })

  return { tempPath, tempPathNormalised, createDummyFolder, setupDb, createDummyFileAsync, createSourcePath, createBackupPath }
}
