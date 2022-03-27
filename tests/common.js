const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const db = require('../src/db')
const { newId, _resetNumberRange, curry } = require('../src/utils')
const jobManager = require('../src/jobs/jobManager')
const cwd = process.cwd()
const app = require('../src/app')
const { migrateDbAsync } = require('../src/migrations')

const tempRootPath = path.resolve(cwd, 'temp')
const testDataPath = exports.testDataPath = path.resolve(cwd, 'testdata')
const testBackupSourcePath = exports.testBackupSourcePath = path.resolve(testDataPath, 'backup-source')

// So we can debug tests
// We only run time manually anyway
jest.setTimeout(100 * 1000)

exports.assertJobLogHasNoErrors = (jobId) => {
  const logs = jobManager.getJobLog(jobId)
  expect(logs.some(x => x.type === 'error')).toBe(false)
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

function convertIteratorToCallback (iterator, cb) {
  return iterator.next().then(j => {
    cb(j)
    return convertIteratorToCallback(iterator, cb)
  })
}
exports.convertIteratorToCallback = convertIteratorToCallback

exports.createDevicesAsync = async (env, sourceDeviceId, backupDeviceId) => {
  const sourcePath = await env.createSourcePath()
  const backupPath = await env.createBackupPath()

  const sourceDevice = await app.createSourceDeviceAsync({ name: 'source', path: sourcePath, id: sourceDeviceId })
  const backupDevice = await app.createBackupDeviceAsync({ name: 'backup', path: backupPath, id: backupDeviceId })
  return { sourceDevice, backupDevice }
}

exports.setupTestEnvironment = () => {
  const id = newId()
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
    const backupPath = path.join(tempPath, 'backup')
    await fs.mkdir(backupPath)
    return backupPath
  }

  const createDummyFolder = async () => {
    const folder = path.join(tempPath, newId())
    await fs.mkdir(folder)
    return folder
  }

  const setupDb = ({ maxDbVersion } = {}) => {
    beforeEach(async () => {
      isDbSetup = true
      await db.setDbFilePath(path.join(tempPath, 'app.db'))
      maxDbVersion !== null && await migrateDbAsync(maxDbVersion)
      await db.openDbAsync()
    })
  }

  const createDummyFile = (filePath, size) => {
    return new Promise((resolve, reject) => {
      try {
        const filename = path.join(tempPath, filePath)
        const data = new Uint8Array(size)
        data.fill(1)
        const stream = fs.createWriteStream(filename)
        stream.end(data, (err, _) => {
          if (err) {
            reject(err)
          } else resolve(filename)
        })
      } catch (error) {
        reject(error)
      }
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

  return { tempPath, tempPathNormalised, createDummyFolder, setupDb, createDummyFile, createSourcePath, createBackupPath }
}
