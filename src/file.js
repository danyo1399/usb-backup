const fs = require('fs-extra')
const { copyAndHashAsync, hashFileAsync } = require('./crypto')
const { ensureFilePathExistsAsync, findUniqueFilenameAsync, getFileRelativePath } = require('./path')
const { InsertFileAsync } = require('./repo')

exports.createFileAsync = async (device, filePath, { hash, stat } = {}) => {
  stat = stat || await fs.stat(filePath)
  hash = hash || await hashFileAsync(filePath)
  const relativePath = getFileRelativePath(device.path, filePath)

  const newFile = createFile({ deviceType: device.deviceType, deviceId: device.id, relativePath, stat, hash })

  const file = await InsertFileAsync(newFile)
  return { file }
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

    return { hash, path: destination }
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
