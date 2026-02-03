# Backend API Implementation Guide - Teacher Portal

## Overview
This guide outlines the backend API endpoints that need to be implemented to support the teacher portal frontend. The frontend service layer is complete and ready to connect.

## Required Endpoints

### 1. Dashboard Statistics

#### `GET /api/v1/teachers/dashboard/stats`
Returns comprehensive dashboard data for the logged-in teacher.

**Response Structure:**
```json
{
  "success": true,
  "data": {
    "totalClasses": 5,
    "totalStudents": 127,
    "pendingGrades": 18,
    "avgAttendance": 94,
    "todaySchedule": [
      {
        "id": 1,
        "className": "Mathematics 101",
        "startTime": "08:00",
        "endTime": "09:30",
        "room": "Room 205",
        "studentCount": 28,
        "status": "upcoming" | "in-progress" | "completed"
      }
    ],
    "pendingGrading": [
      {
        "id": 1,
        "studentName": "John Doe",
        "assignmentTitle": "Chapter 5 Test",
        "className": "Mathematics 101",
        "submittedAt": "2026-02-01T10:30:00Z",
        "daysOverdue": 2
      }
    ],
    "upcomingAssignments": [
      {
        "id": 1,
        "title": "Chapter 6 Test",
        "className": "Mathematics 101",
        "dueDate": "2026-02-05",
        "submittedCount": 15,
        "totalStudents": 28
      }
    ],
    "recentActivities": [
      {
        "id": 1,
        "type": "submission" | "grade" | "message" | "announcement",
        "description": "New submission from John Doe",
        "timestamp": "10 min ago"
      }
    ],
    "classes": [
      {
        "id": 1,
        "name": "Mathematics 101",
        "studentCount": 28,
        "schedule": "Mon, Wed, Fri 8:00 AM",
        "avgGrade": 85,
        "attendanceRate": 95
      }
    ]
  }
}
```

**Implementation Steps:**
1. Get teacher ID from authenticated user
2. Query all classes taught by teacher
3. Count total students across all classes
4. Count pending assignment submissions
5. Calculate average attendance rate
6. Fetch today's schedule
7. Get recent pending grading items (last 10)
8. Get upcoming assignments (next 7 days)
9. Get recent activities (last 20)
10. Get class performance metrics

**Prisma Queries:**
```javascript
// Get teacher's classes
const classes = await prisma.class.findMany({
  where: { teacherId: teacherId },
  include: {
    students: true,
    assignments: {
      where: {
        dueDate: { gte: new Date() }
      }
    },
    schedules: {
      where: {
        dayOfWeek: new Date().getDay(),
        schoolYear: currentYear
      }
    }
  }
});

// Count total students
const totalStudents = await prisma.student.count({
  where: {
    classes: {
      some: { teacherId: teacherId }
    }
  }
});

// Pending grading
const pendingGrading = await prisma.assignmentSubmission.findMany({
  where: {
    assignment: {
      class: { teacherId: teacherId }
    },
    grade: null
  },
  include: {
    student: true,
    assignment: {
      include: { class: true }
    }
  },
  orderBy: { submittedAt: 'asc' },
  take: 10
});
```

---

### 2. Profile Management

#### `GET /api/v1/teachers/me`
Get current teacher's profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "email": "john.smith@school.com",
    "phone": "+1234567890",
    "profileImage": "https://...",
    "employeeNumber": "EMP001",
    "specialization": "Mathematics",
    "hireDate": "2020-09-01",
    "department": "Mathematics Department",
    "qualifications": ["B.Ed", "M.Sc Mathematics"],
    "subjects": ["Mathematics", "Algebra"],
    "bio": "Passionate mathematics teacher..."
  }
}
```

#### `PUT /api/v1/teachers/me`
Update current teacher's profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+1234567890",
  "bio": "Updated bio...",
  "qualifications": ["B.Ed", "M.Sc"],
  "subjects": ["Math"]
}
```

**Implementation:**
```javascript
const updateMyProfile = async (req, res) => {
  const teacherId = req.user.teacherId;
  const updates = req.body;

  const teacher = await prisma.teacher.update({
    where: { id: teacherId },
    data: updates,
    include: {
      user: true,
      department: true,
      subjects: true
    }
  });

  res.json({ success: true, data: teacher });
};
```

---

### 3. Classes Management

#### `GET /api/v1/teachers/classes`
Get all classes taught by the teacher.

**Query Params:**
- `year`: Academic year (optional)
- `term`: Term/semester (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Mathematics 101",
      "code": "MATH101",
      "gradeLevel": "10th Grade",
      "section": "A",
      "studentCount": 28,
      "schedule": "Mon, Wed, Fri 8:00-9:30 AM",
      "room": "Room 205"
    }
  ]
}
```

#### `GET /api/v1/teachers/classes/:id/students`
Get students in a specific class.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "firstName": "John",
      "lastName": "Doe",
      "rollNumber": "S001",
      "email": "john.doe@school.com",
      "profileImage": "https://..."
    }
  ]
}
```

