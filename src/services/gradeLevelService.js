const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllGradeLevels = async (schoolId) => {
  const gradeLevels = await prisma.gradeLevel.findMany({
    where: { schoolId },
    include: {
      _count: { select: { students: true, classes: true } },
    },
    orderBy: { sequence: 'asc' },
  });

  return { data: gradeLevels };
};

exports.createGradeLevel = async (data, schoolId) => {
  const { name, level, sequence } = data;

  const gradeLevel = await prisma.gradeLevel.create({
    data: {
      name,
      level,
      sequence,
      schoolId,
    },
  });

  return gradeLevel;
};

exports.updateGradeLevel = async (id, data, schoolId) => {
  const { name, level, sequence } = data;

  const gradeLevel = await prisma.gradeLevel.findFirst({
    where: { id, schoolId },
  });

  if (!gradeLevel) {
    throw new NotFoundError('Grade level not found');
  }

  const updatedGradeLevel = await prisma.gradeLevel.update({
    where: { id },
    data: { name, level, sequence },
  });

  return updatedGradeLevel;
};

exports.deleteGradeLevel = async (id, schoolId) => {
  const gradeLevel = await prisma.gradeLevel.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { students: true, classes: true } } },
  });

  if (!gradeLevel) {
    throw new NotFoundError('Grade level not found');
  }

  if (gradeLevel._count.students > 0 || gradeLevel._count.classes > 0) {
    throw new ValidationError('Cannot delete grade level with associated students or classes');
  }

  await prisma.gradeLevel.delete({ where: { id } });
  return true;
};
