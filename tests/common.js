const fs = require('fs-extra')
const path = require('path')
const process = require('process')
const db = require('../src/db')
const { newId, _resetNumberRange, curry } = require('../src/utils')
const jobManager = require('../src/jobs/jobManager')
const cwd = process.cwd()

const tempRootPath = path.resolve(cwd, 'temp')
const testDataPath = exports.testDataPath = path.resolve(cwd, 'testdata')
const testBackupSourcePath = exports.testBackupSourcePath = path.resolve(testDataPath, 'backup-source')

exports.sleep = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

exports.replaceUniqueId = curry((replacement, inStr) => {
  return inStr.replaceAll(/[0-9a-f]{32}/g, replacement)
})

exports.setupTestEnvironment = () => {
  const id = newId()
  const tempPath = path.resolve(tempRootPath, id)
  let isDbSetup = false

  const createBackupSource = async () => {
    const tempSourcePath = path.join(tempPath, 'backup-source')
    await fs.copy(testBackupSourcePath, tempSourcePath, { recursive: true })
    return tempSourcePath
  }

  const createDummyFolder = async () => {
    const folder = path.join(tempPath, newId())
    await fs.mkdir(folder)
    return folder
  }

  const setupDb = () => {
    beforeEach(async () => {
      isDbSetup = true
      await db.setDbFilename(path.join(tempPath, 'app.db'))
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
    if (isDbSetup) await db.closeAsync()
    await fs.rm(tempPath, { force: true, recursive: true, maxRetries: 3, retryDelay: 100 })
  })

  return { tempPath, createDummyFolder, setupDb, createDummyFile, createBackupSource }
}