---

### 4. Attendance Management

#### `GET /api/v1/teachers/attendance`
Get attendance records for a class on a specific date.

**Query Params:**
- `classId`: Class ID (required)
- `date`: Date in YYYY-MM-DD format (required)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "John Doe",
      "rollNumber": "S001",
      "status": "present" | "absent" | "late" | "excused",
      "notes": "Arrived 10 minutes late"
    }
  ]
}
```

#### `POST /api/v1/teachers/attendance`
Mark attendance for multiple students.

**Request Body:**
```json
{
  "classId": 1,
  "date": "2026-02-01",
  "attendance": [
    {
      "studentId": 1,
      "status": "present",
      "notes": ""
    },
    {
      "studentId": 2,
      "status": "absent",
      "notes": "Sick leave"
    }
  ]
}
```

**Implementation:**
```javascript
const markAttendance = async (req, res) => {
  const { classId, date, attendance } = req.body;
  const teacherId = req.user.teacherId;

  // Verify teacher owns this class
  const classExists = await prisma.class.findFirst({
    where: { id: classId, teacherId }
  });

  if (!classExists) {
    throw new UnauthorizedError('Not authorized for this class');
  }

  // Bulk create/update attendance
  const records = await Promise.all(
    attendance.map(record =>
      prisma.attendance.upsert({
        where: {
          studentId_classId_date: {
            studentId: record.studentId,
            classId: classId,
            date: new Date(date)
          }
        },
        create: {
          studentId: record.studentId,
          classId: classId,
          date: new Date(date),
          status: record.status,
          notes: record.notes,
          markedBy: teacherId
        },
        update: {
          status: record.status,
          notes: record.notes
        }
      })
    )
  );

  // Emit WebSocket event
  wsServer.sendAttendanceUpdate(
    attendance.map(a => a.studentId),
    { classId, date, records }
  );

  res.json({ success: true, data: records });
};
```

---

### 5. Assignment Management

#### `GET /api/v1/teachers/assignments`
Get assignments for teacher's classes.

**Query Params:**
- `classId`: Filter by class (optional)
- `status`: active/upcoming/past (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Chapter 5 Test",
      "description": "Test covering topics 1-5",
      "className": "Mathematics 101",
      "dueDate": "2026-02-05T23:59:59Z",
      "maxPoints": 100,
      "submittedCount": 15,
      "totalStudents": 28,
      "attachments": []
    }
  ]
}
```

#### `POST /api/v1/teachers/assignments`
Create a new assignment.

**Request Body:**
```json
{
  "classId": 1,
  "title": "Chapter 6 Test",
  "description": "Test covering chapter 6",
  "dueDate": "2026-02-10T23:59:59Z",
  "maxPoints": 100,
  "instructions": "Complete all questions",
  "attachments": ["file1.pdf"]
}
```

#### `GET /api/v1/teachers/assignments/:id/submissions`
Get submissions for an assignment.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "studentId": 1,
      "studentName": "John Doe",
      "submittedAt": "2026-02-01T10:30:00Z",
      "grade": 85,
      "maxPoints": 100,
      "feedback": "Good work!",
      "attachments": ["submission.pdf"],
      "status": "submitted" | "graded" | "late"
    }
  ]
}
```

#### `PUT /api/v1/teachers/assignments/:assignmentId/submissions/:submissionId/grade`
Grade a submission.

**Request Body:**
```json
{
  "grade": 85,
  "maxPoints": 100,
  "feedback": "Excellent work!"
}
```

**Implementation:**
```javascript
const gradeSubmission = async (req, res) => {
  const { assignmentId, submissionId } = req.params;
  const { grade, feedback } = req.body;
  const teacherId = req.user.teacherId;

  // Verify ownership
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: parseInt(assignmentId),
      class: { teacherId }
    }
  });

  if (!assignment) {
    throw new UnauthorizedError('Not authorized');
  }

  // Grade submission
  const submission = await prisma.assignmentSubmission.update({
    where: { id: parseInt(submissionId) },
    data: {
      grade,
      feedback,
      gradedAt: new Date(),
      gradedBy: teacherId
    },
    include: { student: true }
  });

  // Emit WebSocket event
  wsServer.sendGradeUpdate(submission.studentId, {
    assignmentId,
    grade,
    feedback
  });

  res.json({ success: true, data: submission });
};
```

---

### 6. Grade Management

#### `GET /api/v1/teachers/grades`
Get grades for a class.

**Query Params:**
- `classId`: Class ID (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "id": 1,
        "name": "John Doe",
        "rollNumber": "S001"
      }
    ],
    "assignments": [
      {
        "id": 1,
        "title": "Test 1",
        "maxPoints": 100,
        "weight": 20
      }
    ],
    "grades": [
      {
        "studentId": 1,
        "assignmentId": 1,
        "grade": 85,
        "percentage": 85
      }
    ]
  }
}
```

