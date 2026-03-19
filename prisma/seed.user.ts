import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creando usuarios iniciales...');

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: adminPassword,
      name: 'Administrador',
      role: 'admin'
    }
  });

  // Cajero
  const cashierPassword = await bcrypt.hash('cajero123', 10);
  const cashier = await prisma.user.upsert({
    where: { username: 'cajero' },
    update: {},
    create: {
      username: 'cajero',
      password: cashierPassword,
      name: 'Cajero Principal',
      role: 'cashier'
    }
  });

  console.log('✅ Usuarios creados:');
  console.log('   Admin - username: admin, password: admin123');
  console.log('   Cajero - username: cajero, password: cajero123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  