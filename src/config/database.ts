import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

// Manejo de desconexión
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;