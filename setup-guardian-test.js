const prisma = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createTestGuardianAndStudent() {
  try {
    console.log('Creating/updating test guardian and student...');

    // Find the school first
    const school = await prisma.school.findFirst();
    if (!school) {
      console.error('No school found. Please create a school first.');
      return;
    }
    console.log(`Using school: ${school.name}`);

    // Create or update guardian user
    let guardianUser = await prisma.user.findUnique({
      where: { email: 'guardian@school1.com' }
    });

    if (!guardianUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      guardianUser = await prisma.user.create({
        data: {
          email: 'guardian@school1.com',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Guardian',
          role: 'GUARDIAN',
          schoolId: school.id,
          isActive: true,
        }
      });
      console.log('Created guardian user');
    } else {
      console.log('Guardian user already exists');
    }

    // Create or find guardian profile
    let guardian = await prisma.guardian.findUnique({
      where: { userId: guardianUser.id }
    });

    if (!guardian) {
      guardian = await prisma.guardian.create({
        data: {
          userId: guardianUser.id,
          schoolId: school.id,
          phone: '+1234567890',
          occupation: 'Software Engineer',
        }
      });
      console.log('Created guardian profile');
    } else {
      console.log('Guardian profile already exists');
    }

    // Find or create a student
    let studentUser = await prisma.user.findFirst({
      where: { 
        role: 'STUDENT',
        schoolId: school.id 
      }
    });

    if (!studentUser) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      studentUser = await prisma.user.create({
        data: {
          email: 'jane.student@school1.com',
          password: hashedPassword,
          firstName: 'Jane',
          lastName: 'Student',
          role: 'STUDENT',
          schoolId: school.id,
          isActive: true,
        }
      });
      console.log('Created student user');
    }

    // Find or create grade level
    let gradeLevel = await prisma.gradeLevel.findFirst({
      where: { schoolId: school.id }
    });

    if (!gradeLevel) {
      gradeLevel = await prisma.gradeLevel.create({
        data: {
          name: 'Grade 10',
          level: 10,
          sequence: 10,
          schoolId: school.id,
        }
      });
      console.log('Created grade level');
    }

    // Create or find student profile
    let student = await prisma.student.findUnique({
      where: { userId: studentUser.id }
    });

    if (!student) {
      student = await prisma.student.create({
        data: {
          userId: studentUser.id,
          studentNumber: 'STU001',
          schoolId: school.id,
          gradeLevelId: gradeLevel.id,
          dateOfBirth: new Date('2008-05-15'),
          gender: 'FEMALE',
        }
      });
      console.log('Created student profile');
    }

    // Link guardian and student
    const existingRelation = await prisma.studentGuardian.findFirst({
      where: {
        guardianId: guardian.id,
        studentId: student.id
      }
    });

    if (!existingRelation) {
      await prisma.studentGuardian.create({
        data: {
          guardianId: guardian.id,
          studentId: student.id,
          relationship: 'PARENT',
          isPrimary: true,
          canPickup: true,
        }
      });
      console.log('Linked guardian and student');
    } else {
      console.log('Guardian-student relationship already exists');
    }

    console.log('✅ Test guardian and student setup complete!');
    console.log(`Guardian email: ${guardianUser.email}`);
    console.log(`Guardian password: password123`);
    console.log(`Student: ${studentUser.firstName} ${studentUser.lastName}`);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestGuardianAndStudent();