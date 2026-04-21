import Phaser from 'phaser';
import { Log } from '../utils/Log.js';
import {
    registerDefaultTextureBindingsForAtlas,
    registerDefaultTextureBindingsForImageKey,
} from './AnimationManager.js';
import { dataManager } from './DataManager.js';
import TextureManager from './TextureManager.js';

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

interface SceneAssetData {
    stageId?: string;
}

interface DungeonData {
    stageId: string;
    map_background?: string;
    availableCards?: Record<string, string[]>;
}

interface CharacterAssetData {
    id: string;
    imageSpritesheet?: string;
    attached?: CharacterAttachedAsset[];
}

interface CharacterAttachedAsset {
    nameId: string;
    image: string;
}

interface LibraryCardEntry {
    id?: string;
    type?: string;
    className?: string;
    image?: string;
    attached?: unknown[];
    contents?: unknown[];
}

interface QueueCardImageItem {
    id: string;
    path: string;
    attached: CharacterAttachedAsset[];
}

interface ItemAssetData {
    nameId?: string;
    image?: string;
    attached?: unknown[];
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
    preloadSceneAssets(sceneName: string, callback?: () => void, dataTargetScene?: SceneAssetData): void {
        if (!this.scene) {
            Log.warn('[AssetManager] Scene chưa được set');
            if (callback) callback();
            return;
        }

        if (sceneName === 'MenuScene') {
            this.loadAudio('bgm-ormos', '/assets/sounds/BGM/Ormos.ogg');
            this.preloadMenuSceneCharacterSpritesheets();
            this.preloadAtlasAssetsFromJsonFiles(['character.json', 'items.json'], 'menu-atlas', callback);
            return;
        }
        if (sceneName === 'SelectCharacterScene') {
            this.preloadMenuSceneCharacterSpritesheets();
            this.preloadAtlasAssetsFromJsonFiles(['element.json'], 'select-character-atlas', callback);
            return;
        }
        if (sceneName === 'LibraryScene') {
            this.preloadAtlasAssetsFromJsonFiles(['cards.json'], 'library-atlas', callback);
            return;
        }
        if (sceneName === 'GameScene') {
            this.preloadGameSceneAssets(dataTargetScene, callback);
            return;
        }

        debugLog(`preloadSceneAssets(${sceneName}): runtime-driven queue`);
        this.scene.load.once('complete', callback ?? (() => { }));
        this.scene.load.start();
    }

    private preloadGameSceneAssets(dataTargetScene?: SceneAssetData, callback?: () => void): void {
        if (!this.scene) {
            callback?.();
            return;
        }
        const stageId = dataTargetScene?.stageId;
        Log.infoTag('[AssetManager]', 'preloadGameSceneAssets:start', '/src/core/AssetManager.ts', { stageId });
        this.loadAudios([
            { key: 'move-sound', path: 'assets/sounds/SE/move.ogg' },
            { key: 'Coin-sound', path: 'assets/sounds/SE/Coin.ogg' },
            { key: 'equip-sound', path: 'assets/sounds/SE/Equip.ogg' },
            { key: 'Chest-sound', path: 'assets/sounds/SE/Chest.ogg' },
        ]);
        const backgroundAsset = this.resolveGameSceneBackgroundAsset(stageId);
        if (backgroundAsset) {
            Log.infoTag('[AssetManager]', 'queue background image', backgroundAsset.path, {
                key: backgroundAsset.key,
            });
            this.loadImage(backgroundAsset.key, backgroundAsset.path);
        }
        this.loadCharacterAsset(dataManager.get<string | { id?: string }>('selectedCharacter'));
        this.loadItemAsset(dataManager.get<unknown>('equipment'));
        // `token.json` + ảnh: logic json cache / queue atlas đã nằm trong `preloadAtlasAssetsFromJsonFiles` (dùng chung với Menu/Library).
        this.preloadAtlasAssetsFromJsonFiles(['token.json'], 'game-scene-token-atlas', () => {
            this.loadCardsByMaps(stageId, callback);
        });
    }

