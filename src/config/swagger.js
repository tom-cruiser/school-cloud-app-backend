const swaggerJsdoc = require("swagger-jsdoc");
const config = require("./index");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "School Cloud API",
      version: "1.0.0",
      description:
        "Multi-tenant School Management SaaS Platform - REST & GraphQL APIs",
      contact: {
        name: "School Cloud Support",
        email: "support@schoolcloud.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: "Development server (REST API)",
      },
      {
        url: `http://localhost:${config.port}/graphql`,
        description: "Development server (GraphQL API)",
      },
      {
        url: "https://api.schoolcloud.com/api/v1",
        description: "Production server (REST API)",
      },
      {
        url: "https://api.schoolcloud.com/graphql",
        description: "Production server (GraphQL API)",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT access token",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "An error occurred",
            },
            errors: {
              type: "array",
              items: {
                type: "object",
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "c313736d-ead6-4d51-b534-3c7e9f333b3f",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            firstName: {
              type: "string",
              example: "John",
            },
            lastName: {
              type: "string",
              example: "Doe",
            },
            role: {
              type: "string",
              enum: [
                "SUPER_ADMIN",
                "SCHOOL_ADMIN",
                "TEACHER",
                "STUDENT",
                "PARENT",
              ],
              example: "TEACHER",
            },
            schoolId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        School: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Springfield High School",
            },
            domain: {
              type: "string",
              example: "springfield",
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              type: "string",
            },
            address: {
              type: "string",
            },
            primaryColor: {
              type: "string",
              example: "#7C3AED",
            },
            secondaryColor: {
              type: "string",
              example: "#6366F1",
            },
            logo: {
              type: "string",
              nullable: true,
            },
            isActive: {
              type: "boolean",
            },
            maxTeachers: {
              type: "integer",
              example: 50,
            },
          },
        },
        Student: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            dateOfBirth: {
              type: "string",
              format: "date",
            },
            admissionNumber: {
              type: "string",
            },
            schoolId: {
              type: "string",
              format: "uuid",
            },
            gradeLevelId: {
              type: "string",
              format: "uuid",
            },
            houseId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
          },
        },
        Teacher: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            firstName: {
              type: "string",
            },
            lastName: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
            phone: {
              type: "string",
            },
            employeeNumber: {
              type: "string",
            },
            schoolId: {
              type: "string",
              format: "uuid",
            },
            departmentId: {
              type: "string",
              format: "uuid",
              nullable: true,
            },
          },
        },
        GradeLevel: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Grade 10",
            },
            level: {
              type: "integer",
              example: 10,
            },
            schoolId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        House: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            name: {
              type: "string",
              example: "Gryffindor",
            },
            color: {
              type: "string",
              example: "#DC2626",
            },
            schoolId: {
              type: "string",
              format: "uuid",
            },
          },
        },
        SupportMessage: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            userId: {
              type: "string",
              format: "uuid",
            },
            subject: {
              type: "string",
            },
            message: {
              type: "string",
            },
            category: {
              type: "string",
              enum: ["TECHNICAL", "BILLING", "FEATURE_REQUEST", "OTHER"],
            },
            status: {
              type: "string",
              enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
            },
            priority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            },
          },
        },
        LibraryBook: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
            },
            title: {
              type: "string",
            },
            author: {
              type: "string",
            },
            isbn: {
              type: "string",
            },
            quantity: {
              type: "integer",
            },
            available: {
              type: "integer",
            },
            schoolId: {
              type: "string",
              format: "uuid",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: "Authentication",
        description: "Authentication and authorization endpoints",
      },
      {
        name: "Super Admin",
        description:
          "Super administrator operations for managing schools and users",
      },
      {
        name: "Schools",
        description: "School management operations",
      },
      {
        name: "Users",
        description: "User management operations",
      },
      {
        name: "Students",
        description: "Student management operations",
      },
      {
        name: "Teachers",
        description: "Teacher management operations",
      },
      {
        name: "Grade Levels",
        description: "Grade level management operations",
      },
      {
        name: "Houses",
        description: "House system management operations",
      },
      {
        name: "Support",
        description: "Support ticket management operations",
      },
      {
        name: "Library",
        description: "Library management operations",
      },
      {
        name: "System",
        description: "System health and monitoring endpoints",
      },
      {
        name: "GraphQL",
        description:
          "GraphQL API endpoint - Use GraphQL Playground for interactive exploration",
      },
    ],
  },
  apis: [
    "./src/routes/*.js",
    "./src/controllers/*.js",
    "./src/graphql/typeDefs/*.js",
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
