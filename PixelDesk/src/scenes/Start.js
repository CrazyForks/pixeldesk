import { WorkstationManager } from '../logic/WorkstationManager.js';

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
        this.workstationManager = null;
    }

    preload() {
        this.loadTilemap();
        this.loadTilesetImages();
        this.loadLibraryImages();
    }

    create() {
        // 初始化工位管理器
        this.workstationManager = new WorkstationManager(this);
        this.setupWorkstationEvents();

        const map = this.createTilemap();
        this.createTilesetLayers(map);
        this.renderObjectLayer(map, 'desk_objs');
        this.setupCamera(map);
        
        // 创建完成后的初始化
        this.time.delayedCall(100, () => {
            this.workstationManager.printStatistics();
            this.setupTestBindings(); // 示例绑定
        });
    }

    update() {
        // No update logic needed for static map display
    }

    // ===== 工位事件处理 =====
    setupWorkstationEvents() {
        // 监听工位相关事件
        this.events.on('workstation-clicked', (data) => {
            console.log('Workstation clicked event:', data);
            // 在这里添加自定义的点击处理逻辑
        });

        this.events.on('user-bound', (data) => {
            console.log('User bound event:', data);
            // 在这里添加用户绑定后的处理逻辑
        });

        this.events.on('user-unbound', (data) => {
            console.log('User unbound event:', data);
            // 在这里添加用户解绑后的处理逻辑
        });
    }

    // ===== 资源加载方法 =====
    loadTilemap() {
        this.load.tilemapTiledJSON('officemap', 'assets/officemap.json');
    }

    loadTilesetImages() {
        const tilesetAssets = {
            'room_builder_walls_image': 'assets/moderninteriors-win/1_Interiors/48x48/Room_Builder_subfiles_48x48/Room_Builder_Walls_48x48.png',
            'pixel_office_assets': 'assets/PixelOffice/PixelOfficeAssets.png',
            'ice_creem_image': 'assets/moderninteriors-win/6_Home_Designs/Ice-Cream_Shop_Designs/48x48/Ice_Cream_Shop_Design_layer_2_48x48.png',
            'ice_creem_floor_image': 'assets/moderninteriors-win/6_Home_Designs/Ice-Cream_Shop_Designs/48x48/Ice_Cream_Shop_Design_layer_1_48x48.png',
            'hospital_image': 'assets/moderninteriors-win/1_Interiors/48x48/Theme_Sorter_48x48/19_Hospital_48x48.png',
            'characters_list_image': 'assets/moderninteriors-win/2_Characters/Old/Single_Characters_Legacy/48x48/Adam_idle_48x48.png'
        };

        Object.entries(tilesetAssets).forEach(([key, path]) => {
            this.load.image(key, path);
        });
    }

    loadLibraryImages() {
        // 默认桌子图像
        this.load.image("desk_image", "assets/moderninteriors-win/1_Interiors/48x48/Theme_Sorter_Singles_48x48/5_Classroom_and_Library_Singles_48x48/Classroom_and_Library_Singles_48x48_10.png");
        
        // 加载完整的图像集
        for (let i = 1; i <= 75; i++) {
            const path = `assets/moderninteriors-win/1_Interiors/48x48/Theme_Sorter_Singles_48x48/5_Classroom_and_Library_Singles_48x48/Classroom_and_Library_Singles_48x48_${i}.png`;
            this.load.image(`desk_${i}`, path);
        }
    }

    // ===== 地图创建方法 =====
    createTilemap() {
        return this.make.tilemap({ key: 'officemap', tileWidth: 48, tileHeight: 48 });
    }

    createTilesetLayers(map) {
        // 添加 tileset
        const tilesets = this.addTilesets(map);
        
        // 创建图层
        const layerNames = ['office_1', 'office_1_desk'];
        layerNames.forEach(layerName => {
            map.createLayer(layerName, tilesets);
        });
    }

    addTilesets(map) {
        const tilesetConfigs = [
            ['room_floor_tileset', 'room_builder_walls_image'],
            ['room_wall_tileset', 'room_builder_walls_image'],
            ['office_tileset_blue', 'pixel_office_assets'],
            ['ice_creem', 'ice_creem_image'],
            ['ice_creem_floor', 'ice_creem_floor_image'],
            ['hospital', 'hospital_image'],
            ['characters_list', 'characters_list_image']
        ];

        return tilesetConfigs.map(([tilesetName, imageKey]) => 
            map.addTilesetImage(tilesetName, imageKey)
        );
    }

    // ===== 对象渲染方法 =====
    renderObjectLayer(map, layerName) {
        const objectLayer = map.getObjectLayer(layerName);
        
        if (!objectLayer) {
            console.warn(`Object layer "${layerName}" not found`);
            return;
        }

        console.log(`Found ${layerName} with ${objectLayer.objects.length} objects`);
        objectLayer.objects.forEach((obj, index) => this.renderObject(obj, index));
    }

    renderObject(obj, index) {
        console.log(`Object ${index}:`, obj);
        
        const adjustedY = obj.y - obj.height;
        let sprite = null;
        
        // 渲染对象
        if (obj.gid) {
            sprite = this.renderTilesetObject(obj, adjustedY);
        } else if (this.isDeskObject(obj)) {
            sprite = this.renderGeometricObject(obj, adjustedY);
        }
        
        // 如果是工位对象，使用工位管理器创建工位
        if (sprite && this.isDeskObject(obj)) {
            this.workstationManager.createWorkstation(obj, sprite);
        }
        
        // 添加调试边界
        this.addDebugBounds(obj, adjustedY);
    }

    renderTilesetObject(obj, adjustedY) {
        const imageKey = this.getImageKeyFromGid(obj.gid);
        if (!imageKey) return null;

        console.log(`Rendering tileset object: ${imageKey} at (${obj.x}, ${adjustedY})`);
        
        const sprite = this.add.image(obj.x, adjustedY, imageKey);
        this.configureSprite(sprite, obj);
        return sprite;
    }

    renderGeometricObject(obj, adjustedY) {
        console.log(`Rendering geometric object at (${obj.x}, ${adjustedY})`);
        
        const sprite = this.add.image(obj.x, adjustedY, 'desk_image');
        this.configureSprite(sprite, obj);
        return sprite;
    }

    configureSprite(sprite, obj) {
        sprite.setOrigin(0, 0);
        if (obj.width && obj.height) {
            sprite.setDisplaySize(obj.width, obj.height);
        }
    }

    // ===== 辅助方法 =====
    isDeskObject(obj) {
        return obj.name === 'desk' || obj.type === 'desk';
    }

    getImageKeyFromGid(gid) {
        const LIBRARY_FIRST_GID = 2601;
        const LIBRARY_LAST_GID = 2676;
        
        if (gid >= LIBRARY_FIRST_GID && gid < LIBRARY_LAST_GID) {
            const tileIndex = gid - LIBRARY_FIRST_GID + 1;
            return `desk_${tileIndex}`;
        }
        
        return null;
    }

    addDebugBounds(obj, adjustedY) {
        const debugRect = this.add.rectangle(
            obj.x, adjustedY, 
            obj.width || 48, obj.height || 48, 
            0xff0000, 0.2
        );
        debugRect.setOrigin(0, 0);
        debugRect.setStrokeStyle(1, 0xff0000);
    }

    setupCamera(map) {
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        console.log(`Map size: ${map.widthInPixels}x${map.heightInPixels}`);
    }

    // ===== 工位管理便捷方法 =====
    // 这些方法提供对工位管理器的便捷访问
    bindUser(workstationId, userId, userInfo) {
        return this.workstationManager.bindUserToWorkstation(workstationId, userId, userInfo);
    }

    unbindUser(workstationId) {
        return this.workstationManager.unbindUserFromWorkstation(workstationId);
    }

    getWorkstation(workstationId) {
        return this.workstationManager.getWorkstation(workstationId);
    }

    getAvailableWorkstations() {
        return this.workstationManager.getAvailableWorkstations();
    }

    // ===== 示例和测试方法 =====
    setupTestBindings() {
        console.log('=== Setting up test bindings ===');
        
        // 获取前几个工位进行测试绑定
        const availableWorkstations = this.workstationManager.getAvailableWorkstations().slice(0, 3);
        
        availableWorkstations.forEach((workstation, index) => {
            const userId = `user_${index + 1}`;
            const userInfo = {
                name: `User ${index + 1}`,
                department: 'Engineering',
                role: 'Developer'
            };
            this.workstationManager.bindUserToWorkstation(workstation.id, userId, userInfo);
        });
        
        console.log('=== Test bindings complete ===');
        this.workstationManager.printStatistics();
    }

    // ===== 清理方法 =====
    shutdown() {
        if (this.workstationManager) {
            this.workstationManager.destroy();
        }
        super.shutdown();
    }
}