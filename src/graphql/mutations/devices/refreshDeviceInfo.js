const { deviceInfo } = require('../../../deviceInfo')
const { GenericErrorResponse } = require('../../types')
const { toGraphqlErrorSection } = require('../../utils')

module.exports = {
  refreshDeviceInfo: {
    type: GenericErrorResponse,
    resolve: async () => {
      let response
      try {
        await deviceInfo.refresh()
      } catch (err) {
        response = toGraphqlErrorSection(err)
      }
      return response || { error: null }
    }
  }
}
