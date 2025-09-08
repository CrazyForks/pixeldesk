/**
 * Multi-Player Collision Manager
 * Efficiently handles multiple simultaneous collisions with priority system
 */

export class MultiPlayerCollisionManager {
    constructor(scene) {
        this.scene = scene;
        
        // Collision management
        this.activeCollisions = new Map(); // playerId -> collisionData
        this.collisionPriorities = new Map(); // playerId -> priority
        this.maxSimultaneousCollisions = 5; // Limit for performance
        
        // Priority system
        this.priorityLevels = {
            HIGH: 3,    // VIP users, friends
            NORMAL: 2,  // Regular users
            LOW: 1      // Background/idle users
        };
        
        // Collision queuing system
        this.collisionQueue = [];
        this.processingQueue = false;
        this.queueProcessInterval = 50; // Process queue every 50ms
        
        // Performance optimization
        this.collisionCooldowns = new Map(); // playerId -> cooldownEndTime
        this.cooldownDuration = 1000; // 1 second cooldown between collision events
        
        // Spatial optimization for multi-player scenarios
        this.collisionZones = new Map(); // zoneId -> Set of playerIds
        this.zoneSize = 150; // Size of collision zones
        
        // Statistics and monitoring
        this.stats = {
            totalCollisions: 0,
            simultaneousCollisions: 0,
            queuedCollisions: 0,
            droppedCollisions: 0,
            averageCollisionDuration: 0
        };
        
        this.initializeManager();
    }
    
    initializeManager() {
        // Start queue processing
        this.startQueueProcessing();
        
        // Set up collision zone management
        this.setupCollisionZones();
        
        // Initialize performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('[MultiPlayerCollisionManager] Initialized with priority-based collision handling');
    }
    
    /**
     * Handle collision start with priority and queuing
     */
    handleCollisionStart(mainPlayer, targetPlayer, collisionData = {}) {
        try {
            const playerId = targetPlayer.playerData?.id;
            if (!playerId) {
                console.warn('[MultiPlayerCollisionManager] Invalid player data for collision');
                return false;
            }
            
            // Check cooldown
            if (this.isPlayerOnCooldown(playerId)) {
                return false;
            }
            
            // Check if already in collision
            if (this.activeCollisions.has(playerId)) {
                return false;
            }
            
            // Determine collision priority
            const priority = this.calculateCollisionPriority(targetPlayer);
            
            // Check if we can handle more simultaneous collisions
            if (this.activeCollisions.size >= this.maxSimultaneousCollisions) {
                return this.handleCollisionOverflow(playerId, targetPlayer, priority, collisionData);
            }
            
            // Process collision immediately
            return this.processCollisionStart(mainPlayer, targetPlayer, priority, collisionData);
            
        } catch (error) {
            console.error('[MultiPlayerCollisionManager] Error handling collision start:', error);
            return false;
        }
    }
    
    /**
     * Process collision start immediately
     */
    processCollisionStart(mainPlayer, targetPlayer, priority, collisionData) {
        const playerId = targetPlayer.playerData.id;
        const startTime = Date.now();
        
        // Create collision record
        const collision = {
            playerId,
            targetPlayer,
            mainPlayer,
            startTime,
            priority,
            zone: this.getCollisionZone(targetPlayer),
            ...collisionData
        };
        
        // Add to active collisions
        this.activeCollisions.set(playerId, collision);
        this.collisionPriorities.set(playerId, priority);
        
        // Update collision zones
        this.updateCollisionZones(playerId, collision.zone);
        
        // Trigger collision start event
        targetPlayer.handleCollisionStart(mainPlayer);
        
        // Update statistics
        this.stats.totalCollisions++;
        this.stats.simultaneousCollisions = Math.max(
            this.stats.simultaneousCollisions, 
            this.activeCollisions.size
        );
        
        console.log(`[MultiPlayerCollisionManager] Collision started with ${targetPlayer.playerData.name} (Priority: ${priority})`);
        return true;
    }
    
    /**
     * Handle collision overflow when too many simultaneous collisions
     */
    handleCollisionOverflow(playerId, targetPlayer, priority, collisionData) {
        // Check if we can replace a lower priority collision
        const lowestPriorityCollision = this.findLowestPriorityCollision();
        
        if (lowestPriorityCollision && priority > lowestPriorityCollision.priority) {
            // End the lowest priority collision
            this.forceEndCollision(lowestPriorityCollision.playerId);
            
            // Start the new higher priority collision
            return this.processCollisionStart(
                targetPlayer.mainPlayer || this.scene.player, 
                targetPlayer, 
                priority, 
                collisionData
            );
        } else {
            // Queue the collision for later processing
            this.queueCollision(playerId, targetPlayer, priority, collisionData);
            this.stats.queuedCollisions++;
            return false;
        }
    }
    
    /**
     * Find the lowest priority active collision
     */
    findLowestPriorityCollision() {
        let lowestPriority = Infinity;
        let lowestCollision = null;
        
        for (const [playerId, collision] of this.activeCollisions) {
            if (collision.priority < lowestPriority) {
                lowestPriority = collision.priority;
                lowestCollision = collision;
            }
        }
        
        return lowestCollision;
    }
    
    /**
     * Queue collision for later processing
     */
    queueCollision(playerId, targetPlayer, priority, collisionData) {
        const queueItem = {
            playerId,
            targetPlayer,
            priority,
            collisionData,
            queueTime: Date.now()
        };
        
        // Insert in priority order
        const insertIndex = this.collisionQueue.findIndex(item => item.priority < priority);
        if (insertIndex === -1) {
            this.collisionQueue.push(queueItem);
        } else {
            this.collisionQueue.splice(insertIndex, 0, queueItem);
        }
        
        // Limit queue size to prevent memory issues
        if (this.collisionQueue.length > 20) {
            const dropped = this.collisionQueue.pop();
            this.stats.droppedCollisions++;
            console.warn('[MultiPlayerCollisionManager] Dropped collision from queue:', dropped.playerId);
        }
    }
    
    /**
     * Handle collision end
     */
    handleCollisionEnd(playerId, targetPlayer) {
        try {
            const collision = this.activeCollisions.get(playerId);
            if (!collision) {
                return false;
            }
            
            // Calculate collision duration
            const duration = Date.now() - collision.startTime;
            this.updateAverageCollisionDuration(duration);
            
            // Remove from active collisions
            this.activeCollisions.delete(playerId);
            this.collisionPriorities.delete(playerId);
            
            // Update collision zones
            this.removeFromCollisionZones(playerId, collision.zone);
            
            // Set cooldown
            this.setPlayerCooldown(playerId);
            
            // Trigger collision end event
            if (targetPlayer && typeof targetPlayer.handleCollisionEnd === 'function') {
                targetPlayer.handleCollisionEnd(collision.mainPlayer);
            }
            
            console.log(`[MultiPlayerCollisionManager] Collision ended with ${playerId} (Duration: ${duration}ms)`);
            
            // Process queued collisions
            this.processQueuedCollisions();
            
            return true;
            
        } catch (error) {
            console.error('[MultiPlayerCollisionManager] Error handling collision end:', error);
            return false;
        }
    }
    
    /**
     * Calculate collision priority based on player attributes
     */
    calculateCollisionPriority(targetPlayer) {
        const playerData = targetPlayer.playerData;
        
        // Base priority
        let priority = this.priorityLevels.NORMAL;
        
        // Increase priority for friends or VIP users
        if (playerData.isFriend) {
            priority = this.priorityLevels.HIGH;
        }
        
        // Increase priority for active users
        if (playerData.isOnline && playerData.lastActivity) {
            const timeSinceActivity = Date.now() - new Date(playerData.lastActivity).getTime();
            if (timeSinceActivity < 60000) { // Active within last minute
                priority = Math.max(priority, this.priorityLevels.NORMAL + 0.5);
            }
        }
        
        // Decrease priority for idle users
        if (playerData.currentStatus?.type === 'idle' || playerData.currentStatus?.type === 'away') {
            priority = this.priorityLevels.LOW;
        }
        
        return priority;
    }
    
    /**
     * Collision zone management for spatial optimization
     */
    getCollisionZone(player) {
        const zoneX = Math.floor(player.x / this.zoneSize);
        const zoneY = Math.floor(player.y / this.zoneSize);
        return `${zoneX},${zoneY}`;
    }
    
    setupCollisionZones() {
        // Initialize collision zones based on current players
        this.updateAllCollisionZones();
        
        // Update zones periodically
        this.scene.time.addEvent({
            delay: 1000, // Update every second
            callback: () => {
                this.updateAllCollisionZones();
            },
            loop: true
        });
    }
    
    updateAllCollisionZones() {
        // Clear existing zones
        this.collisionZones.clear();
        
        // Add all active collision players to zones
        for (const [playerId, collision] of this.activeCollisions) {
            const zone = this.getCollisionZone(collision.targetPlayer);
            this.updateCollisionZones(playerId, zone);
        }
    }
    
    updateCollisionZones(playerId, zone) {
        if (!this.collisionZones.has(zone)) {
            this.collisionZones.set(zone, new Set());
        }
        this.collisionZones.get(zone).add(playerId);
    }
    
    removeFromCollisionZones(playerId, zone) {
        if (this.collisionZones.has(zone)) {
            this.collisionZones.get(zone).delete(playerId);
            
            // Clean up empty zones
            if (this.collisionZones.get(zone).size === 0) {
                this.collisionZones.delete(zone);
            }
        }
    }
    
