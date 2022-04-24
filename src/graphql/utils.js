const { isCustomError } = require('../errors')
const { defaultLogger } = require('../logging')

exports.toGraphQlEnum = function toGraphQlEnum (obj) {
  return Object.keys(obj).reduce(
    (previous, current) => (
      {
        ...previous,
        [current]: { value: obj[current] }
      }), {})
}

exports.toGraphqlErrorSection = (error) => {
  defaultLogger.error('graphql error', error)
  return isCustomError(error)
    ? { error }
    : {
        error: exports.errorCodes.unexpectedError
      }
}

/**
 * Converts an async iterator to a graphql subscription iterator structure
 */
exports.toGraphqlIterator = (iterator, key) => {
  return {
    [Symbol.asyncIterator] () {
      return this
    },

    next: async function next () {
      const { value, done } = await iterator.next()
      return { value: { [key]: value }, done }
    },
    return () {
      return iterator.return()
    }
  }
}
