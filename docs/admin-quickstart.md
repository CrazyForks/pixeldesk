# 后台管理系统 - 快速启动指南

## 🚀 快速开始

### 1. 数据库同步

如果你是第一次运行，需要同步数据库：

```bash
npx prisma db push
```

### 2. 创建初始数据

运行 seed 脚本创建默认管理员和角色数据：

```bash
npx tsx prisma/seed-admin.ts
```

这将创建：
- 默认管理员：`admin` / `admin123`
- 21 个角色形象
- 默认工位配置

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问后台

打开浏览器访问：

```
http://localhost:3000/pixel-dashboard/login
```

使用默认账号登录：
- **用户名**: `admin`
- **密码**: `admin123`

---

## 📁 目录结构

```
/app/pixel-dashboard/                    # 后台管理页面
  /login/page.tsx              # 登录页 ✅
  /page.tsx                    # 仪表盘 ✅
  /players/                    # 玩家管理 🚧
  /characters/                 # 角色形象管理 🚧
  /workstations/               # 工位管理 🚧

/app/api/pixel-dashboard/                # 后台 API
  /auth/                       # 认证相关 ✅
  /players/                    # 玩家API 🚧
  /characters/                 # 角色API 🚧
  /workstations/               # 工位API 🚧

/components/pixel-dashboard/             # 后台组件
  /layout/Sidebar.tsx          # 侧边栏 ✅

/lib/pixel-dashboard/                    # 工具函数
  /auth.ts                     # 认证 ✅
  /permissions.ts              # 权限 ✅
  /logger.ts                   # 日志 ✅
```

---

## 🔐 权限系统

### 权限级别

1. **SUPER_ADMIN** (超级管理员)
   - 所有权限
   - 可以管理其他管理员

2. **ADMIN** (普通管理员)
   - 查看/编辑玩家
   - 创建/编辑/删除角色形象
   - 查看/编辑工位配置
   - 查看仪表盘

3. **VIEWER** (只读)
   - 只能查看数据
   - 不能修改任何内容

### 权限矩阵

| 功能 | SUPER_ADMIN | ADMIN | VIEWER |
|------|------------|-------|--------|
| 玩家查看 | ✅ | ✅ | ✅ |
| 玩家编辑 | ✅ | ✅ | ❌ |
| 角色查看 | ✅ | ✅ | ✅ |
| 角色创建 | ✅ | ✅ | ❌ |
| 角色编辑 | ✅ | ✅ | ❌ |
| 角色删除 | ✅ | ✅ | ❌ |
| 工位查看 | ✅ | ✅ | ✅ |
| 工位配置 | ✅ | ✅ | ❌ |
| 管理员管理 | ✅ | ❌ | ❌ |

---

## 📊 API 端点

### 认证相关

```typescript
// 登录
POST /api/pixel-dashboard/auth/login
Body: { username: string, password: string }

// 登出
POST /api/pixel-dashboard/auth/logout

// 获取当前管理员信息
GET /api/pixel-dashboard/auth/me
```

### 玩家管理（开发中）

```typescript
// 获取玩家列表
GET /api/pixel-dashboard/players
Query: { page, pageSize, search, isActive, sortBy, sortOrder }

// 获取玩家详情
GET /api/pixel-dashboard/players/[id]

// 编辑玩家
PATCH /api/pixel-dashboard/players/[id]
Body: { points?, characterId?, isActive? }

// 获取玩家积分历史
GET /api/pixel-dashboard/players/[id]/history
Query: { page, pageSize }
```

### 角色形象管理（开发中）

```typescript
// 获取角色列表
GET /api/pixel-dashboard/characters
Query: { page, pageSize, search, isActive, priceMin, priceMax }

// 创建角色
POST /api/pixel-dashboard/characters
Body: FormData (multipart/form-data)

// 获取角色详情
GET /api/pixel-dashboard/characters/[id]

// 编辑角色
PATCH /api/pixel-dashboard/characters/[id]
Body: FormData

// 删除角色
DELETE /api/pixel-dashboard/characters/[id]
```

### 工位管理（开发中）

