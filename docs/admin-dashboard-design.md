# PixelDesk 后台管理系统开发方案

## 1. 项目概述

### 1.1 目标
开发一个功能完善的后台管理系统，用于管理 PixelDesk 游戏的核心数据，包括玩家、角色形象、工位配置等，并为未来的形象商店功能做好技术准备。

### 1.2 核心价值
- **集中管理**：统一管理玩家数据、角色形象资源和工位配置
- **数据可视化**：直观展示玩家活跃度、积分分布等关键指标
- **动态配置**：支持动态调整积分规则、工位数量等游戏参数
- **资源管理**：统一管理角色形象资源，为形象商店奠定基础
- **权限控制**：确保只有授权管理员可以访问和修改数据

---

## 2. 技术架构

### 2.1 技术栈
- **前端框架**: Next.js 14 (App Router)
- **UI 组件库**: Tailwind CSS + Shadcn/ui
- **状态管理**: React Hooks + Context API
- **表单处理**: React Hook Form + Zod
- **表格组件**: TanStack Table (React Table v8)
- **图表库**: Recharts
- **认证**: NextAuth.js v5
- **后端**: Next.js API Routes
- **数据库**: Prisma + PostgreSQL
- **文件上传**: Uploadthing 或 本地存储

### 2.2 项目结构
```
/app/admin                    # 后台管理系统根目录
  /layout.tsx                 # 后台布局（侧边栏、顶栏）
  /page.tsx                   # 仪表盘首页
  /login/page.tsx             # 管理员登录页
  /players                    # 玩家管理模块
    /page.tsx                 # 玩家列表
    /[id]/page.tsx            # 玩家详情
  /characters                 # 角色形象管理模块
    /page.tsx                 # 形象列表
    /create/page.tsx          # 创建形象
    /[id]/edit/page.tsx       # 编辑形象
  /workstations               # 工位管理模块
    /page.tsx                 # 工位配置
    /settings/page.tsx        # 积分规则配置
  /settings                   # 系统设置
    /page.tsx                 # 全局设置

/components/admin             # 后台专用组件
  /layout/
    /Sidebar.tsx              # 侧边栏导航
    /TopBar.tsx               # 顶部导航栏
  /charts/
    /PlayerActivityChart.tsx  # 玩家活跃度图表
    /PointsDistribution.tsx   # 积分分布图表
  /tables/
    /PlayerTable.tsx          # 玩家表格
    /CharacterTable.tsx       # 角色形象表格
  /forms/
    /CharacterForm.tsx        # 角色形象表单
    /WorkstationForm.tsx      # 工位配置表单

/lib/admin                    # 后台专用工具
  /auth.ts                    # 管理员认证逻辑
  /permissions.ts             # 权限控制
  /validations.ts             # 数据验证规则

/prisma/schema.prisma         # 数据库模型（扩展）
```

---

## 3. 数据库设计

### 3.1 新增表结构

#### Admin 表（管理员）
```prisma
model Admin {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  password      String   // bcrypt 加密
  role          AdminRole @default(ADMIN)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  isActive      Boolean  @default(true)
}

enum AdminRole {
  SUPER_ADMIN   // 超级管理员，所有权限
  ADMIN         // 普通管理员，大部分权限
  VIEWER        // 只读权限
}
```

#### Character 表（角色形象）
```prisma
model Character {
  id              String   @id @default(cuid())
  name            String   @unique // 例如 'hangli', 'Premade_Character_48x48_01'
  displayName     String   // 显示名称，例如 '寒黎', '角色01'
  description     String?  // 描述
  imageUrl        String   // 图片存储路径
  frameWidth      Int      @default(48)
  frameHeight     Int      @default(48)
  totalFrames     Int      @default(8)
  isCompactFormat Boolean  @default(false) // 是否为紧凑格式（2行4列）
  price           Int      @default(0) // 积分价格，0表示免费
  isDefault       Boolean  @default(false) // 是否为默认角色
  isActive        Boolean  @default(true) // 是否启用
  sortOrder       Int      @default(0) // 排序顺序
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 使用该角色的玩家
  players         Player[] @relation("PlayerCharacter")
}
```

