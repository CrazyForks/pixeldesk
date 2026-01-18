const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearWorkstations() {
    try {
        console.log('🧹 Clearing all user workstation bindings...');
        const result = await prisma.user_workstations.deleteMany({});
        console.log(`✅ Success! Deleted ${result.count} records.`);
    } catch (error) {
        console.error('❌ Error clearing workstations:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearWorkstations();
