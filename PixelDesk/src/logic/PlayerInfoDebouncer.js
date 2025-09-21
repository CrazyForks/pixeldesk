/**
 * Player Information Update Debouncer
 * Handles frequent player information updates with debouncing and batching
 */

export class PlayerInfoDebouncer {
    constructor(scene) {
        this.scene = scene;
        
        // Debouncing configuration
        this.debounceDelay = 200; // 200ms debounce delay for player info updates
        this.batchUpdateDelay = 100; // Batch updates every 100ms
        this.maxBatchSize = 10; // Maximum updates per batch
        
        // Update queues and timers
        this.updateQueue = new Map(); // playerId -> updateData
        this.debounceTimers = new Map(); // playerId -> timer
        this.batchTimer = null;
        this.pendingUpdates = new Set(); // Track pending updates
        
        // Performance tracking
        this.updateStats = {
            totalUpdates: 0,
            batchedUpdates: 0,
            debouncedUpdates: 0,
            averageBatchSize: 0
        };
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 5;
        
        this.initializeDebouncer();
    }
    
    initializeDebouncer() {
        // Start batch processing
        this.startBatchProcessing();
        
        // Set up performance monitoring
        this.setupPerformanceMonitoring();
        
        console.log('[PlayerInfoDebouncer] Initialized with batching and debouncing');
    }
    
    /**
     * Queue a player information update with debouncing
     */
    queuePlayerUpdate(playerId, updateData, priority = 'normal') {
        try {
            // Validate input
            if (!playerId || !updateData) {
                console.warn('[PlayerInfoDebouncer] Invalid update data provided');
                return false;
            }
            
            // Clear existing debounce timer for this player
            if (this.debounceTimers.has(playerId)) {
                this.scene.time.removeEvent(this.debounceTimers.get(playerId));
            }
            
            // Merge with existing update data if present
            const existingUpdate = this.updateQueue.get(playerId);
            const mergedUpdate = existingUpdate ? 
                this.mergeUpdateData(existingUpdate, updateData) : 
                { ...updateData, timestamp: Date.now(), priority };
            
            // Add to update queue
            this.updateQueue.set(playerId, mergedUpdate);
            this.pendingUpdates.add(playerId);
            
            // Set debounce timer based on priority
            const delay = priority === 'high' ? this.debounceDelay / 2 : this.debounceDelay;
            
            const timer = this.scene.time.delayedCall(delay, () => {
                this.processPlayerUpdate(playerId);
                this.debounceTimers.delete(playerId);
            });
            
            this.debounceTimers.set(playerId, timer);
            
            this.updateStats.totalUpdates++;
            return true;
            
        } catch (error) {
            this.handleError(error, 'queuePlayerUpdate', playerId);
            return false;
        }
    }
    
    /**
     * Merge update data intelligently
     */
    mergeUpdateData(existing, newData) {
        const merged = { ...existing };
        
        // Merge status information
        if (newData.status) {
            merged.status = { ...existing.status, ...newData.status };
        }
        
        // Merge position information
        if (newData.position) {
            merged.position = newData.position;
        }
        
        // Merge collision information
        if (newData.collision) {
            merged.collision = { ...existing.collision, ...newData.collision };
        }
        
        // Update timestamp and priority
        merged.timestamp = Date.now();
        if (newData.priority === 'high') {
            merged.priority = 'high';
        }
        
        return merged;
    }
    
    /**
     * Process individual player update
     */
    processPlayerUpdate(playerId) {
        try {
            const updateData = this.updateQueue.get(playerId);
            if (!updateData) {
                return;
            }
            
            // Remove from queue and pending set
            this.updateQueue.delete(playerId);
            this.pendingUpdates.delete(playerId);
            
            // Apply the update
            this.applyPlayerUpdate(playerId, updateData);
            
            this.updateStats.debouncedUpdates++;
            
        } catch (error) {
            this.handleError(error, 'processPlayerUpdate', playerId);
        }
    }
    
    /**
     * Apply player update to the game
     */
    applyPlayerUpdate(playerId, updateData) {
        // Find the player object
        const player = this.findPlayerById(playerId);
        if (!player) {
            console.warn(`[PlayerInfoDebouncer] Player ${playerId} not found for update`);
            return;
        }
        
        // Apply status updates
        if (updateData.status) {
            this.updatePlayerStatus(player, updateData.status);
        }
        
        // Apply position updates
        if (updateData.position) {
            this.updatePlayerPosition(player, updateData.position);
        }
        
        // Apply collision updates
        if (updateData.collision) {
            this.updatePlayerCollision(player, updateData.collision);
        }
        
        // Trigger UI updates if needed
        if (updateData.triggerUIUpdate) {
            this.triggerUIUpdate(playerId, updateData);
        }
    }
    
    /**
     * Update player status information
     */
    updatePlayerStatus(player, statusData) {
        try {
            if (player.playerData && player.playerData.currentStatus) {
                // Update status data
                Object.assign(player.playerData.currentStatus, statusData);
                
                // Update visual status label if it exists
                if (player.updateStatus && typeof player.updateStatus === 'function') {
                    player.updateStatus(player.playerData.currentStatus);
                }
            }
        } catch (error) {
            this.handleError(error, 'updatePlayerStatus', player.playerData?.id);
        }
    }
    
    /**
     * Update player position information
     */
    updatePlayerPosition(player, positionData) {
        try {
            if (positionData.x !== undefined && positionData.y !== undefined) {
                // Smooth position update to avoid jarring movements
                if (player.body) {
                    const distance = Phaser.Math.Distance.Between(
                        player.x, player.y, 
                        positionData.x, positionData.y
                    );
                    
                    // Only update if the distance is significant
                    if (distance > 5) {
                        // Use tweening for smooth movement
                        this.scene.tweens.add({
                            targets: player,
                            x: positionData.x,
                            y: positionData.y,
                            duration: 200,
                            ease: 'Power2'
                        });
                    }
                }
            }
        } catch (error) {
            this.handleError(error, 'updatePlayerPosition', player.playerData?.id);
        }
    }
    
    /**
     * Update player collision information
     */
    updatePlayerCollision(player, collisionData) {
        try {
            if (collisionData.isColliding !== undefined) {
                player.isColliding = collisionData.isColliding;
                
                // Collision visual effects removed to prevent unwanted animations
            }
        } catch (error) {
            this.handleError(error, 'updatePlayerCollision', player.playerData?.id);
        }
    }
    
    /**
     * Trigger UI update for player information
     */
    triggerUIUpdate(playerId, updateData) {
        try {
            // Emit event for React components to listen to
            if (window.gameEventBus) {
                window.gameEventBus.emit('player:info:updated', {
                    playerId,
                    updateData,
                    timestamp: Date.now()
                });
            }
            
            // Legacy callback support
            if (window.onPlayerInfoUpdated) {
                window.onPlayerInfoUpdated(playerId, updateData);
            }
        } catch (error) {
            this.handleError(error, 'triggerUIUpdate', playerId);
        }
    }
    
    /**
     * Find player by ID across different player collections
     */
    findPlayerById(playerId) {
        // Check main player
        if (this.scene.player && this.scene.player.playerData?.id === playerId) {
            return this.scene.player;
        }
        
        // Check other players map
        if (this.scene.otherPlayers) {
            for (const [id, player] of this.scene.otherPlayers) {
                if (player.playerData?.id === playerId) {
                    return player;
                }
            }
        }
        
        // Check workstation characters
        if (this.scene.workstationManager) {
            const workstations = this.scene.workstationManager.getAllWorkstations();
            for (const workstation of workstations) {
                if (workstation.characterSprite && 
                    workstation.characterSprite.playerData?.id === playerId) {
                    return workstation.characterSprite;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Batch processing system
     */
    startBatchProcessing() {
        this.batchTimer = this.scene.time.addEvent({
            delay: this.batchUpdateDelay,
            callback: () => {
                this.processBatch();
            },
            loop: true
        });
    }
    
    /**
     * Process a batch of updates
     */
    processBatch() {
        try {
            if (this.pendingUpdates.size === 0) {
                return;
            }
            
            // Get updates to process (limited by batch size)
            const updatesToProcess = Array.from(this.pendingUpdates)
                .slice(0, this.maxBatchSize);
            
            // Process each update in the batch
            updatesToProcess.forEach(playerId => {
                // Only process if debounce timer has expired or is high priority
                const updateData = this.updateQueue.get(playerId);
                if (updateData && (updateData.priority === 'high' || 
                    Date.now() - updateData.timestamp > this.debounceDelay)) {
                    
                    // Clear debounce timer
                    if (this.debounceTimers.has(playerId)) {
                        this.scene.time.removeEvent(this.debounceTimers.get(playerId));
                        this.debounceTimers.delete(playerId);
                    }
                    
                    this.processPlayerUpdate(playerId);
                }
            });
            
            // Update batch statistics
            this.updateStats.batchedUpdates += updatesToProcess.length;
            this.updateStats.averageBatchSize = 
                (this.updateStats.averageBatchSize + updatesToProcess.length) / 2;
            
        } catch (error) {
            this.handleError(error, 'processBatch');
        }
    }
    
    /**
     * Performance monitoring - 禁用以减少CPU消耗
     */
    setupPerformanceMonitoring() {
        // 性能优化：禁用定期性能日志输出以减少CPU消耗
        // 在开发调试时可以手动启用
        return;

        // 原始代码已注释，如需调试可以解除注释
        // this.scene.time.addEvent({
        //     delay: 5000, // Log every 5 seconds
        //     callback: () => {
        //         this.logPerformanceStats();
        //     },
        //     loop: true
        // });
    }

    logPerformanceStats() {
        // 性能优化：禁用日志输出
        return;

        // 原始代码已注释，如需调试可以解除注释
        // const stats = this.updateStats;
        //
        // if (stats.totalUpdates > 0) {
        //     console.log('[PlayerInfoDebouncer] Performance stats:', {
        //         totalUpdates: stats.totalUpdates,
        //         batchedUpdates: stats.batchedUpdates,
        //         debouncedUpdates: stats.debouncedUpdates,
        //         averageBatchSize: stats.averageBatchSize.toFixed(1),
        //         queueSize: this.updateQueue.size,
        //         pendingUpdates: this.pendingUpdates.size,
        //         activeTimers: this.debounceTimers.size
        //     });
        //
        //     // Reset counters
        //     this.updateStats.totalUpdates = 0;
        //     this.updateStats.batchedUpdates = 0;
        //     this.updateStats.debouncedUpdates = 0;
        // }
    }
    
    /**
     * Error handling
     */
    handleError(error, context, playerId = null) {
        this.errorCount++;
        
        console.error(`[PlayerInfoDebouncer] Error in ${context}:`, error, {
            playerId,
            errorCount: this.errorCount,
            queueSize: this.updateQueue.size
        });
        
        // Clean up corrupted state
        if (playerId) {
            this.cleanupPlayerState(playerId);
        }
        
        // If too many errors, reset the system
        if (this.errorCount >= this.maxErrors) {
            console.error('[PlayerInfoDebouncer] Too many errors, resetting system');
            this.reset();
        }
    }
    
    /**
     * Clean up state for a specific player
     */
    cleanupPlayerState(playerId) {
        try {
            this.updateQueue.delete(playerId);
            this.pendingUpdates.delete(playerId);
            
            if (this.debounceTimers.has(playerId)) {
                this.scene.time.removeEvent(this.debounceTimers.get(playerId));
                this.debounceTimers.delete(playerId);
            }
        } catch (error) {
            console.error('[PlayerInfoDebouncer] Error cleaning up player state:', error);
        }
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Force immediate update for a player
     */
    forceUpdate(playerId) {
        if (this.debounceTimers.has(playerId)) {
            this.scene.time.removeEvent(this.debounceTimers.get(playerId));
            this.debounceTimers.delete(playerId);
        }
        
        this.processPlayerUpdate(playerId);
    }
    
    /**
     * Get debouncer statistics
     */
    getStats() {
        return {
            queueSize: this.updateQueue.size,
            pendingUpdates: this.pendingUpdates.size,
            activeTimers: this.debounceTimers.size,
            errorCount: this.errorCount,
            stats: { ...this.updateStats }
        };
    }
    
    /**
     * Reset the debouncer system
     */
    reset() {
        // Clear all timers
        this.debounceTimers.forEach(timer => {
            this.scene.time.removeEvent(timer);
        });
        this.debounceTimers.clear();
        
        // Clear queues
        this.updateQueue.clear();
        this.pendingUpdates.clear();
        
        // Reset error count
        this.errorCount = 0;
        
        console.log('[PlayerInfoDebouncer] System reset completed');
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        this.reset();
        
        if (this.batchTimer) {
            this.scene.time.removeEvent(this.batchTimer);
            this.batchTimer = null;
        }
        
        console.log('[PlayerInfoDebouncer] Cleanup completed');
    }
}