#### `POST /api/v1/teachers/grades/bulk`
Save multiple grades at once.

**Request Body:**
```json
{
  "classId": 1,
  "grades": [
    {
      "studentId": 1,
      "assignmentId": 1,
      "grade": 85,
      "feedback": "Good"
    }
  ]
}
```

---

### 7. Lesson Plans

#### `GET /api/v1/teachers/lesson-plans`
Get lesson plans.

**Query Params:**
- `classId`: Filter by class (optional)
- `startDate`: Start date (optional)
- `endDate`: End date (optional)

#### `POST /api/v1/teachers/lesson-plans`
Create a lesson plan.

**Request Body:**
```json
{
  "classId": 1,
  "title": "Introduction to Algebra",
  "date": "2026-02-05",
  "duration": 90,
  "objectives": ["Understand variables", "Solve equations"],
  "materials": ["Textbook", "Whiteboard"],
  "activities": ["Lecture", "Practice problems"],
  "homework": "Page 45-50",
  "notes": "Focus on examples"
}
```

#### `PUT /api/v1/teachers/lesson-plans/:id`
Update a lesson plan.

#### `DELETE /api/v1/teachers/lesson-plans/:id`
Delete a lesson plan.

---

### 8. File Upload

#### `POST /api/v1/teachers/upload`
Upload files (profile photo, assignment materials, etc.)

**Request**: Multipart form data
- `file`: File to upload
- `type`: "profile" | "assignment" | "lessonplan"

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://cdn.example.com/uploads/file.pdf",
    "filename": "file.pdf",
    "size": 12345,
    "mimeType": "application/pdf"
  }
}
```

**Implementation:**
```javascript
const uploadFile = async (req, res) => {
  const file = req.file; // multer middleware
  const { type } = req.body;
  const teacherId = req.user.teacherId;

  // Upload to storage (S3, Cloudinary, etc.)
  const fileUrl = await uploadToStorage(file);

  // Save file record
  const fileRecord = await prisma.file.create({
    data: {
      filename: file.originalname,
      url: fileUrl,
      size: file.size,
      mimeType: file.mimetype,
      type: type,
      uploadedBy: teacherId
    }
  });

  res.json({ success: true, data: fileRecord });
};
```

---

## Implementation Checklist

### Phase 1: Core Endpoints
- [ ] Dashboard stats endpoint
- [ ] Profile GET/PUT endpoints
- [ ] Classes list endpoint
- [ ] Class students endpoint

### Phase 2: Attendance
- [ ] Get attendance endpoint
- [ ] Mark attendance endpoint
- [ ] Attendance stats endpoint

### Phase 3: Assignments
- [ ] List assignments endpoint
- [ ] Create assignment endpoint
- [ ] Update assignment endpoint
- [ ] Delete assignment endpoint
- [ ] Get submissions endpoint
- [ ] Grade submission endpoint

### Phase 4: Grades & Lesson Plans
- [ ] Get grades endpoint
- [ ] Bulk save grades endpoint
- [ ] List lesson plans endpoint
- [ ] CRUD lesson plan endpoints

### Phase 5: File Upload
- [ ] Configure multer middleware
- [ ] Set up storage (S3/local)
- [ ] Upload endpoint
- [ ] File validation

### Phase 6: WebSocket Events
- [ ] Emit attendance events
- [ ] Emit grade events
- [ ] Emit assignment events
- [ ] Emit notification events

---

## Testing

### Postman Collection
Create a Postman collection with all endpoints for testing.

### Sample Test Cases
1. **Dashboard**: Verify stats match database
2. **Attendance**: Mark attendance and verify in database
3. **Assignments**: Create, update, delete cycle
4. **Grading**: Submit and grade assignment
5. **File Upload**: Upload various file types

---

## Error Handling

All endpoints should follow this error format:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Assignment not found"
  }
}
```

Common error codes:
- `NOT_FOUND`: Resource not found
- `UNAUTHORIZED`: Not authorized for this resource
- `VALIDATION_ERROR`: Invalid input data
- `SERVER_ERROR`: Internal server error

---

## Next Steps

1. Implement endpoints in order of priority
2. Test each endpoint with Postman
3. Connect frontend pages to backend
4. Test WebSocket real-time updates
5. Deploy and monitor

---

**Related Files:**
- Frontend Integration: `/Frontend/TEACHER_PORTAL_INTEGRATION.md`
- Teacher Controller: `/Backend/src/controllers/teacherController.js`
- Teacher Service: `/Backend/src/services/teacherService.js`
- WebSocket Server: `/Backend/src/websocket/index.js`
