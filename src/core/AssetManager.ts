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
    ANIMATIONS_ASSETS,
    BGM_ASSETS,
    // HILICHURL_TOKEN_UI_ASSETS
} from '../utils/AssetConstants.js';
import { dataManager } from './DataManager.js';
import { Log } from '../utils/Log.js';

/** Danh sách atlas JSON theo scene (đường dẫn trong public/data, đọc qua DataManager) */
const ATLAS_PATHS_BY_SCENE: Record<string, string[]> = {
    MenuScene: [
        'atlas/item.json',
        'atlas/character.json',
        'atlas/coin.json',
    ],
    GameScene: [
        // 'atlas/item.json',
        'atlas/character.json',
        'atlas/coin.json',
        'atlas/weapon-catalyst.json',
        'atlas/weapon-sword.json',
        'atlas/enemy-hilichurl.json',
        'atlas/food.json',
        'atlas/trap.json',
        'atlas/treasure.json',
        'atlas/bomb.json',
        'atlas/weapon-sword-badge.json',
        'atlas/weapon-catalyst-badge.json',
    ],
    LibraryScene: [
        'atlas/weapon-sword.json',
        'atlas/weapon-catalyst.json',
        'atlas/weapon-polearm.json',
        'atlas/weapon-claymore.json',
        'atlas/weapon-bow.json',
        'atlas/enemy-hilichurl.json',
        'atlas/enemy-abyss.json',
        'atlas/enemy-slime.json',
        'atlas/enemy-shroom.json',
        'atlas/enemy-automatons.json',
        'atlas/enemy-kairagi.json',
        'atlas/enemy-eremite.json',
        'atlas/enemy-fatui.json',
        'atlas/enemy-boss.json',
        'atlas/food.json',
        'atlas/trap.json',
        'atlas/treasure.json',
        'atlas/bomb.json',
        'atlas/coin.json',

    ],
    SelectCharacterScene: [
        'atlas/element.json',
        'atlas/coin.json',
    ],
    EquipScene: [
        'atlas/item.json',
    ],
};

/** Bật log debug (sửa thành true khi cần trace load atlas) */
const DEBUG_ATLAS_LOAD = false;
function debugLog(...args: unknown[]): void {
    if (DEBUG_ATLAS_LOAD) {
        Log.info('[AssetManager]', ...args);
    }
}

interface AtlasJsonData {
    meta: {
        image: string;
        path: string;
        size: {
            w: number;
            h: number;
        };
    };
    frames: Record<string, unknown>;
}

function isAtlasJsonData(obj: unknown): obj is AtlasJsonData {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    if (!o.meta || typeof o.meta !== 'object') return false;
    const meta = o.meta as Record<string, unknown>;
    return (
        typeof meta.image === 'string' &&
        typeof meta.path === 'string' &&
        o.frames != null &&
        typeof o.frames === 'object'
    );
}

interface AssetFile {
    key: string;
    path: string;
}

interface LibraryCardEntry {
    id?: string;
    type?: string;
    className?: string;
    image?: string;
}

interface DungeonStage {
    availableCards?: Record<string, unknown>;
}

