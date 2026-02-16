const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllDepartments = async (schoolId, page, limit) => {
  const skip = (page - 1) * limit;

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: {
            teachers: true,
            subjects: true,
          },
        },
        headTeacher: {
          select: {
            id: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.department.count({ where: { schoolId } }),
  ]);

  return {
    data: departments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Simple method without pagination for dropdowns
exports.getAllDepartmentsSimple = async (schoolId) => {
  const departments = await prisma.department.findMany({
    where: { schoolId },
    include: {
      _count: {
        select: {
          teachers: true,
          subjects: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments;
};

exports.getDepartmentById = async (id, schoolId) => {
  const department = await prisma.department.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: {
          teachers: true,
          subjects: true,
        },
      },
      headTeacher: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!department) {
    throw new NotFoundError('Department not found');
  }

  return department;
};

exports.createDepartment = async (data, schoolId) => {
  const { name, code, description, headTeacherId } = data;

  // Check if code already exists in this school
  const existingDept = await prisma.department.findFirst({
    where: { schoolId, code },
  });

  if (existingDept) {
    throw new ValidationError('Department code already exists');
  }

  // If headTeacherId is provided, verify the teacher exists in this school
  if (headTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: headTeacherId, schoolId },
    });
    if (!teacher) {
      throw new NotFoundError('Head teacher not found');
    }
  }

  const department = await prisma.department.create({
    data: {
      name,
      code,
      description,
      headTeacherId,
      schoolId,
    },
    include: {
      _count: {
        select: {
          teachers: true,
          subjects: true,
        },
      },
    },
  });

  return department;
};

exports.updateDepartment = async (id, data, schoolId) => {
  const { name, code, description, headTeacherId } = data;

  // Check if department exists
  const department = await prisma.department.findFirst({
    where: { id, schoolId },
  });

  if (!department) {
    throw new NotFoundError('Department not found');
  }

  // Check if new code conflicts with another department
  if (code && code !== department.code) {
    const existingDept = await prisma.department.findFirst({
      where: { schoolId, code, id: { not: id } },
    });
    if (existingDept) {
      throw new ValidationError('Department code already exists');
    }
  }

  // If headTeacherId is provided, verify the teacher exists
  if (headTeacherId) {
    const teacher = await prisma.teacher.findFirst({
      where: { id: headTeacherId, schoolId },
    });
    if (!teacher) {
      throw new NotFoundError('Head teacher not found');
    }
  }

  const updatedDepartment = await prisma.department.update({
    where: { id },
    data: {
      name,
      code,
      description,
      headTeacherId,
    },
    include: {
      _count: {
        select: {
          teachers: true,
          subjects: true,
        },
      },
    },
  });

  return updatedDepartment;
};

exports.deleteDepartment = async (id, schoolId) => {
  // Check if department exists
  const department = await prisma.department.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: {
          teachers: true,
          subjects: true,
        },
      },
    },
  });

  if (!department) {
    throw new NotFoundError('Department not found');
  }

  // Check if department has teachers or subjects
  if (department._count.teachers > 0 || department._count.subjects > 0) {
    throw new ValidationError(
      'Cannot delete department with associated teachers or subjects. Please reassign them first.'
    );
  }

  await prisma.department.delete({
    where: { id },
  });

  return true;
};
