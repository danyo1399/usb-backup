const { isCustomError } = require('../errors')

exports.toGraphQlEnum = function toGraphQlEnum (obj) {
  return Object.keys(obj).reduce(
    (previous, current) => (
      {
        ...previous,
        [current]: { value: obj[current] }
      }), {})
}

exports.toGraphqlErrorSection = (error) => {
  console.error(error)
  return isCustomError(error)
    ? { error }
    : {
        error: exports.errorCodes.unexpectedError
      }
}