#### WorkstationConfig 表（工位配置）
```prisma
model WorkstationConfig {
  id                    String   @id @default(cuid())
  totalWorkstations     Int      @default(1000) // 总工位数
  bindingCost           Int      @default(10) // 绑定工位消耗积分
  renewalCost           Int      @default(5) // 续期工位消耗积分
  unbindingRefund       Int      @default(5) // 解绑退还积分
  teleportCost          Int      @default(2) // 传送消耗积分
  defaultDuration       Int      @default(24) // 默认绑定时长（小时）
  maxBindingsPerUser    Int      @default(1) // 每个用户最多绑定工位数
  updatedAt             DateTime @updatedAt
  updatedBy             String?  // 更新者ID
}
```

### 3.2 扩展现有表结构

#### Player 表扩展
```prisma
model Player {
  // ... 现有字段 ...

  // 新增字段
  characterId     String?
  character       Character? @relation("PlayerCharacter", fields: [characterId], references: [id])
  totalPlayTime   Int       @default(0) // 总游戏时长（分钟）
  lastActiveAt    DateTime? // 最后活跃时间
  isActive        Boolean   @default(true) // 是否活跃
}
```

---

## 4. 功能模块详细设计

### 4.1 认证与权限系统

#### 4.1.1 登录流程
```
1. 管理员访问 /admin -> 检查登录状态
2. 未登录 -> 重定向到 /admin/login
3. 输入用户名/密码 -> 调用 /api/admin/auth/login
4. 验证成功 -> 创建 session -> 跳转到仪表盘
5. 验证失败 -> 显示错误信息
```

#### 4.1.2 权限控制
```typescript
// 权限矩阵
const PERMISSIONS = {
  SUPER_ADMIN: ['*'], // 所有权限
  ADMIN: [
    'players.view',
    'players.edit',
    'characters.view',
    'characters.create',
    'characters.edit',
    'characters.delete',
    'workstations.view',
    'workstations.edit',
  ],
  VIEWER: [
    'players.view',
    'characters.view',
    'workstations.view',
  ],
}
```

#### 4.1.3 中间件保护
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const session = await getServerSession()
    if (!session?.user?.isAdmin) {
      return NextResponse.redirect('/admin/login')
    }
  }
}
```

---

### 4.2 玩家管理模块

#### 4.2.1 玩家列表页 (`/admin/players`)

**功能需求**:
- 表格展示所有玩家
- 支持分页（每页 20/50/100 条）
- 支持搜索（用户名、ID）
- 支持筛选（活跃状态、注册时间范围）
- 支持排序（注册时间、积分、游戏时长）

**表格字段**:
| 字段 | 说明 | 显示 |
|------|------|------|
| ID | 玩家ID | 前8位 + ... |
| 头像 | 角色形象预览 | 48x48 图片 |
| 用户名 | 玩家名称 | 文本 |
| 角色形象 | 使用的形象名称 | 文本链接 |
| 积分 | 当前积分 | 数字 |
| 游戏时长 | 总时长 | XX小时XX分钟 |
| 注册时间 | createdAt | YYYY-MM-DD HH:mm |
| 最后活跃 | lastActiveAt | 相对时间 |
| 状态 | 是否活跃 | 徽章 |
| 操作 | 按钮组 | 查看/编辑/禁用 |

**API 端点**:
```
GET /api/admin/players
Query参数:
  - page: number (页码)
  - pageSize: number (每页数量)
  - search: string (搜索关键词)
  - isActive: boolean (活跃状态)
  - sortBy: string (排序字段)
  - sortOrder: 'asc' | 'desc'

