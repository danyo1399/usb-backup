const fs = require('fs-extra')
const path = require('path')

const IGNORED_FOLDERS = [
  '$RECYCLE.BIN', // windows
  'System Volume Information', // windows
  '#recycle' // synology diskstation recycle bin
]
const IGNORED_FILES = [
  'Thumbs.db', // windows folder image db
  '.DS_Store' // custom mac metadata file
]

const currentPath = exports.currentPath = path.resolve(process.cwd())

exports.isIgnoredFile = (filename) => {
  const basename = this.basename(filename).toUpperCase()
  return IGNORED_FILES.some(x => x.toUpperCase() === basename)
}

function isExplicitIgnoredDirectory (fullPath) {
  const basename = exports.basename(fullPath).toUpperCase()
  return IGNORED_FOLDERS.some(x => x.toUpperCase() === basename)
}

exports.isIgnoredPath = (fullPath) => {
  return isExplicitIgnoredDirectory(fullPath)
}

// Ignores folders starting with . in addition to ignored folders
exports.isIgnoredDirectory = (fullPath) => {
  const basename = this.basename(fullPath).toUpperCase()
  return basename.startsWith('.') || isExplicitIgnoredDirectory(fullPath)
}

/**
 * Appends a suffix to a filename before the extension
 */
exports.appendSuffixToFilename = (filename, suffix) => {
  const ext = path.extname(filename)
  const separator = filename.includes('/') ? '/' : filename.includes('\\') ? '\\' : path.sep

  let dirName = path.dirname(filename)
  if (dirName === '.') dirName = ''
  else if (dirName.endsWith(separator) === false) dirName = `${dirName}${separator}`

  const basename = path.basename(filename)
  const basenameWithoutPrefix = basename.slice(0, basename.length - ext.length)
  return `${dirName}${basenameWithoutPrefix}${suffix}${ext}`
}

/**
 * Given a specific path for a file, if a file with the same name exists append a incrementing suffix
 * till we find a filename that doesn't exist.
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
    const newFilename = this.appendSuffixToFilename(filename, ` ${i.toString().padStart(3, '0')}`)
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
exports.getFileRelativePath = (basePath, filePath) => {
  const resolvedBasePath = this.resolvePaths(basePath)
  const resolvedFilePath = this.resolvePaths(filePath)
  if (resolvedFilePath.startsWith(resolvedBasePath) === false) {
    throw new Error(`Path mismatch ${resolvedBasePath}, ${resolvedFilePath}`)
  }
  const result = resolvedFilePath.slice(resolvedBasePath.length).replaceAll('\\', '/')

  // root directories have slash whereas subdirectories dont.
  if (result.startsWith('/')) return result.slice(1)
  return result
}

/**
 * Appends n number of paths the the current working directory
 * @param  {...string} subPaths
 * @returns the combined full path
 */
exports.appendRelativePath = (...subPaths) => {
  return this.joinPaths(currentPath, ...subPaths)
}

/**
 * Takes a file path and appends it to the
 * end of another path stripping windows drive letters
 * eg
 * c:\folder1\folder2\test.txt
 * being appended to d:\folder3
 * becomes
 * d:\folder3\folder1\folder2\test.txt
 *
 */
exports.appendFilePathToPath = (filePath, destinationDir) => {
  filePath = filePath.replaceAll('\\', '/')
  destinationDir = destinationDir.replaceAll('\\', '/')
  if (/^[a-z]:\//i.test(filePath)) {
    filePath = filePath.substr(3)
  }
  let fileDir = path.dirname(filePath)
  const filename = path.basename(filePath)
  if (/^[a-z]:\//i.test(fileDir)) {
    fileDir = fileDir.substring(3)
  } else {
    fileDir = fileDir.replace(/^\/\/[^/]+/, '')
  }
  return this.joinPaths(destinationDir, fileDir, filename).replaceAll('\\', '/')
}

exports.joinPaths = (...paths) => {
  paths = paths.map(x => x.replaceAll('\\', '/'))
  return path.join(...paths).replaceAll('\\', '/')
}

exports.basename = (aPath) => path.basename(aPath.replaceAll('\\', '/'))
exports.dirname = (aPath) => path.dirname(aPath.replaceAll('\\', '/'))

exports.resolvePaths = (...paths) => {
  paths = paths.map(x => x.replaceAll('\\', '/'))
  return path.resolve(...paths).replaceAll('\\', '/')
}

exports.endsWithPathSeparator = (path) => path.endsWith('/') || path.endsWith('\\')
