/**
 * 导入等级配置数据
 * 运行方法: node scripts/seed-levels.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
        level: 5,
        name: '8位行者 (8-Bit Walker)',
        minBits: 500,
        visualConfig: { color: '#3b82f6', icon: 'walker' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display']
    },
    {
        level: 10,
        name: '16位游侠 (16-Bit Ranger)',
        minBits: 2000,
        visualConfig: { color: '#8b5cf6', icon: 'ranger' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting']
    },
    {
        level: 20,
        name: '网格冲浪者 (Grid Surfer)',
        minBits: 8000,
        visualConfig: { color: '#10b981', icon: 'surfer' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture']
    },
    {
        level: 40,
        name: '体素建筑师 (Voxel Architect)',
        minBits: 20000,
        visualConfig: { color: '#f59e0b', icon: 'architect' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture', 'create_room']
    },
    {
        level: 60,
        name: '高位传奇 (High-Bit Legend)',
        minBits: 50000,
        visualConfig: { color: '#ec4899', icon: 'legend' },
        unlockedFeatures: ['upload_avatar', 'use_emoji', 'workstation_diy', 'title_display', 'custom_name_color', 'bgm_setting', 'trail_effect', 'interactive_furniture', 'create_room', 'global_broadcast', 'custom_shader']
    }
];

async function main() {
    console.log('🚀 开始导入等级配置...');

    for (const lvl of levels) {
        try {
            const upsertLevel = await prisma.level_definitions.upsert({
                where: { level: lvl.level },
                update: {
                    name: lvl.name,
                    minBits: lvl.minBits,
                    visualConfig: lvl.visualConfig,
                    unlockedFeatures: lvl.unlockedFeatures,
                    updatedAt: new Date()
                },
                create: {
                    level: lvl.level,
                    name: lvl.name,
                    minBits: lvl.minBits,
                    visualConfig: lvl.visualConfig,
                    unlockedFeatures: lvl.unlockedFeatures,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });
            console.log(`✅ 已导入等级 ${lvl.level}: ${lvl.name}`);
        } catch (error) {
            console.error(`❌ 导入等级 ${lvl.level} 失败:`, error.message);
        }
    }

    console.log('✨ 导入完成！');
}

main()
    .catch((e) => {
        console.error('❌ 脚本运行出错:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
