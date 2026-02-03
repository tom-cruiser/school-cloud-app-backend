const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllAcademicYears = async (schoolId) => {
  const academicYears = await prisma.academicYear.findMany({
    where: { schoolId },
    orderBy: { startDate: 'desc' },
  });

  return { data: academicYears };
};

exports.getAcademicYearById = async (id, schoolId) => {
  const academicYear = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });

  if (!academicYear) {
    throw new NotFoundError('Academic year not found');
  }

  return academicYear;
};

exports.createAcademicYear = async (data, schoolId) => {
  const { year, startDate, endDate, isCurrent } = data;

  // If setting as current, unset other current years
  if (isCurrent) {
    await prisma.academicYear.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const academicYear = await prisma.academicYear.create({
    data: {
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent,
      schoolId,
    },
  });

  return academicYear;
};

exports.updateAcademicYear = async (id, data, schoolId) => {
  const { year, startDate, endDate, isCurrent } = data;

  const academicYear = await prisma.academicYear.findFirst({
    where: { id, schoolId },
  });

  if (!academicYear) {
    throw new NotFoundError('Academic year not found');
  }

  // If setting as current, unset other current years
  if (isCurrent) {
    await prisma.academicYear.updateMany({
      where: { schoolId, isCurrent: true, id: { not: id } },
      data: { isCurrent: false },
    });
  }

  const updatedAcademicYear = await prisma.academicYear.update({
    where: { id },
    data: {
      year,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent,
    },
  });

  return updatedAcademicYear;
};

exports.deleteAcademicYear = async (id, schoolId) => {
  const academicYear = await prisma.academicYear.findFirst({
    where: { id, schoolId },
    include: {
      _count: {
        select: { classes: true, terms: true },
      },
    },
  });

  if (!academicYear) {
    throw new NotFoundError('Academic year not found');
  }

  if (academicYear._count.classes > 0 || academicYear._count.terms > 0) {
    throw new ValidationError('Cannot delete academic year with associated classes or terms');
  }

  await prisma.academicYear.delete({ where: { id } });
  return true;
};
