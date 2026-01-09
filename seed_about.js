const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function main() {
  const configs = [
    // zh-CN
    {
      key: 'about_title',
      locale: 'zh-CN',
      value: '关于象素工坊',
      type: 'text'
    },
    {
      key: 'about_content',
      locale: 'zh-CN',
      value: '象素工坊（PixelDesk）是一个将复古像素艺术与现代协作工具结合的创新社交办公平台。在这里，你不仅可以拥有属于自己的像素工位，还能在沉浸式的虚拟世界中与同事、朋友进行实时互动、协同工作。我们致力于打破远程工作的枯燥感，通过游戏化的方式提升团队凝聚力，让办公变得不再单调。无论是在这里专注工作，还是在休息室里聊闲天，每一个像素都承载着连接与创造的可能。',
      type: 'textarea'
    },
    // en-US
    {
      key: 'about_title',
      locale: 'en-US',
      value: 'About PixelDesk',
      type: 'text'
    },
    {
      key: 'about_content',
      locale: 'en-US',
      value: 'PixelDesk is an innovative social workspace that blends retro pixel art with modern collaboration tools. Here, you can have your own pixel workstation and interact with colleagues and friends in an immersive virtual world. We are dedicated to breaking the monotony of remote work by enhancing team cohesion through gamification, making office life anything but dull. Whether youre focused on deep work or chatting in the lounge, every pixel carries the potential for connection and creativity.',
      type: 'textarea'
    },
    // zh-TW
    {
      key: 'about_title',
      locale: 'zh-TW',
      value: '關於象素工坊',
      type: 'text'
    },
    {
      key: 'about_content',
      locale: 'zh-TW',
      value: '象素工坊（PixelDesk）是一個將復古像素藝術與現代協作工具結合的創新社交辦公平台。在這裡，你不僅可以擁有屬於自己的像素工位，還能在沉浸式的虛擬世界中與同事、朋友進行即時互動、協同工作。我們致力於打破遠程工作的枯燥感，通過遊戲化的方式提升團隊凝聚力，讓辦公變得不再單調。無論是在這裡專注工作，還是在休息室裡聊閒天，每一個像素都承載著連接與創造的可能。',
      type: 'textarea'
    },
    // ja-JP
    {
      key: 'about_title',
      locale: 'ja-JP',
      value: 'PixelDeskについて',
      type: 'text'
    },
    {
      key: 'about_content',
      locale: 'ja-JP',
      value: 'PixelDeskは、レトロなピクセルアートと現代のコラボレーションツールを融合させた革新的なソーシャルワークスペースです。ここでは、自分だけのピクセルワークステーションを持ち、没入感のある仮想世界で同僚や友人とリアルタイムで交流し、協力して作業することができます。私たちは、ゲーミフィケーションを通じてチームの結束力を高め、リモートワークの単調さを打破し、オフィスライフを退屈させないことに専念しています。集中して仕事に取り組むときも、ラウンジでチャットを楽しむときも、すべてのピクセルが繋がりと創造の可能性を秘めています。',
      type: 'textarea'
    }
  ];

  for (const config of configs) {
    await prisma.brand_config.upsert({
      where: {
        key_locale: {
          key: config.key,
          locale: config.locale
        }
      },
      update: {
        value: config.value,
        type: config.type
      },
      create: {
        id: crypto.randomUUID(),
        ...config
      }
    });
  }
  console.log('Default about content seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
