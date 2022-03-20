const logLevels = exports.logLevels = { debug: 'debug', info: 'info', warn: 'warn', error: 'error' }

const orderedLogLevels = [logLevels.debug, logLevels.info, logLevels.warn, logLevels.error]

exports.createLogger = ({ debug, info, warn, error }) => {
  return { debug, info, warn, error }
}

exports.defaultLogger = this.createLogger({ debug: console.debug, info: console.info, warn: console.warn, error: console.error })
