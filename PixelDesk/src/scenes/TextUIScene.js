export class TextUIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TextUIScene' });
        this.deskCount = 0; // 添加桌子数量属性
        this.userData = null; // 用户数据
    }
    
    create() {
      
        // 2. 用户信息栏 (userInfo)
        const infoBarHeight = 40;
        const fontSize = '18px';

        this.userInfoBg = this.add.rectangle(
            this.scale.width / 2, 
            infoBarHeight / 2, 
            this.scale.width, 
            infoBarHeight, 
            0x000000, 0.6
        );
        this.userInfoBg.setScrollFactor(0).setDepth(999);
        
        this.userInfoText = this.add.text(
            this.scale.width / 2, 
            infoBarHeight / 2, 
            'Loading...', 
            {
                fontSize: fontSize,
                fill: '#ffffff',
                align: 'center'
            }
        );
        this.userInfoText.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(1000);
        
        // 监听游戏数据更新事件
        const gameScene = this.scene.get('Start');

        // 立即使用初始数据更新一次
        if (gameScene.userData) {
            this.updateUserDisplay(gameScene.userData);
        }

        // 监听用户数据更新事件
        if (gameScene) {
            gameScene.events.on('update-user-data', (data) => {
                this.userData = data;
                this.updateUserDisplay(data);
            });
        }
    }
    
    updateUserDisplay(data) {
        if (data) {
            const points = data.points || 0;
            const username = data.username || 'Player';
            const deskCount = data.deskCount || this.deskCount;
            const workstationId = data.workstationId || '';
            
            let displayText = `${username} | 积分: ${points} | 桌子: ${deskCount}`;
            if (workstationId) {
                displayText += ` | 工位: ${workstationId}`;
            }
            
            this.userInfoText.setText(displayText);
        }
    }
    
    updateDeskCount(count) {
        console.log('updateDeskCount', count)
        this.deskCount = count;

        // 重新更新显示以包含桌子数量
        if (this.userData) {
            // 创建新的数据对象，包含更新的deskCount
            const updatedData = {
                ...this.userData,
                deskCount: count
            };
            this.updateUserDisplay(updatedData);
        } else {
            const gameScene = this.scene.get('Start');
            if (gameScene.userData) {
                // 创建新的数据对象，包含更新的deskCount
                const updatedData = {
                    ...gameScene.userData,
                    deskCount: count
                };
                this.updateUserDisplay(updatedData);
            }
        }
    }
}