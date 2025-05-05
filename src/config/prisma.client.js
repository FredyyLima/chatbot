const { PrismaClient } = require('@prisma/client');

// Instância única do Prisma Client para ser reutilizada em todo o projeto
const prisma = new PrismaClient();

module.exports = prisma;