    private loadItemAsset(equipment: unknown): void {
        if (!this.scene) {
            return;
        }

        const equippedItemIds = this.extractEquipmentNameIds(equipment);
        if (equippedItemIds.length === 0) {
            return;
        }

        const itemList = dataManager.getFlag<ItemAssetData[]>('items');
        if (!Array.isArray(itemList) || itemList.length === 0) {
            return;
        }

        const itemByNameId = new Map<string, ItemAssetData>();
        for (const item of itemList) {
            if (!item || typeof item !== 'object') {
                continue;
            }
            const nameId = typeof item.nameId === 'string' ? item.nameId.trim() : '';
            if (!nameId) {
                continue;
            }
            itemByNameId.set(nameId, item);
        }

        for (const itemNameId of equippedItemIds) {
            const item = itemByNameId.get(itemNameId);
            if (!item) {
                continue;
            }

            if (Array.isArray(item.attached) && item.attached.length > 0) {
                this.routeRawAttachedAssets(item.attached, itemNameId);
            }
        }
    }

    private extractEquipmentNameIds(equipment: unknown): string[] {
        if (Array.isArray(equipment)) {
            return equipment.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        }
        if (equipment && typeof equipment === 'object') {
            return Object.keys(equipment).filter((value) => value.trim().length > 0);
        }
        return [];
    }

    private routeRawAttachedAssets(rawAttached: unknown[], ownerId: string): void {
        for (const entry of rawAttached) {
            this.routeRawAttachedAsset(entry, ownerId);
        }
    }

    private routeRawAttachedAsset(rawAttached: unknown, ownerId: string): void {
        if (!rawAttached || typeof rawAttached !== 'object') {
            return;
        }
        const attached = rawAttached as Record<string, unknown>;
        const nameIdRaw =
            typeof attached.nameId === 'string' ? attached.nameId : typeof attached.id === 'string' ? attached.id : '';
        const pathRaw =
            typeof attached.image === 'string'
                ? attached.image
                : typeof attached.path === 'string'
                    ? attached.path
                    : '';
        const nameId = nameIdRaw.trim();
        const path = pathRaw.trim();
        if (!nameId || !path) {
            return;
        }

        if (this.isSoundEffectAssetPath(path)) {
            this.loadAudio(nameId, path);
            return;
        }
        if (this.isAnimationAssetPath(path)) {
            this.loadAnimations(nameId, path);
            return;
        }
        Log.infoTag('[AssetManager]', 'queue item attached image', path, { ownerId, attachedId: nameId });
        this.loadImage(nameId, path);
    }

