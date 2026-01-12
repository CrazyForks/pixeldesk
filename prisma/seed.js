const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据库...')

  // 清理现有数据（可选）
  await prisma.userWorkstation.deleteMany()
  await prisma.workstation.deleteMany()
  await prisma.user.deleteMany()

  // 创建示例工位数据 - 使用与 Tiled 地图匹配的 ID
  const workstations = [
    { id: 218, name: 'desk_long_right', xPosition: 720, yPosition: 581 },
    { id: 219, name: 'desk_long_left', xPosition: 800, yPosition: 581 },
    { id: 220, name: 'single_desk', xPosition: 900, yPosition: 581 },
    { id: 221, name: 'library_bookcase_normal', xPosition: 1000, yPosition: 581 },
    { id: 222, name: 'library_bookcase_tall', xPosition: 1100, yPosition: 581 },
    { id: 223, name: 'sofa-left-1', xPosition: 1200, yPosition: 581 },
    { id: 224, name: 'sofa-right-1', xPosition: 1300, yPosition: 581 },
    { id: 225, name: 'desk-big-manager-left-1', xPosition: 1400, yPosition: 581 },
    { id: 226, name: 'desk-big-manager-center-1', xPosition: 1500, yPosition: 581 },
    { id: 227, name: 'desk-big-manager-right-1', xPosition: 1600, yPosition: 581 },
    { id: 228, name: 'desk-big-manager-center-2', xPosition: 1700, yPosition: 581 },
    { id: 229, name: 'flower', xPosition: 5280, yPosition: 3120 },
    { id: 230, name: 'flower', xPosition: 5280, yPosition: 3072 },
    { id: 231, name: 'flower', xPosition: 5280, yPosition: 3024 },
    { id: 232, name: 'flower', xPosition: 5280, yPosition: 2976 },
  ]

  for (const ws of workstations) {
    await prisma.workstation.create({
      data: ws
    })
  }

  console.log('已创建', workstations.length, '个工位')

  // === AI NPC 数据 ===
  console.log('正在初始化 AI NPCs...')
  const npcs = [
    {
      id: 'npc_adam',
      name: 'Adam',
      sprite: 'Male_Adam_idle_48x48',
      x: 1200,
      y: 800,
      role: 'IT Support',
      personality: 'Tech-savvy and helpful, but slightly overwhelmed by ticket requests.',
      greeting: 'Have you tried turning it off and on again?',
      knowledge: 'Knows about the office network and hardware setup.',
      isFixed: false
    },
    {
      id: 'npc_designer',
      name: 'Sarah',
      sprite: 'Female_Conference_woman_idle_48x48',
      x: 2500,
      y: 1200,
      role: 'Senior Designer',
      personality: 'Artistic and meticulous about pixel perfection.',
      greeting: 'Watch the spacing, we need it aligned perfectly.',
      knowledge: 'Expert in design systems and HSL color palettes.',
      isFixed: false
    },
    {
      id: 'npc_arthur',
      name: 'Arthur',
      sprite: 'Male_Ash_idle_48x48',
      x: 1500,
      y: 3500,
      role: 'Financial Analyst',
      personality: 'A polite but firm British financial analyst. He only speaks English and polite prompts users to speak English.',
      greeting: 'Good morning! I am Arthur. Please, let us keep our conversation in English for clarity, shall we?',
      knowledge: 'Expert in market trends and company budgets.',
      isFixed: false
    },
    {
      id: 'npc_sophia',
      name: 'Sophia',
      sprite: 'Amelia_idle_48x48',
      x: 4000,
      y: 2500,
      role: 'Creative Director',
      personality: 'Inspirational and always looking for new design trends.',
      greeting: 'The lighting here is just perfect for inspiration!',
      knowledge: 'Deep understanding of branding and visual identity.',
      isFixed: false
    },
    {
      id: 'npc_lucas',
      name: 'Lucas',
      sprite: 'Male_Dan_idle_48x48',
      x: 7000,
      y: 1500,
      role: 'Backend Architect',
      personality: 'Focused on scalability and efficient algorithms.',
      greeting: 'Ready to optimize some database queries today?',
      knowledge: 'Specialist in distributed systems and performance tuning.',
      isFixed: false
    },
    {
      id: 'npc_elena',
      name: 'Elena',
      sprite: 'Lucy_idle_48x48',
      x: 3000,
      y: 5000,
      role: 'Product Manager',
      personality: 'Data-driven and user-focused, always iterating.',
      greeting: 'Glad to meet you! Do you have any feedback on our latest roadmap?',
      knowledge: 'Bridge between users and the core engineering team.',
      isFixed: false
    },
    {
      id: 'npc_josh',
      name: 'Josh',
      sprite: 'Old_man_Josh_idle_48x48',
      x: 8500,
      y: 3000,
      role: 'Senior Consultant',
      personality: 'Wise and experienced, loves sharing industry stories.',
      greeting: 'Ah, I remember when we used to code on punch cards...',
      knowledge: 'Vast knowledge of industry history and best practices.',
      isFixed: true
    },
    {
      id: 'npc_molly',
      name: 'Molly',
      sprite: 'Molly_idle_48x48',
      x: 9311,
      y: -632,
      role: 'Head Barista',
      personality: 'Energetic and passionate about the perfect roast.',
      greeting: 'One double espresso, coming right up!',
      knowledge: 'Knows everything about coffee beans and tea blends.',
      isFixed: true
    }
  ]

  for (const npc of npcs) {
    await prisma.ai_npcs.upsert({
      where: { id: npc.id },
      update: { ...npc, updatedAt: new Date() },
      create: { ...npc, updatedAt: new Date() }
    })
  }

  console.log('已处理', npcs.length, '个 AI NPCs')
  console.log('数据库初始化完成！')
}

main()
  .catch((e) => {
    console.error('数据库初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })