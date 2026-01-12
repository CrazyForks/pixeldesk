import { Player } from '../entities/Player.js';

/**
 * AI NPC 管理器 - 进阶版
 * 增加本地随机 NPC 生成、多样化角色模板以及轻量级 AI 游荡逻辑
 */
export class AiNpcManager {
    constructor(scene) {
        this.scene = scene;
        this.npcGroup = null;
        this.npcs = new Map(); // id -> npcCharacter (持久化 NPC)
        this.dynamicNpcs = new Map(); // id -> npcCharacter (临时生成的 NPC)
        this.maxDynamicNpcs = 5; // 周边最大动态 NPC 数量
        this.spawnDistance = 800; // 生成距离 (像素)
        this.despawnDistance = 1500; // 回收距离 (像素)

        // NPC 角色模板库 - 使用项目中实际存在的资源
        this.templates = [
            {
                role: '保洁员',
                sprite: 'Female_Cleaner_girl_idle_48x48',
                personality: '一个勤劳的保洁员，总是碎碎念哪里的地板不干净。',
                greetings: ['嘿，走路小心点，这地板我刚拖过！', '要是看到垃圾记得捡起来哦。', '唉，这办公室的人怎么这么多...']
            },
            {
                role: 'IT支援',
                sprite: 'Male_Adam_idle_48x48',
                personality: '冷静的技术宅，总是背着电脑。',
                greetings: ['重启试过了吗？', '我在等编译，正好出来转转。', '网络没问题吧？如果有问题别找我，找路由器。']
            },
            {
                role: '商务经理',
                sprite: 'Male_Conference_man_idle_48x48',
                personality: '总是很忙，在找人开会。',
                greetings: ['下午的会议你参加吗？', '帮我看看这个 PPT 逻辑对不对。', '咖啡...我需要更多的咖啡。']
            },
            {
                role: 'HR琳达',
                sprite: 'Female_Conference_woman_idle_48x48',
                personality: '优雅但充满威慑力，时刻观察着员工的状态。',
                greetings: ['今天的工作进度怎么样？', '别忘了提交下周的周报。', '欢迎来到 PixelDesk，加油。']
            }
        ];
    }

    /**
     * 初始化管理器
     */
    async init() {
        // 优先复用场景中已经定义好的物理组
        this.npcGroup = this.scene.npcGroup || this.scene.physics.add.group({ immovable: true });

        // 确保 NPC 进入其他玩家 group (为了兼容 Start.js 中的其他逻辑)
        if (!this.scene.otherPlayersGroup) {
            this.scene.otherPlayersGroup = this.scene.physics.add.group();
        }

        // 定时设置环境碰撞，确保图层已加载
        this.scene.time.delayedCall(1000, () => {
            if (this.scene.mapLayers) {
                const layers = [this.scene.mapLayers.office_1, this.scene.mapLayers.tree];
                layers.forEach(layer => {
                    if (layer) this.scene.physics.add.collider(this.npcGroup, layer);
                });
            }
            if (this.scene.deskColliders) {
                this.scene.physics.add.collider(this.npcGroup, this.scene.deskColliders);
            }
        });

        // 1. 加载服务器端的 NPC
        await this.loadAndCreateNpcs();
    }