    private loadCardsByMaps(stageId?: string, callback?: () => void): void {
        if (!this.scene) {
            callback?.();
            return;
        }
        if (!stageId) {
            Log.infoTag('[AssetManager]', 'stageId empty: skip map card preload');
            this.scene.load.once('complete', callback ?? (() => { }));
            this.scene.load.start();
            return;
        }

        const queueById = this.buildQueueCardImageListByStage(stageId);
        const queueItems = Array.from(queueById.values());
        const finish = callback ?? (() => { });
        Log.infoTag('[AssetManager]', 'map card queue ready', `/data/dungeonList.json#${stageId}`, {
            stageId,
            queueSize: queueItems.length,
            ids: queueItems.map((item) => item.id),
        });

        if (queueItems.length <= 10) {
            Log.infoTag('[AssetManager]', 'use single-image strategy (<=10)');
            this.queueIndividualCardImages(queueItems);
            this.scene.load.once('complete', finish);
            this.scene.load.start();
            return;
        }

        const variant = AssetManager.getAssetVariantByGpuProfile();
        const atlasJsonPath = `/assets/images/${variant}/atlas/${stageId}.json`;
        const atlasJsonKey = `map-card-atlas-json-${variant}-${stageId}`;
        Log.infoTag('[AssetManager]', 'use atlas strategy (>10)', atlasJsonPath, { atlasJsonKey, variant });
        const queueByAtlasOrFallback = (): void => {
            const atlasRaw = this.scene?.cache.json.get(atlasJsonKey) as unknown;
            if (!isAtlasJsonData(atlasRaw)) {
                Log.infoTag('[AssetManager]', 'atlas json invalid/missing -> fallback single-image', atlasJsonPath);
                this.queueIndividualCardImages(queueItems);
                return;
            }
            const atlasData: AtlasJsonData = {
                ...atlasRaw,
                meta: {
                    ...atlasRaw.meta,
                    path: this.buildAtlasImagePath(atlasJsonPath, atlasRaw.meta.image),
                },
            };
            Log.infoTag('[AssetManager]', 'atlas json loaded, queue atlas', atlasData.meta.path, {
                atlasKey: stageId,
                frames: Object.keys(atlasData.frames).length,
            });
            this.loadAtlasByUrlsWithRuntimeBindings(stageId, atlasData.meta.path, atlasJsonPath, atlasData);
            this.queueAttachedAndMissingFromAtlas(queueItems, atlasData);
        };

        if (this.scene.cache.json.exists(atlasJsonKey)) {
            queueByAtlasOrFallback();
            this.scene.load.once('complete', finish);
            this.scene.load.start();
            return;
        }

        this.scene.load.json(atlasJsonKey, atlasJsonPath);
        this.scene.load.once('complete', () => {
            queueByAtlasOrFallback();
            this.scene?.load.once('complete', finish);
            this.scene?.load.start();
        });
        this.scene.load.start();
    }

    private buildQueueCardImageListByStage(stageId: string): Map<string, QueueCardImageItem> {
        const queueById = new Map<string, QueueCardImageItem>();
        if (!this.scene) {
            return queueById;
        }

        const dungeonList = dataManager.getFlag<DungeonData[]>('dungeonList');
        if (!Array.isArray(dungeonList)) {
            return queueById;
        }
        const dungeon = dungeonList.find((item) => item?.stageId === stageId);
        if (!dungeon?.availableCards || typeof dungeon.availableCards !== 'object') {
            return queueById;
        }

        const libraryCards = dataManager.getFlag<Record<string, unknown>>('libraryCards');
        const classNameMap = this.buildLibraryCardClassNameMap(libraryCards);
        if (classNameMap.size === 0) {
            return queueById;
        }

        const visitedClassNames = new Set<string>();
        for (const classNames of Object.values(dungeon.availableCards)) {
            if (!Array.isArray(classNames)) {
                continue;
            }
            for (const className of classNames) {
                if (typeof className !== 'string' || !className.trim()) {
                    continue;
                }
                this.queueCardByClassName(className.trim(), classNameMap, queueById, visitedClassNames);
            }
        }

        return queueById;
    }

    private buildLibraryCardClassNameMap(libraryCards: Record<string, unknown> | undefined): Map<string, LibraryCardEntry> {
        const classNameMap = new Map<string, LibraryCardEntry>();
        if (!libraryCards || typeof libraryCards !== 'object') {
            return classNameMap;
        }

        for (const entries of Object.values(libraryCards)) {
            if (!Array.isArray(entries)) {
                continue;
            }
            for (const entry of entries) {
                if (!entry || typeof entry !== 'object') {
                    continue;
                }
                const cardEntry = entry as LibraryCardEntry;
                if (typeof cardEntry.className !== 'string' || !cardEntry.className.trim()) {
                    continue;
                }
                classNameMap.set(cardEntry.className.trim(), cardEntry);
            }
        }

        return classNameMap;
    }

