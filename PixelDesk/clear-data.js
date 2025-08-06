// 清除PixelDesk相关数据的脚本
// 在浏览器控制台中运行

// 清除所有相关数据
localStorage.removeItem('pixelDeskUser');
localStorage.removeItem('playerState');
localStorage.removeItem('cameraZoom');

console.log('已清除所有PixelDesk相关数据：');
console.log('- pixelDeskUser (用户数据)');
console.log('- playerState (玩家状态)');
console.log('- cameraZoom (相机缩放)');

// 显示当前localStorage中的所有数据
console.log('\n当前localStorage中剩余的数据：');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`- ${key}: ${localStorage.getItem(key)}`);
}

console.log('\n请刷新页面以重新开始');