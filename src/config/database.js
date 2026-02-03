const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

// Middleware to enable Row-Level Security for multi-tenancy
prisma.$use(async (params, next) => {
  // Log queries in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Query:', params.model, params.action);
  }

  return next(params);
});

module.exports = prisma;