Response:
{
  data: Player[],
  pagination: {
    total: number,
    page: number,
    pageSize: number,
    totalPages: number
  }
}
```

#### 4.2.2 玩家详情页 (`/admin/players/[id]`)

**功能需求**:
- 查看玩家完整信息
- 查看玩家当前绑定的工位
- 查看玩家的积分变动历史
- 查看玩家的游戏时长统计（按天）
- 查看玩家使用的角色形象（大图预览）
- 管理员操作：
  - 修改积分
  - 修改角色形象
  - 禁用/启用账户
  - 解绑工位

**展示区块**:
1. **基本信息卡片**
   - 角色形象大图
   - 用户名、ID
   - 注册时间、最后活跃时间
   - 账户状态

2. **统计数据卡片**
   - 当前积分
   - 总游戏时长
   - 绑定工位数
   - 角色形象名称

3. **积分历史表格**
   - 时间、操作类型、变动金额、余额、备注

4. **游戏时长图表**
   - 近30天游戏时长折线图

**API 端点**:
```
GET /api/admin/players/[id]
Response: Player 详细信息

PATCH /api/admin/players/[id]
Body: { points?: number, characterId?: string, isActive?: boolean }

GET /api/admin/players/[id]/history
Query: page, pageSize
Response: { data: PointHistory[], pagination }
```

---

### 4.3 角色形象管理模块

#### 4.3.1 形象列表页 (`/admin/characters`)

**功能需求**:
- 网格/列表视图切换
- 显示形象预览图
- 支持搜索（名称、ID）
- 支持筛选（格式类型、启用状态、价格范围）
- 支持拖拽排序
- 批量操作（启用/禁用、删除）

**网格卡片显示**:
- 角色预览图（4个方向的帧组合显示）
- 显示名称
- 价格标签（积分）
- 状态徽章（启用/禁用、默认）
- 使用人数统计
- 操作按钮（编辑、删除、预览）

**API 端点**:
```
GET /api/admin/characters
Query参数:
  - page, pageSize
  - search: string
  - isActive: boolean
  - isCompactFormat: boolean
  - priceMin, priceMax: number
  - sortBy, sortOrder

Response: { data: Character[], pagination }

DELETE /api/admin/characters/[id]
POST /api/admin/characters/batch
Body: { action: 'enable' | 'disable' | 'delete', ids: string[] }
```

#### 4.3.2 创建形象页 (`/admin/characters/create`)

**功能需求**:
- 表单上传角色图片
- 自动检测图片尺寸
- 自动判断格式类型（标准/紧凑）
- 预览四个方向的帧
- 设置基本信息
- 设置积分价格

**表单字段**:
```typescript
interface CharacterFormData {
  name: string              // 唯一标识（如 'hangli'）
  displayName: string       // 显示名称（如 '寒黎'）
  description?: string      // 描述
  imageFile: File          // 上传的图片文件
  frameWidth: number       // 帧宽度（默认48）
  frameHeight: number      // 帧高度（默认48）
  isCompactFormat: boolean // 是否紧凑格式
  price: number            // 积分价格
  isDefault: boolean       // 是否默认角色
  isActive: boolean        // 是否启用
  sortOrder: number        // 排序
}
```

**上传流程**:
```
1. 选择图片文件
2. 前端验证：
   - 文件类型（PNG）
   - 文件大小（< 5MB）
   - 图片尺寸（宽度必须是48的倍数）
3. 预览上传：显示4个方向的帧
4. 填写表单信息
5. 提交：
   - 上传图片到 /public/assets/characters/
   - 保存数据到数据库
6. 成功后跳转到列表页
```

**API 端点**:
```
POST /api/admin/characters
Body: FormData (multipart/form-data)
  - imageFile: File
  - 其他字段: JSON string

Response: { success: boolean, data: Character }
```

#### 4.3.3 编辑形象页 (`/admin/characters/[id]/edit`)

**功能需求**:
- 加载现有数据
- 支持更换图片
- 支持修改所有字段
- 预览更新后的效果
- 显示使用该形象的玩家数量（无法删除正在使用的形象）

**API 端点**:
```
GET /api/admin/characters/[id]
Response: Character

PATCH /api/admin/characters/[id]
Body: FormData (允许部分更新)

GET /api/admin/characters/[id]/usage
Response: { playerCount: number, canDelete: boolean }
```

---

### 4.4 工位管理模块

#### 4.4.1 工位配置页 (`/admin/workstations`)

**功能需求**:
- 查看当前工位统计
- 查看工位占用情况（可视化）
- 查看绑定历史记录
- 批量操作（批量解绑）

**统计卡片**:
- 总工位数
- 已绑定数量
- 可用数量
- 占用率（饼图）

**绑定列表表格**:
| 字段 | 说明 |
|------|------|
| 工位ID | 工位编号 |
| 绑定玩家 | 用户名 + 链接 |
| 绑定时间 | 时间戳 |
| 到期时间 | 时间戳 |
| 状态 | 正常/即将过期 |
| 操作 | 解绑 |

**API 端点**:
```
GET /api/admin/workstations/stats
Response: {
  total: number,
  occupied: number,
  available: number,
  occupancyRate: number
}

GET /api/admin/workstations/bindings
Query: page, pageSize, search, status
Response: { data: WorkstationBinding[], pagination }

DELETE /api/admin/workstations/bindings/[id]
POST /api/admin/workstations/bindings/batch-unbind
Body: { ids: string[] }
```

#### 4.4.2 积分规则配置页 (`/admin/workstations/settings`)

**功能需求**:
- 配置各项积分规则
- 实时预览规则变化
- 显示修改历史
- 需要二次确认（防止误操作）

**配置表单**:
```typescript
interface WorkstationConfigForm {
  totalWorkstations: number      // 总工位数
  bindingCost: number            // 绑定消耗
  renewalCost: number            // 续期消耗
  unbindingRefund: number        // 解绑退还
  teleportCost: number           // 传送消耗
  defaultDuration: number        // 默认时长（小时）
  maxBindingsPerUser: number     // 每人最多绑定数
}
```

**API 端点**:
```
GET /api/admin/workstations/config
Response: WorkstationConfig

PUT /api/admin/workstations/config
Body: WorkstationConfigForm
Response: { success: boolean, data: WorkstationConfig }

GET /api/admin/workstations/config/history
Response: ConfigHistory[]
```

---

### 4.5 仪表盘（Dashboard）

#### 4.5.1 统计卡片
- 总玩家数（+本周新增）
- 活跃玩家数（+环比）
- 总角色形象数
- 工位占用率

#### 4.5.2 图表
- 玩家注册趋势（近30天折线图）
- 玩家活跃度分布（按最后活跃时间）
- 积分分布直方图
- 热门角色形象排行（Top 10）

#### 4.5.3 快捷操作
- 创建新角色形象
- 查看待审核内容
- 查看系统日志

**API 端点**:
```
GET /api/admin/dashboard/stats
Response: {
  totalPlayers: number,
  newPlayersThisWeek: number,
  activePlayers: number,
  totalCharacters: number,
  workstationOccupancy: number
}

GET /api/admin/dashboard/charts
Response: {
  registrationTrend: { date: string, count: number }[],
  activityDistribution: { range: string, count: number }[],
  pointsDistribution: { range: string, count: number }[],
  topCharacters: { name: string, count: number }[]
}
```

---

## 5. 前端改造计划

### 5.1 角色形象数据源改造

#### 5.1.1 现状分析
当前冗余位置：
1. `/components/CharacterCreationModal.tsx` - 角色选择列表
2. `/lib/tempPlayerManager.ts` - 随机角色生成
3. `/app/api/player/route.ts` - 角色验证
4. `/PixelDesk/src/scenes/Start.js` - 资源加载列表

#### 5.1.2 改造方案

**创建统一的角色形象服务**:
```typescript
// /lib/services/characterService.ts
export class CharacterService {
  /**
   * 获取可用角色列表（前端用）
   */
  static async getAvailableCharacters(params?: {
    page?: number
    pageSize?: number
    priceMax?: number  // 用户积分限制
  }): Promise<{
    data: Character[]
    pagination: Pagination
  }>

  /**
   * 获取角色详情
   */
  static async getCharacterById(id: string): Promise<Character>

  /**
   * 验证角色是否可用
   */
  static async validateCharacter(name: string): Promise<boolean>

