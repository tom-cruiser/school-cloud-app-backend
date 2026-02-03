const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const typeDefs = require('./typeDefs');
const resolvers = require('./resolvers');
const { getAuthContext } = require('./context');

// Create executable schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Create Apollo Server
const createApolloServer = () => {
  return new ApolloServer({
    schema,
    context: getAuthContext,
    introspection: true, // Enable in development
    playground: true, // Enable GraphQL playground in development
    formatError: (error) => {
      // Custom error formatting
      console.error('GraphQL Error:', error);
      
      return {
        message: error.message,
        code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
        path: error.path,
      };
    },
    plugins: [
      {
        async requestDidStart() {
          return {
            async willSendResponse({ response, errors }) {
              // Log errors
              if (errors) {
                errors.forEach((error) => {
                  console.error('GraphQL Error:', error.message);
                });
              }
            },
          };
        },
      },
    ],
  });
};

module.exports = { createApolloServer, schema };
