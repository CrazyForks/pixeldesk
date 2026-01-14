const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const npcs = await prisma.ai_npcs.findMany()
    console.log(`Found ${npcs.length} NPCs to check.`)

    for (const npc of npcs) {
        if (npc.personality && npc.personality.includes(' Only speaks English.')) {
            const newPersonality = npc.personality.replace(' Only speaks English.', '').trim()
            console.log(`Updating NPC ${npc.name}: "${npc.personality}" -> "${newPersonality}"`)
            await prisma.ai_npcs.update({
                where: { id: npc.id },
                data: { personality: newPersonality }
            })
        }
    }

    console.log('Finished updating NPCs.')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
