
exports.FileTreeWalkerPathError = class extends Error {
  constructor (path) {
    super(`Failed to process path ${path}`)
    this.path = path
  }
}

class CustomError extends Error {
  constructor (code, message) {
    super(message)
    this.code = code
  }
}
exports.CustomError = CustomError

exports.isCustomError = (error) => {
  return !!(error.code && error.message)
}

exports.raiseError = ({ code, message }) => {
  throw new CustomError(code, message)
}

/**
 * Creates a default error section when no error occured
 * @returns non error response
 */
exports.emptyError = () => ({ error: null })

exports.errorCodes = {
  unexpectedError: { code: 'unexpectedError', message: 'An unexpected error occured' },
  existingSource: { code: 'existingSource', message: 'existingSource' },
  pathNotSupported: { code: 'pathNotSupported', message: 'The backup device path must look similar to x:\\path\\pathtobackup' },
  devicePathDoesNotExist: { code: 'devicePathDoesNotExist', message: 'Device path does not exist' },
  deviceIsNotOnline: { code: 'deviceIsNotOnline', message: 'Device is not online' },
  deviceDoesNotExist: { code: 'deviceDoesNotExist', message: 'Device does not exist' },
  pathDoesNotMatchDevice: { code: 'pathDoesNotMatchDevice', message: 'Path does not match device' }
}
