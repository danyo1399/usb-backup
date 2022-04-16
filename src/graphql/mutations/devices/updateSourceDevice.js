const { GraphQLInputObjectType, GraphQLString } = require('graphql')
const { updateDeviceAsync } = require('../../../device')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')
const { CreateSourceDeviceRequest } = require('../types')

const UpdateSourceDeviceRequest = new GraphQLInputObjectType({
  name: 'UpdateSourceDeviceRequest',
  fields: {
    id: { type: GraphQLString },
    device: { type: CreateSourceDeviceRequest }
  }
})

module.exports = {
  updateSourceDevice: {
    type: GenericErrorResponse,
    args: {
      input: { type: UpdateSourceDeviceRequest }
    },
    resolve: async (a, args) => {
      let response
      const {
        input: {
          id,
          device: { name, path, description }
        }
      } = args
      try {
        await updateDeviceAsync({ id, name, description, path })
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('edit source device', response)
      }
      return response || { error: null }
    }
  }
}
