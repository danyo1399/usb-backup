
const crypto = require('crypto')
const fs = require('fs-extra')

/**
 * Generates an MD5 hash of the file contents
 * @param {string} filePath  the path to the file
 * @returns
 */
exports.hashFileAsync = (filePath) => {
  return new Promise((resolve, reject) => {
    // Algorithm depends on availability of OpenSSL on platform
    // Another algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...
    const algorithm = 'md5'
    let stream, shasum
    try {
      shasum = crypto.createHash(algorithm)
      // Updating shasum with file content
      stream = fs.ReadStream(filePath)
    } catch (error) {
      return reject(error)
    }

    stream.on('data', function (data) {
      shasum.update(data)
    })

    // making digest
    stream.on('end', function () {
      const hash = shasum.digest('hex')
      resolve(hash)
    })
    stream.on('error', function (err) {
      reject(err)
    })
  })
}

/**
 * Copies a file and generates an MD5 hash of the contents as its copying
 * @param {*} src the source file path
 * @param {*} dest the destination file path
 * @returns md5 hash
 *
 * @description
 * the file could have been updated after it was  scanned before it is copied.
 * By generating the hash of the file as its being copied when we create the file record,
 * we know we have the hash of the file contents copied.
 */
exports.copyAndHashAsync = function (src, dest) {
  // Algorithm depends on availability of OpenSSL on platform
  // Another algorithms: 'sha1', 'md5', 'sha256', 'sha512' ...
  const algorithm = 'md5'
  return new Promise((resolve, reject) => {
    try {
      const shasum = crypto.createHash(algorithm)
      const srcStream = fs.ReadStream(src)
      const destStream = fs.WriteStream(dest)

      srcStream.on('data', function (data) {
        shasum.update(data)
      })

      // making digest
      srcStream.on('end', function () {
        const hash = shasum.digest('hex')
        resolve(hash)
      })
      srcStream.on('error', function (err) {
        reject(err)
      })

      destStream.on('error', function (err) {
        reject(err)
      })

      srcStream.pipe(destStream)
    } catch (error) {
      return reject(error)
    }
  })
}