export default class AssetManager {
    private static instance: AssetManager;
    private scene: Phaser.Scene | null;
    private isAtlasMode = false;
    private assetVariantCache: 'desktop' | 'mobile' = 'desktop';
    private gpuProfileResolved = false;
    private loadErrorHookedScene: Phaser.Scene | null = null;

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
        this.bindDetailedLoadErrorLogger();
    }

    /**
     * Preload assets cho scene cụ thể với callback.
     * Atlas JSON đọc từ public/data qua DataManager (batch: queue JSON → load xong lấy từ cache → loadAtlas).
     */
    preloadSceneAssets(sceneName: string, callback?: () => void): void {
        if (!this.scene) {
            Log.warn('[AssetManager] Scene chưa được set');
            if (callback) callback();
            return;
        }

        // Tạm thời cho phép GameScene chuyển qua cơ chế load ảnh đơn để so sánh hiệu năng.
        const isGameSceneSingleImageMode = sceneName === 'GameScene' && !this.isAtlasMode;
        const atlasPaths = isGameSceneSingleImageMode ? [] : (ATLAS_PATHS_BY_SCENE[sceneName] ?? []);
        const onAllLoaded = callback ?? (() => {});

        if (atlasPaths.length > 0) {
            // Phase 1: queue tất cả atlas JSON (đọc từ public/data qua DataManager)
            debugLog(`preloadSceneAssets(${sceneName}): queue ${atlasPaths.length} atlas JSON`);
            for (const dataPath of atlasPaths) {
                dataManager.queueJsonFromData(this.scene, dataPath);
            }
            this.scene.load.once('complete', () => {
                this.onAtlasJsonBatchComplete(sceneName, atlasPaths, onAllLoaded);
            });
            this.scene.load.start();
        } else {
            // Scene không dùng atlas hoặc không trong map: chỉ load images/audios (nếu có)
            this.queueNonAtlasAssets(sceneName);
            this.scene.load.once('complete', onAllLoaded);
            this.scene.load.start();
        }
    }

    /**
     * Sau khi load xong batch atlas JSON: lấy từ cache, loadAtlas từng cái, rồi queue images/audios và start lại.
     */
    private onAtlasJsonBatchComplete(sceneName: string, atlasPaths: string[], callback: () => void): void {
        if (!this.scene) {
            callback();
            return;
        }

        for (const dataPath of atlasPaths) {
            const cacheKey = dataManager.getDataCacheKey(dataPath);
            const raw = dataManager.getJsonFromCache<unknown>(this.scene, cacheKey);
            if (!raw) {
                Log.warn('[AssetManager] Atlas JSON chưa có trong cache:', dataPath, 'cacheKey:', cacheKey);
                continue;
            }
            if (!isAtlasJsonData(raw)) {
                Log.warn('[AssetManager] Atlas JSON không đúng format (meta.image/path, frames):', dataPath);
                continue;
            }
            this.loadAtlas(raw);
            debugLog('loadAtlas from cache:', cacheKey);
        }

        // Queue thêm images/audios cho scene
        this.queueNonAtlasAssets(sceneName);
        this.scene.load.once('complete', callback);
        this.scene.load.start();
    }

    /**
     * Thêm vào queue loader: images, audios cho scene (không gồm atlas – atlas đã xử lý riêng).
     */
    private queueNonAtlasAssets(sceneName: string): void {
        if (!this.scene) return;

        switch (sceneName) {
            case 'MenuScene':
                this.loadImages([...BACKGROUND_ASSETS, ...CHARACTER_SPRITE_ASSETS]);
                this.loadAudios([...BGM_ASSETS]);
                break;
            case 'GameScene':
                // Load background texture theo map_background (public/data/dungeonList.json)
                // Texture key = tên file (ví dụ BideBao.webp => key 'BideBao')
                this.queueGameSceneMapBackgroundTexture();
                this.loadAudios([...SOUND_EFFECT_ASSETS]);
                // this.loadImages([...WEAPON_CATALYST_BADGE_ASSETS]);
                if (this.isAtlasMode) {
                    // this.loadImages([...WEAPON_CATALYST_ASSETS]);
                } else {
                    this.loadGameSceneSingleCardImagesByDungeonConfig();
                }
                this.loadImages([...EMPTY_CARD]);
                // this.loadImages([...WEAPON_CATALYST_BADGE_ASSETS]);
                // SkillAnimation dùng texture key `{nameId}-skill` (CHARACTER_SPRITE_ASSETS); MenuScene cũng load
                // nhưng vào GameScene trực tiếp hoặc sau reload cache có thể thiếu — preload ở đây để luôn có.
                this.loadImages([...ANIMATIONS_ASSETS, ...CHARACTER_SPRITE_ASSETS]);
                break;
            case 'EquipScene':
                debugLog('EquipScene: chỉ atlas (item) đã load ở phase 1');
                break;
            case 'LibraryScene':
                this.loadImages([...EMPTY_CARD]);
                break;
            case 'MapScenes':
                break;
            case 'SelectCharacterScene':
                break;
            default:
                Log.warn('[AssetManager] Không có config assets cho scene:', sceneName);
                break;
        }
    }

    /**
     * Với GameScene: đọc dungeonList từ DataManager và load map_background lên texture.
     * - URI ví dụ: "/assets/images/ui/background/BideBao.webp"
     * - Texture key: "BideBao"
     */
    private queueGameSceneMapBackgroundTexture(): void {
        if (!this.scene) return;

        const dungeonList = dataManager.getFlag<unknown>('dungeonList');
        const uris: string[] = [];

        if (Array.isArray(dungeonList)) {
            for (const d of dungeonList) {
                const uri = (d as Record<string, unknown>)?.map_background;
                if (typeof uri === 'string' && uri.trim()) {
                    uris.push(uri);
                }
            }
        } else if (dungeonList && typeof dungeonList === 'object') {
            const uri = (dungeonList as Record<string, unknown>)?.map_background;
            if (typeof uri === 'string' && uri.trim()) uris.push(uri);
        }

        if (uris.length === 0) {
            Log.warn('[AssetManager] GameScene: dungeonList.map_background is missing; skip map background texture');
            return;
        }

        // Load each background texture once.
        const seen = new Set<string>();
        for (const mapBackgroundUri of uris) {
            const fileName = mapBackgroundUri.split('/').pop() ?? '';
            const textureKey = fileName.replace(/\.[^/.]+$/i, '');

            if (!textureKey || seen.has(textureKey)) continue;
            seen.add(textureKey);
            this.loadImage(textureKey, mapBackgroundUri);
        }
    }

    /**
     * GameScene (non-atlas): lọc card className theo dungeonList.availableCards và load ảnh đơn.
     * Data nguồn lấy từ flag `libraryCards` + `dungeonList` đã được LoadingScene preload.
     */
    private loadGameSceneSingleCardImagesByDungeonConfig(): void {
        const libraryCardsRaw = dataManager.getFlag<unknown>('libraryCards');
        const dungeonListRaw = dataManager.getFlag<unknown>('dungeonList');

        if (!libraryCardsRaw || typeof libraryCardsRaw !== 'object') {
            Log.warn('[AssetManager] GameScene(single-image): thiếu libraryCards trong DataManager flag');
            return;
        }
        if (!Array.isArray(dungeonListRaw)) {
            Log.warn('[AssetManager] GameScene(single-image): dungeonList không hợp lệ');
            return;
        }

        const cardInfoByClassName = new Map<string, { id: string; image: string; type?: string }>();
        const libraryCards = libraryCardsRaw as Record<string, unknown>;

        for (const value of Object.values(libraryCards)) {
            if (!Array.isArray(value)) continue;
            for (const item of value) {
                if (!item || typeof item !== 'object') continue;
                const card = item as LibraryCardEntry;
                if (
                    typeof card.className === 'string' &&
                    card.className.trim() &&
                    typeof card.id === 'string' &&
                    card.id.trim() &&
                    typeof card.image === 'string' &&
                    card.image.trim()
                ) {
                    cardInfoByClassName.set(card.className, {
                        id: card.id,
                        image: card.image,
                        type: card.type
                    });
                }
            }
        }

        const seenClassName = new Set<string>();
        for (const stage of dungeonListRaw as DungeonStage[]) {
            const availableCards = stage?.availableCards;
            if (!availableCards || typeof availableCards !== 'object') continue;

            for (const classNames of Object.values(availableCards)) {
                if (!Array.isArray(classNames)) continue;

                for (const classNameRaw of classNames) {
                    if (typeof classNameRaw !== 'string' || !classNameRaw.trim()) continue;
                    if (seenClassName.has(classNameRaw)) continue;
                    seenClassName.add(classNameRaw);

                    const cardInfo = cardInfoByClassName.get(classNameRaw);
                    if (!cardInfo) continue;

                    this.loadImage(cardInfo.id, cardInfo.image);
                    if (cardInfo.type === 'weapon') {
                        const badgePath = this.getWeaponBadgePathFromCardImage(cardInfo.image);
                        if (badgePath) {
                            this.loadImage(`${cardInfo.id}-badge`, badgePath);
                        }
                    }
                }
            }
        }
    }

    /**
     * Ví dụ:
     * /assets/images/cards/weapon/catalyst/magic-guide.webp
     * -> /assets/images/badge/catalyst/magic-guide.webp
     */
    private getWeaponBadgePathFromCardImage(imagePath: string): string | null {
        if (!imagePath.includes('/cards/weapon/')) {
            return null;
        }
        return imagePath.replace('/cards/weapon/', '/badge/');
    }

    /**
     * Load sprite sheet với logic tự động
     * Nếu key có đuôi "sprite" thì load như sprite sheet
     */
    loadImage(key: string, path: string): void {
        if (!this.scene) {
            Log.warn('AssetManager: Scene chưa được set');
            return;
        }
        const resolvedPath = this.resolveImagePathByGpuProfile(path);
        console.info('%c[info][AssetManager] load image', 'color:#16a34a;font-weight:700;', { key, source: path, resolved: resolvedPath });

        if (!this.scene.textures.exists(key)) {
            // Kiểm tra nếu key có đuôi "sprite" thì load như sprite sheet
            if (key.endsWith('sprite')) {
                this.scene.load.spritesheet(key, resolvedPath, {
                    frameWidth: 350,
                    frameHeight: 590
                });
            } else if (key.endsWith('animations')) {
                this.scene.load.spritesheet(key, resolvedPath, {
                    frameWidth: 192,
                    frameHeight: 192
                });
            }
            else {
                // Nếu không có đuôi "sprite" thì load như image bình thường
                this.scene.load.image(key, resolvedPath);
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
     * Load atlas từ JSON data (thường lấy từ cache sau khi load qua DataManager – public/data/atlas/*.json).
     * @param jsonData - Có meta.image, meta.path, meta.size, frames
     */
    loadAtlas(jsonData: AtlasJsonData): void {
        if (!this.scene) {
            Log.warn('[AssetManager] loadAtlas: Scene chưa được set');
            return;
        }

        const atlasKey = jsonData.meta.image.replace('.webp', '');
        if (this.scene.textures.exists(atlasKey)) {
            debugLog('Atlas đã tồn tại:', atlasKey);
            return;
        }

        const imageURL = jsonData.meta.path.replace(/^\.\.\\public\\/, '').replace(/\\/g, '/');
        this.scene.load.atlas(atlasKey, imageURL, jsonData);
    }

    /**
     * Load audio files
     */
    loadAudio(key: string, path: string): void {
        if (!this.scene) {
            Log.warn('AssetManager: Scene chưa được set');
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

    private bindDetailedLoadErrorLogger(): void {
        if (!this.scene) return;
        if (this.loadErrorHookedScene === this.scene) return;

        this.loadErrorHookedScene = this.scene;
        this.scene.load.on('loaderror', (file: Phaser.Loader.File) => {
            console.error('[AssetManager] Load error', {
                key: file?.key,
                type: file?.type,
                src: file?.src,
                url: file?.url,
                state: file?.state,
                xhrLoader: file?.xhrLoader,
                data: file?.data
            });
        });
    }

    private resolveImagePathByGpuProfile(path: string): string {
        if (!path.includes('/assets/images/')) {
            return path;
        }
        const variant = this.getAssetVariantByGpuProfile();
        return path.replace('/assets/images/', `/assets/${variant}/`);
    }

    private getAssetVariantByGpuProfile(): 'desktop' | 'mobile' {
        if (this.gpuProfileResolved) {
            return this.assetVariantCache;
        }

        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                this.assetVariantCache = 'mobile';
                this.gpuProfileResolved = true;
                console.warn('[AssetManager] WebGL unavailable, fallback to mobile images');
                return this.assetVariantCache;
            }

            const webgl = gl as WebGLRenderingContext;
            const maxTextureSize = Number(webgl.getParameter(webgl.MAX_TEXTURE_SIZE) ?? 0);

            let renderer = 'unknown';
            const debugInfo = webgl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const rawRenderer = webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                if (typeof rawRenderer === 'string' && rawRenderer.trim()) {
                    renderer = rawRenderer;
                }
            }

            // Chỉ dựa theo năng lực GPU texture size: mobile yếu thì dùng ảnh mobile.
            this.assetVariantCache = maxTextureSize >= 8192 ? 'desktop' : 'mobile';
            this.gpuProfileResolved = true;
            console.info('%c[info][AssetManager] GPU profile', 'color:#16a34a;font-weight:700;', {
                variant: this.assetVariantCache,
                maxTextureSize,
                renderer
            });

            // Giải phóng context tạm để tránh rò rỉ WebGL context.
            const loseContextExt = webgl.getExtension('WEBGL_lose_context');
            loseContextExt?.loseContext();
        } catch (error) {
            this.assetVariantCache = 'mobile';
            this.gpuProfileResolved = true;
            console.warn('[AssetManager] Cannot read WebGL profile, fallback to mobile images', error);
        }
        return this.assetVariantCache;
    }

    /**
     * Danh sách assets (images) bổ sung cho GameScene – atlas do ATLAS_PATHS_BY_SCENE['GameScene'] quyết định.
     * Giữ method để tương thích nếu có chỗ gọi; logic load atlas đã chuyển sang DataManager + preloadSceneAssets.
     */
    getLoadImagesListGameScene(): AssetFile[] {
        return [];
    }
}

// Export singleton instance
export const assetManager = new AssetManager();
