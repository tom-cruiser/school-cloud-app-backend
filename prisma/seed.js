const prisma = require('../src/config/database');
const bcrypt = require('bcrypt');
const config = require('../src/config');
const logger = require('../src/config/logger');

async function main() {
  logger.info('Starting database seeding...');

  // Create a Super Admin user
  const superAdminPassword = await bcrypt.hash('password123', config.bcryptRounds);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  logger.info(`Super Admin created: ${superAdmin.email}`);

  // Create a demo school
  const school = await prisma.school.upsert({
    where: { domain: 'school1' },
    update: {},
    create: {
      name: 'Demo High School',
      domain: 'school1',
      email: 'admin@school1.com',
      phone: '+1234567890',
      address: '123 Education Street, Learning City',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
    },
  });

  logger.info(`School created: ${school.name}`);

  // Create School Admin
  const schoolAdminPassword = await bcrypt.hash('password123', config.bcryptRounds);
  const schoolAdmin = await prisma.user.upsert({
    where: { email: 'admin@school1.com' },
    update: {},
    create: {
      email: 'admin@school1.com',
      password: schoolAdminPassword,
      firstName: 'School',
      lastName: 'Admin',
      role: 'SCHOOL_ADMIN',
      schoolId: school.id,
    },
  });

  logger.info(`School Admin created: ${schoolAdmin.email}`);

  // Create Teacher
  const teacherPassword = await bcrypt.hash('password123', config.bcryptRounds);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school1.com' },
    update: {},
    create: {
      email: 'teacher@school1.com',
      password: teacherPassword,
      firstName: 'John',
      lastName: 'Teacher',
      role: 'TEACHER',
      schoolId: school.id,
    },
  });

  const teacher = await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      schoolId: school.id,
      employeeNumber: 'T001',
      specialization: 'Mathematics',
    },
  });

  logger.info(`Teacher created: ${teacherUser.email}`);

  // Create Academic Year
  const academicYear = await prisma.academicYear.upsert({
    where: { schoolId_year: { schoolId: school.id, year: '2025-2026' } },
    update: {},
    create: {
      schoolId: school.id,
      year: '2025-2026',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: true,
    },
  });

  logger.info(`Academic Year created: ${academicYear.year}`);

  // Create Terms
  const firstTerm = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'First Term',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-15'),
      isCurrent: true,
    },
  });

  const secondTerm = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Second Term',
      startDate: new Date('2026-01-05'),
      endDate: new Date('2026-03-20'),
      isCurrent: false,
    },
  });

  const thirdTerm = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'Third Term',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
      isCurrent: false,
    },
  });

  logger.info('Terms created: First, Second, Third');

  // Create Departments
  const mathDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'MATH' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Mathematics Department',
      code: 'MATH',
      description: 'Mathematics and related subjects',
      headTeacherId: teacher.id,
    },
  });

  const scienceDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'SCI' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Science Department',
      code: 'SCI',
      description: 'Physics, Chemistry, Biology',
    },
  });

  const humDept = await prisma.department.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'HUM' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Humanities Department',
      code: 'HUM',
      description: 'History, Geography, Literature',
    },
  });

  logger.info('Departments created: Mathematics, Science, Humanities');

  // Update Teacher with Department
  await prisma.teacher.update({
    where: { id: teacher.id },
    data: { departmentId: mathDept.id },
  });

  // Create Grade Levels
  const grade10 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 10 } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 10',
      level: 10,
      sequence: 10,
    },
  });

  const grade11 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 11 } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 11',
      level: 11,
      sequence: 11,
    },
  });

  const grade12 = await prisma.gradeLevel.upsert({
    where: { schoolId_level: { schoolId: school.id, level: 12 } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Grade 12',
      level: 12,
      sequence: 12,
    },
  });

  logger.info('Grade Levels created: 10, 11, 12');

  // Create Houses
  const redHouse = await prisma.house.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Red House' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Red House',
      code: 'RED',
      color: '#DC2626',
      points: 0,
      motto: 'Courage and Strength',
    },
  });

  const blueHouse = await prisma.house.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Blue House' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Blue House',
      code: 'BLUE',
      color: '#2563EB',
      points: 0,
      motto: 'Wisdom and Knowledge',
    },
  });

  const greenHouse = await prisma.house.upsert({
    where: { schoolId_name: { schoolId: school.id, name: 'Green House' } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Green House',
      code: 'GREEN',
      color: '#16A34A',
      points: 0,
      motto: 'Growth and Unity',
    },
  });

  logger.info('Houses created: Red, Blue, Green');

  // Create Transport Routes
  const route1 = await prisma.transportRoute.upsert({
    where: { schoolId_routeNumber: { schoolId: school.id, routeNumber: 'R-001' } },
    update: {},
    create: {
      schoolId: school.id,
      routeName: 'North Route',
      routeNumber: 'R-001',
      busNumber: 'BUS-101',
      driverName: 'John Driver',
      driverPhone: '+1234567890',
      capacity: 50,
      pickupTime: '07:00 AM',
      dropoffTime: '02:30 PM',
      stops: [
        { name: 'Main Street', time: '07:00', location: '40.7128,-74.0060' },
        { name: 'Park Avenue', time: '07:15', location: '40.7580,-73.9855' },
        { name: 'School Gate', time: '07:30', location: '40.7589,-73.9851' },
      ],
    },
  });

  logger.info('Transport Route created: North Route');

  // Create Student
  const studentPassword = await bcrypt.hash('password123', config.bcryptRounds);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school1.com' },
    update: {},
    create: {
      email: 'student@school1.com',
      password: studentPassword,
      firstName: 'Jane',
      lastName: 'Student',
      role: 'STUDENT',
      schoolId: school.id,
    },
  });

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      schoolId: school.id,
      studentNumber: 'S001',
      dateOfBirth: new Date('2005-01-15'),
      gender: 'Female',
      guardianName: 'Parent Name',
      guardianPhone: '+1234567891',
      guardianEmail: 'parent@example.com',
      gradeLevelId: grade10.id,
      houseId: redHouse.id,
      transportRouteId: route1.id,
    },
  });

  logger.info(`Student created: ${studentUser.email}`);

  // Create Guardian
  const guardianPassword = await bcrypt.hash('password123', config.bcryptRounds);
  const guardianUser = await prisma.user.upsert({
    where: { email: 'guardian@school1.com' },
    update: {},
    create: {
      email: 'guardian@school1.com',
      password: guardianPassword,
      firstName: 'John',
      lastName: 'Guardian',
      role: 'GUARDIAN',
      schoolId: school.id,
    },
  });

  const guardian = await prisma.guardian.upsert({
    where: { userId: guardianUser.id },
    update: {},
    create: {
      userId: guardianUser.id,
      schoolId: school.id,
      phone: '+1234567890',
      occupation: 'Parent',
      emergencyContact: '+1234567890',
    },
  });

  // Link guardian to student
  await prisma.studentGuardian.upsert({
    where: { studentId_guardianId: { studentId: student.id, guardianId: guardian.id } },
    update: {},
    create: {
      studentId: student.id,
      guardianId: guardian.id,
      relationship: 'Parent',
      isPrimary: true,
      canPickup: true,
    },
  });

  logger.info(`Guardian created: ${guardianUser.email}`);

  // Create a subject
  const subject = await prisma.subject.upsert({
    where: { schoolId_code: { schoolId: school.id, code: 'MATH101' } },
    update: {},
    create: {
      schoolId: school.id,
      departmentId: mathDept.id,
      name: 'Mathematics 101',
      code: 'MATH101',
      description: 'Introduction to Mathematics',
      credits: 3,
    },
  });

  logger.info(`Subject created: ${subject.name}`);

  // Create a class
  const classData = await prisma.class.create({
    data: {
      schoolId: school.id,
      teacherId: teacher.id,
      subjectId: subject.id,
      academicYearId: academicYear.id,
      termId: firstTerm.id,
      gradeLevelId: grade10.id,
      departmentId: mathDept.id,
      name: 'Math 101 - Section A',
      section: 'A',
      academicYear: '2025-2026',
      semester: 'First Term',
      schedule: 'Mon, Wed, Fri 10:00 AM - 11:00 AM',
      room: 'Room 101',
      maxStudents: 30,
    },
  });

  logger.info(`Class created: ${classData.name}`);

  // Enroll student in class
  await prisma.classStudent.create({
    data: {
      classId: classData.id,
      studentId: student.id,
    },
  });

  logger.info('Student enrolled in class');

  logger.info('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    logger.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
