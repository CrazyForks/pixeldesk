# API 参考文档

本文档提供了碰撞交互系统所有公共 API 的详细参考。

## 目录

- [React 组件 API](#react-组件-api)
- [EventBus API](#eventbus-api)
- [Phaser 碰撞系统 API](#phaser-碰撞系统-api)
- [类型定义](#类型定义)

---

## React 组件 API

### LayoutManager

响应式布局管理组件。

#### Props

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `gameComponent` | `ReactNode` | ✅ | - | 游戏组件 |
| `infoPanel` | `ReactNode` | ✅ | - | 信息面板组件 |
| `className` | `string` | ❌ | `''` | 自定义CSS类名 |
| `onLayoutChange` | `(deviceType: DeviceType) => void` | ❌ | - | 布局变化回调 |

#### 方法

无公共方法（内部管理状态）。

#### 示例

```tsx
<LayoutManager
  gameComponent={<PhaserGame />}
  infoPanel={<InfoPanel />}
  onLayoutChange={(deviceType) => console.log(deviceType)}
/>
```

---

### TabManager

标签页管理组件。

#### Props

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `tabs` | `TabType[]` | ✅ | - | 标签页配置数组 |
| `activeTab` | `string` | ❌ | 第一个标签页ID | 当前激活的标签页ID |
| `onTabChange` | `(tabId: string) => void` | ❌ | - | 标签页切换回调 |
| `collisionPlayer` | `PlayerData` | ❌ | - | 碰撞玩家数据 |
| `className` | `string` | ❌ | `''` | 自定义CSS类名 |
| `isMobile` | `boolean` | ❌ | `false` | 是否为移动设备 |
| `isTablet` | `boolean` | ❌ | `false` | 是否为平板设备 |

#### TabType 接口

```typescript
interface TabType {
  id: string              // 标签页唯一标识
  label: string           // 显示标签
  icon: string           // 图标（emoji或字符）
  component: ComponentType<any>  // 标签页组件
  badge?: number         // 徽章数字
  autoSwitch?: boolean   // 是否自动切换
  priority?: number      // 优先级
}
```

#### 示例

```tsx
const tabs = [
  {
    id: 'status',
    label: '状态',
    icon: '📊',
    component: StatusTab
  }
]

<TabManager
  tabs={tabs}
  activeTab="status"
  onTabChange={handleTabChange}
/>
```

---

### PlayerInteractionPanel

玩家交互面板组件。

#### Props

| 属性 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `player` | `PlayerData` | ✅ | - | 玩家数据 |
| `onSendMessage` | `(message: string) => void` | ❌ | - | 发送消息回调 |
| `onFollow` | `(playerId: string) => void` | ❌ | - | 关注玩家回调 |
| `onViewProfile` | `(playerId: string) => void` | ❌ | - | 查看详情回调 |
| `className` | `string` | ❌ | `''` | 自定义CSS类名 |
| `isMobile` | `boolean` | ❌ | `false` | 是否为移动设备 |
| `isTablet` | `boolean` | ❌ | `false` | 是否为平板设备 |

#### PlayerData 接口

```typescript
interface PlayerData {
  id: string                    // 玩家唯一标识
  name: string                  // 玩家姓名
  avatar?: string              // 头像URL
  currentStatus?: StatusData   // 当前状态
  isOnline: boolean           // 是否在线
  lastSeen?: string           // 最后在线时间
}
```

#### 示例

```tsx
<PlayerInteractionPanel
  player={playerData}
  onSendMessage={handleSendMessage}
  onFollow={handleFollow}
  onViewProfile={handleViewProfile}
/>
```

---

## EventBus API

中心化事件系统。

### 核心方法

#### `on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void`

订阅事件。

**参数：**
- `event`: 事件名称
- `callback`: 回调函数

**示例：**
```typescript
EventBus.on('player:collision:start', (event) => {
  console.log('Collision with:', event.targetPlayer.name)
})
```

#### `off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void`

取消订阅事件。

**参数：**
- `event`: 事件名称
- `callback`: 要移除的回调函数

**示例：**
```typescript
const callback = (event) => console.log(event)
EventBus.on('player:click', callback)
EventBus.off('player:click', callback)
```

#### `emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void`

发送事件。

**参数：**
- `event`: 事件名称
- `data`: 事件数据

**示例：**
```typescript
EventBus.emit('player:collision:start', {
  type: 'collision_start',
  timestamp: Date.now(),
  mainPlayer: player1,
  targetPlayer: player2,
  position: { x: 100, y: 200 }
})
```

#### `once<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void`

一次性订阅事件。

**参数：**
- `event`: 事件名称
- `callback`: 回调函数

**示例：**
```typescript
EventBus.once('tab:switch', (event) => {
  console.log('Tab switched once:', event.toTab)
})
```

### 管理方法

#### `removeAllListeners(event?: string): void`

移除所有监听器。

**参数：**
- `event`: 可选，指定事件名称

#### `listenerCount(event: string): number`

获取事件监听器数量。

**返回：** 监听器数量

#### `eventNames(): string[]`

获取所有已注册的事件名称。

**返回：** 事件名称数组

#### `setDebugMode(enabled: boolean): void`

启用/禁用调试模式。

**参数：**
- `enabled`: 是否启用调试

#### `updateConfig(newConfig: Partial<EventBusConfig>): void`

更新配置。

**参数：**
- `newConfig`: 新配置对象

### 错误处理

#### `onError(callback: EventCallback<EventBusErrorEvent>): void`

订阅错误事件。

**参数：**
- `callback`: 错误回调函数

#### `offError(callback: EventCallback<EventBusErrorEvent>): void`

取消订阅错误事件。

### 性能监控

#### `getMetrics(): EventBusMetrics`

获取性能指标。

**返回：** 包含事件统计的对象

#### `resetMetrics(): void`

重置性能指标。

---

## Phaser 碰撞系统 API

### MultiPlayerCollisionManager

多玩家碰撞管理器。

#### 构造函数

```javascript
new MultiPlayerCollisionManager(scene)
```

**参数：**
- `scene`: Phaser 场景对象

#### 方法

##### `handleCollisionStart(mainPlayer, targetPlayer, collisionData?): boolean`

处理碰撞开始。

**参数：**
- `mainPlayer`: 主玩家对象
- `targetPlayer`: 目标玩家对象
- `collisionData`: 可选的碰撞数据

**返回：** 是否成功处理碰撞

##### `handleCollisionEnd(playerId, targetPlayer): boolean`

处理碰撞结束。

**参数：**
- `playerId`: 玩家ID
- `targetPlayer`: 目标玩家对象

**返回：** 是否成功处理

##### `forceEndCollision(playerId): boolean`

强制结束碰撞。

**参数：**
- `playerId`: 玩家ID

**返回：** 是否成功结束

##### `getCurrentCollisions(): string[]`

获取当前碰撞列表。

**返回：** 玩家ID数组

##### `getCollisionStats(): CollisionStats`

获取碰撞统计信息。

**返回：** 统计对象

##### `setMaxSimultaneousCollisions(max: number): void`

设置最大同时碰撞数。

**参数：**
- `max`: 最大数量（1-20）

##### `clearAllCollisions(): void`

清除所有碰撞。

---

### CollisionOptimizer

碰撞检测优化器。

#### 构造函数

```javascript
new CollisionOptimizer(scene)
```

#### 方法

##### `updateCollisionDetection(mainPlayer, otherPlayers): void`

更新碰撞检测。

**参数：**
- `mainPlayer`: 主玩家对象
- `otherPlayers`: 其他玩家数组

##### `setCollisionSensitivity(radius: number): void`

设置碰撞敏感度。

**参数：**
- `radius`: 检测半径（像素）

##### `getCollisionStats(): CollisionOptimizerStats`

获取优化器统计信息。

##### `getCurrentCollisions(): string[]`

获取当前碰撞列表。

##### `forceEndCollision(playerId: string): void`

强制结束指定玩家的碰撞。

---

### PlayerInfoDebouncer

玩家信息防抖器。

#### 构造函数

```javascript
new PlayerInfoDebouncer(scene)
```

#### 方法

##### `queuePlayerUpdate(playerId, updateData, priority?): boolean`

队列玩家更新。

**参数：**
- `playerId`: 玩家ID
- `updateData`: 更新数据
- `priority`: 优先级（'normal' | 'high'）

**返回：** 是否成功队列

##### `forceUpdate(playerId: string): void`

强制立即更新。

**参数：**
- `playerId`: 玩家ID

##### `getStats(): DebouncerStats`

获取防抖器统计信息。

##### `reset(): void`

重置防抖器状态。

---

## 类型定义

### 基础类型

```typescript
type DeviceType = 'mobile' | 'tablet' | 'desktop'
type Orientation = 'portrait' | 'landscape'
type PanelPosition = 'left' | 'right' | 'top' | 'bottom'
```

### 事件类型

```typescript
interface BaseEvent {
  type: string
  timestamp: number
}

interface CollisionEvent extends BaseEvent {
  type: 'collision_start' | 'collision_end'
  mainPlayer: PlayerData
  targetPlayer: PlayerData
  position: { x: number; y: number }
  duration?: number
}

interface TabSwitchEvent extends BaseEvent {
  type: 'tab_switch'
  fromTab: string
  toTab: string
  trigger: 'collision' | 'manual' | 'auto'
}

interface PlayerClickEvent extends BaseEvent {
  type: 'player_click'
  targetPlayer: PlayerData
  position: { x: number; y: number }
  trigger: 'click'
}
```

### 配置类型

```typescript
interface EventBusConfig {
  debugMode: boolean
  maxListeners: number
  errorThreshold: number
  enableMetrics: boolean
}

interface LayoutConfig {
  desktop: DeviceLayoutConfig
  tablet: DeviceLayoutConfig
  mobile: DeviceLayoutConfig
}

interface DeviceLayoutConfig {
  gameArea: AreaConfig
  infoPanel: PanelConfig
}
```

### 统计类型

```typescript
interface EventBusMetrics {
  totalEvents: number
  totalErrors: number
  eventCounts: Map<string, number>
  errorCounts: Map<string, number>
  lastEventTime: number
}

interface CollisionStats {
  activeCollisions: number
  queuedCollisions: number
  totalCollisions: number
  simultaneousCollisions: number
  droppedCollisions: number
  averageCollisionDuration: number
}
```

---

## 常量

### 断点

```typescript
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280
} as const
```

### 动画配置

```typescript
const ANIMATION_CONFIG = {
  transitionDuration: 300,
  debounceDelay: 150,
  resizeThreshold: 50
} as const
```

### 优先级

```typescript
const PRIORITY_LEVELS = {
  HIGH: 3,
  NORMAL: 2,
  LOW: 1
} as const
```

---

## 错误代码

| 代码 | 描述 | 解决方案 |
|------|------|----------|
| `EVENTBUS_001` | 事件名称无效 | 确保事件名称为非空字符串 |
| `EVENTBUS_002` | 回调函数无效 | 确保传入有效的函数 |
| `EVENTBUS_003` | 监听器数量超限 | 减少监听器数量或增加限制 |
| `COLLISION_001` | 玩家数据无效 | 检查玩家对象是否包含必要属性 |
| `COLLISION_002` | 碰撞检测失败 | 检查碰撞敏感度和玩家位置 |
| `LAYOUT_001` | 组件渲染失败 | 检查传入的组件是否有效 |

---

## 版本兼容性

| 版本 | React | TypeScript | Phaser | Node.js |
|------|-------|------------|--------|---------|
| 1.0.x | ≥18.0 | ≥4.5 | ≥3.70 | ≥16.0 |

---

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。