const fs = require('fs-extra')
const path = require('path')

const currentPath = exports.currentPath = path.resolve(process.cwd())

/**
 * Appends a suffix to a filename before the extension
 */
const appendSuffixToFilename = exports.appendSuffixToFilename = (filename, suffix) => {
  const ext = path.extname(filename)
  const seperator = filename.includes('/') ? '/' : filename.includes('\\') ? '\\' : path.sep

  let dirName = path.dirname(filename)
  if (dirName === '.') dirName = ''
  else if (dirName.endsWith(seperator) === false) dirName = `${dirName}${seperator}`

  const basename = path.basename(filename)
  const basenameWithoutPrefix = basename.slice(0, basename.length - ext.length)
  return `${dirName}${basenameWithoutPrefix}${suffix}${ext}`
}

/**
 * Given a specific path for a file, if a file with the same name exists append a incrementing suffix
 * till we find a filename that doesnt exist.
 *
 * This is useful when we are writing to a backup device and there could already be a file at the path
 * @param {*} filename
 * @returns {string} unique filename with path
 *
 */
exports.findUniqueFilenameAsync = async (filename) => {
  if ((await fs.pathExists(filename)) === false) {
    return filename
  }

  for (let i = 1; ;i++) {
    const newFilename = appendSuffixToFilename(filename, ` ${i.toString().padStart(3, '0')}`)
    if ((await fs.pathExists(newFilename)) === false) {
      return newFilename
    }
  }
}

/**
 * Given a path for a file, ensure the file directory path exists creating it if necessary
 * @param {*} fullFilePath
 */
exports.ensureFilePathExistsAsync = async (fullFilePath) => {
  const dirPath = path.dirname(fullFilePath)
  const pathExists = await fs.pathExists(dirPath)
  if (!pathExists) {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

/**
 * Determines the relative path for the file from the root directory
 * @param {*} basePath the root directory for the file
 * @param {*} filePath the full path of the file
 * @returns the relative path of the file from the root directory
 */
exports.getRelativePath = function (basePath, filePath) {
  const rpath = path.resolve(basePath.replaceAll('\\', '/'))
  const fpath = path.resolve(filePath.replaceAll('\\', '/'))
  if (fpath.startsWith(rpath) === false) {
    throw new Error(`Path mismatch ${rpath}, ${fpath}`)
  }
  const result = fpath.slice(rpath.length).replaceAll('\\', '/')

  // root directories have slash whereas subdirectories dont.
  if (result.startsWith('/')) return result.slice(1)
  return result
}

/**
 * Appends n number of paths the the current working directory
 * @param  {...string} subpaths
 * @returns the combined full path
 */
exports.appendRelativePath = (...subpaths) => {
  return path.join(currentPath, ...subpaths)
}

/**
 * Takes a file path and appends it to the
 * end of another path stripping windows drive letters
 * eg
 * c:\folder1\folder2\test.txt
 * being appeneded to d:\folder3
 * becomes
 * d:\folder3\folder1\folder2\test.txt
 *
 */
exports.appendFilePathToPath = (filePath, destinationDir) => {
  filePath = filePath.replaceAll('\\', '/')
  destinationDir = destinationDir.replaceAll('\\', '/')
  let fileDir = path.dirname(filePath)
  const filename = path.basename(filePath)
  if (/^[a-z]:\//i.test(fileDir)) {
    fileDir = fileDir.substring(3)
  } else {
    fileDir = fileDir.replace(/^\/\/[^/]+/, '')
  }
  return path.join(destinationDir, fileDir, filename).replaceAll('\\', '/')
}
