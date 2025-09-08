/**
 * Event Bus System for Phaser-React Communication
 * Handles collision events and tab switching communication
 */

export interface CollisionEvent {
  type: 'collision_start' | 'collision_end'
  mainPlayer: PlayerData
  targetPlayer: PlayerData
  timestamp: number
  position: { x: number; y: number }
  duration?: number
}

export interface PlayerData {
  id: string
  name: string
  avatar?: string
  currentStatus: StatusData
  isOnline: boolean
  lastSeen?: string
}

export interface StatusData {
  type: string
  status: string
  emoji: string
  message: string
  timestamp: string
}

export interface TabSwitchEvent {
  type: 'tab_switch'
  fromTab: string
  toTab: string
  trigger: 'collision' | 'manual' | 'auto'
  timestamp: number
}

export interface ChatMessageEvent {
  type: 'chat_message'
  senderId: string
  receiverId: string
  content: string
  timestamp: number
}

// Event type definitions
export interface GameEvents {
  'player:collision:start': CollisionEvent
  'player:collision:end': CollisionEvent
  'player:click': PlayerData
  'tab:switch': TabSwitchEvent
  'chat:message:send': ChatMessageEvent
}

type EventCallback<T = any> = (data: T) => void

class EventBusClass {
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private debugMode: boolean = false

  constructor() {
    // Enable debug mode in development
    this.debugMode = process.env.NODE_ENV === 'development'
  }

  /**
   * Subscribe to an event
   */
  on<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void
  on(event: string, callback: EventCallback): void
  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    
    if (this.debugMode) {
      console.log(`[EventBus] Subscribed to event: ${event}`)
    }
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void
  off(event: string, callback: EventCallback): void
  off(event: string, callback: EventCallback): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(callback)
      
      // Clean up empty event sets
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
      
      if (this.debugMode) {
        console.log(`[EventBus] Unsubscribed from event: ${event}`)
      }
    }
  }

  /**
   * Emit an event
   */
  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void
  emit(event: string, data: any): void
  emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event)
    
    if (eventListeners && eventListeners.size > 0) {
      if (this.debugMode) {
        console.log(`[EventBus] Emitting event: ${event}`, data)
      }
      
      // Create a copy of listeners to avoid issues if listeners are modified during emission
      const listenersArray = Array.from(eventListeners)
      
      listenersArray.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[EventBus] Error in event listener for ${event}:`, error)
        }
      })
    } else if (this.debugMode) {
      console.log(`[EventBus] No listeners for event: ${event}`)
    }
  }

  /**
   * Subscribe to an event only once
   */
  once<K extends keyof GameEvents>(event: K, callback: EventCallback<GameEvents[K]>): void
  once(event: string, callback: EventCallback): void
  once(event: string, callback: EventCallback): void {
    const onceCallback = (data: any) => {
      callback(data)
      this.off(event, onceCallback)
    }
    
    this.on(event, onceCallback)
  }

  /**
   * Remove all listeners for a specific event
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
      if (this.debugMode) {
        console.log(`[EventBus] Removed all listeners for event: ${event}`)
      }
    } else {
      this.listeners.clear()
      if (this.debugMode) {
        console.log(`[EventBus] Removed all event listeners`)
      }
    }
  }

  /**
   * Get the number of listeners for an event
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0
  }

  /**
   * Get all registered event names
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys())
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }
}

// Create singleton instance
export const EventBus = new EventBusClass()

// Global window interface for Phaser integration
declare global {
  interface Window {
    gameEventBus: EventBusClass
    onPlayerCollisionStart?: (event: CollisionEvent) => void
    onPlayerCollisionEnd?: (event: CollisionEvent) => void
  }
}

// Make EventBus available globally for Phaser
if (typeof window !== 'undefined') {
  window.gameEventBus = EventBus
}

export default EventBus