const { GraphQLString } = require('graphql')
const { removeDeviceAsync } = require('../../../device')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

module.exports = {
  removeDevice: {
    type: GenericErrorResponse,
    args: {
      input: { type: GraphQLString }
    },
    resolve: async (a, { input: id }) => {
      let response
      try {
        await removeDeviceAsync(id)
        response = { error: null }
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('remove device error', response)
      }

      return response
    }
  }
}
