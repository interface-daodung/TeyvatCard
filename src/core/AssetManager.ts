import Phaser from 'phaser';
import {
    COIN_ASSETS,
    CHARACTER_ASSETS,
    WEAPON_SWORD_ASSETS,
    WEAPON_POLEARM_ASSETS,
    WEAPON_CLAYMORE_ASSETS,
    WEAPON_CATALYST_ASSETS,
    WEAPON_BOW_ASSETS,
    ENEMY_HILICHURL_ASSETS,
    ENEMY_ABYSS_ASSETS,
    ENEMY_SLIME_ASSETS,
    ENEMY_SHROOM_ASSETS,
    ENEMY_AUTOMATONS_ASSETS,
    ENEMY_KAIRAGI_ASSETS,
    ENEMY_EREMITE_ASSETS,
    ENEMY_FATUI_ASSETS,
    ENEMY_BOSS_ASSETS,
    FOOD_ASSETS,
    TRAP_ASSETS,
    TREASURE_ASSETS,
    BOMB_ASSETS,
    EMPTY_CARD,
    ITEM_ASSETS,
    ELEMENT_ASSETS,
    WEAPON_SWORD_BADGE_ASSETS,
    WEAPON_CATALYST_BADGE_ASSETS,
    BACKGROUND_ASSETS,
    CHARACTER_SPRITE_ASSETS,
    SOUND_EFFECT_ASSETS,
    ANIMATIONS_ASSETS
} from '../utils/AssetConstants.js';

import item from '../data/atlas/item.json';
import character from '../data/atlas/character.json';
import element from '../data/atlas/element.json';
import coin from '../data/atlas/coin.json';
import weapon_sword from '../data/atlas/weapon-sword.json';
import weapon_catalyst from '../data/atlas/weapon-catalyst.json';
import weapon_polearm from '../data/atlas/weapon-polearm.json';
import weapon_claymore from '../data/atlas/weapon-claymore.json';
import weapon_bow from '../data/atlas/weapon-bow.json';

import enemy_hilichurl from '../data/atlas/enemy-hilichurl.json';
import enemy_abyss from '../data/atlas/enemy-abyss.json';
import enemy_slime from '../data/atlas/enemy-slime.json';
import enemy_shroom from '../data/atlas/enemy-shroom.json';
import enemy_automatons from '../data/atlas/enemy-automatons.json';
import enemy_kairagi from '../data/atlas/enemy-kairagi.json';
import enemy_eremite from '../data/atlas/enemy-eremite.json';
import enemy_fatui from '../data/atlas/enemy-fatui.json';
import enemy_boss from '../data/atlas/enemy-boss.json';

import food from '../data/atlas/food.json';
import trap from '../data/atlas/trap.json';
import treasure from '../data/atlas/treasure.json';
import bomb from '../data/atlas/bomb.json';

import weapon_sword_badge from '../data/atlas/weapon-sword-badge.json';
import weapon_catalyst_badge from '../data/atlas/weapon-catalyst-badge.json';
import weapon_polearm_badge from '../data/atlas/weapon-polearm-badge.json';
import weapon_claymore_badge from '../data/atlas/weapon-claymore-badge.json';
import weapon_bow_badge from '../data/atlas/weapon-bow-badge.json';

interface AtlasJsonData {
    meta: {
        image: string;
        path: string;
        size: {
            w: number;
            h: number;
        };
    };
    frames: Record<string, any>;
}

interface AssetFile {
    key: string;
    path: string;
}

export default class AssetManager {
    private static instance: AssetManager;
    private scene: Phaser.Scene | null;

    constructor() {
        if (AssetManager.instance) {
            return AssetManager.instance;
        }
        AssetManager.instance = this;

        this.scene = null;
    }

    /**
     * Set scene reference để có thể load assets
     */
    setScene(scene: Phaser.Scene): void {
        this.scene = scene;
    }

