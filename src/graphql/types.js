const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,
  GraphQLFloat,
  GraphQLNonNull
} = require('graphql')

exports.SourceDevice = new GraphQLObjectType({
  name: 'SourceDevice',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    path: {
      type: GraphQLString
    },
    lastScanDate: {
      type: GraphQLFloat
    },
    addDate: {
      type: GraphQLFloat
    }
  })
})

exports.BackupDevice = new GraphQLObjectType({
  name: 'BackupDevice',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLID)
    },
    name: {
      type: GraphQLString
    },
    description: {
      type: GraphQLString
    },
    path: {
      type: GraphQLString
    },
    lastScanDate: {
      type: GraphQLFloat
    },
    addDate: {
      type: GraphQLFloat
    }
  })
})

const Error = exports.Error = new GraphQLObjectType({
  name: 'Error',
  fields: {
    code: { type: GraphQLString },
    message: { type: GraphQLString }
  }
})

exports.GenericErrorResponse = new GraphQLObjectType({
  name: 'ErrorResponse',
  fields: {
    error: { type: Error }
  }
})
