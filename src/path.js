const fs = require('fs-extra')
const path = require('path')

const currentPath = exports.currentPath = path.resolve(process.cwd())

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

exports.ensureFilePathExistsAsync = async (fullFilePath) => {
  const dirPath = path.dirname(fullFilePath)
  const pathExists = await fs.pathExists(dirPath)
  if (!pathExists) {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

exports.getRelativePath = function ({ basePath, filePath }) {
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

exports.appendRelativePath = (...subpaths) => {
  return path.join(currentPath, ...subpaths)
}
