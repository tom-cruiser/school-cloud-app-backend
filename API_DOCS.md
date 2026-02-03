# API Documentation

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### Health Check

#### GET /health
Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Authentication Endpoints

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT",
  "schoolId": "school-uuid" // Required for non-SUPER_ADMIN roles
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "schoolId": "school-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /auth/login
Authenticate a user.

**Request Body:**
```json
{
  "email": "admin@school1.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "admin@school1.com",
      "firstName": "School",
      "lastName": "Admin",
      "role": "SCHOOL_ADMIN",
      "schoolId": "school-uuid"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/refresh
Refresh the access token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-access-token"
  }
}
```

### POST /auth/logout
Logout the user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refreshToken": "refresh-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

### POST /auth/change-password
Change user password.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": null
}
```

### GET /auth/me
Get current user profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STUDENT",
    "schoolId": "school-uuid"
  }
}
```

---

## Super Admin Endpoints

All endpoints require SUPER_ADMIN role.

### POST /super-admin/schools
Create a new school.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "name": "Demo High School",
  "domain": "demoschool",
  "email": "admin@demoschool.com",
  "phone": "+1234567890",
  "address": "123 Education St",
  "primaryColor": "#3B82F6",
  "secondaryColor": "#10B981",
  "logo": "https://example.com/logo.png",
  "maxTeachers": 20
}
```

**Response:** (201 Created)
```json
{
  "success": true,
  "message": "School created successfully",
  "data": {
    "id": "school-uuid",
    "name": "Demo High School",
    "domain": "demoschool",
    "email": "admin@demoschool.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET /super-admin/schools
Get all schools with pagination.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10, max: 100)
- `search` (string, optional)
- `isActive` (boolean, optional)

**Example:**
```
GET /super-admin/schools?page=1&limit=10&search=demo&isActive=true
```

**Response:**
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": [
    {
      "id": "school-uuid",
      "name": "Demo High School",
      "domain": "demoschool",
      "email": "admin@demoschool.com",
      "isActive": true,
      "_count": {
        "users": 15,
        "students": 120,
        "teachers": 10
      }
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### GET /super-admin/schools/:id
Get school details.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "School retrieved successfully",
  "data": {
    "id": "school-uuid",
    "name": "Demo High School",
    "domain": "demoschool",
    "email": "admin@demoschool.com",
    "phone": "+1234567890",
    "address": "123 Education St",
    "isActive": true,
    "_count": {
      "users": 15,
      "students": 120,
      "teachers": 10,
      "classes": 25
    }
  }
}
```

### PUT /super-admin/schools/:id
Update school details.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Request Body:**
```json
{
  "name": "Updated School Name",
  "email": "newemail@school.com",
  "maxTeachers": 30,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "School updated successfully",
  "data": {
    "id": "school-uuid",
    "name": "Updated School Name",
    "domain": "demoschool",
    "email": "newemail@school.com",
    "maxTeachers": 30,
    "isActive": true
  }
}
```

### DELETE /super-admin/schools/:id
Deactivate a school.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "School deleted successfully",
  "data": null
}
```

### GET /super-admin/schools/:id/stats
Get school statistics.

**Headers:**
```
Authorization: Bearer <super_admin_token>
```

**Response:**
```json
{
  "success": true,
  "message": "School statistics retrieved successfully",
  "data": {
    "totalStudents": 120,
    "totalTeachers": 10,
    "totalClasses": 25,
    "activeStudents": 115,
    "recentEnrollments": 5
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error: email is required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication failed"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "A record with this value already exists"
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **General API**: 60 requests per minute
- **Authentication**: 5 attempts per 15 minutes
- **Super Admin**: 100 requests per 15 minutes

---

## WebSocket Connection

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:5001?token=<access_token>');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

// Send ping
ws.send(JSON.stringify({ type: 'ping' }));
```

### WebSocket Events

**connection**: Connection established
**notification**: New notification
**message**: New message
**pong**: Ping response