    /**
     * Chỉ coi Attached đã sẵn sàng khi dữ liệu runtime (texture/audio/spritesheet) thực sự có.
     * Không dùng TextureManager.has một mình: logical key có thể đăng ký trước khi file load xong.
     */
    private isAttachedAssetRuntimeReady(attached: CharacterAttachedAsset): boolean {
        if (!this.scene) {
            return true;
        }
        if (this.isSoundEffectAssetPath(attached.image)) {
            return this.scene.cache.audio.exists(attached.nameId);
        }
        if (this.isAnimationAssetPath(attached.image)) {
            const animKey = attached.nameId.endsWith('-animations')
                ? attached.nameId
                : `${attached.nameId}-animations`;
            return this.scene.textures.exists(animKey);
        }
        return this.scene.textures.exists(attached.nameId);
    }

    private queueCardByClassName(
        className: string,
        classNameMap: Map<string, LibraryCardEntry>,
        queueById: Map<string, QueueCardImageItem>,
        visitedClassNames: Set<string>,
    ): void {
        if (!this.scene || visitedClassNames.has(className)) {
            return;
        }
        visitedClassNames.add(className);

        const entry = classNameMap.get(className);
        if (!entry) {
            return;
        }
        const cardId = typeof entry.id === 'string' ? entry.id.trim() : '';
        const cardImage = typeof entry.image === 'string' ? entry.image.trim() : '';
        if (!cardId || !cardImage) {
            return;
        }

        const attached = this.normalizeAttachedAssets(entry.attached);
        const mainResolved = TextureManager.has(cardId) || this.scene.textures.exists(cardId);
        const allAttachedReady =
            attached.length === 0 || attached.every((a) => this.isAttachedAssetRuntimeReady(a));
        // Không skip chỉ vì main đã có: phải kiểm tra từng Attached runtime (texture/audio/anim)
        // tránh trường hợp đã đăng ký logical nhưng file Attached chưa vào cache.
        const needsQueueForLoad = !mainResolved || !allAttachedReady;

        if (needsQueueForLoad && !queueById.has(cardId)) {
            Log.infoTag('[AssetManager]', 'queue card image', cardImage, { className, id: cardId });
            queueById.set(cardId, {
                id: cardId,
                path: cardImage,
                attached,
            });
        }

        if (entry.type !== 'treasure' || !Array.isArray(entry.contents) || entry.contents.length === 0) {
            return;
        }
        for (const contentClassName of entry.contents) {
            if (typeof contentClassName !== 'string' || !contentClassName.trim()) {
                continue;
            }
            this.queueCardByClassName(contentClassName.trim(), classNameMap, queueById, visitedClassNames);
        }
    }

    private normalizeAttachedAssets(rawAttached: unknown[] | undefined): CharacterAttachedAsset[] {
        if (!Array.isArray(rawAttached)) {
            return [];
        }
        const attached: CharacterAttachedAsset[] = [];
        for (const entry of rawAttached) {
            if (!entry || typeof entry !== 'object') {
                continue;
            }
            const item = entry as Record<string, unknown>;
            const nameIdRaw = typeof item.nameId === 'string' ? item.nameId : typeof item.id === 'string' ? item.id : '';
            const imageRaw =
                typeof item.image === 'string' ? item.image : typeof item.path === 'string' ? item.path : '';
            const nameId = nameIdRaw.trim();
            const image = imageRaw.trim();
            if (!nameId || !image) {
                continue;
            }
            attached.push({ nameId, image });
        }
        return attached;
    }

    private queueIndividualCardImages(items: QueueCardImageItem[]): void {
        for (const item of items) {
            Log.infoTag('[AssetManager]', 'queue single image', item.path, { id: item.id });
            this.loadImage(item.id, item.path);
            for (const attachedAsset of item.attached) {
                Log.infoTag('[AssetManager]', 'queue attached image', attachedAsset.image, {
                    ownerId: item.id,
                    attachedId: attachedAsset.nameId,
                });
                this.routeRawAttachedAsset(
                    {
                        nameId: attachedAsset.nameId,
                        image: attachedAsset.image,
                    },
                    item.id,
                );
            }
        }
    }

