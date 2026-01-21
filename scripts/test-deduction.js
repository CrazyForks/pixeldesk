const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDeduction() {
    const userId = 'clq...'; // Need a real userId or create one
    // Let's find first user
    const user = await prisma.users.findFirst();
    if (!user) {
        console.log('No user found');
        return;
    }

    console.log(`Initial points for ${user.name}: ${user.points}`);

    const cost = 10;

    try {
        const updatedUser = await prisma.users.update({
            where: { id: user.id },
            data: {
                points: { decrement: cost },
                updatedAt: new Date()
            }
        });
        console.log(`Updated points for ${user.name}: ${updatedUser.points}`);

        if (updatedUser.points === user.points - cost) {
            console.log('✅ Deduction successful');
        } else {
            console.log('❌ Deduction failed');
        }
    } catch (error) {
        console.error('Error during update:', error);
    }
}

testDeduction()
    .finally(() => prisma.$disconnect());
