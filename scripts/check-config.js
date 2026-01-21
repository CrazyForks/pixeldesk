const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const configs = await prisma.points_config.findMany();
    console.log('Points Config:', JSON.stringify(configs, null, 2));

    const count = await prisma.users.count();
    console.log('User count:', count);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
