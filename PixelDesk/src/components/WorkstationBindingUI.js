export class WorkstationBindingUI {
    constructor(scene) {
        this.scene = scene;
        this.bindingWindow = null;
        this.isVisible = false;
        this.currentWorkstation = null;
    }

    show(workstation, user) {
        if (this.isVisible) return;

        this.currentWorkstation = workstation;
        this.currentuser = user;
        this.createBindingWindow();
        this.isVisible = true;
    }

    hide() {
        if (!this.isVisible) return;

        if (this.bindingWindow) {
            this.bindingWindow.destroy();
            this.bindingWindow = null;
        }
        this.isVisible = false;
        this.currentWorkstation = null;
    }

    createBindingWindow() {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        // 创建半透明背景
        const bg = this.scene.add.rectangle(
            centerX,
            centerY,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.6
        );
        bg.setScrollFactor(0);
        bg.setDepth(999); // 背景在按钮下方

        // 创建绑定窗口
        const windowBg = this.scene.add.rectangle(
            centerX,
            centerY,
            400,
            250,
            0x2a2a2a,
            0.95
        );
        windowBg.setScrollFactor(0);
        windowBg.setStrokeStyle(2, 0x4a9eff);
        windowBg.setDepth(999); // 窗口在按钮下方

        // 标题
        const title = this.scene.add.text(
            centerX,
            centerY - 80,
            '工位绑定',
            {
                fontSize: '24px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        title.setOrigin(0.5);
        title.setScrollFactor(0);
        title.setDepth(1001); // 文本在按钮上方

        // 工位信息
        const infoText = this.scene.add.text(
            centerX,
            centerY - 40,
            `工位ID: ${this.currentWorkstation.id}\n位置: (${Math.floor(this.currentWorkstation.position.x)}, ${Math.floor(this.currentWorkstation.position.y)})\n类型: ${this.currentWorkstation.type}`,
            {
                fontSize: '16px',
                fill: '#cccccc',
                fontFamily: 'Arial',
                align: 'center'
            }
        );
        infoText.setOrigin(0.5);
        infoText.setScrollFactor(0);
        infoText.setDepth(1001); // 文本在按钮上方

        // 费用信息
        const costText = this.scene.add.text(
            centerX,
            centerY + 20,
            '绑定费用: 5积分 (30天)',
            {
                fontSize: '18px',
                fill: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        costText.setOrigin(0.5);
        costText.setScrollFactor(0);
        costText.setDepth(1001); // 文本在按钮上方

        // 用户积分
        const userPointsText = this.scene.add.text(
            centerX,
            centerY + 50,
            `您的积分: ${this.currentuser.points}`,
            {
                fontSize: '16px',
                fill: '#4a9eff',
                fontFamily: 'Arial'
            }
        );
        userPointsText.setOrigin(0.5);
        userPointsText.setScrollFactor(0);
        userPointsText.setDepth(1001); // 文本在按钮上方

        // 创建按钮
        const buttons = this.createButtons(centerX, centerY + 90);

        // 存储窗口组件
        this.bindingWindow = this.scene.add.container(0, 0, [
            bg, windowBg, title, infoText, costText, userPointsText, ...buttons
        ]);
        this.bindingWindow.setScrollFactor(0);
        this.bindingWindow.setDepth(1000); // 容器深度
    }

    createButtons(centerX, centerY) {
        // 确认按钮
        const confirmButton = this.scene.add.rectangle(
            centerX - 80,
            centerY,
            120,
            40,
            0x4a9eff
        );
        confirmButton.setScrollFactor(0);
        confirmButton.setInteractive();
        confirmButton.setDepth(1000); // 确保按钮在最上层

        const confirmText = this.scene.add.text(
            centerX - 80,
            centerY,
            '确认绑定',
            {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        confirmText.setOrigin(0.5);
        confirmText.setScrollFactor(0);
        confirmText.setDepth(1001); // 文本在按钮上方

        // 取消按钮
        const cancelButton = this.scene.add.rectangle(
            centerX + 80,
            centerY,
            120,
            40,
            0x666666
        );
        cancelButton.setScrollFactor(0);
        cancelButton.setInteractive();
        cancelButton.setDepth(1000); // 确保按钮在最上层

        const cancelText = this.scene.add.text(
            centerX + 80,
            centerY,
            '取消',
            {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        cancelText.setOrigin(0.5);
        cancelText.setScrollFactor(0);
        cancelText.setDepth(1001); // 文本在按钮上方

        // 按钮事件
        confirmButton.on('pointerdown', () => {
            console.log('确认按钮被点击');
            this.handleConfirm();
        });
        confirmButton.on('pointerover', () => confirmButton.setFillStyle(0x5aafff));
        confirmButton.on('pointerout', () => confirmButton.setFillStyle(0x4a9eff));

        cancelButton.on('pointerdown', () => {
            console.log('取消按钮被点击');
            this.handleCancel();
        });
        cancelButton.on('pointerover', () => cancelButton.setFillStyle(0x777777));
        cancelButton.on('pointerout', () => cancelButton.setFillStyle(0x666666));

        // 返回按钮组件数组
        return [confirmButton, confirmText, cancelButton, cancelText];
    }

    async handleConfirm() {
        try {
            const result = await this.scene.workstationManager.purchaseWorkstation(
                this.currentWorkstation.id,
                this.currentuser.id,
                this.currentuser
            );

            if (result.success) {
                // 更新用户积分
                this.currentuser.points = result.remainingPoints;
                
                // 保存用户数据
                localStorage.setItem('pixelDeskUser', JSON.stringify(this.currentuser));
                
                // 显示成功消息
                this.showMessage('绑定成功！', 0x4a9eff);
                
                // 更新UI显示
                this.scene.events.emit('user-points-updated', {
                    userId: this.currentuser.id,
                    points: result.remainingPoints
                });
                
                // 延迟关闭窗口
                setTimeout(() => {
                    this.hide();
                    // 重新启用玩家移动
                    this.scene.time.delayedCall(50, () => {
                        if (this.scene.player && typeof this.scene.player.enableMovement === 'function') {
                            this.scene.player.enableMovement();
                        }
                    });
                }, 1500);
            } else {
                this.showMessage(result.error, 0xff4444);
            }
        } catch (error) {
            console.error('绑定失败:', error);
            this.showMessage('绑定失败，请重试', 0xff4444);
        }
    }

    handleCancel() {
        this.hide();
        // 重新启用玩家移动
        this.scene.time.delayedCall(50, () => {
            if (this.scene.player && typeof this.scene.player.enableMovement === 'function') {
                this.scene.player.enableMovement();
            }
        });
    }

    showMessage(message, color = 0x4a9eff) {
        const centerX = this.scene.cameras.main.width / 2;
        const centerY = this.scene.cameras.main.height / 2;

        const messageText = this.scene.add.text(
            centerX,
            centerY + 140,
            message,
            {
                fontSize: '16px',
                fill: `#${color.toString(16).padStart(6, '0')}`,
                fontFamily: 'Arial'
            }
        );
        messageText.setOrigin(0.5);
        messageText.setScrollFactor(0);

        this.bindingWindow.add(messageText);

        // 3秒后移除消息
        setTimeout(() => {
            if (messageText && messageText.active) {
                messageText.destroy();
            }
        }, 3000);
    }

    update() {
        // 可以在这里添加更新逻辑
    }
}