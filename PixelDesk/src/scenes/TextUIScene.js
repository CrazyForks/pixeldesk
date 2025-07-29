export class TextUIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TextUIScene' });
    }
    
    create() {
        console.log('TextUIScene created');


        // 创建分数文本显示
        this.scoreText = this.add.text(100, 100, '10000', { 
            fontSize: '88px', 
            color:'#043DAC',
            stroke: '#FFFFFF',
            strokeThickness: 6,
        });
        // 确保文本固定在屏幕上，不随摄像机移动
        this.scoreText.setScrollFactor(0);
        // 设置文本层级，确保在最上层显示
        this.scoreText.setDepth(1000);

        // 创建用户数据显示
        this.userInfoBg = this.add.rectangle(
            this.scale.width / 2, 25, 
            this.scale.width - 20, 40, 
            0x000000, 0.7
        ).setScrollFactor(0).setDepth(999);
        
        this.userInfoText = this.add.text(
            this.scale.width / 2, 25, 
            'Loading...', 
            {
                fontSize: '16px',
                fill: '#ffffff',
                align: 'center'
            }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(1000);
        
        // 监听游戏数据更新事件
        this.scene.get('Start').events.on('updateUserData', (data) => {
            this.updateUserDisplay(data);
        });
    }
    
    updateUserDisplay(data) {
        this.userInfoText.setText(
            `${data.username} | Level ${data.level} | HP: ${data.hp}/${data.maxHp} | Gold: ${data.gold}`
        );
    }
}