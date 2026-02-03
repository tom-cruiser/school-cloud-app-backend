const { GraphQLDateTime } = require('graphql-scalars');
const authResolvers = require('./authResolvers');
const userResolvers = require('./userResolvers');
const schoolResolvers = require('./schoolResolvers');
const studentResolvers = require('./studentResolvers');
const teacherResolvers = require('./teacherResolvers');
const gradeLevelResolvers = require('./gradeLevelResolvers');
const houseResolvers = require('./houseResolvers');
const supportResolvers = require('./supportResolvers');
const libraryResolvers = require('./libraryResolvers');

const resolvers = {
  // Custom scalars
  DateTime: GraphQLDateTime,

  // Queries
  Query: {
    ...authResolvers.Query,
    ...userResolvers.Query,
    ...schoolResolvers.Query,
    ...studentResolvers.Query,
    ...teacherResolvers.Query,
    ...gradeLevelResolvers.Query,
    ...houseResolvers.Query,
    ...supportResolvers.Query,
    ...libraryResolvers.Query,
  },

  // Mutations
  Mutation: {
    ...authResolvers.Mutation,
    ...userResolvers.Mutation,
    ...schoolResolvers.Mutation,
    ...studentResolvers.Mutation,
    ...teacherResolvers.Mutation,
    ...gradeLevelResolvers.Mutation,
    ...houseResolvers.Mutation,
    ...supportResolvers.Mutation,
    ...libraryResolvers.Mutation,
  },

  // Type resolvers
  User: userResolvers.User,
  School: schoolResolvers.School,
  Student: studentResolvers.Student,
  Teacher: teacherResolvers.Teacher,
  GradeLevel: gradeLevelResolvers.GradeLevel,
  House: houseResolvers.House,
  SupportMessage: supportResolvers.SupportMessage,
  LibraryBook: libraryResolvers.LibraryBook,
  LibraryLoan: libraryResolvers.LibraryLoan,
};

module.exports = resolvers;