  /**
   * 获取随机角色（用于临时玩家）
   */
  static async getRandomCharacter(): Promise<Character>
}
```

**新增 API 端点**:
```
GET /api/characters
Query: page, pageSize, priceMax, isActive=true
Response: { data: Character[], pagination }

GET /api/characters/[name]
Response: Character
```

**修改各文件**:

1. **CharacterCreationModal.tsx**
```typescript
// 改造前
const characterSprites = ['hangli', 'Premade_Character_48x48_01', ...]

// 改造后
const [characters, setCharacters] = useState<Character[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadCharacters() {
    const { data } = await fetch('/api/characters?pageSize=100').then(r => r.json())
    setCharacters(data)
    setLoading(false)
  }
  loadCharacters()
}, [])
```

2. **Start.js (Phaser)**
```javascript
// 改造前
const characterAssets = ['hangli.png', 'Premade_Character_48x48_01.png', ...]

// 改造后
async preload() {
  // 1. 先加载基础资源
  this.loadTilemap()
  this.loadTilesetImages()

  // 2. 从API获取角色列表
  const response = await fetch('/api/characters?pageSize=1000')
  const { data: characters } = await response.json()

  // 3. 动态加载角色资源
  characters.forEach(character => {
    const filename = character.name + '.png'
    const key = character.name
    this.load.spritesheet(key, `/assets/characters/${filename}`, {
      frameWidth: character.frameWidth,
      frameHeight: character.frameHeight
    })
  })

  // 4. 保存角色配置到场景
  this.characterConfigs = new Map(
    characters.map(c => [c.name, {
      isCompactFormat: c.isCompactFormat,
      totalFrames: c.totalFrames
    }])
  )
}
```

3. **Player.js**
```javascript
// 改造前
this.isCompactFormat = this.spriteKey === 'hangli'

// 改造后
constructor(scene, x, y, spriteKey, ...) {
  // 从场景获取角色配置
  const characterConfig = scene.characterConfigs?.get(spriteKey)
  this.isCompactFormat = characterConfig?.isCompactFormat || false
  this.totalFrames = characterConfig?.totalFrames || 8
}
```

4. **tempPlayerManager.ts**
```typescript
// 改造前
const characters = ['hangli', 'Premade_Character_48x48_01', ...]

// 改造后
async function generateRandomCharacter(): Promise<string> {
  const character = await CharacterService.getRandomCharacter()
  return character.name
}
```

---

## 6. 形象商店功能准备

### 6.1 数据库扩展

```prisma
// 用户购买记录
model CharacterPurchase {
  id          String    @id @default(cuid())
  playerId    String
  player      Player    @relation(fields: [playerId], references: [id])
  characterId String
  character   Character @relation(fields: [characterId], references: [id])
  price       Int       // 购买时的价格
  purchasedAt DateTime  @default(now())

  @@unique([playerId, characterId]) // 同一角色只能购买一次
}

// Player 表扩展
model Player {
  // ... 现有字段 ...
  ownedCharacters CharacterPurchase[] // 拥有的角色形象
}
```

### 6.2 前端商店页面（未来开发）

**页面路径**: `/shop/characters`

**功能需求**:
- 展示所有可购买角色形象
- 筛选：价格范围、已拥有/未拥有
- 预览角色动画
- 显示价格和拥有状态
- 购买功能（扣除积分）
- 我的收藏

**API 端点（预留）**:
```
GET /api/shop/characters
Response: Character[] (包含 isPurchased 字段)

POST /api/shop/characters/[id]/purchase
Response: { success: boolean, remainingPoints: number }

