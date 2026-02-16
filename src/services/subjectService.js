const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllSubjects = async (schoolId, departmentId = null) => {
  const where = { schoolId };
  if (departmentId) {
    where.departmentId = departmentId;
  }

  const subjects = await prisma.subject.findMany({
    where,
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      credits: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: 'asc' },
  });

  return subjects;
};

exports.getSubjectById = async (id, schoolId) => {
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      credits: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      classes: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!subject) {
    throw new NotFoundError('Subject not found');
  }

  return subject;
};

exports.createSubject = async (data, schoolId) => {
  const { name, code, description, credits, departmentId } = data;

  // Check if subject with same code already exists in this school
  const existingSubject = await prisma.subject.findFirst({
    where: { schoolId, code },
  });

  if (existingSubject) {
    throw new ValidationError('Subject with this code already exists in this school');
  }

  const subject = await prisma.subject.create({
    data: {
      name,
      code,
      description: description || null,
      credits: credits || 0,
      schoolId,
      departmentId: departmentId || null,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      credits: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return subject;
};

exports.updateSubject = async (id, data, schoolId) => {
  const { name, code, description, credits, departmentId } = data;

  // Verify subject exists
  const existingSubject = await prisma.subject.findFirst({
    where: { id, schoolId },
  });

  if (!existingSubject) {
    throw new NotFoundError('Subject not found');
  }

  // Check if new code is already used (if code is being changed)
  if (code && code !== existingSubject.code) {
    const duplicateCode = await prisma.subject.findFirst({
      where: {
        schoolId,
        code,
        id: { not: id },
      },
    });

    if (duplicateCode) {
      throw new ValidationError('Subject with this code already exists in this school');
    }
  }

  const subject = await prisma.subject.update({
    where: { id },
    data: {
      name: name || existingSubject.name,
      code: code || existingSubject.code,
      description: description !== undefined ? description : existingSubject.description,
      credits: credits !== undefined ? credits : existingSubject.credits,
      departmentId: departmentId !== undefined ? departmentId : existingSubject.departmentId,
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      credits: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return subject;
};

exports.deleteSubject = async (id, schoolId) => {
  // Verify subject exists
  const subject = await prisma.subject.findFirst({
    where: { id, schoolId },
  });

  if (!subject) {
    throw new NotFoundError('Subject not found');
  }

  // Check if subject is used in any classes
  const classesUsingSubject = await prisma.class.findMany({
    where: { subjects: { some: { id } } },
  });

  if (classesUsingSubject.length > 0) {
    throw new ValidationError('Cannot delete subject as it is used in one or more classes');
  }

  await prisma.subject.delete({
    where: { id },
  });

  return null;
};
