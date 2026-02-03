const { gql } = require('apollo-server-express');

// Base types
const baseTypes = gql`
  scalar DateTime
  scalar Upload

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }

  # Pagination
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    totalPages: Int!
    totalCount: Int!
    currentPage: Int!
    pageSize: Int!
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 10
  }

  # Common response types
  type SuccessResponse {
    success: Boolean!
    message: String!
  }

  # Enums
  enum UserRole {
    SUPER_ADMIN
    SCHOOL_ADMIN
    TEACHER
    STUDENT
  }

  enum SupportPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  enum SupportStatus {
    PENDING
    IN_PROGRESS
    RESOLVED
    CLOSED
  }

  enum SupportCategory {
    GENERAL
    TECHNICAL
    BILLING
    FEATURE_REQUEST
    BUG_REPORT
    OTHER
  }

  enum AttendanceStatus {
    PRESENT
    ABSENT
    LATE
    EXCUSED
  }

  enum LibraryLoanStatus {
    ACTIVE
    RETURNED
    OVERDUE
  }
`;

// User types
const userTypes = gql`
  type User {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
    name: String!
    role: UserRole!
    schoolId: String
    school: School
    avatar: String
    isActive: Boolean!
    lastLogin: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AuthPayload {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
    role: UserRole!
    schoolId: String
  }

  input UpdateProfileInput {
    firstName: String
    lastName: String
    email: String
    avatar: String
  }

  input ChangePasswordInput {
    currentPassword: String!
    newPassword: String!
  }

  type UserConnection {
    edges: [User!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    me: User
    user(id: ID!): User
    users(pagination: PaginationInput, search: String, role: UserRole, schoolId: String): UserConnection!
  }

  extend type Mutation {
    login(input: LoginInput!): AuthPayload!
    register(input: RegisterInput!): User!
    refreshToken(refreshToken: String!): AuthPayload!
    logout(refreshToken: String): SuccessResponse!
    updateProfile(input: UpdateProfileInput!): User!
    changePassword(input: ChangePasswordInput!): SuccessResponse!
  }
`;

// School types
const schoolTypes = gql`
  type School {
    id: ID!
    name: String!
    domain: String!
    email: String!
    phone: String
    address: String
    primaryColor: String
    secondaryColor: String
    logo: String
    isActive: Boolean!
    maxTeachers: Int
    _count: SchoolCount
    users: [User!]
    students: [Student!]
    teachers: [Teacher!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type SchoolCount {
    users: Int!
    students: Int!
    teachers: Int!
  }

  input CreateSchoolInput {
    name: String!
    domain: String!
    email: String!
    phone: String
    address: String
    primaryColor: String
    secondaryColor: String
    maxTeachers: Int
  }

  input UpdateSchoolInput {
    name: String
    email: String
    phone: String
    address: String
    primaryColor: String
    secondaryColor: String
    logo: String
    isActive: Boolean
    maxTeachers: Int
  }

  type SchoolConnection {
    edges: [School!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    school(id: ID!): School
    schools(pagination: PaginationInput, search: String): SchoolConnection!
  }

  extend type Mutation {
    createSchool(input: CreateSchoolInput!): School!
    updateSchool(id: ID!, input: UpdateSchoolInput!): School!
    deleteSchool(id: ID!): SuccessResponse!
  }
`;

// Student types
const studentTypes = gql`
  type Student {
    id: ID!
    schoolId: String!
    school: School!
    userId: String
    user: User
    firstName: String!
    lastName: String!
    email: String
    dateOfBirth: DateTime
    gender: String
    address: String
    phone: String
    guardianName: String
    guardianPhone: String
    guardianEmail: String
    enrollmentDate: DateTime
    gradeLevelId: String
    gradeLevel: GradeLevel
    houseId: String
    house: House
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateStudentInput {
    schoolId: String!
    firstName: String!
    lastName: String!
    email: String
    dateOfBirth: DateTime
    gender: String
    address: String
    phone: String
    guardianName: String
    guardianPhone: String
    guardianEmail: String
    enrollmentDate: DateTime
    gradeLevelId: String
    houseId: String
  }

  input UpdateStudentInput {
    firstName: String
    lastName: String
    email: String
    dateOfBirth: DateTime
    gender: String
    address: String
    phone: String
    guardianName: String
    guardianPhone: String
    guardianEmail: String
    gradeLevelId: String
    houseId: String
    isActive: Boolean
  }

  type StudentConnection {
    edges: [Student!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    student(id: ID!): Student
    students(schoolId: String!, pagination: PaginationInput, search: String): StudentConnection!
  }

  extend type Mutation {
    createStudent(input: CreateStudentInput!): Student!
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!
    deleteStudent(id: ID!): SuccessResponse!
  }
`;

// Teacher types
const teacherTypes = gql`
  type Teacher {
    id: ID!
    schoolId: String!
    school: School!
    userId: String!
    user: User!
    subject: String
    hireDate: DateTime
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateTeacherInput {
    schoolId: String!
    userId: String!
    subject: String
    hireDate: DateTime
  }

  input UpdateTeacherInput {
    subject: String
    hireDate: DateTime
    isActive: Boolean
  }

  type TeacherConnection {
    edges: [Teacher!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    teacher(id: ID!): Teacher
    teachers(schoolId: String!, pagination: PaginationInput, search: String): TeacherConnection!
  }

  extend type Mutation {
    createTeacher(input: CreateTeacherInput!): Teacher!
    updateTeacher(id: ID!, input: UpdateTeacherInput!): Teacher!
    deleteTeacher(id: ID!): SuccessResponse!
  }
`;