GET /api/shop/characters/owned
Response: Character[] (用户拥有的角色)
```

---

## 7. 开发计划

### 7.1 第一阶段：基础架构（2-3天）
- [ ] 数据库 Schema 设计和迁移
- [ ] 管理员认证系统实现
- [ ] 后台布局和路由搭建
- [ ] 权限中间件开发
- [ ] 基础 UI 组件封装

### 7.2 第二阶段：核心功能（4-5天）
- [ ] 玩家管理模块
  - [ ] 玩家列表页
  - [ ] 玩家详情页
  - [ ] API 实现
- [ ] 角色形象管理模块
  - [ ] 形象列表页
  - [ ] 创建形象功能
  - [ ] 编辑形象功能
  - [ ] 图片上传处理
  - [ ] API 实现
- [ ] 工位管理模块
  - [ ] 工位统计页
  - [ ] 积分规则配置
  - [ ] API 实现

### 7.3 第三阶段：前端改造（2-3天）
- [ ] 创建 CharacterService
- [ ] 改造 CharacterCreationModal
- [ ] 改造 Phaser Start.js 资源加载
- [ ] 改造 Player.js 格式检测
- [ ] 改造 tempPlayerManager
- [ ] 创建 /api/characters 端点
- [ ] 测试所有改动

### 7.4 第四阶段：仪表盘和优化（2天）
- [ ] 仪表盘统计卡片
- [ ] 仪表盘图表实现
- [ ] 性能优化
- [ ] 错误处理完善
- [ ] 日志记录

### 7.5 第五阶段：测试和部署（1-2天）
- [ ] 单元测试
- [ ] 集成测试
- [ ] 用户测试
- [ ] 文档完善
- [ ] 部署上线

**总预计时间**: 11-15 天

---

## 8. 技术细节

### 8.1 文件上传处理

**方案选择**: 本地文件系统存储

**流程**:
```typescript
// /app/api/admin/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // 验证
  if (!file.type.startsWith('image/png')) {
    return NextResponse.json({ error: 'Only PNG files allowed' }, { status: 400 })
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }

  // 生成唯一文件名
  const fileName = `${Date.now()}-${file.name}`
  const filePath = path.join(process.cwd(), 'public/assets/characters', fileName)

  // 保存文件
  const buffer = Buffer.from(await file.arrayBuffer())
  await fs.writeFile(filePath, buffer)

  // 返回相对路径
  return NextResponse.json({
    url: `/assets/characters/${fileName}`,
    fileName
  })
}
```

### 8.2 图片尺寸验证

```typescript
import sharp from 'sharp'

async function validateSpriteSheet(filePath: string) {
  const metadata = await sharp(filePath).metadata()

  if (!metadata.width || !metadata.height) {
    throw new Error('Invalid image file')
  }

  // 检查宽度必须是48的倍数
  if (metadata.width % 48 !== 0) {
    throw new Error('Image width must be multiple of 48')
  }

  // 检查高度必须是48或96
  if (![48, 96].includes(metadata.height)) {
    throw new Error('Image height must be 48 or 96')
  }

  // 判断格式类型
  const isCompactFormat = metadata.height === 96
  const totalFrames = (metadata.width / 48) * (metadata.height / 48)

  return {
    width: metadata.width,
    height: metadata.height,
    frameWidth: 48,
    frameHeight: 48,
    totalFrames,
    isCompactFormat
  }
}
```

### 8.3 权限控制实现

```typescript
// /lib/admin/permissions.ts
import { getServerSession } from 'next-auth'

export async function requireAdmin() {
  const session = await getServerSession()

  if (!session?.user?.isAdmin) {
    throw new Error('Unauthorized')
  }

  return session.user
}

