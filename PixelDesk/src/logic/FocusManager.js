/**
 * 焦点管理器 - 解决Phaser键盘输入与Next.js输入框的冲突问题
 *
 * 功能：
 * 1. 检测输入框焦点状态
 * 2. 检测鼠标位置
 * 3. 管理Phaser键盘监听的启用/禁用
 * 4. 提供焦点状态变化回调
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
export class FocusManager {
    constructor(scene) {
        this.scene = scene;
        this.isGameFocused = true;  // 默认游戏有焦点
        this.isInputFocused = false;
        this.isMouseOverUI = false;
        this.keyboardEnabled = true;  // 默认启用键盘
        
        // 回调函数列表
        this.onFocusChangeCallbacks = [];
        
        this.init();
    }
    
    init() {
        this.setupInputFocusDetection();
        this.setupMouseOverDetection();
        this.setupCanvasFocusDetection();
        
        // 初始化时设置键盘捕获
        this.updatePhaserKeyboardCapture(this.keyboardEnabled);
        
        debugLog('🎯 FocusManager initialized');
    }
    
    // ===== 输入框焦点检测 =====
    setupInputFocusDetection() {
        // 监听所有输入框的focus和blur事件
        document.addEventListener('focusin', (event) => {
            const isInputElement = this.isInputElement(event.target);
            
            debugLog('🔍 Focus in event:', {
                tagName: event.target.tagName,
                type: event.target.type,
                className: event.target.className,
                id: event.target.id,
                isInputElement: isInputElement,
                currentInputFocused: this.isInputFocused
            });
            
            if (isInputElement) {
                this.setInputFocused(true);
                debugLog('📝 Input focused - keyboard disabled for game');
            }
        });
        
        document.addEventListener('focusout', (event) => {
            const isInputElement = this.isInputElement(event.target);
            
            debugLog('🔍 Focus out event:', {
                tagName: event.target.tagName,
                type: event.target.type,
                className: event.target.className,
                id: event.target.id,
                isInputElement: isInputElement,
                currentInputFocused: this.isInputFocused
            });
            
            if (isInputElement) {
                // 延迟一点检查，确保焦点真的离开了输入框
                setTimeout(() => {
                    const activeElement = document.activeElement;
                    const stillInInput = this.isInputElement(activeElement);
                    
                    debugLog('🔍 Delayed focus check:', {
                        activeElementTag: activeElement?.tagName,
                        activeElementType: activeElement?.type,
                        stillInInput: stillInInput
                    });
                    
                    if (!stillInInput) {
                        this.setInputFocused(false);
                        debugLog('📝 Input blurred - keyboard enabled for game');
                    }
                }, 50);
            }
        });
    }
    
    // 检查元素是否为输入元素 - 更精确的检测
    isInputElement(element) {
        if (!element) return false;
        
        const tagName = element.tagName.toLowerCase();
        
        // 检查基本输入标签
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
            // 对于input元素，排除一些不需要文本输入的类型
            if (tagName === 'input') {
                const inputType = element.type.toLowerCase();
                const nonTextInputTypes = ['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'image'];
                if (nonTextInputTypes.includes(inputType)) {
                    return false;
                }
            }
            return true;
        }
        
        // 检查contenteditable元素
        if (element.contentEditable === 'true') {
            return true;
        }
        
        // 检查是否有明确的文本输入角色
        if (element.getAttribute('role') === 'textbox') {
            return true;
        }
        
        // 检查是否在输入相关的容器内
        const inputContainerSelectors = [
            '.form-control',
            '.input-group',
            '[data-input]',
            '[data-input-container]',
            'form input',
            'form textarea'
        ];
        
        for (const selector of inputContainerSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        }
        
        return false;
    }
    
    // ===== 鼠标位置检测 ===== 
    setupMouseOverDetection() {
        // 添加防抖以减少mousemove事件的处理频率
        let mouseMoveTimeout = null;
        
        // 检测鼠标是否在UI区域 - 使用防抖优化性能
        document.addEventListener('mousemove', (event) => {
            if (mouseMoveTimeout) return; // 跳过过于频繁的事件
            
            mouseMoveTimeout = setTimeout(() => {
                const isOverUI = this.isMouseOverUIElement(event.target);
                
                if (isOverUI !== this.isMouseOverUI) {
                    this.setMouseOverUI(isOverUI);
                }
                mouseMoveTimeout = null;
            }, 50); // 50ms防抖，减少高频率的检查
        });
        
        // 检测鼠标离开窗口
        document.addEventListener('mouseleave', () => {
            this.setMouseOverUI(false);
        });
    }
    
    // 检查鼠标是否在UI元素上
    isMouseOverUIElement(element) {
        if (!element) return false;
        
        // 检查是否是Phaser canvas
        if (element.tagName === 'CANVAS' && element.id === 'phaser-game') {
            return false;
        }
        
        // 检查是否在UI容器内
        const uiSelectors = [
            '.ui-container',
            '.tab-container',
            '.modal',
            '.dropdown',
            '.menu',
            '[data-ui-element]',
            'input',
            'textarea',
            'button',
            'select'
        ];
        
        for (const selector of uiSelectors) {
            if (element.matches && element.matches(selector)) {
                return true;
            }
            if (element.closest && element.closest(selector)) {
                return true;
            }
        }
        
        return false;
    }
    
    // ===== Canvas焦点检测 =====
    setupCanvasFocusDetection() {
        const canvas = this.scene.game.canvas;
        
        if (canvas) {
            // 使Canvas可聚焦
            canvas.tabIndex = 0;
            
            canvas.addEventListener('focus', () => {
                this.setGameFocused(true);
                debugLog('🎮 Game canvas focused');
            });
            
            canvas.addEventListener('blur', () => {
                this.setGameFocused(false);
                debugLog('🎮 Game canvas blurred');
            });
            
            // 点击canvas时自动聚焦
            canvas.addEventListener('click', () => {
                if (!this.isInputFocused) {
                    canvas.focus();
                }
            });
        }
    }
    
    // ===== 状态管理方法 =====
    setInputFocused(focused) {
        if (this.isInputFocused !== focused) {
            this.isInputFocused = focused;
            this.updateKeyboardState();
            this.notifyFocusChange();
        }
    }
    
    setMouseOverUI(overUI) {
        if (this.isMouseOverUI !== overUI) {
            this.isMouseOverUI = overUI;
            this.updateKeyboardState();
            this.notifyFocusChange();
        }
    }
    
    setGameFocused(focused) {
        if (this.isGameFocused !== focused) {
            this.isGameFocused = focused;
            this.updateKeyboardState();
            this.notifyFocusChange();
        }
    }
    
    // 更新键盘监听状态
    updateKeyboardState() {
        // 简化的键盘输入启用条件：
        // 只有当输入框明确被聚焦时才禁用键盘输入
        // 这样可以避免过度限制游戏操作
        const shouldEnable = !this.isInputFocused;
        
        if (this.keyboardEnabled !== shouldEnable) {
            this.keyboardEnabled = shouldEnable;
            
            // 动态控制Phaser的键盘捕获
            this.updatePhaserKeyboardCapture(shouldEnable);
            
            debugLog(`⌨️ Keyboard input ${shouldEnable ? 'ENABLED' : 'DISABLED'} for game`);
            debugLog(`   - Input focused: ${this.isInputFocused}`);
            if (this.isInputFocused) {
                debugLog(`   - Active element: ${document.activeElement?.tagName || 'unknown'}`);
            }
        }
    }
    
    // 动态控制Phaser键盘捕获 - 简化版本，不再需要addCapture/removeCapture
    updatePhaserKeyboardCapture(shouldEnable) {
        // 现在通过handlePlayerMovement中的shouldHandleKeyboard()检查来控制
        // 不需要动态添加/移除键盘捕获，因为我们改为手动检查键盘状态
        debugLog(`⌨️ Keyboard input ${shouldEnable ? 'ENABLED' : 'DISABLED'} for game (via movement check)`);
    }
    
    // ===== 回调管理 =====
    onFocusChange(callback) {
        this.onFocusChangeCallbacks.push(callback);
    }
    
    notifyFocusChange() {
        const state = {
            isGameFocused: this.isGameFocused,
            isInputFocused: this.isInputFocused,
            isMouseOverUI: this.isMouseOverUI,
            keyboardEnabled: this.keyboardEnabled
        };
        
        this.onFocusChangeCallbacks.forEach(callback => {
            try {
                callback(state);
            } catch (error) {
                console.error('Focus change callback error:', error);
            }
        });
    }
    
    // ===== 公共API =====
    
    // 检查是否应该处理键盘输入
    shouldHandleKeyboard() {
        return this.keyboardEnabled;
    }
    
    // 强制启用键盘输入（谨慎使用）
    forceEnableKeyboard() {
        this.keyboardEnabled = true;
        debugLog('⌨️ Keyboard input FORCE ENABLED');
    }
    
    // 强制禁用键盘输入
    forceDisableKeyboard() {
        this.keyboardEnabled = false;
        debugLog('⌨️ Keyboard input FORCE DISABLED');
    }
    
    // 获取当前焦点状态
    getFocusState() {
        return {
            isGameFocused: this.isGameFocused,
            isInputFocused: this.isInputFocused,
            isMouseOverUI: this.isMouseOverUI,
            keyboardEnabled: this.keyboardEnabled
        };
    }
    
    // 调试信息
    debugFocusState() {
        const state = this.getFocusState();
        debugLog('🔍 Focus State Debug:');
        debugLog('  Game Focused:', state.isGameFocused);
        debugLog('  Input Focused:', state.isInputFocused);
        debugLog('  Mouse Over UI:', state.isMouseOverUI);
        debugLog('  Keyboard Enabled:', state.keyboardEnabled);
        debugLog('  Active Element:', document.activeElement?.tagName, document.activeElement?.type);
    }
    
    // 清理方法
    destroy() {
        // 移除所有事件监听器
        // 注意：这里只是示例，实际实现需要保存事件处理器的引用以便移除
        debugLog('🎯 FocusManager destroyed');
    }
}