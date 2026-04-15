import Phaser from 'phaser';
import { Log } from '../utils/Log.js';
import {
    registerDefaultTextureBindingsForAtlas,
    registerDefaultTextureBindingsForImageKey,
} from './AnimationManager.js';

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

export default class AssetManager {
    private static instance: AssetManager;
    private static cachedAssetVariant: 'desktop' | 'mobile' | null = null;
    private scene: Phaser.Scene | null;
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

    /** Runtime sẽ tự queue atlas/image; hàm này chỉ start queue hiện tại và nhận callback khi complete. */
    preloadSceneAssets(sceneName: string, callback?: () => void): void {
        if (!this.scene) {
            Log.warn('[AssetManager] Scene chưa được set');
            if (callback) callback();
            return;
        }

        if (sceneName === 'MenuScene') {
            this.preloadAtlasAssetsFromJsonFiles(['character.json', 'items.json'], 'menu-atlas', callback);
            return;
        }
        if (sceneName === 'SelectCharacterScene') {
            this.preloadAtlasAssetsFromJsonFiles(['element.json'], 'select-character-atlas', callback);
            return;
        }
        if (sceneName === 'LibraryScene') {
            this.preloadAtlasAssetsFromJsonFiles(['cards.json'], 'library-atlas', callback);
            return;
        }

        debugLog(`preloadSceneAssets(${sceneName}): runtime-driven queue`);
        this.scene.load.once('complete', callback ?? (() => { }));
        this.scene.load.start();
    }

    private preloadAtlasAssetsFromJsonFiles(
        atlasJsonFiles: string[],
        atlasKeyPrefix: string,
        callback?: () => void,
    ): void {
        if (!this.scene) {
            callback?.();
            return;
        }

        const atlasJsonEntries = this.buildAtlasJsonEntries(atlasJsonFiles);

        let queuedJsonCount = 0;
        for (const entry of atlasJsonEntries) {
            if (this.scene.cache.json.exists(entry.jsonKey)) {
                continue;
            }
            this.scene.load.json(entry.jsonKey, entry.jsonPath);
            queuedJsonCount += 1;
        }

        const queueAtlasFromCachedJson = (): void => {
            for (const entry of atlasJsonEntries) {
                const atlasRaw = this.scene?.cache.json.get(entry.jsonKey) as unknown;
                if (!isAtlasJsonData(atlasRaw)) {
                    Log.warn('[AssetManager] Invalid atlas JSON format:', entry.jsonPath);
                    continue;
                }
                const atlasData: AtlasJsonData = {
                    ...atlasRaw,
                    meta: {
                        ...atlasRaw.meta,
                        path: this.buildAtlasImagePath(entry.jsonPath, atlasRaw.meta.image),
                    },
                };
                const atlasName = atlasData.meta.image.replace(/\.[^/.]+$/i, '');
                const atlasKey = `${atlasKeyPrefix}-${atlasName}`;
                this.loadAtlasByUrlsWithRuntimeBindings(atlasKey, atlasData.meta.path, entry.jsonPath, atlasData);
            }
        };

        const finishWithCallback = callback ?? (() => { });
        if (queuedJsonCount > 0) {
            this.scene.load.once('complete', () => {
                queueAtlasFromCachedJson();
                this.scene?.load.once('complete', finishWithCallback);
                this.scene?.load.start();
            });
            this.scene.load.start();
            return;
        }

        queueAtlasFromCachedJson();
        this.scene.load.once('complete', finishWithCallback);
        this.scene.load.start();
    }

    private buildAtlasJsonEntries(atlasJsonFiles: string[]): { jsonKey: string; jsonPath: string }[] {
        const variant = AssetManager.getAssetVariantByGpuProfile();
        return atlasJsonFiles.map((fileName) => ({
            jsonKey: `atlas-json-${variant}-${fileName.replace('.json', '')}`,
            jsonPath: this.resolveAtlasJsonPathByVariant(fileName),
        }));
    }

    private resolveAtlasJsonPathByVariant(fileName: string): string {
        const variant = AssetManager.getAssetVariantByGpuProfile();
        return `/assets/${variant}/atlas/${fileName}`;
    }

    private buildAtlasImagePath(atlasJsonPath: string, imageFileName: string): string {
        const slashIndex = atlasJsonPath.lastIndexOf('/');
        if (slashIndex < 0) {
            return imageFileName;
        }
        const directoryPath = atlasJsonPath.slice(0, slashIndex);
        return `${directoryPath}/${imageFileName}`;
    }

