const { GraphQLObjectType } = require('graphql')
const { createSourceDeviceAsync } = require('../../../device')
const { defaultLogger } = require('../../../logging')
const { SourceDevice, Error } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')
const { CreateSourceDeviceRequest } = require('../types')

const AddSourceDeviceResponse = new GraphQLObjectType({
  name: 'AddSourceDeviceResponse',
  fields: {
    device: { type: SourceDevice },
    error: { type: Error }
  }
})

module.exports = {
  addSourceDevice: {
    type: AddSourceDeviceResponse,
    args: {
      input: { type: CreateSourceDeviceRequest }
    },
    resolve: async (a, { input }) => {
      let response
      try {
        const device = await createSourceDeviceAsync(input)
        response = { device: device, error: response }
      } catch (err) {
        response = toGraphqlErrorSection(err)
        defaultLogger.error('add source device error', response)
      }
      return response
    }
  }
}