```typescript
// 获取工位统计
GET /api/pixel-dashboard/workstations/stats

// 获取工位绑定列表
GET /api/pixel-dashboard/workstations/bindings
Query: { page, pageSize, search, status }

// 解绑工位
DELETE /api/pixel-dashboard/workstations/bindings/[id]

// 获取工位配置
GET /api/pixel-dashboard/workstations/config

// 更新工位配置
PUT /api/pixel-dashboard/workstations/config
Body: WorkstationConfigForm
```

---

## 🛠️ 开发指南

### 添加新页面

1. 在 `/app/pixel-dashboard/` 下创建新目录
2. 创建 `page.tsx` 文件
3. 在 `Sidebar.tsx` 中添加菜单项

例如：

```typescript
// /app/pixel-dashboard/settings/page.tsx
export default function SettingsPage() {
  return <div>系统设置</div>
}

// /components/pixel-dashboard/layout/Sidebar.tsx
const menuItems = [
  // ...
  {
    title: '系统设置',
    icon: '⚙️',
    href: '/pixel-dashboard/settings',
  },
]
```

### 添加新 API

1. 在 `/app/api/pixel-dashboard/` 下创建路由
2. 使用 `requirePermission` 验证权限
3. 使用 `logAdminAction` 记录操作

例如：

```typescript
// /app/api/pixel-dashboard/example/route.ts
import { requirePermission } from '@/lib/pixel-dashboard/permissions'
import { logAdminAction } from '@/lib/pixel-dashboard/logger'

export async function POST(request: Request) {
  const admin = await requirePermission('example.create')

  // ... 业务逻辑 ...

  await logAdminAction({
    adminId: admin.id,
    action: 'CREATE',
    resource: 'Example',
    resourceId: result.id,
    details: { /* ... */ }
  })

  return NextResponse.json({ success: true, data: result })
}
```

### 权限检查

```typescript
// 在 API 路由中
import { requirePermission } from '@/lib/pixel-dashboard/permissions'

// 要求特定权限
const admin = await requirePermission('characters.delete')

// 只要求管理员身份
const admin = await requireAdmin()
```

---

## 🧪 测试

### 测试登录

```bash
curl -X POST http://localhost:3000/api/pixel-dashboard/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 测试认证

```bash
# 需要先登录获取 cookie
curl http://localhost:3000/api/pixel-dashboard/auth/me \
  -H "Cookie: admin-token=YOUR_TOKEN"
```

---

## 🔧 配置

### 环境变量

确保 `.env` 文件包含：

```env
# 数据库
DATABASE_URL="postgresql://..."

# JWT 密钥
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"

# 站点URL
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## 📝 日志

### 查看操作日志

所有管理员操作都会记录到 `admin_logs` 表中：

```sql
SELECT
  al.*,
  a.username
FROM admin_logs al
JOIN admins a ON al."adminId" = a.id
ORDER BY al."createdAt" DESC
LIMIT 50;
```

### 日志字段

- `action`: CREATE, UPDATE, DELETE, VIEW
- `resource`: 资源类型（Player, Character, WorkstationConfig）
- `resourceId`: 资源ID
- `details`: JSON 详细信息
- `ipAddress`: IP 地址
- `userAgent`: 浏览器信息

---

## ❓ 常见问题

### Q: 忘记管理员密码怎么办？

A: 运行以下脚本重置密码：

```bash
npx tsx prisma/seed-admin.ts
```

这会重置 `admin` 账号的密码为 `admin123`

### Q: 如何创建新管理员？

A: 使用 Prisma Studio 或者运行 TypeScript 脚本：

```typescript
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const password = await bcrypt.hash('new-password', 10)
await prisma.admin.create({
  data: {
    username: 'newadmin',
    email: 'newadmin@example.com',
    password,
    role: 'ADMIN'
  }
})
```

### Q: 如何查看所有角色形象？

A: 访问 Prisma Studio：

```bash
npx prisma studio
```

然后打开 `Character` 表

---

## 📚 相关文档

- [完整开发方案](./pixel-dashboard-dashboard-design.md)
- [开发进度](./pixel-dashboard-progress.md)
- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js 文档](https://nextjs.org/docs)

---

## 🆘 获取帮助

如果遇到问题：

1. 检查控制台错误信息
2. 查看 `admin_logs` 表
3. 检查环境变量配置
4. 参考完整开发方案文档

---

更新时间：2025-11-07
