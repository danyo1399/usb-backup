const { noop } = require('./utils')

exports.logLevels = { debug: 'debug', info: 'info', warn: 'warn', error: 'error' }

exports.createLogger = ({ debug, info, warn, error }) => {
  return { debug, info, warn, error }
}

if (process.env.VERBOSE) {
  exports.defaultLogger = this.createLogger({ debug: console.debug, info: console.info, warn: console.warn, error: console.error })
} else {
  exports.defaultLogger = this.createLogger({ debug: noop, info: noop, warn: noop, error: noop })
}