    private loadAtlasByUrlsWithRuntimeBindings(
        atlasKey: string,
        imageURL: string,
        jsonURL: string,
        jsonData: AtlasJsonData,
    ): void {
        if (!this.scene) return;
        if (this.scene.textures.exists(atlasKey)) {
            registerDefaultTextureBindingsForAtlas(atlasKey, jsonData);
            return;
        }

        let didRegisterAtlasBindings = false;
        const registerAtlasBindingsIfLoaded = (): void => {
            if (didRegisterAtlasBindings) return;
            if (!this.scene?.textures.exists(atlasKey)) return;
            didRegisterAtlasBindings = true;
            registerDefaultTextureBindingsForAtlas(atlasKey, jsonData);
        };

        this.scene.load.once(`filecomplete-atlasjson-${atlasKey}`, () => {
            registerAtlasBindingsIfLoaded();
        });
        this.scene.load.once('complete', () => {
            registerAtlasBindingsIfLoaded();
        });
        this.scene.load.atlas(atlasKey, imageURL, jsonURL);
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
        Log.info('[AssetManager] load image', { key, source: path, resolved: resolvedPath });
        // Đăng ký sớm logical key -> texture key để tránh cảnh báo "Unknown key"
        // khi UI gọi TextureManager trước lúc filecomplete.
        try {
            registerDefaultTextureBindingsForImageKey(key);
        } catch (error) {
            Log.warn('[AssetManager] register image key before load failed', { key, error });
        }

        if (!this.scene.textures.exists(key)) {
            // Kiểm tra nếu key có đuôi "sprite" thì load như sprite sheet
            if (key.endsWith('sprite')) {
                this.scene.load.once(`filecomplete-spritesheet-${key}`, () => {
                    registerDefaultTextureBindingsForImageKey(key);
                });
                this.scene.load.spritesheet(key, resolvedPath, {
                    frameWidth: 350,
                    frameHeight: 590
                });
            } else if (key.endsWith('animations')) {
                this.scene.load.once(`filecomplete-spritesheet-${key}`, () => {
                    registerDefaultTextureBindingsForImageKey(key);
                });
                this.scene.load.spritesheet(key, resolvedPath, {
                    frameWidth: 192,
                    frameHeight: 192
                });
            }
            else {
                // Nếu không có đuôi "sprite" thì load như image bình thường
                this.scene.load.once(`filecomplete-image-${key}`, () => {
                    registerDefaultTextureBindingsForImageKey(key);
                });
                this.scene.load.image(key, resolvedPath);
                // console.log(`AssetManager: Đã load image ${key} từ ${path}`);
            }
        } else {
            // console.log(`AssetManager: ${key} đã tồn tại`);
            registerDefaultTextureBindingsForImageKey(key);
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
     * Load atlas từ JSON data được truyền runtime.
     * @param jsonData - Có meta.image, meta.path, meta.size, frames
     */
    loadAtlas(jsonData: AtlasJsonData): void {
        if (!this.scene) {
            Log.warn('[AssetManager] loadAtlas: Scene chưa được set');
            return;
        }

        const atlasKey = jsonData.meta.image.replace(/\.[^/.]+$/i, '');

        if (this.scene.textures.exists(atlasKey)) {
            debugLog('Atlas đã tồn tại:', atlasKey);
            registerDefaultTextureBindingsForAtlas(atlasKey, jsonData);
            return;
        }

        let didRegisterAtlasBindings = false;
        const registerAtlasBindingsIfLoaded = (): void => {
            if (didRegisterAtlasBindings) return;
            if (!this.scene?.textures.exists(atlasKey)) return;
            didRegisterAtlasBindings = true;
            registerDefaultTextureBindingsForAtlas(atlasKey, jsonData);
        };

        const imageURL = jsonData.meta.path.replace(/^\.\.\\public\\/, '').replace(/\\/g, '/');
        Log.warn('[AssetManager] queue atlas:', { atlasKey, imageURL });
        this.scene.load.once(`filecomplete-atlasjson-${atlasKey}`, () => {
            Log.warn('[AssetManager] filecomplete-atlasjson event:', atlasKey);
            registerAtlasBindingsIfLoaded();
        });
        // Fallback: một số version/type atlas có thể không bắn đúng event `filecomplete-atlasjson-*`.
        this.scene.load.once('complete', () => {
            if (!this.scene?.textures.exists(atlasKey)) {
                Log.error('[AssetManager] Atlas texture missing after complete:', { atlasKey, imageURL });
            } else {
                Log.warn('[AssetManager] atlas available after complete:', atlasKey);
            }
            registerAtlasBindingsIfLoaded();
        });
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
            Log.error('[AssetManager] Load error', {
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
        const variant = AssetManager.getAssetVariantByGpuProfile();
        return path.replace('/assets/images/', `/assets/${variant}/`);
    }

    static getAssetVariantByGpuProfile(): 'desktop' | 'mobile' {
        if (AssetManager.cachedAssetVariant) {
            return AssetManager.cachedAssetVariant;
        }

        let resolvedVariant: 'desktop' | 'mobile' = 'mobile';
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (!gl) {
                Log.warn('[AssetManager] WebGL unavailable, fallback to mobile images');
                AssetManager.cachedAssetVariant = resolvedVariant;
                return resolvedVariant;
            }

            const webgl = gl as WebGLRenderingContext;
            const maxTextureSize = Number(webgl.getParameter(webgl.MAX_TEXTURE_SIZE) ?? 0);

            // Chỉ dựa theo năng lực GPU texture size: mobile yếu thì dùng ảnh mobile.
            resolvedVariant = maxTextureSize >= 8192 ? 'desktop' : 'mobile';
            Log.info('[AssetManager] GPU profile', {
                variant: resolvedVariant,
                maxTextureSize
            });

            // Giải phóng context tạm để tránh rò rỉ WebGL context.
            const loseContextExt = webgl.getExtension('WEBGL_lose_context');
            loseContextExt?.loseContext();
        } catch (error) {
            Log.warn('[AssetManager] Cannot read WebGL profile, fallback to mobile images', error);
        }
        AssetManager.cachedAssetVariant = resolvedVariant;
        return resolvedVariant;
    }

    getLoadImagesListGameScene(): AssetFile[] {
        return [];
    }
}

// Export singleton instance
export const assetManager = new AssetManager();