    private queueAttachedAndMissingFromAtlas(items: QueueCardImageItem[], atlasData: AtlasJsonData): void {
        const frameNames = new Set(Object.keys(atlasData.frames));
        for (const item of items) {
            if (!frameNames.has(item.id)) {
                Log.infoTag('[AssetManager]', 'atlas miss -> queue single image', item.path, { id: item.id });
                this.loadImage(item.id, item.path);
                for (const attachedAsset of item.attached) {
                    Log.infoTag('[AssetManager]', 'atlas miss attached -> queue single image', attachedAsset.image, {
                        ownerId: item.id,
                        attachedId: attachedAsset.nameId,
                    });
                    this.routeRawAttachedAsset(
                        {
                            nameId: attachedAsset.nameId,
                            image: attachedAsset.image,
                        },
                        item.id,
                    );
                }
                continue;
            }
            Log.infoTag('[AssetManager]', 'atlas hit', undefined, { id: item.id });
            for (const attachedAsset of item.attached) {
                Log.infoTag('[AssetManager]', 'atlas hit attached -> queue single image', attachedAsset.image, {
                    ownerId: item.id,
                    attachedId: attachedAsset.nameId,
                });
                this.routeRawAttachedAsset(
                    {
                        nameId: attachedAsset.nameId,
                        image: attachedAsset.image,
                    },
                    item.id,
                );
            }
        }
    }

    private loadCharacterAsset(selectedCharacter: string | { id?: string } | null): void {
        if (!this.scene) {
            return;
        }

        const selectedCharacterId =
            typeof selectedCharacter === 'string'
                ? selectedCharacter
                : typeof selectedCharacter?.id === 'string'
                    ? selectedCharacter.id
                    : null;

        if (!selectedCharacterId) {
            return;
        }

        const cardCharacterList = dataManager.getFlag<CharacterAssetData[]>('cardCharacterList') ?? [];
        if (!Array.isArray(cardCharacterList) || cardCharacterList.length === 0) {
            return;
        }

        const character = cardCharacterList.find((item) => item.id === selectedCharacterId);
        if (!character?.attached || !Array.isArray(character.attached)) {
            return;
        }

        for (const asset of character.attached) {
            if (
                !asset ||
                typeof asset.nameId !== 'string' ||
                !asset.nameId.trim() ||
                typeof asset.image !== 'string' ||
                !asset.image.trim()
            ) {
                continue;
            }
            this.routeRawAttachedAsset(
                {
                    nameId: asset.nameId.trim(),
                    image: asset.image.trim(),
                },
                selectedCharacterId,
            );
        }
    }

    private preloadMenuSceneCharacterSpritesheets(): void {
        if (!this.scene) {
            return;
        }

        const characterLevel = dataManager.get<Record<string, number>>('characterLevel') ?? {};
        const cardCharacterList = dataManager.getFlag<CharacterAssetData[]>('cardCharacterList') ?? [];

        if (!Array.isArray(cardCharacterList) || cardCharacterList.length === 0) {
            return;
        }

        for (const character of cardCharacterList) {
            const level = characterLevel[character.id] ?? 0;
            if (level < 10) {
                continue;
            }
            if (typeof character.imageSpritesheet !== 'string' || !character.imageSpritesheet.trim()) {
                continue;
            }
            this.loadSpritesheet(`${character.id}-sprite`, character.imageSpritesheet.trim());
        }
    }

