const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllHouses = async (schoolId) => {
  const houses = await prisma.house.findMany({
    where: { schoolId },
    include: {
      _count: { select: { students: true } },
    },
    orderBy: { name: 'asc' },
  });

  return houses;
};

exports.createHouse = async (data, schoolId) => {
  const { name, code, color, points, motto } = data;

  const house = await prisma.house.create({
    data: {
      name,
      code,
      color,
      points: points || 0,
      motto,
      schoolId,
    },
  });

  return house;
};

exports.updateHouse = async (id, data, schoolId) => {
  const { name, code, color, points, motto } = data;

  const house = await prisma.house.findFirst({
    where: { id, schoolId },
  });

  if (!house) {
    throw new NotFoundError('House not found');
  }

  const updatedHouse = await prisma.house.update({
    where: { id },
    data: { name, code, color, points, motto },
  });

  return updatedHouse;
};

exports.deleteHouse = async (id, schoolId) => {
  const house = await prisma.house.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { students: true } } },
  });

  if (!house) {
    throw new NotFoundError('House not found');
  }

  if (house._count.students > 0) {
    throw new ValidationError('Cannot delete house with assigned students');
  }

  await prisma.house.delete({ where: { id } });
  return true;
};
