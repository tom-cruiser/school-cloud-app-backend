const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.createAttendance = async (data, schoolId) => {
  const { classId, studentId, date, status, remarks } = data;

  // Validate status
  const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid attendance status');
  }

  // Check if student exists in the class
  const classEnrollment = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
  });

  if (!classEnrollment) {
    throw new NotFoundError('Class not found');
  }

  // Check if student exists
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      schoolId,
    },
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // Check if attendance record already exists for this date
  const existingRecord = await prisma.attendance.findFirst({
    where: {
      classId,
      studentId,
      date: new Date(date),
      schoolId,
    },
  });

  if (existingRecord) {
    // Update existing record
    return prisma.attendance.update({
      where: { id: existingRecord.id },
      data: { status, remarks },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        class: true,
      },
    });
  }

  // Create new record
  const attendance = await prisma.attendance.create({
    data: {
      classId,
      studentId,
      date: new Date(date),
      status,
      remarks,
      schoolId,
    },
    include: {
      student: {
        include: {
          user: true,
        },
      },
      class: true,
    },
  });

  return attendance;
};

exports.getAttendanceByClass = async (classId, schoolId, filters = {}) => {
  const { date, studentId, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    classId,
    schoolId,
  };

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    where.date = {
      gte: startDate,
      lt: endDate,
    };
  }

  if (studentId) {
    where.studentId = studentId;
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        student: {
          include: {
            user: true,
            gradeLevel: true,
          },
        },
        class: {
          include: {
            subject: true,
            teacher: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return { data: attendance, total, page, limit };
};

exports.getAttendanceByStudent = async (studentId, schoolId, filters = {}) => {
  const { classId, startDate, endDate, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    studentId,
    schoolId,
  };

  if (classId) {
    where.classId = classId;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }

  const [attendance, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        class: {
          include: {
            subject: true,
            teacher: { include: { user: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendance.count({ where }),
  ]);

  return { data: attendance, total, page, limit };
};

exports.getAttendanceStatistics = async (classId, schoolId, filters = {}) => {
  const { startDate, endDate } = filters;

  const where = {
    classId,
    schoolId,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }

  const records = await prisma.attendance.findMany({
    where,
    include: {
      student: {
        include: { user: true },
      },
    },
  });

  // Group by student
  const studentStats = {};
  records.forEach((record) => {
    if (!studentStats[record.studentId]) {
      studentStats[record.studentId] = {
        studentId: record.studentId,
        studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: 0,
      };
    }
    studentStats[record.studentId][record.status.toLowerCase()]++;
    studentStats[record.studentId].total++;
  });

  return Object.values(studentStats);
};

exports.bulkCreateAttendance = async (attendanceData, schoolId) => {
  const { classId, date, attendanceList } = attendanceData;

  // Validate class exists
  const classRecord = await prisma.class.findFirst({
    where: {
      id: classId,
      schoolId,
    },
  });

  if (!classRecord) {
    throw new NotFoundError('Class not found');
  }

  // Prepare records for bulk creation
  const records = attendanceList.map((item) => ({
    classId,
    studentId: item.studentId,
    date: new Date(date),
    status: item.status,
    remarks: item.remarks || null,
    schoolId,
  }));

  // Delete existing records for this date and class
  await prisma.attendance.deleteMany({
    where: {
      classId,
      date: new Date(date),
      schoolId,
    },
  });

  // Bulk create
  const created = await prisma.attendance.createMany({
    data: records,
    skipDuplicates: true,
  });

  // Fetch created records
  const attendance = await prisma.attendance.findMany({
    where: {
      classId,
      date: new Date(date),
      schoolId,
    },
    include: {
      student: {
        include: { user: true },
      },
    },
  });

  return { data: attendance, count: created.count };
};

exports.updateAttendance = async (id, data, schoolId) => {
  const { status, remarks } = data;

  // Validate status
  const validStatuses = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];
  if (status && !validStatuses.includes(status)) {
    throw new ValidationError('Invalid attendance status');
  }

  const attendance = await prisma.attendance.findFirst({
    where: { id, schoolId },
  });

  if (!attendance) {
    throw new NotFoundError('Attendance record not found');
  }

  const updated = await prisma.attendance.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(remarks !== undefined && { remarks }),
    },
    include: {
      student: {
        include: { user: true },
      },
      class: true,
    },
  });

  return updated;
};

exports.deleteAttendance = async (id, schoolId) => {
  const attendance = await prisma.attendance.findFirst({
    where: { id, schoolId },
  });

  if (!attendance) {
    throw new NotFoundError('Attendance record not found');
  }

  await prisma.attendance.delete({ where: { id } });
  return true;
};

exports.getClassAttendanceReport = async (classId, schoolId, filters = {}) => {
  const { startDate, endDate } = filters;

  const where = {
    classId,
    schoolId,
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) {
      where.date.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      where.date.lt = end;
    }
  }

  const classData = await prisma.class.findFirst({
    where: { id: classId, schoolId },
    include: {
      students: {
        include: { user: true },
      },
    },
  });

  if (!classData) {
    throw new NotFoundError('Class not found');
  }

  const attendance = await prisma.attendance.findMany({
    where,
    include: { student: true },
  });

  return {
    class: classData,
    attendance,
  };
};