    private resolveGameSceneBackgroundAsset(stageId?: string): { key: string; path: string } | null {
        if (!stageId) return null;
        const dungeonList = dataManager.getFlag<DungeonData[]>('dungeonList');
        if (!Array.isArray(dungeonList)) return null;
        const dungeon = dungeonList.find((item) => item.stageId === stageId);
        const mapBackground = dungeon?.map_background;
        if (typeof mapBackground !== 'string' || !mapBackground.trim()) {
            return null;
        }
        return {
            key: AssetManager.getGameSceneBackgroundTextureKey(stageId),
            path: mapBackground.trim(),
        };
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
        return `/assets/images/${variant}/atlas/${fileName}`;
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
     * Texture Phaser đã tồn tại cho `key` (đã load xong) — không cần queue `load.image` lại.
     */
    private isImageTextureRegistered(key: string): boolean {
        return this.scene !== null && this.scene.textures.exists(key);
    }

    /**
     * Load image thông thường
     */
    loadImage(key: string, path: string): void {
        if (!this.scene) {
            Log.warn('AssetManager: Scene chưa được set');
            return;
        }

        const resolvedPath = this.shouldKeepOriginalPath(key) ? path : this.resolveImagePathByGpuProfile(path);

        if (this.isImageTextureRegistered(key)) {
            Log.info('[AssetManager] loadImage skipped (texture already registered)', {
                key,
                source: path,
                resolved: resolvedPath,
            });
            try {
                registerDefaultTextureBindingsForImageKey(key);
            } catch (error) {
                Log.info('[AssetManager] register image binding (already loaded) failed', { key, error });
            }
            return;
        }

        Log.info('[AssetManager] load image', { key, source: path, resolved: resolvedPath });
        // Đăng ký sớm logical key -> texture key để tránh cảnh báo "Unknown key"
        // khi UI gọi TextureManager trước lúc filecomplete.
        try {
            registerDefaultTextureBindingsForImageKey(key);
        } catch (error) {
            Log.warn('[AssetManager] register image key before load failed', { key, error });
        }

        this.scene.load.once(`filecomplete-image-${key}`, () => {
            registerDefaultTextureBindingsForImageKey(key);
        });
        this.scene.load.image(key, resolvedPath);
    }

    loadSpritesheet(key: string, path: string): void {
        if (!this.scene) {
            Log.warn('AssetManager: Scene chưa được set');
            return;
        }
        const resolvedPath = this.shouldKeepOriginalPath(key) ? path : this.resolveImagePathByGpuProfile(path);
        Log.info('[AssetManager] load spritesheet', { key, source: path, resolved: resolvedPath });

        if (this.scene.textures.exists(key)) {
            return;
        }

        this.scene.load.spritesheet(key, resolvedPath, {
            frameWidth: 350,
            frameHeight: 590
        });
    }

    loadAnimations(key: string, path: string): void {
        if (!this.scene) {
            Log.warn('AssetManager: Scene chưa được set');
            return;
        }
        const animationKey = key.endsWith('-animations') ? key : `${key}-animations`;
        const resolvedPath = this.shouldKeepOriginalPath(animationKey) ? path : this.resolveImagePathByGpuProfile(path);
        Log.info('[AssetManager] load animations', { key: animationKey, source: path, resolved: resolvedPath });

        if (this.scene.textures.exists(animationKey)) {
            return;
        }

        this.scene.load.spritesheet(animationKey, resolvedPath, {
            frameWidth: 192,
            frameHeight: 192
        });
    }

    /**
     * Load nhiều file theo danh sách
     * files = [{key, path}, ...]
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
        return path.replace('/assets/images/', `/assets/images/${variant}/`);
    }

    private shouldKeepOriginalPath(key: string): boolean {
        return key.startsWith('game-scene-bg-') || key.endsWith('-animations');
    }

    private isAnimationAssetPath(path: string): boolean {
        return /\/animations\//i.test(path);
    }

    private isSoundEffectAssetPath(path: string): boolean {
        return /\/SE\//i.test(path);
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

    static getGameSceneBackgroundTextureKey(stageId: string): string {
        const normalized = stageId.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
        return `game-scene-bg-${normalized || 'default'}`;
    }

    getLoadImagesListGameScene(): AssetFile[] {
        return [];
    }
}

// Export singleton instance
export const assetManager = new AssetManager();
