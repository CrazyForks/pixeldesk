export class TextUIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TextUIScene' });
    }
    
    create() {
        // 1. 分数文本 (scoreText)
        this.scoreText = this.add.text(20, 20, 'Score: 10000', { 
            fontSize: '24px', // 在1280x720画布上，这是清晰的字体大小
            color:'#FFFFFF',
            stroke: '#000000',
            strokeThickness: 4,
        });
        this.scoreText.setScrollFactor(0).setDepth(1000);

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
        gameScene.events.on('updateUserData', this.updateUserDisplay, this);

        // 立即使用初始数据更新一次
        if (gameScene.userData) {
            this.updateUserDisplay(gameScene.userData);
        }
    }
    
    updateUserDisplay(data) {
        if (data) {
            this.userInfoText.setText(
                `${data.username} | Level ${data.level} | HP: ${data.hp}/${data.maxHp} | Gold: ${data.gold}`
            );
        }
    }
}