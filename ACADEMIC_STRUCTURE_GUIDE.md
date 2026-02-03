# Academic Structure Implementation Guide

## 🎉 Overview

This document describes the newly implemented academic foundation and infrastructure models that provide a complete school management structure.

## ✅ Implemented Features

### 1. **Academic Foundation** ✅

#### Academic Year Model
- **Purpose**: Centralized management of academic years
- **Fields**: 
  - `year`: e.g., "2025-2026"
  - `startDate` & `endDate`: Define the academic period
  - `isCurrent`: Mark the active academic year
- **Relations**: Links to Terms, Classes

#### Term/Semester Model
- **Purpose**: Break academic year into periods
- **Fields**:
  - `name`: "First Term", "Fall Semester", etc.
  - `startDate` & `endDate`: Term duration
  - `isCurrent`: Mark the active term
- **Relations**: Belongs to AcademicYear, links to Classes and Grades

### 2. **Organizational Structure** ✅

#### Department Model
- **Purpose**: Organize subjects and teachers by department
- **Fields**:
  - `name`: "Mathematics Department", "Science Department"
  - `code`: "MATH", "SCI", "HUM"
  - `headTeacherId`: Optional department head
- **Relations**: 
  - Contains multiple Subjects
  - Contains multiple Teachers
  - Has one Head Teacher

#### Grade Level Model
- **Purpose**: Standardize grade levels across the school
- **Fields**:
  - `name`: "Grade 10", "Year 11", "Form 4"
  - `level`: Numeric level (10, 11, 12)
  - `sequence`: Order for sorting
- **Relations**: Links to Students and Classes

### 3. **Infrastructure** ✅

#### House System
- **Purpose**: Manage school houses for competition and organization
- **Fields**:
  - `name`: "Red House", "Gryffindor"
  - `code`: "RED", "GRYF"
  - `color`: Hex color code
  - `points`: House points system
  - `motto`: House motto
  - `captainId`: Optional student captain
- **Relations**: Contains multiple Students

#### Transport Routes
- **Purpose**: Manage school bus routes and transportation
- **Fields**:
  - `routeName`: "North Route", "Route A"
  - `routeNumber`: "R-001"
  - `busNumber`: "BUS-101"
  - `driverName` & `driverPhone`: Driver details
  - `capacity`: Maximum students
  - `stops`: JSON array of stops with times
  - `pickupTime` & `dropoffTime`: Schedule
- **Relations**: Contains multiple Students

## 📊 Updated Models

### Student Model
**New Fields Added:**
- `gradeLevelId`: Links to GradeLevel
- `houseId`: Links to House (optional)
- `transportRouteId`: Links to TransportRoute (optional)

### Teacher Model
**New Fields Added:**
- `departmentId`: Links to Department (optional)

### Subject Model
**New Fields Added:**
- `departmentId`: Links to Department (optional)

### Class Model
**New Fields Added:**
- `academicYearId`: **Required** - Links to AcademicYear
- `termId`: Links to Term (optional)
- `gradeLevelId`: Links to GradeLevel (optional)
- `departmentId`: Links to Department (optional)
- `maxStudents`: Maximum class capacity

**Deprecated Fields (kept for backward compatibility):**
- `academicYear`: String field (still exists but use `academicYearId` instead)
- `semester`: String field (still exists but use `termId` instead)

### Grade Model
**New Fields Added:**
- `termId`: Links to Term (optional)

**Deprecated Fields:**
- `term`: String field (still exists but use `termId` instead)

## 🎯 Recommended Data Entry Flow

Follow this sequence when setting up a new school:

1. **Academic Year** → Create academic years (e.g., 2025-2026)
2. **Terms** → Create terms for each academic year
3. **Departments** → Create academic departments
4. **Grade Levels** → Define grade levels (10, 11, 12, etc.)
5. **Houses** → Set up house system (if used)
6. **Transport Routes** → Configure bus routes (if applicable)
7. **Subjects** → Create subjects and link to departments
8. **Teachers** → Add teachers and assign to departments
9. **Classes** → Create classes with all required links:
   - Academic Year ✅ (Required)
   - Term ✅
   - Grade Level ✅
   - Department ✅
   - Subject ✅
   - Teacher ✅
10. **Students** → Register students with:
    - Grade Level ✅
    - House ✅ (optional)
    - Transport Route ✅ (optional)
11. **Enrollment** → Enroll students in classes via `ClassStudent` table

## 💾 Database Migration

The migration has been successfully applied with the following changes:

### New Tables Created:
- `academic_years`
- `terms`
- `departments`
- `grade_levels`
- `houses`
- `transport_routes`

### Existing Data Handling:
- Automatically created default academic year (2025-2026) for schools with existing classes
- All existing classes now linked to the default academic year
- Backward compatible - old string fields retained

## 📝 Sample Data

