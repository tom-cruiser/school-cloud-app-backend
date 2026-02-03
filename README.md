# School Cloud - Backend API

A secure, scalable, and production-ready backend for a multi-tenant School Management SaaS platform built with Node.js, Express.js, and PostgreSQL.

## 🚀 Features

- **Multi-Tenancy**: Single database with tenant isolation using school_id
- **Authentication**: JWT-based auth with access & refresh tokens
- **Authorization**: Role-Based Access Control (RBAC) for 4 user roles
- **Security**: Helmet, CORS, rate limiting, bcrypt password hashing
- **Real-time**: WebSocket support for notifications and messaging
- **Background Jobs**: BullMQ for async tasks (emails, notifications)
- **Logging**: Winston for application logs, Morgan for HTTP logs
- **Validation**: Joi schemas for request validation
- **Database**: PostgreSQL with Prisma ORM
- **Production-Ready**: Error handling, graceful shutdown, health checks

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14.0
- Redis (for background jobs)
- npm >= 9.0.0

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd Backend
npm install
```

### 2. Environment Setup

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/school_cloud?schema=public"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 3. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with demo data
npm run prisma:seed
```

This will create:
- Super Admin: `superadmin@example.com` / `password123`
- School Admin: `admin@school1.com` / `password123`
- Teacher: `teacher@school1.com` / `password123`
- Student: `student@school1.com` / `password123`

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on: `http://localhost:5000`

## 📁 Project Structure

```
Backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Database seeder
├── src/
│   ├── config/
│   │   ├── index.js           # App configuration
│   │   ├── database.js        # Prisma client
│   │   └── logger.js          # Winston logger
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   └── schoolController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── authorization.js   # RBAC
│   │   ├── tenant.js          # Multi-tenancy
│   │   ├── validation.js      # Request validation
│   │   └── rateLimiter.js     # Rate limiting
│   ├── routes/                # API routes
│   │   ├── index.js           # Route aggregator
│   │   ├── authRoutes.js
│   │   └── schoolRoutes.js
│   ├── services/              # Business logic
│   │   ├── authService.js
│   │   └── schoolService.js
│   ├── jobs/                  # Background jobs
│   │   └── index.js
│   ├── websocket/             # WebSocket server
│   │   └── index.js
│   ├── utils/
│   │   ├── errors.js          # Error classes
│   │   └── helpers.js         # Utility functions
│   ├── app.js                 # Express app
│   └── server.js              # Server entry point
├── logs/                      # Application logs
├── .env                       # Environment variables
├── .env.example               # Environment template
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔐 Authentication

### Register
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "schoolId": "school-uuid"
}
```

### Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@school1.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Authenticated Requests
```bash
GET /api/v1/auth/me
Authorization: Bearer <access-token>
```

## 🎯 API Endpoints

### Authentication (`/api/v1/auth`)
- `POST /register` - Register new user
- `POST /login` - Login
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout
- `POST /change-password` - Change password
- `GET /me` - Get current user profile

### Super Admin (`/api/v1/super-admin`)
- `POST /schools` - Create school
- `GET /schools` - List all schools
- `GET /schools/:id` - Get school details
- `PUT /schools/:id` - Update school
- `DELETE /schools/:id` - Delete school
- `GET /schools/:id/stats` - Get school statistics

### School Admin (`/api/v1/:school/admin`) - TODO
### Teachers (`/api/v1/:school/teachers`) - TODO
### Students (`/api/v1/:school/students`) - TODO

## 👥 User Roles

### SUPER_ADMIN
- Full system access
- Create and manage schools (tenants)
- View platform-wide analytics

### SCHOOL_ADMIN
- Manage school teachers (max 20)
- Manage students (unlimited)
- View school analytics
- Manage financial data

### TEACHER
- Manage classes and schedules
- Create and grade assignments
- View student academic records
- Send messages

### STUDENT
- View personal schedule
- Access assignments and grades
- Manage library loans
- View performance analytics

## 🔒 Security Features

- **JWT Authentication**: Access & refresh tokens
- **Password Hashing**: bcrypt with configurable rounds
- **Rate Limiting**: Prevent abuse and DDoS
- **Helmet**: HTTP security headers
- **CORS**: Configurable origin control
- **Input Validation**: Joi schema validation
- **Row-Level Security**: Tenant data isolation
- **Audit Logging**: Track all user actions

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 📊 Database Schema

### Core Models
- **School**: Tenant (school) information
- **User**: User accounts with roles
- **Student**: Student profiles
- **Teacher**: Teacher profiles
- **Subject**: Academic subjects
- **Class**: Classes/courses
- **Assignment**: Homework/assignments
- **Grade**: Student grades
- **Attendance**: Attendance records
- **Book**: Library books
- **Loan**: Book loans
- **Message**: Internal messaging
- **Announcement**: School announcements
- **Payment**: Financial transactions

### Tenant Isolation
All tenant-scoped tables include `schoolId` field. Middleware automatically scopes queries to the current tenant.

## 🔧 Development

### Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration
npm run prisma:migrate

# Open Prisma Studio (DB GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Linting

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**
   - Set strong JWT secrets
   - Configure production database URL
   - Set NODE_ENV=production
   - Configure CORS origins

2. **Database**
   - Run migrations
   - Set up database backups
   - Configure connection pooling

3. **Security**
   - Enable HTTPS
   - Configure rate limiting
   - Set up monitoring

4. **Performance**
   - Enable Redis for job queues
   - Configure caching
   - Set up load balancing

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "stack": "..." // Only in development
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved",
  "data": [...],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

## 🤝 Contributing

This is a demo project. Feel free to extend it with:
- Student management endpoints
- Teacher management endpoints
- Attendance tracking
- Grade management
- Library system
- Messaging system
- Financial management
- Real-time notifications

## 📄 License

MIT License

## 🆘 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Migration Errors
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

### Port Already in Use
```bash
# Change PORT in .env file
PORT=5001
```

## 📞 Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error stack traces
3. Verify environment configuration

---

**Built with ❤️ using Node.js, Express, PostgreSQL, and Prisma**
