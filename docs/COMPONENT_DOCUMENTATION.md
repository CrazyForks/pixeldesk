# 碰撞交互系统组件文档

本文档详细介绍了碰撞交互系统中各个组件的接口、使用方法和最佳实践。

## 目录

- [LayoutManager 布局管理器](#layoutmanager-布局管理器)
- [TabManager 标签页管理器](#tabmanager-标签页管理器)
- [PlayerInteractionPanel 玩家交互面板](#playerinteractionpanel-玩家交互面板)
- [EventBus 事件总线](#eventbus-事件总线)
- [Phaser 碰撞系统](#phaser-碰撞系统)

---

## LayoutManager 布局管理器

### 概述

`LayoutManager` 是一个响应式布局管理组件，负责在不同设备和屏幕尺寸下自动调整游戏区域和信息面板的布局。

### 接口定义

```typescript
interface LayoutManagerProps {
  /** 游戏组件，显示在主要区域 */
  gameComponent: ReactNode
  /** 信息面板组件，显示在侧边区域 */
  infoPanel: ReactNode
  /** 可选的CSS类名，用于自定义样式 */
  className?: string
  /** 布局变化时的回调函数 */
  onLayoutChange?: (deviceType: DeviceType) => void
}

type DeviceType = 'mobile' | 'tablet' | 'desktop'
type Orientation = 'portrait' | 'landscape'
```

### 使用示例

```tsx
import LayoutManager from '@/components/LayoutManager'
import PhaserGame from '@/components/PhaserGame'
import InfoPanel from '@/components/InfoPanel'

function App() {
  const handleLayoutChange = (deviceType: DeviceType) => {
    console.log('Layout changed to:', deviceType)
    // 可以在这里处理布局变化逻辑
  }

  return (
    <LayoutManager
      gameComponent={<PhaserGame />}
      infoPanel={<InfoPanel />}
      onLayoutChange={handleLayoutChange}
      className="custom-layout"
    />
  )
}
```

### 响应式断点

| 设备类型 | 屏幕宽度 | 布局特点 |
|---------|---------|---------|
| Mobile | < 640px | 竖屏：上下布局；横屏：左右布局（如果宽度足够） |
| Tablet | 640px - 1024px | 左右布局，信息面板较窄 |
| Desktop | > 1024px | 左右布局，信息面板完整宽度 |

### 配置选项

```typescript
const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280
} as const

const ANIMATION_CONFIG = {
  transitionDuration: 300,
  debounceDelay: 150,
  resizeThreshold: 50
} as const
```

---

## TabManager 标签页管理器

### 概述

`TabManager` 管理信息面板中的标签页系统，支持自动切换、动画效果和碰撞检测触发的标签页切换。

### 接口定义

```typescript
interface TabManagerProps {
  tabs: TabType[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  collisionPlayer?: any
  className?: string
  isMobile?: boolean
  isTablet?: boolean
}

interface TabType {
  id: string
  label: string
  icon: string
  component: ComponentType<any>
  badge?: number
  autoSwitch?: boolean
  priority?: number
}
```

### 使用示例

```tsx
import TabManager from '@/components/TabManager'
import StatusInfoTab from '@/components/tabs/StatusInfoTab'
import PlayerInteractionTab from '@/components/tabs/PlayerInteractionTab'

const tabs: TabType[] = [
  {
    id: 'status-info',
    label: '状态信息',
    icon: '📊',
    component: StatusInfoTab,
    priority: 1
  },
  {
    id: 'player-interaction',
    label: '玩家交互',
    icon: '👥',
    component: PlayerInteractionTab,
    autoSwitch: true,
    priority: 2
  }
]

function InfoPanel() {
  const [activeTab, setActiveTab] = useState('status-info')
  const [collisionPlayer, setCollisionPlayer] = useState(null)

  return (
    <TabManager
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      collisionPlayer={collisionPlayer}
    />
  )
}
```

### 事件处理

TabManager 自动监听以下事件：

- `player:collision:start` - 玩家碰撞开始
- `player:collision:end` - 玩家碰撞结束
- `player:click` - 玩家点击事件

### 自动切换逻辑

1. **碰撞检测触发**：自动切换到 `player-interaction` 标签页
2. **碰撞结束**：自动切换回默认标签页
3. **优先级处理**：碰撞事件优先于点击事件

---

## PlayerInteractionPanel 玩家交互面板

### 概述

`PlayerInteractionPanel` 显示玩家详细信息并提供快速交互功能，包括聊天、关注、查看详情等操作。

### 接口定义

```typescript
interface PlayerInteractionPanelProps {
  player: PlayerData
  onSendMessage?: (message: string) => void
  onFollow?: (playerId: string) => void
  onViewProfile?: (playerId: string) => void
  className?: string
  isMobile?: boolean
  isTablet?: boolean
}

interface PlayerData {
  id: string
  name: string
  avatar?: string
  currentStatus?: StatusData
  isOnline: boolean
  lastSeen?: string
}

interface StatusData {
  type: string
  status: string
  emoji?: string
  message?: string
  timestamp: string
}
```

### 使用示例

```tsx
import PlayerInteractionPanel from '@/components/PlayerInteractionPanel'

function PlayerTab({ collisionPlayer }: { collisionPlayer: PlayerData }) {
  const handleSendMessage = async (message: string) => {
    try {
      await sendMessageToPlayer(collisionPlayer.id, message)
      console.log('Message sent successfully')
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleFollow = (playerId: string) => {
    followPlayer(playerId)
  }

  const handleViewProfile = (playerId: string) => {
    openPlayerProfile(playerId)
  }

  if (!collisionPlayer) {
    return <div>没有选中的玩家</div>
  }

  return (
    <PlayerInteractionPanel
      player={collisionPlayer}
      onSendMessage={handleSendMessage}
      onFollow={handleFollow}
      onViewProfile={handleViewProfile}
    />
  )
}
```

### 功能特性

1. **玩家信息展示**
   - 头像或姓名首字母
   - 在线状态指示器
   - 当前状态徽章
   - 状态消息

2. **快速操作**
   - 关注按钮
   - 查看详情按钮
   - 邀请按钮

3. **聊天功能**
   - 实时消息发送
   - 消息状态指示
   - 聊天记录滚动
   - 消息时间戳

4. **视觉反馈**
   - 加载状态指示器
   - 操作成功/失败提示
   - 动画效果

---

## EventBus 事件总线

### 概述

`EventBus` 是一个中心化的事件系统，用于处理 Phaser 游戏组件和 React UI 组件之间的通信。

### 接口定义

```typescript
interface GameEvents {
  'player:collision:start': CollisionEvent
  'player:collision:end': CollisionEvent
  'player:click': PlayerClickEvent
  'player:info:updated': PlayerInfoUpdateEvent
  'tab:switch': TabSwitchEvent
  'chat:message:send': ChatMessageEvent
  'eventbus:error': EventBusErrorEvent
}

interface CollisionEvent extends BaseEvent {
  type: 'collision_start' | 'collision_end'
  mainPlayer: PlayerData
  targetPlayer: PlayerData
  position: { x: number; y: number }
  duration?: number
}
```

### 使用示例

```typescript
import { EventBus } from '@/lib/eventBus'

// 订阅事件
EventBus.on('player:collision:start', (event) => {
  console.log('Collision started with:', event.targetPlayer.name)
})

// 发送事件
EventBus.emit('player:collision:start', {
  type: 'collision_start',
  timestamp: Date.now(),
  mainPlayer: currentPlayer,
  targetPlayer: otherPlayer,
  position: { x: 100, y: 200 }
})

// 一次性订阅
EventBus.once('tab:switch', (event) => {
  console.log('Tab switched once:', event)
})

// 取消订阅
const callback = (event) => console.log(event)
EventBus.on('player:click', callback)
EventBus.off('player:click', callback)
```

### 错误处理

```typescript
// 订阅错误事件
EventBus.onError((errorEvent) => {
  console.error('EventBus error:', errorEvent.error)
  console.log('Context:', errorEvent.context)
})

// 获取性能指标
const metrics = EventBus.getMetrics()
console.log('Total events:', metrics.totalEvents)
console.log('Total errors:', metrics.totalErrors)
```

### 配置选项

```typescript
// 更新配置
EventBus.updateConfig({
  debugMode: true,
  maxListeners: 100,
  errorThreshold: 20,
  enableMetrics: true
})

// 启用调试模式
EventBus.setDebugMode(true)
```

---

## Phaser 碰撞系统

### 概述

Phaser 碰撞系统包含多个优化组件，用于高效处理多玩家碰撞检测和性能优化。

### 核心组件

#### 1. MultiPlayerCollisionManager

处理多玩家同时碰撞的优先级管理和队列系统。

```javascript
// 初始化
const collisionManager = new MultiPlayerCollisionManager(scene)

// 处理碰撞开始
collisionManager.handleCollisionStart(mainPlayer, targetPlayer, {
  priority: 'high',
  zone: 'office-area'
})

// 获取统计信息
const stats = collisionManager.getCollisionStats()
console.log('Active collisions:', stats.activeCollisions)
```

#### 2. CollisionOptimizer

提供空间分区和性能优化功能。

```javascript
// 初始化
const optimizer = new CollisionOptimizer(scene)

// 更新碰撞检测
optimizer.updateCollisionDetection(mainPlayer, otherPlayers)

// 设置碰撞敏感度
optimizer.setCollisionSensitivity(80) // 80px 检测半径

// 获取性能统计
const stats = optimizer.getCollisionStats()
```

#### 3. PlayerInfoDebouncer

处理玩家信息更新的防抖和批处理。

```javascript
// 初始化
const debouncer = new PlayerInfoDebouncer(scene)

// 队列玩家更新
debouncer.queuePlayerUpdate('player-123', {
  status: { type: 'working', status: '工作中' },
  position: { x: 100, y: 200 }
}, 'high')

// 强制立即更新
debouncer.forceUpdate('player-123')
```

### 性能优化特性

1. **空间分区**：使用网格系统减少碰撞检测计算量
2. **防抖机制**：避免频繁的事件触发
3. **优先级系统**：重要玩家优先处理
4. **批处理**：批量处理更新以提高性能
5. **错误恢复**：自动处理和恢复错误状态

### 配置参数

```javascript
// MultiPlayerCollisionManager 配置
const config = {
  maxSimultaneousCollisions: 5,
  cooldownDuration: 1000,
  queueProcessInterval: 50
}

// CollisionOptimizer 配置
const optimizerConfig = {
  maxChecksPerFrame: 10,
  spatialGridSize: 100,
  updateInterval: 16,
  debounceDelay: 150
}

// PlayerInfoDebouncer 配置
const debouncerConfig = {
  debounceDelay: 200,
  batchUpdateDelay: 100,
  maxBatchSize: 10
}
```

---

## 最佳实践

### 1. 性能优化

- 使用 `useMemo` 和 `useCallback` 优化 React 组件
- 限制同时处理的碰撞数量
- 使用防抖机制避免频繁更新
- 实现空间分区减少计算量

### 2. 错误处理

- 始终包装事件监听器在 try-catch 中
- 使用 EventBus 的错误事件监听系统错误
- 实现降级方案处理组件加载失败
- 添加超时机制防止无限等待

### 3. 用户体验

- 提供视觉反馈指示加载和操作状态
- 使用动画增强交互体验
- 实现响应式设计适配不同设备
- 添加键盘快捷键支持

### 4. 代码维护

- 使用 TypeScript 提供类型安全
- 编写详细的接口文档和注释
- 实现单元测试覆盖核心功能
- 使用一致的命名约定和代码风格

---

## 故障排除

### 常见问题

1. **碰撞检测不工作**
   - 检查 EventBus 是否正确初始化
   - 确认玩家对象包含必要的属性
   - 验证碰撞敏感度设置

2. **标签页不自动切换**
   - 确认标签页配置了 `autoSwitch: true`
   - 检查事件监听器是否正确注册
   - 验证碰撞事件是否正确发送

3. **性能问题**
   - 检查同时处理的碰撞数量
   - 调整空间分区网格大小
   - 优化事件监听器数量

4. **内存泄漏**
   - 确保组件卸载时清理事件监听器
   - 检查定时器是否正确清理
   - 验证对象引用是否正确释放

### 调试工具

```typescript
// 启用调试模式
EventBus.setDebugMode(true)

// 获取性能指标
const metrics = EventBus.getMetrics()
console.table(Array.from(metrics.eventCounts.entries()))

// 监控碰撞系统状态
const collisionStats = collisionManager.getCollisionStats()
console.log('Collision system status:', collisionStats)
```