The seed file now creates:
- ✅ 1 Academic Year (2025-2026)
- ✅ 3 Terms (First, Second, Third)
- ✅ 3 Departments (Mathematics, Science, Humanities)
- ✅ 3 Grade Levels (10, 11, 12)
- ✅ 3 Houses (Red, Blue, Green)
- ✅ 1 Transport Route (North Route)
- ✅ Updated student with grade level, house, and transport
- ✅ Updated class with all proper relationships

## 🔍 Key Relationships

### Academic Structure Flow:
```
School
  └── AcademicYear (2025-2026)
        └── Term (First Term, Second Term, Third Term)
              └── Class
                    ├── Subject → Department
                    ├── Teacher → Department
                    ├── GradeLevel
                    └── Students (via ClassStudent)
```

### Student Organization:
```
Student
  ├── GradeLevel (Grade 10)
  ├── House (Red House)
  ├── TransportRoute (North Route)
  └── Classes (via ClassStudent enrollment)
```

## 🚀 API Development Guidelines

When creating endpoints for the new models:

### Academic Year Endpoints:
- `GET /api/v1/:school/academic-years` - List all academic years
- `POST /api/v1/:school/academic-years` - Create new academic year
- `PUT /api/v1/:school/academic-years/:id` - Update academic year
- `POST /api/v1/:school/academic-years/:id/set-current` - Set as current year

### Department Endpoints:
- `GET /api/v1/:school/departments` - List departments
- `POST /api/v1/:school/departments` - Create department
- `GET /api/v1/:school/departments/:id/teachers` - Get department teachers
- `GET /api/v1/:school/departments/:id/subjects` - Get department subjects

### Grade Level Endpoints:
- `GET /api/v1/:school/grade-levels` - List grade levels
- `GET /api/v1/:school/grade-levels/:id/students` - Get students by grade

### House Endpoints:
- `GET /api/v1/:school/houses` - List houses
- `POST /api/v1/:school/houses/:id/add-points` - Add house points
- `GET /api/v1/:school/houses/leaderboard` - House points leaderboard

### Transport Endpoints:
- `GET /api/v1/:school/transport-routes` - List routes
- `GET /api/v1/:school/transport-routes/:id/students` - Get route students

## ⚠️ Breaking Changes & Migration Notes

### For Existing Code:

1. **Class Creation**: Now requires `academicYearId`
   ```javascript
   // Old way (still works but deprecated):
   academicYear: "2024-2025"
   
   // New way (recommended):
   academicYearId: "<academic-year-uuid>"
   ```

2. **Student Registration**: Can now include grade level, house, transport
   ```javascript
   {
     studentNumber: "S001",
     gradeLevelId: "<grade-level-uuid>",
     houseId: "<house-uuid>",
     transportRouteId: "<route-uuid>"
   }
   ```

3. **Queries**: Use proper includes for new relations
   ```javascript
   const classWithDetails = await prisma.class.findUnique({
     where: { id: classId },
     include: {
       academicYearRef: true,
       term: true,
       gradeLevel: true,
       department: true,
       subject: {
         include: { department: true }
       },
       teacher: {
         include: { department: true }
       }
     }
   });
   ```

## 📈 Benefits of New Structure

### Academic Management:
- ✅ Centralized academic year management
- ✅ Historical data preservation (multi-year tracking)
- ✅ Term-based grading and reporting
- ✅ Academic calendar management

### Organizational Benefits:
- ✅ Department-based teacher organization
- ✅ Department-based subject grouping
- ✅ Grade level standardization
- ✅ Better curriculum planning

### Student Experience:
- ✅ House system for competition and engagement
- ✅ Transport route management
- ✅ Grade level progression tracking
- ✅ Multi-year enrollment history

### Administrative Efficiency:
- ✅ Proper data flow from setup to enrollment
- ✅ Prevents orphaned data
- ✅ Enforces proper relationships
- ✅ Supports school growth and scaling

## 🎓 Best Practices

1. **Always create Academic Year first** before creating classes
2. **Assign students to grade levels** during registration
3. **Link subjects to departments** for better organization
4. **Assign teachers to departments** for clear reporting structure
5. **Use the enrollment table** (ClassStudent) for class assignments
6. **Set only one academic year as current** at a time
7. **Set only one term as current** at a time per academic year

## 🔄 Next Steps

### Recommended Enhancements:
1. Create admin UI for managing:
   - Academic Years & Terms
   - Departments
   - Grade Levels
   - Houses & House Points
   - Transport Routes

2. Build reports for:
   - Department performance
   - House points standings
   - Transport route utilization
   - Grade level statistics

3. Implement services:
   - Academic year rollover (promote students)
   - House points system
   - Transport route optimization
   - Department head dashboard

---

## 📞 Support

For questions about the new academic structure, please refer to:
- Schema file: `/Backend/prisma/schema.prisma`
- Seed file: `/Backend/prisma/seed.js`
- Migration: `/Backend/prisma/migrations/20260123090027_add_academic_structure_and_infrastructure/`

**Created**: January 23, 2026  
**Status**: ✅ Production Ready
