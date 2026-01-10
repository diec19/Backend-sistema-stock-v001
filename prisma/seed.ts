import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes
  await prisma.product.deleteMany();
  console.log('🗑️  Datos anteriores eliminados');

  // Productos de tecnología
  const products = [
    {
      name: 'Laptop HP Pavilion',
      description: 'Laptop para uso profesional, 16GB RAM, 512GB SSD',
      sku: 'LAP-HP-001',
      price: 899.99,
      stock: 15,
      minStock: 5
    },
    {
      name: 'Mouse Logitech MX Master 3',
      description: 'Mouse inalámbrico ergonómico para productividad',
      sku: 'MOU-LOG-001',
      price: 99.99,
      stock: 45,
      minStock: 10
    },
    {
      name: 'Teclado Mecánico Keychron K2',
      description: 'Teclado mecánico inalámbrico RGB',
      sku: 'KEY-KEY-001',
      price: 89.99,
      stock: 8,
      minStock: 15
    },
    {
      name: 'Monitor Dell UltraSharp 27"',
      description: 'Monitor 4K IPS para diseño y programación',
      sku: 'MON-DEL-001',
      price: 449.99,
      stock: 12,
      minStock: 3
    },
    {
      name: 'Webcam Logitech C920',
      description: 'Webcam Full HD 1080p para videoconferencias',
      sku: 'WEB-LOG-001',
      price: 79.99,
      stock: 3,
      minStock: 8
    },
    {
      name: 'Auriculares Sony WH-1000XM5',
      description: 'Auriculares inalámbricos con cancelación de ruido',
      sku: 'AUR-SON-001',
      price: 349.99,
      stock: 20,
      minStock: 5
    },
    {
      name: 'SSD Samsung 1TB',
      description: 'Disco sólido NVMe M.2 alta velocidad',
      sku: 'SSD-SAM-001',
      price: 129.99,
      stock: 35,
      minStock: 10
    },
    {
      name: 'Router WiFi 6 TP-Link',
      description: 'Router de última generación WiFi 6 AX3000',
      sku: 'ROU-TPL-001',
      price: 149.99,
      stock: 2,
      minStock: 5
    },
    {
      name: 'Hub USB-C Anker',
      description: 'Hub 7 en 1 con HDMI, USB 3.0 y lector SD',
      sku: 'HUB-ANK-001',
      price: 49.99,
      stock: 18,
      minStock: 8
    },
    {
      name: 'Cargador Portátil Anker 20000mAh',
      description: 'Power bank de alta capacidad con carga rápida',
      sku: 'CHA-ANK-001',
      price: 59.99,
      stock: 28,
      minStock: 10
    },
    {
      name: 'Cable USB-C Belkin 2m',
      description: 'Cable USB-C a USB-C certificado, carga rápida',
      sku: 'CAB-BEL-001',
      price: 19.99,
      stock: 4,
      minStock: 20
    },
    {
      name: 'Soporte Laptop Adjustable',
      description: 'Soporte ergonómico de aluminio para laptop',
      sku: 'SOP-GEN-001',
      price: 39.99,
      stock: 25,
      minStock: 8
    },
    {
      name: 'Micrófono Blue Yeti',
      description: 'Micrófono USB profesional para streaming',
      sku: 'MIC-BLU-001',
      price: 129.99,
      stock: 1,
      minStock: 4
    },
    {
      name: 'iPad Air 64GB',
      description: 'Tablet Apple con chip M1, pantalla 10.9"',
      sku: 'TAB-APP-001',
      price: 599.99,
      stock: 10,
      minStock: 3
    },
    {
      name: 'Apple Pencil 2da Gen',
      description: 'Lápiz digital para iPad con carga magnética',
      sku: 'PEN-APP-001',
      price: 129.99,
      stock: 15,
      minStock: 5
    }
  ];

  // Crear productos
  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }

  console.log(`✅ ${products.length} productos creados exitosamente`);

  // Mostrar estadísticas
  const totalProducts = await prisma.product.count();
  const lowStockProducts = await prisma.product.count({
    where: {
      stock: {
        lte: prisma.product.fields.minStock
      }
    }
  });

  const allProducts = await prisma.product.findMany();
  const totalValue = allProducts.reduce((sum, p) => {
    return sum + (parseFloat(p.price.toString()) * p.stock);
  }, 0);

  console.log('\n📊 Estadísticas:');
  console.log(`   Total de productos: ${totalProducts}`);
  console.log(`   Productos con stock bajo: ${lowStockProducts}`);
  console.log(`   Valor total del inventario: $${totalValue.toFixed(2)}`);
  console.log('\n🎉 Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });