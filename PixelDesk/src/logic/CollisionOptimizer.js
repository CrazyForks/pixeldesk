/**
 * Collision Detection Performance Optimizer
 * Implements spatial partitioning, debouncing, and efficient collision detection
 */

// ===== 性能优化配置 =====
const PERFORMANCE_CONFIG = {
  // 禁用控制台日志以大幅减少CPU消耗
  ENABLE_DEBUG_LOGGING: false,
  // 关键错误和警告仍然显示
  ENABLE_ERROR_LOGGING: true
}

// 性能优化的日志系统
const debugLog = PERFORMANCE_CONFIG.ENABLE_DEBUG_LOGGING ? console.log.bind(console) : () => {}
const debugWarn = PERFORMANCE_CONFIG.ENABLE_ERROR_LOGGING ? console.warn.bind(console) : () => {}

export class CollisionOptimizer {
    constructor(scene) {
        this.scene = scene;
        
        // Performance settings
        this.maxChecksPerFrame = 10; // Limit collision checks per frame
        this.spatialGridSize = 100; // Grid cell size for spatial partitioning
        this.updateInterval = 16; // ~60fps (16ms between updates)
        this.lastUpdateTime = 0;
        
        // Spatial partitioning grid
        this.spatialGrid = new Map();
        this.gridUpdateInterval = 100; // Update grid every 100ms
        this.lastGridUpdate = 0;
        
        // Debouncing system
        this.debounceTimers = new Map();
        this.debounceDelay = 150; // 150ms debounce delay
        this.collisionStates = new Map(); // Track collision states
        
        // Collision cooldown system - integrate with MultiPlayerCollisionManager
        this.collisionCooldowns = new Map(); // playerId -> cooldownEndTime
        this.cooldownDuration = 1000; // 1 second cooldown after collision ends
        
        // Performance monitoring
        this.performanceMetrics = {
            checksPerSecond: 0,
            averageCheckTime: 0,
            frameDrops: 0,
            lastFrameTime: 0
        };
        
        // Error handling
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorResetInterval = 5000; // Reset error count every 5 seconds
        
        this.initializeOptimizer();
    }
    
    initializeOptimizer() {
        // Initialize performance monitoring
        this.startPerformanceMonitoring();
        
        // Set up error recovery
        this.setupErrorRecovery();
        
        debugLog('[CollisionOptimizer] Initialized with spatial partitioning and performance monitoring');
    }
    
    /**
     * Main collision detection update with performance optimization
     */
    updateCollisionDetection(mainPlayer, otherPlayers) {
        const currentTime = performance.now();
        
        try {
            // Frame rate limiting - only update at specified interval
            if (currentTime - this.lastUpdateTime < this.updateInterval) {
                return;
            }
            
            // Performance monitoring
            const frameStartTime = currentTime;
            
            // Update spatial grid if needed
            this.updateSpatialGrid(mainPlayer, otherPlayers);
            
            // Get nearby players using spatial partitioning
            const nearbyPlayers = this.getNearbyPlayers(mainPlayer);
            
            // Limit collision checks per frame for performance
            const playersToCheck = nearbyPlayers.slice(0, this.maxChecksPerFrame);
            
            // Perform collision detection on nearby players only
            this.checkCollisionsOptimized(mainPlayer, playersToCheck);
            
            // Update performance metrics
            const frameTime = performance.now() - frameStartTime;
            this.updatePerformanceMetrics(frameTime, playersToCheck.length);
            
            this.lastUpdateTime = currentTime;
            
        } catch (error) {
            this.handleCollisionError(error, 'updateCollisionDetection');
        }
    }
    
    /**
     * Spatial partitioning system for efficient collision detection
     */
    updateSpatialGrid(mainPlayer, otherPlayers) {
        const currentTime = performance.now();
        
        // Only update grid at specified intervals
        if (currentTime - this.lastGridUpdate < this.gridUpdateInterval) {
            return;
        }
        
        try {
            // Clear existing grid
            this.spatialGrid.clear();
            
            // Add main player to grid
            this.addToSpatialGrid(mainPlayer);
            
            // Add other players to grid
            otherPlayers.forEach(player => {
                if (player && player.x !== undefined && player.y !== undefined) {
                    this.addToSpatialGrid(player);
                }
            });
            
            this.lastGridUpdate = currentTime;
            
        } catch (error) {
            this.handleCollisionError(error, 'updateSpatialGrid');
        }
    }
    
    addToSpatialGrid(player) {
        if (!player || player.x === undefined || player.y === undefined) {
            return;
        }
        
        const gridX = Math.floor(player.x / this.spatialGridSize);
        const gridY = Math.floor(player.y / this.spatialGridSize);
        const gridKey = `${gridX},${gridY}`;
        
        if (!this.spatialGrid.has(gridKey)) {
            this.spatialGrid.set(gridKey, []);
        }
        
        this.spatialGrid.get(gridKey).push(player);
    }
    
    /**
     * Get nearby players using spatial partitioning
     */
    getNearbyPlayers(mainPlayer) {
        if (!mainPlayer || mainPlayer.x === undefined || mainPlayer.y === undefined) {
            return [];
        }
        
        const nearbyPlayers = [];
        const gridX = Math.floor(mainPlayer.x / this.spatialGridSize);
        const gridY = Math.floor(mainPlayer.y / this.spatialGridSize);
        
        // Check current cell and adjacent cells (3x3 grid)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkGridKey = `${gridX + dx},${gridY + dy}`;
                const cellPlayers = this.spatialGrid.get(checkGridKey);
                
                if (cellPlayers) {
                    cellPlayers.forEach(player => {
                        // Don't include the main player itself
                        if (player !== mainPlayer && player.isOtherPlayer) {
                            nearbyPlayers.push(player);
                        }
                    });
                }
            }
        }
        
        return nearbyPlayers;
    }
    
    /**
     * Optimized collision detection with debouncing
     */
    checkCollisionsOptimized(mainPlayer, nearbyPlayers) {
        if (!mainPlayer || !mainPlayer.body) {
            return;
        }
        
        const currentCollisions = new Set();
        
        nearbyPlayers.forEach(otherPlayer => {
            try {
                if (!otherPlayer || !otherPlayer.body || !otherPlayer.playerData) {
                    return;
                }
                
                const playerId = otherPlayer.playerData.id;
                
                // Fast distance check using squared distance (avoid sqrt)
                const dx = mainPlayer.x - otherPlayer.x;
                const dy = mainPlayer.y - otherPlayer.y;
                const distanceSquared = dx * dx + dy * dy;
                const collisionThresholdSquared = this.scene.collisionSensitivity * this.scene.collisionSensitivity;
                
                const isColliding = distanceSquared <= collisionThresholdSquared;
                const wasColliding = this.collisionStates.has(playerId);
                
                if (isColliding) {
                    currentCollisions.add(playerId);
                    
                    if (!wasColliding) {
                        // New collision detected - use debouncing
                        this.handleCollisionStart(playerId, mainPlayer, otherPlayer);
                    }
                } else if (wasColliding) {
                    // Collision ended - use debouncing
                    this.handleCollisionEnd(playerId, mainPlayer, otherPlayer);
                }
                
            } catch (error) {
                this.handleCollisionError(error, 'checkCollisionsOptimized', otherPlayer?.playerData?.id);
            }
        });
        
        // Clean up collision states for players no longer nearby
        this.cleanupCollisionStates(currentCollisions);
    }
    
    /**
     * Check if player is on collision cooldown
     */
    isPlayerOnCooldown(playerId) {
        const cooldownEnd = this.collisionCooldowns.get(playerId);
        return cooldownEnd && Date.now() < cooldownEnd;
    }

    /**
     * Set collision cooldown for player
     */
    setPlayerCooldown(playerId) {
        this.collisionCooldowns.set(playerId, Date.now() + this.cooldownDuration);
    }

    /**
     * Handle collision start with debouncing and cooldown checking
     */
    handleCollisionStart(playerId, mainPlayer, otherPlayer) {
        // Clear any existing end timer for this player
        if (this.debounceTimers.has(`end_${playerId}`)) {
            this.scene.time.removeEvent(this.debounceTimers.get(`end_${playerId}`));
            this.debounceTimers.delete(`end_${playerId}`);
        }
        
        // If already in collision state, don't trigger again
        if (this.collisionStates.has(playerId)) {
            return;
        }
        
        // Check if player is on cooldown from previous collision
        if (this.isPlayerOnCooldown(playerId)) {
            return;
        }
        
        // Set collision state immediately to prevent duplicate events
        this.collisionStates.set(playerId, {
            startTime: Date.now(),
            player: otherPlayer
        });
        
        // Debounce collision start to avoid rapid triggering
        const startTimer = this.scene.time.delayedCall(50, () => {
            try {
                // Verify collision is still active and not on cooldown
                if (this.collisionStates.has(playerId) && !this.isPlayerOnCooldown(playerId)) {
                    otherPlayer.handleCollisionStart(mainPlayer);
                    
                    // Add to scene's collision tracking
                    if (this.scene.currentCollisions) {
                        this.scene.currentCollisions.add(playerId);
                    }
                }
                
                this.debounceTimers.delete(`start_${playerId}`);
            } catch (error) {
                this.handleCollisionError(error, 'handleCollisionStart', playerId);
            }
        });
        
        this.debounceTimers.set(`start_${playerId}`, startTimer);
    }
    
    /**
     * Handle collision end with debouncing and cooldown setting
     */
    handleCollisionEnd(playerId, mainPlayer, otherPlayer) {
        // Clear any existing start timer for this player
        if (this.debounceTimers.has(`start_${playerId}`)) {
            this.scene.time.removeEvent(this.debounceTimers.get(`start_${playerId}`));
            this.debounceTimers.delete(`start_${playerId}`);
        }
        
        // Debounce collision end to avoid rapid triggering
        const endTimer = this.scene.time.delayedCall(this.debounceDelay, () => {
            try {
                // Double-check that collision has actually ended
                if (this.verifyCollisionEnded(mainPlayer, otherPlayer)) {
                    // Remove from collision state
                    this.collisionStates.delete(playerId);
                    
                    // Set cooldown to prevent immediate re-collision
                    this.setPlayerCooldown(playerId);
                    
                    // Trigger collision end event
                    otherPlayer.handleCollisionEnd(mainPlayer);
                    
                    // Remove from scene's collision tracking
                    if (this.scene.currentCollisions) {
                        this.scene.currentCollisions.delete(playerId);
                    }
                }
                
                this.debounceTimers.delete(`end_${playerId}`);
            } catch (error) {
                this.handleCollisionError(error, 'handleCollisionEnd', playerId);
            }
        });
        
        this.debounceTimers.set(`end_${playerId}`, endTimer);
    }
    
    /**
     * Verify that collision has actually ended
     */
    verifyCollisionEnded(mainPlayer, otherPlayer) {
        if (!mainPlayer || !otherPlayer || !mainPlayer.body || !otherPlayer.body) {
            return true; // If players don't exist, collision has ended
        }
        
        const dx = mainPlayer.x - otherPlayer.x;
        const dy = mainPlayer.y - otherPlayer.y;
        const distanceSquared = dx * dx + dy * dy;
        const collisionThresholdSquared = this.scene.collisionSensitivity * this.scene.collisionSensitivity;
        
        return distanceSquared > collisionThresholdSquared;
    }
    
    /**
     * Clean up collision states for players no longer nearby
     */
    cleanupCollisionStates(currentCollisions) {
        const stateKeys = Array.from(this.collisionStates.keys());
        
        stateKeys.forEach(playerId => {
            if (!currentCollisions.has(playerId)) {
                // Player is no longer nearby, check if we should end collision
                const collisionState = this.collisionStates.get(playerId);
                if (collisionState && collisionState.player) {
                    this.handleCollisionEnd(playerId, this.scene.player, collisionState.player);
                }
            }
        });
    }
    
    /**
     * Performance monitoring
     */
    startPerformanceMonitoring() {
        // Monitor performance every second
        this.scene.time.addEvent({
            delay: 1000,
            callback: () => {
                this.logPerformanceMetrics();
            },
            loop: true
        });
    }
    
    updatePerformanceMetrics(frameTime, checksPerformed) {
        this.performanceMetrics.checksPerSecond = checksPerformed;
        this.performanceMetrics.averageCheckTime = frameTime;
        
        // Detect frame drops (>33ms = below 30fps)
        if (frameTime > 33) {
            this.performanceMetrics.frameDrops++;
        }
        
        this.performanceMetrics.lastFrameTime = frameTime;
    }
    
    logPerformanceMetrics() {
        const metrics = this.performanceMetrics;
        
        // Only log if there are performance issues
        if (metrics.frameDrops > 0 || metrics.averageCheckTime > 16) {
            debugWarn('[CollisionOptimizer] Performance metrics:', {
                checksPerSecond: metrics.checksPerSecond,
                averageCheckTime: `${metrics.averageCheckTime.toFixed(2)}ms`,
                frameDrops: metrics.frameDrops,
                spatialGridCells: this.spatialGrid.size,
                activeCollisions: this.collisionStates.size
            });
        }
        
        // Reset frame drops counter
        this.performanceMetrics.frameDrops = 0;
    }
    
    /**
     * Error handling and recovery
     */
    setupErrorRecovery() {
        // Reset error count periodically
        this.scene.time.addEvent({
            delay: this.errorResetInterval,
            callback: () => {
                this.errorCount = 0;
            },
            loop: true
        });
    }
    
    handleCollisionError(error, context, playerId = null) {
        this.errorCount++;
        
        console.error(`[CollisionOptimizer] Error in ${context}:`, error, {
            playerId,
            errorCount: this.errorCount,
            spatialGridSize: this.spatialGrid.size,
            activeCollisions: this.collisionStates.size
        });
        
        // If too many errors, disable collision detection temporarily
        if (this.errorCount >= this.maxErrors) {
            console.error('[CollisionOptimizer] Too many errors, temporarily disabling collision detection');
            this.temporarilyDisableCollisionDetection();
        }
        
        // Clean up any corrupted state for this player
        if (playerId) {
            this.cleanupPlayerState(playerId);
        }
    }
    
    temporarilyDisableCollisionDetection() {
        // Clear all timers and states
        this.cleanup();
        
        // Re-enable after 5 seconds
        this.scene.time.delayedCall(5000, () => {
            debugLog('[CollisionOptimizer] Re-enabling collision detection');
            this.errorCount = 0;
            this.initializeOptimizer();
        });
    }
    
    cleanupPlayerState(playerId) {
        try {
            // Remove from collision states
            this.collisionStates.delete(playerId);
            
            // Remove from cooldown states
            this.collisionCooldowns.delete(playerId);
            
            // Clear any pending timers for this player
            [`start_${playerId}`, `end_${playerId}`].forEach(timerKey => {
                if (this.debounceTimers.has(timerKey)) {
                    this.scene.time.removeEvent(this.debounceTimers.get(timerKey));
                    this.debounceTimers.delete(timerKey);
                }
            });
            
            // Remove from scene collision tracking
            if (this.scene.currentCollisions) {
                this.scene.currentCollisions.delete(playerId);
            }
            
        } catch (error) {
            console.error('[CollisionOptimizer] Error cleaning up player state:', error);
        }
    }
    
    /**
     * Public API methods
     */
    
    /**
     * Set collision sensitivity (detection radius)
     */
    setCollisionSensitivity(radius) {
        if (radius > 0 && radius <= 200) {
            this.scene.collisionSensitivity = radius;
            debugLog(`[CollisionOptimizer] Collision sensitivity set to ${radius}px`);
        } else {
            console.warn('[CollisionOptimizer] Invalid collision sensitivity value');
        }
    }
    
    /**
     * Get current collision statistics
     */
    getCollisionStats() {
        return {
            activeCollisions: this.collisionStates.size,
            playersOnCooldown: this.collisionCooldowns.size,
            spatialGridCells: this.spatialGrid.size,
            debounceTimers: this.debounceTimers.size,
            performanceMetrics: { ...this.performanceMetrics },
            errorCount: this.errorCount
        };
    }
    
    /**
     * Get current collisions
     */
    getCurrentCollisions() {
        return Array.from(this.collisionStates.keys());
    }
    
    /**
     * Force end collision for a specific player
     */
    forceEndCollision(playerId) {
        const collisionState = this.collisionStates.get(playerId);
        if (collisionState) {
            this.handleCollisionEnd(playerId, this.scene.player, collisionState.player);
        }
    }
    
    /**
     * Cleanup method
     */
    cleanup() {
        // Clear all debounce timers
        this.debounceTimers.forEach(timer => {
            this.scene.time.removeEvent(timer);
        });
        this.debounceTimers.clear();
        
        // Clear collision states
        this.collisionStates.clear();
        
        // Clear cooldown states
        this.collisionCooldowns.clear();
        
        // Clear spatial grid
        this.spatialGrid.clear();
        
        debugLog('[CollisionOptimizer] Cleanup completed');
    }
}