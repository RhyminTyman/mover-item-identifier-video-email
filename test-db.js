const { PrismaClient } = require('@prisma/client');

async function testDb() {
  try {
    const prisma = new PrismaClient();
    console.log('Testing database connection...');
    
    const inventories = await prisma.inventory.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, photos: true },
    });
    
    console.log('Success! Found', inventories.length, 'inventories');
    console.log('Inventories:', JSON.stringify(inventories, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database error:', error);
    process.exit(1);
  }
}

testDb();