export async function requirePermission(permission: string) {
  const user = await requireAdmin()
  const userPermissions = PERMISSIONS[user.role] || []

  if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

// 在 API 路由中使用
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await requirePermission('characters.delete')

  // ... 删除逻辑
}
```

### 8.4 分页组件封装

```typescript
// /components/admin/Pagination.tsx
interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function Pagination({ ... }: PaginationProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-700">
        显示第 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, totalItems)} 条，
        共 {totalItems} 条记录
      </div>

      <div className="flex items-center gap-2">
        <Select value={pageSize} onValueChange={onPageSizeChange}>
          <option value={20}>20 条/页</option>
          <option value={50}>50 条/页</option>
          <option value={100}>100 条/页</option>
        </Select>

        <Button disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          上一页
        </Button>

        <span className="px-4">{currentPage} / {totalPages}</span>

        <Button disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          下一页
        </Button>
      </div>
    </div>
  )
}
```

---

## 9. 安全考虑

### 9.1 认证安全
- 密码使用 bcrypt 加密（salt rounds: 10）
- Session 使用 HTTP-only cookies
- 实现 CSRF 保护
- 设置 session 过期时间（24小时）
- 记录登录日志

### 9.2 数据验证
- 所有输入使用 Zod 进行验证
- API 层和数据库层双重验证
- 文件上传白名单验证
- SQL 注入防护（使用 Prisma）

### 9.3 权限控制
- 基于角色的访问控制（RBAC）
- 敏感操作需要二次确认
- 操作日志记录
- 定期权限审计

### 9.4 文件上传安全
- 限制文件类型（仅 PNG）
- 限制文件大小（5MB）
- 文件名随机化
- 存储在 public 外的目录（或使用 CDN）
- 病毒扫描（可选）

---

## 10. 性能优化

### 10.1 数据库优化
```prisma
// 添加必要的索引
model Character {
  // ...
  @@index([isActive, sortOrder])
  @@index([price])
  @@index([createdAt])
}

model Player {
  // ...
  @@index([isActive, createdAt])
  @@index([lastActiveAt])
  @@index([characterId])
}
```

### 10.2 缓存策略
```typescript
// 角色列表缓存（60分钟）
export const revalidate = 3600

// API 响应缓存
export async function GET(request: Request) {
  const characters = await getCachedCharacters()

  return NextResponse.json(characters, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  })
}
```

### 10.3 图片优化
- 使用 Next.js Image 组件
- 实现懒加载
- 生成不同尺寸的缩略图
- 考虑 WebP 格式转换

### 10.4 表格优化
- 虚拟滚动（大量数据）
- 服务端分页
- 防抖搜索输入
- 骨架屏加载状态

---

## 11. 监控和日志

### 11.1 操作日志
```prisma
model AdminLog {
  id          String   @id @default(cuid())
  adminId     String
  admin       Admin    @relation(fields: [adminId], references: [id])
  action      String   // 'CREATE', 'UPDATE', 'DELETE'
  resource    String   // 'Player', 'Character', 'WorkstationConfig'
  resourceId  String?
  details     Json?    // 详细信息
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([adminId, createdAt])
  @@index([resource, createdAt])
}
```

### 11.2 监控指标
- API 响应时间
- 错误率
- 登录成功/失败次数
- 文件上传成功率
- 数据库查询性能

---

## 12. 未来扩展

### 12.1 短期（1-3个月）
- [ ] 形象商店功能上线
- [ ] 角色形象预览动画
- [ ] 批量导入角色工具
- [ ] 数据导出功能（CSV/Excel）
- [ ] 高级搜索和筛选

### 12.2 中期（3-6个月）
- [ ] 角色形象版本管理
- [ ] A/B 测试功能
- [ ] 用户反馈系统
- [ ] 自动化报表
- [ ] 移动端适配

### 12.3 长期（6-12个月）
- [ ] 机器学习推荐系统
- [ ] 用户行为分析
- [ ] 实时监控大屏
- [ ] 多语言支持
- [ ] 微服务架构拆分

---

## 13. 附录

### 13.1 UI 设计参考
- 布局：Vercel Dashboard, Railway Dashboard
- 表格：Shadcn Table, TanStack Table
- 图表：Tremor, Recharts
- 配色：Tailwind CSS 默认调色板

### 13.2 相关资源
- Next.js 文档: https://nextjs.org/docs
- Prisma 文档: https://www.prisma.io/docs
- Shadcn/ui: https://ui.shadcn.com
- TanStack Table: https://tanstack.com/table

### 13.3 团队协作
- 代码规范：ESLint + Prettier
- Git 工作流：Feature Branch + PR
- 提交规范：Conventional Commits
- 文档更新：与代码同步更新

---

## 变更记录

| 版本 | 日期 | 作者 | 变更内容 |
|------|------|------|----------|
| v1.0 | 2025-11-07 | - | 初始版本 |

---

**文档状态**: 设计完成，待评审
**下一步**: 评审通过后开始第一阶段开发
