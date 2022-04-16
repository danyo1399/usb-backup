const { GraphQLInputObjectType, GraphQLString } = require('graphql')
const { updateDeviceAsync } = require('../../../device')
const { defaultLogger } = require('../../../logging')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')
const { CreateBackupDeviceRequest } = require('../types')

const UpdateBackupDeviceRequest = new GraphQLInputObjectType({
  name: 'UpdateBackupDeviceRequest',
  fields: {
    id: { type: GraphQLString },
    device: { type: CreateBackupDeviceRequest }
  }
})

module.exports = {
  updateBackupDevice: {
    type: GenericErrorResponse,
    args: {
      input: { type: UpdateBackupDeviceRequest }
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
        defaultLogger.error('edit backup device error', response)
      }
      return response || { error: null }
    }
  }
}
