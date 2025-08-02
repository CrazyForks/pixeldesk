import { Start } from './scenes/Start.js';
import { TextUIScene } from './scenes/TextUIScene.js';

const config = {
    type: Phaser.CANVAS,
    title: 'Overlord Rising',
    description: '',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: true,
    scene: [
        Start,
        TextUIScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 }, // 顶视角游戏不需要重力
            debug: true // 设为 true 可以看到碰撞盒
        }
    }
}

new Phaser.Game(config);