    /**
     * 加载数据库中的所有活跃 NPC
     */
    async loadAndCreateNpcs() {
        try {
            const response = await fetch('/api/ai/npcs');
            const data = await response.json();
            const npcs = data.data || data.npcs;
            if (data.success && Array.isArray(npcs)) {
                for (const npcData of npcs) {
                    this.createAiNpc(npcData).then(npc => {
                        // 🔧 关键修复：如果是固定位置 NPC，不启动游荡逻辑
                        if (npc && !npcData.isFixed) {
                            this.startWandering(npc);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('🤖 [AiNpcManager] 加载 NPCs 失败:', error);
        }
    }

    startWandering(npc) {
        if (!npc || !npc.body) return;

        // 记录“家”的位置，用于约束范围（可选）
        const homeX = npc.x;
        const homeY = npc.y;

        const roamAction = () => {
            if (!npc.active || !npc.body) return;

            // 🔧 关键逻辑：如果正在与玩家碰撞（对话中），严禁启动新的走动任务
            if (npc.isColliding) {
                // 每隔 2 秒检查一次是否脱离碰撞
                this.scene.time.delayedCall(2000, roamAction);
                return;
            }

            // 随机做决定：60% 概率走动，40% 概率休息
            if (Phaser.Math.Between(0, 100) > 40) {
                // 随机选择一个方向
                const directions = ['up', 'down', 'left', 'right'];
                const direction = Phaser.Utils.Array.GetRandom(directions);
                const walkDuration = Phaser.Math.Between(1500, 4000);
                const speed = Phaser.Math.Between(40, 80); // 散步速度

                // 计算速度向量
                let vx = 0, vy = 0;
                if (direction === 'left') vx = -speed;
                else if (direction === 'right') vx = speed;
                else if (direction === 'up') vy = -speed;
                else if (direction === 'down') vy = speed;

                // 开始移动
                npc.body.setVelocity(vx, vy);
                if (npc.setDirectionFrame) npc.setDirectionFrame(direction);

                // 定时停止
                this.scene.time.delayedCall(walkDuration, () => {
                    if (npc.active && npc.body) {
                        npc.body.setVelocity(0, 0);
                        // 到了目的地，随机停顿 5-15 秒
                        this.scene.time.delayedCall(Phaser.Math.Between(5000, 15000), roamAction);
                    }
                });
            } else {
                // 休息状态
                this.scene.time.delayedCall(Phaser.Math.Between(5000, 10000), roamAction);
            }
        };

        // 首次启动延迟一点
        this.scene.time.delayedCall(Phaser.Math.Between(1000, 5000), roamAction);

        // 每帧同步 AI 图标
        this.scene.events.on('update', () => {
            if (npc.active && npc.aiIcon) {
                npc.aiIcon.x = npc.x + 25;
                npc.aiIcon.y = npc.y - 50;
            }
        });
    }


    /**
     * 创建单个 NPC 实体
     */
    async createAiNpc(npcData) {
        let { id, name, sprite, x, y, greeting, isFixed } = npcData;

        // 每次刷新给游荡 NPC 一个随机的初始位置偏移，让场景更有活力
        // 如果是固定位置 NPC（如咖啡师），则精准原位生成
        if (!isFixed) {
            x += Phaser.Math.Between(-150, 150);
            y += Phaser.Math.Between(-150, 150);
        }

        // 检查精灵
        const textureKey = sprite;
        // ... (保持精灵加载逻辑不变)
        if (!this.scene.textures.exists(textureKey)) {
            try {
                await new Promise((resolve, reject) => {
                    this.scene.load.spritesheet(textureKey, `/assets/characters/${sprite}.png`, {
                        frameWidth: 48, frameHeight: 48
                    });
                    this.scene.load.once('complete', resolve);
                    this.scene.load.once('loaderror', () => reject());
                    this.scene.load.start();
                });
            } catch (e) {
                console.warn(`🤖 NPC 精灵 ${sprite} 加载失败`);
                return null;
            }
        }

        const texture = this.scene.textures.get(textureKey);
        const frameCount = texture ? texture.frameTotal : 0;
        const isCompactFormat = frameCount <= 12 || sprite.includes('Premade');

        const npcCharacter = new Player(
            this.scene, x, y, textureKey,
            false, // enableMovement (这是针对键盘控制的)
            false, // enableStateSave
            true,  // isOtherPlayer
            {
                id: id.startsWith('npc_') ? id : `npc_${id}`,
                name: name,
                avatar: textureKey, // 添加头像字段，供 UI 显示
                currentStatus: {
                    type: 'available',
                    status: npcData.role || npcData.personality?.substring(0, 10) || 'AI助手',
                    emoji: '🤖',
                    message: greeting,
                    timestamp: new Date().toISOString()
                },
                isOnline: true
            },
            { isCompactFormat }
        );

        if (npcCharacter.body) {
            // NPC 的物理设定：Immovable 确保玩家撞不动 NPC
            // 恢复为与玩家一致的大碰撞箱 (40x60)，确保碰撞感扎实
            npcCharacter.body.setSize(40, 60);
            npcCharacter.body.setOffset(-20, -12);
            npcCharacter.body.setImmovable(true);
            npcCharacter.body.moves = true;
            npcCharacter.body.setCollideWorldBounds(true);
        }

        npcCharacter.setScale(0.8);
        npcCharacter.setDepth(1000);
        if (npcCharacter.setDirectionFrame) npcCharacter.setDirectionFrame('down');

        // 同时加入这两个 Group：
        // 1. npcGroup 用于环境碰撞（如撞墙）
        // 2. otherPlayersGroup 用于与主玩家的物理碰撞和对话交互
        if (this.npcGroup) this.npcGroup.add(npcCharacter);

        if (this.scene.otherPlayersGroup) {
            this.scene.otherPlayersGroup.add(npcCharacter);

            // 再次强化物理属性：确保在加入 Group 后，其 Immovable 状态仍为 true
            // 防止玩家推动 NPC
            if (npcCharacter.body) {
                npcCharacter.body.setImmovable(true);
            }

            // 触发 Start.js 里的检测器创建
            if (typeof this.scene.ensurePlayerCharacterOverlap === 'function') {
                this.scene.ensurePlayerCharacterOverlap();
            }
        }

        this.createAiIcon(npcCharacter, x, y);
        this.setupInteractions(npcCharacter);

        this.scene.add.existing(npcCharacter);
        this.npcs.set(id, npcCharacter);
        return npcCharacter;
    }

    createAiIcon(npcCharacter, x, y) {
        const aiIcon = this.scene.add.text(x + 25, y - 50, '🤖', { fontSize: '16px' });
        aiIcon.setOrigin(0.5);
        aiIcon.setDepth(1100);
        npcCharacter.aiIcon = aiIcon;
        this.scene.tweens.add({
            targets: aiIcon, y: '-=5', duration: 1000,
            ease: 'Sine.easeInOut', yoyo: true, repeat: -1
        });
    }

    /**
     * 更新动态 NPC (根据玩家位置生成/回收)
     */
    updateDynamicNpcs(playerX, playerY) {
        // 1. 回收过远的动态 NPC
        for (const [id, npc] of this.dynamicNpcs) {
            const distance = Phaser.Math.Distance.Between(playerX, playerY, npc.x, npc.y);
            if (distance > this.despawnDistance) {
                this.despawnNpc(id);
            }
        }

        // 2. 如果数量不足，尝试生成新 NPC
        if (this.dynamicNpcs.size < this.maxDynamicNpcs) {
            // 20% 的触发概率，避免刷新太密集
            if (Phaser.Math.Between(0, 100) < 20) {
                this.spawnRandomEncounter(playerX, playerY);
            }
        }
    }

    /**
     * 在玩家周边随机位置生成一个 NPC
     */
    async spawnRandomEncounter(playerX, playerY) {
        const template = Phaser.Utils.Array.GetRandom(this.templates);
        const id = `dynamic_${Date.now()}_${Phaser.Math.Between(1000, 9999)}`;

        // 随机在视野外的边缘生成 (800-1000像素距离)
        const angle = Math.random() * Math.PI * 2;
        const dist = Phaser.Math.Between(this.spawnDistance, this.spawnDistance + 200);
        const x = playerX + Math.cos(angle) * dist;
        const y = playerY + Math.sin(angle) * dist;

        const npcData = {
            id,
            name: `${template.role}`,
            sprite: template.sprite,
            x,
            y,
            greeting: Phaser.Utils.Array.GetRandom(template.greetings),
            isFixed: false,
            role: template.role
        };

        const npc = await this.createAiNpc(npcData);
        if (npc) {
            this.dynamicNpcs.set(id, npc);
            this.startWandering(npc);
            debugLog(`🤖 [AiNpcManager] 动态生成 NPC: ${id} (${template.role})`);
        }
    }

    /**
     * 回收/销毁 NPC
     */
    despawnNpc(id) {
        const npc = this.dynamicNpcs.get(id);
        if (npc) {
            if (npc.aiIcon) npc.aiIcon.destroy();
            this.npcs.delete(id);
            this.dynamicNpcs.delete(id);
            npc.destroy();
            debugLog(`🚮 [AiNpcManager] 回收动态 NPC: ${id}`);
        }
    }

    setupInteractions(npcCharacter) {
        npcCharacter.on('pointerover', () => {
            npcCharacter.setScale(0.85);
            this.scene.input.setDefaultCursor('pointer');
        });
        npcCharacter.on('pointerout', () => {
            npcCharacter.setScale(0.8);
            this.scene.input.setDefaultCursor('default');
        });
    }
}
