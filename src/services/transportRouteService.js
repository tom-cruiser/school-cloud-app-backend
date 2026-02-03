const prisma = require('../config/database');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.getAllTransportRoutes = async (schoolId) => {
  const routes = await prisma.transportRoute.findMany({
    where: { schoolId },
    include: {
      _count: { select: { students: true } },
    },
    orderBy: { routeName: 'asc' },
  });

  return { data: routes };
};

exports.createTransportRoute = async (data, schoolId) => {
  const { routeName, routeNumber, busNumber, capacity, isActive } = data;

  const route = await prisma.transportRoute.create({
    data: {
      routeName,
      routeNumber,
      busNumber,
      capacity,
      isActive: isActive !== undefined ? isActive : true,
      schoolId,
    },
  });

  return route;
};

exports.updateTransportRoute = async (id, data, schoolId) => {
  const { routeName, routeNumber, busNumber, capacity, isActive } = data;

  const route = await prisma.transportRoute.findFirst({
    where: { id, schoolId },
  });

  if (!route) {
    throw new NotFoundError('Transport route not found');
  }

  const updatedRoute = await prisma.transportRoute.update({
    where: { id },
    data: { routeName, routeNumber, busNumber, capacity, isActive },
  });

  return updatedRoute;
};

exports.deleteTransportRoute = async (id, schoolId) => {
  const route = await prisma.transportRoute.findFirst({
    where: { id, schoolId },
    include: { _count: { select: { students: true } } },
  });

  if (!route) {
    throw new NotFoundError('Transport route not found');
  }

  if (route._count.students > 0) {
    throw new ValidationError('Cannot delete transport route with assigned students');
  }

  await prisma.transportRoute.delete({ where: { id } });
  return true;
};