    /**
     * Preload assets cho scene cụ thể với callback
     */
    preloadSceneAssets(sceneName: string, callback?: () => void): void {
        if (!this.scene) {
            console.warn('AssetManager: Scene chưa được set');
            if (callback) callback();
            return;
        }

        // Đăng ký event listener cho load complete
        this.scene.load.on('complete', callback || (() => {}));

        // Thêm assets vào queue
        switch (sceneName) {
            case 'MenuScene':
                this.loadAtlas(item);
                this.loadAtlas(character);
                this.loadImages([...BACKGROUND_ASSETS, ...CHARACTER_SPRITE_ASSETS]);
                break;

            case 'GameScene':
                this.loadAudios([...SOUND_EFFECT_ASSETS]);
                this.loadImages([...ANIMATIONS_ASSETS]);
                this.getLoadImagesListGameScene();
                break;

            case 'EquipScene':
                // this.loadAtlas(item);
                console.log('EquipScene load item assets');
                break;

            case 'LibraryScene':
                // Load các atlas cần thiết cho LibraryScene
                this.loadAtlas(weapon_sword);
                this.loadAtlas(weapon_catalyst);
                this.loadAtlas(weapon_polearm);
                this.loadAtlas(weapon_claymore);
                this.loadAtlas(weapon_bow);
                this.loadAtlas(enemy_hilichurl);
                this.loadAtlas(enemy_abyss);
                this.loadAtlas(enemy_slime);
                this.loadAtlas(enemy_shroom);
                this.loadAtlas(enemy_automatons);
                this.loadAtlas(enemy_kairagi);
                this.loadAtlas(enemy_eremite);
                this.loadAtlas(enemy_fatui);
                this.loadAtlas(enemy_boss);
                this.loadAtlas(food);
                this.loadAtlas(trap);
                this.loadAtlas(treasure);
                this.loadAtlas(bomb);
                this.loadAtlas(coin);
                this.loadImages([...EMPTY_CARD]);
                console.log('LibraryScene load all card atlas assets');
                break;
            case 'MapScenes':
                break;
            case 'SelectCharacterScene':
                this.loadAtlas(element);
                // this.loadImages(ELEMENT_ASSETS);
                break;

            default:
                console.warn(`AssetManager: Không tìm thấy scene "${sceneName}"`);
                if (callback) callback();
                return;
        }

        // Bắt đầu load process THỦ CÔNG để tránh race condition
        this.scene.load.start();
    }

    /**
     * Load sprite sheet với logic tự động
     * Nếu key có đuôi "sprite" thì load như sprite sheet
     */
    loadImage(key: string, path: string): void {
        if (!this.scene) {
            console.warn('AssetManager: Scene chưa được set');
            return;
        }

        if (!this.scene.textures.exists(key)) {
            // Kiểm tra nếu key có đuôi "sprite" thì load như sprite sheet
            if (key.endsWith('sprite')) {
                this.scene.load.spritesheet(key, path, {
                    frameWidth: 350,
                    frameHeight: 590
                });
            } else if (key.endsWith('animations')) {
                this.scene.load.spritesheet(key, path, {
                    frameWidth: 192,
                    frameHeight: 192
                });
            }
            else {
                // Nếu không có đuôi "sprite" thì load như image bình thường
                this.scene.load.image(key, path);
                // console.log(`AssetManager: Đã load image ${key} từ ${path}`);
            }
        } else {
            // console.log(`AssetManager: ${key} đã tồn tại`);
        }
    }

    /**
     * Load nhiều file theo danh sách
     * files = [{key, path}, ...]
     * Tự động phát hiện sprite sheet dựa trên đuôi "sprite"
     */
    loadImages(files: AssetFile[]): void {
        files.forEach(file => this.loadImage(file.key, file.path));
    }