// Grade Level types
const gradeLevelTypes = gql`
  type GradeLevel {
    id: ID!
    schoolId: String!
    school: School!
    name: String!
    order: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateGradeLevelInput {
    schoolId: String!
    name: String!
    order: Int!
  }

  input UpdateGradeLevelInput {
    name: String
    order: Int
    isActive: Boolean
  }

  extend type Query {
    gradeLevel(id: ID!): GradeLevel
    gradeLevels(schoolId: String!): [GradeLevel!]!
  }

  extend type Mutation {
    createGradeLevel(input: CreateGradeLevelInput!): GradeLevel!
    updateGradeLevel(id: ID!, input: UpdateGradeLevelInput!): GradeLevel!
    deleteGradeLevel(id: ID!): SuccessResponse!
  }
`;

// House types
const houseTypes = gql`
  type House {
    id: ID!
    schoolId: String!
    school: School!
    name: String!
    color: String
    points: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateHouseInput {
    schoolId: String!
    name: String!
    color: String
  }

  input UpdateHouseInput {
    name: String
    color: String
    points: Int
    isActive: Boolean
  }

  extend type Query {
    house(id: ID!): House
    houses(schoolId: String!): [House!]!
  }

  extend type Mutation {
    createHouse(input: CreateHouseInput!): House!
    updateHouse(id: ID!, input: UpdateHouseInput!): House!
    deleteHouse(id: ID!): SuccessResponse!
  }
`;

// Support types
const supportTypes = gql`
  type SupportMessage {
    id: ID!
    schoolId: String
    school: School
    userId: String!
    user: User!
    subject: String!
    message: String!
    category: SupportCategory!
    priority: SupportPriority!
    status: SupportStatus!
    response: String
    isRead: Boolean!
    respondedAt: DateTime
    respondedBy: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateSupportMessageInput {
    subject: String!
    message: String!
    category: SupportCategory!
    priority: SupportPriority!
  }

  input UpdateSupportMessageInput {
    response: String
    status: SupportStatus
  }

  type SupportMessageConnection {
    edges: [SupportMessage!]!
    pageInfo: PageInfo!
    unreadCount: Int!
  }

  extend type Query {
    supportMessage(id: ID!): SupportMessage
    supportMessages(pagination: PaginationInput, status: SupportStatus): SupportMessageConnection!
    mySupportMessages: [SupportMessage!]!
  }

  extend type Mutation {
    createSupportMessage(input: CreateSupportMessageInput!): SupportMessage!
    updateSupportMessage(id: ID!, input: UpdateSupportMessageInput!): SupportMessage!
    markSupportMessageAsRead(id: ID!): SuccessResponse!
  }
`;

// Library types
const libraryTypes = gql`
  type LibraryBook {
    id: ID!
    schoolId: String!
    school: School!
    title: String!
    author: String!
    isbn: String
    publisher: String
    publishedDate: DateTime
    category: String
    totalCopies: Int!
    availableCopies: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type LibraryLoan {
    id: ID!
    bookId: String!
    book: LibraryBook!
    studentId: String!
    student: Student!
    loanDate: DateTime!
    dueDate: DateTime!
    returnDate: DateTime
    status: LibraryLoanStatus!
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateLibraryBookInput {
    schoolId: String!
    title: String!
    author: String!
    isbn: String
    publisher: String
    publishedDate: DateTime
    category: String
    totalCopies: Int!
  }

  input UpdateLibraryBookInput {
    title: String
    author: String
    isbn: String
    publisher: String
    publishedDate: DateTime
    category: String
    totalCopies: Int
    isActive: Boolean
  }

  input CreateLibraryLoanInput {
    bookId: String!
    studentId: String!
    dueDate: DateTime!
    notes: String
  }

  type LibraryBookConnection {
    edges: [LibraryBook!]!
    pageInfo: PageInfo!
  }

  type LibraryLoanConnection {
    edges: [LibraryLoan!]!
    pageInfo: PageInfo!
  }

  extend type Query {
    libraryBook(id: ID!): LibraryBook
    libraryBooks(schoolId: String!, pagination: PaginationInput, search: String): LibraryBookConnection!
    libraryLoan(id: ID!): LibraryLoan
    libraryLoans(schoolId: String!, pagination: PaginationInput, status: LibraryLoanStatus): LibraryLoanConnection!
  }

  extend type Mutation {
    createLibraryBook(input: CreateLibraryBookInput!): LibraryBook!
    updateLibraryBook(id: ID!, input: UpdateLibraryBookInput!): LibraryBook!
    deleteLibraryBook(id: ID!): SuccessResponse!
    createLibraryLoan(input: CreateLibraryLoanInput!): LibraryLoan!
    returnLibraryLoan(id: ID!): LibraryLoan!
  }
`;

module.exports = [
  baseTypes,
  userTypes,
  schoolTypes,
  studentTypes,
  teacherTypes,
  gradeLevelTypes,
  houseTypes,
  supportTypes,
  libraryTypes,
];
