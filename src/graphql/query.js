const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList
} = require('graphql')
const repo = require('../repo')
const { SourceDevice, BackupDevice } = require('./types')

module.exports = new GraphQLObjectType({
  name: 'Query',
  fields: {
    sourceDevices: {
      type: new GraphQLList(SourceDevice),
      resolve: async () => {
        const data = await repo.getDevicesAsync('source')
        return data
      }
    },
    backupDevices: {
      type: new GraphQLList(BackupDevice),
      resolve: async () => {
        const data = await repo.getDevicesAsync('backup')
        return data
      }
    },
    hello: {
      type: GraphQLString,
      resolve: () => 'world'
    }
  }
})
