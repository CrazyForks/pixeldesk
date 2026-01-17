
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const levels = [
    {
        level: 0,
        name: '初生像素 (Raw Pixel)',
        minBits: 0,
        visualConfig: { color: '#4b5563', icon: 'raw_pixel' },
        unlockedFeatures: []
    },
    {
        level: 1,
        name: '漫游位点 (Roaming Bit)',
        minBits: 100,
        visualConfig: { color: '#9ca3af', icon: 'bit' },
        unlockedFeatures: ['upload_avatar', 'use_emoji']
    },
    {
        level: 6,
        name: '8位行者 (8-Bit Walker)',
        minBits: 500,
        visualConfig: { color: '#3b82f6', icon: 'walker' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display']
    },
    {
        level: 11,
        name: '16位游侠 (16-Bit Ranger)',
        minBits: 2000,
        visualConfig: { color: '#8b5cf6', icon: 'ranger' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting']
    },
    {
        level: 21,
        name: '网格冲浪者 (Grid Surfer)',
        minBits: 8000,
        visualConfig: { color: '#10b981', icon: 'surfer' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture']
    },
    {
        level: 41,
        name: '体素建筑师 (Voxel Architect)',
        minBits: 20000,
        visualConfig: { color: '#f59e0b', icon: 'architect' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture', 'create_room']
    },
    {
        level: 70,
        name: '高位传奇 (High-Bit Legend)',
        minBits: 50000,
        visualConfig: { color: '#ec4899', icon: 'legend' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture', 'create_room', 'global_broadcast', 'custom_shader']
    }
]

async function main() {
    console.log('Start seeding levels...')
    for (const lvl of levels) {
        const upsertLevel = await prisma.level_definitions.upsert({
            where: { level: lvl.level },
            update: {
                name: lvl.name,
                minBits: lvl.minBits,
                visualConfig: lvl.visualConfig,
                unlockedFeatures: lvl.unlockedFeatures
            },
            create: {
                level: lvl.level,
                name: lvl.name,
                minBits: lvl.minBits,
                visualConfig: lvl.visualConfig,
                unlockedFeatures: lvl.unlockedFeatures
            }
        })
        console.log(`Upserted level ${lvl.level}: ${lvl.name}`)
    }
    console.log('Seeding finished.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