    /**
     * Cooldown management
     */
    isPlayerOnCooldown(playerId) {
        const cooldownEnd = this.collisionCooldowns.get(playerId);
        return cooldownEnd && Date.now() < cooldownEnd;
    }
    
    setPlayerCooldown(playerId) {
        this.collisionCooldowns.set(playerId, Date.now() + this.cooldownDuration);
    }
    
    /**
     * Queue processing
     */
    startQueueProcessing() {
        this.scene.time.addEvent({
            delay: this.queueProcessInterval,
            callback: () => {
                this.processQueuedCollisions();
            },
            loop: true
        });
    }
    
    processQueuedCollisions() {
        if (this.processingQueue || this.collisionQueue.length === 0) {
            return;
        }
        
        this.processingQueue = true;
        
        try {
            // Process collisions while we have capacity
            while (this.collisionQueue.length > 0 && 
                   this.activeCollisions.size < this.maxSimultaneousCollisions) {
                
                const queueItem = this.collisionQueue.shift();
                
                // Check if collision is still valid (not too old)
                const queueAge = Date.now() - queueItem.queueTime;
                if (queueAge > 5000) { // 5 second timeout
                    this.stats.droppedCollisions++;
                    continue;
                }
                
                // Check if player is still available for collision
                if (!this.isPlayerOnCooldown(queueItem.playerId) && 
                    !this.activeCollisions.has(queueItem.playerId)) {
                    
                    this.processCollisionStart(
                        this.scene.player,
                        queueItem.targetPlayer,
                        queueItem.priority,
                        queueItem.collisionData
                    );
                }
            }
        } catch (error) {
            console.error('[MultiPlayerCollisionManager] Error processing queued collisions:', error);
        } finally {
            this.processingQueue = false;
        }
    }
    
    /**
     * Statistics and monitoring
     */
    updateAverageCollisionDuration(duration) {
        const currentAvg = this.stats.averageCollisionDuration;
        const totalCollisions = this.stats.totalCollisions;
        
        this.stats.averageCollisionDuration = 
            (currentAvg * (totalCollisions - 1) + duration) / totalCollisions;
    }
    
    setupPerformanceMonitoring() {
        this.scene.time.addEvent({
            delay: 10000, // Log every 10 seconds
            callback: () => {
                this.logPerformanceStats();
            },
            loop: true
        });
    }
    
    logPerformanceStats() {
        const stats = this.stats;
        
        if (stats.totalCollisions > 0) {
            console.log('[MultiPlayerCollisionManager] Performance stats:', {
                activeCollisions: this.activeCollisions.size,
                queuedCollisions: this.collisionQueue.length,
                totalCollisions: stats.totalCollisions,
                simultaneousCollisions: stats.simultaneousCollisions,
                droppedCollisions: stats.droppedCollisions,
                averageCollisionDuration: `${stats.averageCollisionDuration.toFixed(0)}ms`,
                collisionZones: this.collisionZones.size,
                playersOnCooldown: this.collisionCooldowns.size
            });
        }
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Force end collision for a specific player
     */
    forceEndCollision(playerId) {
        const collision = this.activeCollisions.get(playerId);
        if (collision) {
            this.handleCollisionEnd(playerId, collision.targetPlayer);
            return true;
        }
        return false;
    }
    
    /**
     * Get current collision information
     */
    getCurrentCollisions() {
        return Array.from(this.activeCollisions.keys());
    }
    
    /**
     * Get collision statistics
     */
    getCollisionStats() {
        return {
            ...this.stats,
            activeCollisions: this.activeCollisions.size,
            queuedCollisions: this.collisionQueue.length,
            collisionZones: this.collisionZones.size,
            playersOnCooldown: this.collisionCooldowns.size
        };
    }
    
    /**
     * Set maximum simultaneous collisions
     */
    setMaxSimultaneousCollisions(max) {
        if (max > 0 && max <= 20) {
            this.maxSimultaneousCollisions = max;
            console.log(`[MultiPlayerCollisionManager] Max simultaneous collisions set to ${max}`);
        }
    }
    
    /**
     * Clear all collisions (emergency cleanup)
     */
    clearAllCollisions() {
        // End all active collisions
        for (const [playerId, collision] of this.activeCollisions) {
            if (collision.targetPlayer && typeof collision.targetPlayer.handleCollisionEnd === 'function') {
                collision.targetPlayer.handleCollisionEnd(collision.mainPlayer);
            }
        }
        
        // Clear all data structures
        this.activeCollisions.clear();
        this.collisionPriorities.clear();
        this.collisionQueue.length = 0;
        this.collisionZones.clear();
        this.collisionCooldowns.clear();
        
        console.log('[MultiPlayerCollisionManager] All collisions cleared');
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        this.clearAllCollisions();
        console.log('[MultiPlayerCollisionManager] Cleanup completed');
    }
}