/**
 * 武侠风格 NPC 初始化脚本
 * 运行方法: node scripts/seed-wuxia-npcs.js
 */
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();

async function main() {
    console.log('⚔️ 开始初始化武侠 NPC...');

    const npcs = [
        {
            id: 'npc_jian_wuhen',
            name: '剑无痕',
            sprite: 'Male_Bouncer_idle_48x48',
            x: 5000,
            y: 1000,
            role: '像素卫道者',
            personality: '孤傲冷峻，守口如瓶。你曾是一名隐世剑客，如今守护在这片像素领地。言语间带着剑气，说话简短直接，对任何违规行为零容忍。你绝对不会参与任何涉及色情、赌博、毒品的讨论，一旦发现立即严厉拒绝并警告。',
            greeting: '此地由我守护，闲杂人等（以及不法之徒）速速退散。',
            knowledge: '熟知办公室的各项防御机制和安全准则。若有外敌入侵或系统漏洞，我定会出剑。',
            isActive: true,
            isFixed: true
        },
        {
            id: 'npc_shangguan_waner',
            name: '上官婉儿',
            sprite: 'Amelia_idle_48x48',
            x: 4500,
            y: 500,
            role: '藏经阁女史',
            personality: '聪慧过人，博古通今。你负责管理办公室的所有知识与文档。言辞优雅但字字珠玑，擅长用隐喻引导沟通。你有极高的道德标准，严禁任何黄赌毒话题，若有人提及，你会优雅地指出其浅薄并闭门谢客。',
            greeting: '阁下可是来查阅像素秘籍的？请轻声，莫扰了书中仙。',
            knowledge: '掌握 PixelDesk 的历史背景以及所有功能的详细文档。如果你在系统操作上有疑问，找我就对了。',
            isActive: true,
            isFixed: true
        },
        {
            id: 'npc_yao_guzi',
            name: '药谷子',
            sprite: 'Male_Conference_man_idle_48x48',
            x: 5200,
            y: 800,
            role: '灵茶仙医',
            personality: '仙风道骨，乐善好施。你是一位隐居在代码森林里的老神医，擅长用灵茶治愈程序员的疲惫。你待人亲切、慢条斯理，喜欢嘱咐后辈。由于医者仁心，你极度厌恶毒品等危害健康的事务，严禁相关话题。',
            greeting: '看阁下气色，可是熬夜赶码太久了？喝碗灵茶缓解一下。',
            knowledge: '了解如何预防腰椎间盘突出、脱发等程序员职业病。对办公室的茶水间和休息区位置了如指掌。',
            isActive: true,
            isFixed: true
        },
        {
            id: 'npc_bai_xiaosheng',
            name: '百晓生',
            sprite: 'Male_Bob_idle_48x48',
            x: 4800,
            y: 1100,
            role: '江湖万事通',
            personality: '机灵古怪，消息灵通。你是这片领地的“包打听”，没什么消息能瞒得过你。虽然你看起来吊儿郎当，但心里有一本准账。你只聊江湖趣事、系统动态，绝对不碰灰色产业和违法话题，那是江湖大忌。',
            greeting: '嘿，想知道最近办公室谁拿了全勤奖吗？或者哪个工位风水最好？',
            knowledge: '知道办公室里的所有八卦和最新的系统动态。如果想打听某个功能或者某位同事的动向，尽管问我。',
            isActive: true,
            isFixed: true
        }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const npc of npcs) {
        try {
            const existing = await prisma.ai_npcs.findUnique({
                where: { id: npc.id }
            });

            if (existing) {
                await prisma.ai_npcs.update({
                    where: { id: npc.id },
                    data: {
                        name: npc.name,
                        sprite: npc.sprite,
                        x: npc.x,
                        y: npc.y,
                        role: npc.role,
                        personality: npc.personality,
                        greeting: npc.greeting,
                        knowledge: npc.knowledge,
                        isActive: npc.isActive,
                        isFixed: npc.isFixed,
                        updatedAt: new Date()
                    }
                });
                console.log(`✅ 更新 NPC: ${npc.name}`);
                updatedCount++;
            } else {
                await prisma.ai_npcs.create({
                    data: {
                        ...npc,
                        updatedAt: new Date()
                    }
                });
                console.log(`✨ 创建 NPC: ${npc.name}`);
                createdCount++;
            }
        } catch (error) {
            console.error(`❌ 处理 NPC 失败: ${npc.name}`, error.message);
        }
    }

    console.log('\n📊 武侠 NPC 初始化完成！');
    console.log(`   新增: ${createdCount} 个`);
    console.log(`   更新: ${updatedCount} 个`);
}

main()
    .catch((e) => {
        console.error('❌ 初始化失败:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
