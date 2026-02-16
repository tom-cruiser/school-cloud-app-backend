const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllTerms = async (schoolId) => {
  const terms = await prisma.term.findMany({
    where: { academicYear: { schoolId } },
    include: { academicYear: { select: { year: true } } },
    orderBy: { startDate: 'desc' },
  });

  return terms;
};

exports.createTerm = async (data, schoolId) => {
  const { name, startDate, endDate, academicYearId, isCurrent } = data;

  // Verify academic year belongs to school
  const academicYear = await prisma.academicYear.findFirst({
    where: { id: academicYearId, schoolId },
  });

  if (!academicYear) {
    throw new NotFoundError('Academic year not found');
  }

  // If setting as current, unset other current terms
  if (isCurrent) {
    await prisma.term.updateMany({
      where: { academicYear: { schoolId }, isCurrent: true },
      data: { isCurrent: false },
    });
  }

  const term = await prisma.term.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent,
      academicYearId,
    },
  });

  return term;
};

exports.updateTerm = async (id, data, schoolId) => {
  const { name, startDate, endDate, academicYearId, isCurrent } = data;

  const term = await prisma.term.findFirst({
    where: { id, academicYear: { schoolId } },
  });

  if (!term) {
    throw new NotFoundError('Term not found');
  }

  // If changing academic year, verify it belongs to school
  if (academicYearId && academicYearId !== term.academicYearId) {
    const academicYear = await prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    });

    if (!academicYear) {
      throw new NotFoundError('Academic year not found');
    }
  }

  // If setting as current, unset other current terms
  if (isCurrent) {
    await prisma.term.updateMany({
      where: { academicYear: { schoolId }, isCurrent: true, id: { not: id } },
      data: { isCurrent: false },
    });
  }

  const updatedTerm = await prisma.term.update({
    where: { id },
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent,
      academicYearId,
    },
  });

  return updatedTerm;
};

exports.deleteTerm = async (id, schoolId) => {
  const term = await prisma.term.findFirst({
    where: { id, academicYear: { schoolId } },
    include: { _count: { select: { classes: true, grades: true } } },
  });

  if (!term) {
    throw new NotFoundError('Term not found');
  }

  if (term._count.classes > 0 || term._count.grades > 0) {
    throw new ValidationError('Cannot delete term with associated classes or grades');
  }

  await prisma.term.delete({ where: { id } });
  return true;
};
