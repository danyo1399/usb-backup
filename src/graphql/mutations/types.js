const { GraphQLInputObjectType, GraphQLString } = require('graphql')

exports.CreateBackupDeviceRequest = new GraphQLInputObjectType({
  name: 'CreateBackupDeviceRequest',
  fields: {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    path: { type: GraphQLString }
  }
})

exports.CreateSourceDeviceRequest = new GraphQLInputObjectType({
  name: 'CreateSourceDeviceRequest',
  fields: {
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    path: { type: GraphQLString }
  }
})