    /**
     * Load images từ atlas JSON data
     * @param jsonData - JSON data chứa thông tin atlas
     * @param jsonData.meta.image - Tên file atlas image
     * @param jsonData.meta.path - Đường dẫn tương đối đến file atlas image
     * @param jsonData.meta.size - Kích thước atlas (w, h)
     * @param jsonData.frames - Object chứa thông tin frames với key và frame data
     */
    loadAtlas(jsonData: AtlasJsonData): void {
        if (!this.scene) {
            console.warn('AssetManager: Scene chưa được set');
            return;
        }

        // Tạo key cho atlas (sử dụng tên từ JSON hoặc tạo key mặc định)
        const atlasKey = jsonData.meta.image.replace('.webp', '');

        // Kiểm tra nếu atlas đã tồn tại thì không load lại
        if (this.scene.textures.exists(atlasKey)) {
            // console.log(`AssetManager: Atlas ${atlasKey} đã tồn tại`);
            return;
        }

        // Sử dụng path từ metadata nếu có, nếu không thì fallback về cách cũ
        const imageURL = jsonData.meta.path.replace(/^\.\.\\public\\/, '').replace(/\\/g, '/');

        // Sử dụng Phaser's built-in load.atlas method
        this.scene.load.atlas(atlasKey, imageURL, jsonData);
    }

    /**
     * Load audio files
     */
    loadAudio(key: string, path: string): void {
        if (!this.scene) {
            console.warn('AssetManager: Scene chưa được set');
            return;
        }

        if (!this.scene.cache.audio.exists(key)) {
            this.scene.load.audio(key, path);
        }
    }

    /**
     * Load nhiều audio files
     */
    loadAudios(files: AssetFile[]): void {
        files.forEach(file => this.loadAudio(file.key, file.path));
    }

    /**
     * Lấy danh sách tất cả assets cần load cho GameScene
     */
    getLoadImagesListGameScene(): AssetFile[] {
        let loadImagesList: AssetFile[] = [];

        // loadImagesList.push(...CHARACTER_SPRITE_ASSETS);
        this.loadAtlas(item);
        this.loadAtlas(character);

        this.loadAtlas(coin);

        this.loadAtlas(weapon_sword);

        // this.loadAtlas(weapon_catalyst);

        // this.loadAtlas(weapon_polearm);

        // this.loadAtlas(weapon_claymore);

        this.loadAtlas(enemy_hilichurl);



        // loadImagesList.push(...WEAPON_POLEARM_ASSETS);
        // loadImagesList.push(...WEAPON_CLAYMORE_ASSETS);
        // loadImagesList.push(...WEAPON_BOW_ASSETS);


        // loadImagesList.push(...ENEMY_SLIME_ASSETS);

        // loadImagesList.push(...ENEMY_ABYSS_ASSETS);
        // loadImagesList.push(...ENEMY_SHROOM_ASSETS);
        // loadImagesList.push(...ENEMY_AUTOMATONS_ASSETS);
        // loadImagesList.push(...ENEMY_KAIRAGI_ASSETS);
        // loadImagesList.push(...ENEMY_EREMITE_ASSETS);
        // loadImagesList.push(...ENEMY_FATUI_ASSETS);
        // loadImagesList.push(...ENEMY_BOSS_ASSETS);
        this.loadAtlas(food);
        this.loadAtlas(trap);
        this.loadAtlas(treasure);
        this.loadAtlas(bomb);

        this.loadAtlas(weapon_sword_badge);
        // this.loadAtlas(weapon_catalyst_badge);
        // this.loadAtlas(weapon_polearm_badge);
        // this.loadAtlas(weapon_claymore_badge);
        // this.loadAtlas(weapon_bow_badge);
        // this.loadAtlas(enemy_abyss);
        // this.loadAtlas(enemy_slime);
        // this.loadAtlas(enemy_shroom);
        // this.loadAtlas(enemy_automatons);
        // this.loadAtlas(enemy_kairagi);
        // this.loadAtlas(enemy_eremite);
        // this.loadAtlas(enemy_fatui);
        // this.loadAtlas(enemy_boss);
        // loadImagesList.push(...FOOD_ASSETS);
        // loadImagesList.push(...TRAP_ASSETS);
        // loadImagesList.push(...TREASURE_ASSETS);
        // loadImagesList.push(...BOMB_ASSETS);
        // loadImagesList.push(...EMPTY_CARD);

        // loadImagesList.push(...WEAPON_SWORD_BADGE_ASSETS);
        // loadImagesList.push(...WEAPON_CATALYST_BADGE_ASSETS);


        // this.loadImages(loadImagesList);
        return loadImagesList;
    }


}

// Export singleton instance
export const assetManager = new AssetManager();
