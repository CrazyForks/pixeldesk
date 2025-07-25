import { Start } from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 2280,
    height: 2920,
    backgroundColor: '#000000',
    pixelArt: true,
    scene: [
        Start
    ],
    scale: {
        mode: Phaser.Scale.ENVELOP,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 }, // 顶视角游戏不需要重力
            debug: false // 设为 true 可以看到碰撞盒
        }
    }
}

new Phaser.Game(config);
            