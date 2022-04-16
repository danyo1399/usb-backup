const fs = require('fs-extra')
const { copyAndHashAsync, hashFileAsync } = require('./crypto')
const { ensureFilePathExistsAsync, findUniqueFilenameAsync, getFileRelativePath } = require('./path')
const { InsertFileAsync } = require('./repo')
const path = require('path')
const { defaultLogger } = require('./logging')

exports.createFileAsync = async (device, filePath, { hash, stat } = {}) => {
  stat = stat || await fs.stat(filePath)
  hash = hash || await hashFileAsync(filePath)
  const relativePath = getFileRelativePath(device.path, filePath)

  const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })

  const file = await InsertFileAsync(newFile)
  return { file }
}

exports.isVideoFile = (filename) => {
  const ext = path.extname(filename)
  return ['.mp4', '.mkv', '.avi'].some(x => x === ext)
}

const bufferSizeToCheck = 1024 * 50 // 50 KB
/**
 * check for file with allocated blank space at end of file often
 * representing not all of a files contents have been written
 */
exports.hasZeroDataAtEndAsync = async (filePath, { stat } = {}) => {
  stat = stat || await fs.stat(filePath)
  if (stat.isFile() === false) return
  let fileHandle
  try {
    if (stat.size <= bufferSizeToCheck) return
    fileHandle = await fs.open(filePath, 'r')
    const { buffer } = await fs.read(fileHandle, Buffer.alloc(bufferSizeToCheck), 0, bufferSizeToCheck, stat.size - 1 - bufferSizeToCheck)

    // all of files contents might not have copied
    return buffer.every(x => x === 0)
  } catch (error) {
    defaultLogger.error(`Error occurred reading file tail. ${error?.message}`)
    // NOOP
  } finally {
    try {
      fileHandle && await fs.close(fileHandle)
    } catch (error) {
    // NOOP
    }
  }
}

exports.areFileFingerprintsEqual = (f1, f2) => {
  return f1.relativePath === f2.relativePath &&
    Math.floor(f1.birthtimeMs) === Math.floor(f2.birthtimeMs) &&
    Math.floor(f1.mtimeMs) === Math.floor(f2.mtimeMs)
}

exports.copyFileAsync = async (src, destination, { overwrite, appendSuffix } = {}) => {
  const tempDest = destination + '.tmp'
  if (overwrite && appendSuffix) throw new Error('overwrite and appendSuffix are mutually exclusive')
  try {
    await ensureFilePathExistsAsync(destination)

    const stat = await fs.stat(src)
    const editDate = new Date(stat.mtimeMs)
    await fs.rm(tempDest, { force: true })
    const hash = await copyAndHashAsync(src, tempDest)

    await fs.utimes(tempDest, editDate, editDate)

    if (appendSuffix) {
      destination = await findUniqueFilenameAsync(destination)
    }
    await fs.move(tempDest, destination, { overwrite })
    const basename = path.basename(destination)
    return { hash, path: destination, basename }
  } catch (error) {
    try { await fs.rm(tempDest, { force: true }) } catch (err) {}

    throw error
  }
}

/**
 * Creates a file object from a list of required fields and destructuring a file stat object
 */
const createFile = exports.createFile = ({ deviceType, deviceId, relativePath, hash, stat: { mtimeMs, birthtimeMs, size } }) => {
  mtimeMs = Math.floor(mtimeMs)
  birthtimeMs = Math.floor(birthtimeMs)

  const addDate = Date.now()

  return {
    deviceType,
    deviceId,
    relativePath,
    mtimeMs,
    birthtimeMs,
    size,
    hash,
    deleted: 0,
    addDate
  }
}
