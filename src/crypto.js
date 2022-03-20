
const crypto = require('crypto')
const fs = require('fs-extra')

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

// the file could have been updated after scanned before copy.
// The only way to be sure is to to hash while we copy
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
