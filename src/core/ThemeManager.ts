/**
 * ThemeManager - Quản lý theme màu sắc toàn hệ thống
 *
 * Đọc theme.json (object key-value, key = tên theme). Mặc định dùng theme đầu tiên (theo thứ tự key).
 * Lưu tên theme hiện tại qua dataManager (key 'theme'). Khi mở game đọc dataManager.get('theme') để áp dụng.
 * Không fallback: nếu không đọc được hoặc dữ liệu không hợp lệ thì báo lỗi.
 */

import Phaser from 'phaser';
import { publicUrl } from '../pwa/base.js';
import { dataManager } from './DataManager.js';
import { Log } from '../utils/Log.js';
import AssetManager from './AssetManager.js';
import TextureManager from './TextureManager.js';

/** 7 màu chủ đảo + Success/Warning/Error/Info */
export interface ThemePalette {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
    surface: string;
    text: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}

export interface ThemeData {
    name?: string;
    colors: Partial<ThemePalette>;
}

const PALETTE_KEYS: (keyof ThemePalette)[] = [
    'primary', 'secondary', 'accent', 'neutral', 'background', 'surface', 'text',
    'success', 'warning', 'error', 'info',
];

/** Giá trị mặc định cho success/warning/error/info khi theme.json không khai báo */
const DEFAULT_EXTRA_COLORS: Pick<ThemePalette, 'success' | 'warning' | 'error' | 'info'> = {
    success: '#2ecc71',
    warning: '#f1c40f',
    error: '#e74c3c',
    info: '#3498db',
};

/**
 * Chuyển #rrggbb hoặc #rrggbbaa thành số hex Phaser (0xrrggbb)
 */
export function toPhaserHex(hexStr: string): number {
    const s = hexStr.replace(/^#/, '');
    const rgb = s.length >= 6 ? s.slice(0, 6) : s.padEnd(6, '0');
    return parseInt(rgb, 16);
}

const HEX_REG = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;

/**
 * Ngưỡng level (theo nhân vật đang chọn) tối thiểu để áp dụng theme theo `selectedCharacter`.
 * `characterLevel` là object `{ [characterId]: level }`; level đọc theo key = `selectedCharacter`.
 * Dưới ngưỡng → luôn theme `default` dù `applyCharacterTheme === true`.
 */
export const CHARACTER_THEME_APPLY_MIN_LEVEL = 10;

function coerceStoredLevelValue(v: unknown): number {
    if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
    if (typeof v === 'string') {
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

/** Level của nhân vật đang chọn từ local `characterLevel` (map) hoặc legacy một số. */
function getCharacterLevelForSelected(selectedCharacter: string | null | undefined): number {
    const raw = dataManager.get<unknown>('characterLevel');
    if (raw == null) return 0;

    if (typeof raw === 'number' && Number.isFinite(raw)) return Math.trunc(raw);
    if (typeof raw === 'string') {
        const n = parseInt(raw, 10);
        return Number.isFinite(n) ? n : 0;
    }

    if (typeof raw !== 'object' || Array.isArray(raw)) return 0;

    const map = raw as Record<string, unknown>;
    const name = typeof selectedCharacter === 'string' ? selectedCharacter.trim() : '';
    if (!name) return 0;

    let entry = map[name];
    if (entry === undefined) entry = map[name.toLowerCase()];
    if (entry === undefined) {
        const found = Object.keys(map).find((k) => k.toLowerCase() === name.toLowerCase());
        if (found !== undefined) entry = map[found];
    }
    return coerceStoredLevelValue(entry);
}

function parseOneThemeColors(obj: unknown): ThemePalette {
    if (!obj || typeof obj !== 'object') {
        throw new Error('Theme item must be an object');
    }
    const colors = (obj as Record<string, unknown>).colors;
    if (!colors || typeof colors !== 'object') {
        throw new Error('Theme item must have "colors" object');
    }
    const raw = colors as Record<string, unknown>;
    const result: Partial<ThemePalette> = { ...DEFAULT_EXTRA_COLORS };
    for (const key of PALETTE_KEYS) {
        const v = raw[key];
        if (typeof v === 'string' && HEX_REG.test(v)) {
            result[key] = v;
        }
        // Nếu thiếu hoặc không hợp lệ: 7 màu chính bắt buộc (throw), 4 màu còn lại đã có trong DEFAULT_EXTRA_COLORS
        else if (key === 'primary' || key === 'secondary' || key === 'accent' || key === 'neutral' || key === 'background' || key === 'surface' || key === 'text') {
            throw new Error(`Theme colors.${key} must be a valid hex string (#rrggbb or #rrggbbaa)`);
        }
    }
    return result as ThemePalette;
}

/** Chuẩn hóa theme.json thành danh sách { name, colors }. Chỉ hỗ trợ object key-value (key = tên theme). */
function normalizeThemeList(data: unknown): { name: string; colors: ThemePalette }[] {
    if (data == null || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('theme.json must be an object key-value (key = theme name)');
    }
    const entries = Object.entries(data as Record<string, unknown>);
    if (entries.length === 0) throw new Error('theme.json object is empty');
    return entries.map(([key, item]) => {
        const name = (item as Record<string, unknown>)?.name;
        const nameStr = typeof name === 'string' && name.trim() ? name.trim() : key;
        return { name: nameStr, colors: parseOneThemeColors(item) };
    });
}

interface ThemeAssetsBlock {
    background?: string;
    icons?: {
        compass?: string;
        equip?: string;
        library?: string;
    };
}

interface ThemeJsonEntry {
    name?: string;
    assets?: ThemeAssetsBlock;
}

export default class ThemeManager {
    private static instance: ThemeManager;
    private palette: ThemePalette | null = null;
    private themeList: { name: string; colors: ThemePalette }[] = [];
    private _loaded = false;
    private scene: Phaser.Scene | null = null;
    private themeJsonCacheKey = 'theme';

    private constructor() {}

    static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Load theme.json (array hoặc object), lấy theme mặc định = index 0.
     * Lưu tên theme hiện tại vào dataManager key 'theme'. Khi mở game gọi applySavedTheme() sau khi load xong.
     * Không fallback: load/parse thất bại thì reject và log lỗi.
     */
    loadTheme(scene: Phaser.Scene, dataPath = 'theme.json', cacheKey = 'theme'): Promise<void> {
        this.scene = scene;
        this.themeJsonCacheKey = cacheKey;
        return dataManager
            .loadJsonFromData<unknown>(scene, dataPath, cacheKey)
            .then((data) => {
                const list = normalizeThemeList(data);
                this.themeList = list;
                this._loaded = true;
                this.applyThemeFromDataPreferences();
            })
            .catch((err) => {
                Log.error('[ThemeManager] Không đọc được theme. Bắt buộc phải có theme.json hợp lệ.', dataPath, err);
                this._loaded = false;
                this.palette = null;
                throw err;
            });
    }

    private getUiAssetVariantByGpuProfile(): 'desktop' | 'mobile' {
        return AssetManager.getAssetVariantByGpuProfile();
    }

    private getCurrentScene(): Phaser.Scene | null {
        return this.scene;
    }

    private getThemeAssetsByName(themeName: string): ThemeAssetsBlock | null {
        const scene = this.getCurrentScene();
        if (!scene) return null;

        const raw = dataManager.getJsonFromCache<unknown>(scene, this.themeJsonCacheKey);
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
            return null;
        }
        const entry = this.findThemeJsonEntry(raw as Record<string, unknown>, themeName);
        if (!entry || !entry.assets || typeof entry.assets !== 'object') {
            return null;
        }
        return entry.assets;
    }

    private findThemeJsonEntry(raw: Record<string, unknown>, themeName: string): ThemeJsonEntry | null {
        const direct = raw[themeName];
        if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
            return direct as ThemeJsonEntry;
        }
        for (const [, value] of Object.entries(raw)) {
            if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
            const candidateName = (value as ThemeJsonEntry).name;
            if (typeof candidateName === 'string' && candidateName === themeName) {
                return value as ThemeJsonEntry;
            }
        }
        return null;
    }

    private extractFileNameNoExt(url: string): string {
        const cleaned = url.split('?')[0].split('#')[0];
        const fileName = cleaned.substring(cleaned.lastIndexOf('/') + 1);
        const noExt = fileName.replace(/\.[^/.]+$/i, '');
        return noExt || 'unknown';
    }

    private buildThemeTextureKey(logicalKey: 'background' | 'compass' | 'equip' | 'library', url: string): string {
        return `theme-${logicalKey}-${this.extractFileNameNoExt(url)}`;
    }

    private resolveThemeIconImageUrl(url: string): string {
        if (!url.includes('/assets/images/ui/')) {
            return url;
        }
        const variant = this.getUiAssetVariantByGpuProfile();
        return url.replace('/assets/images/ui/', `/assets/images/${variant}/ui/`);
    }

    private loadThemeAssetAndRebind(
        scene: Phaser.Scene,
        logicalKey: 'background' | 'compass' | 'equip' | 'library',
        sourceUrl: string,
    ): void {
        const finalUrl = logicalKey === 'background' ? sourceUrl : this.resolveThemeIconImageUrl(sourceUrl);
        const textureKey = this.buildThemeTextureKey(logicalKey, sourceUrl);
        const fallbackTextureKey = TextureManager.getFallbackTextureKeyForScene(scene);
        let didResolveBinding = false;

        const bindFallback = (reason: unknown): void => {
            if (didResolveBinding) return;
            didResolveBinding = true;
            if (!fallbackTextureKey) {
                Log.error(`[ThemeManager] Không có fallback texture để bind "${logicalKey}"`, reason);
                return;
            }
            TextureManager.upsertImageBinding(logicalKey, fallbackTextureKey);
            Log.warn(`[ThemeManager] Bind fallback texture cho "${logicalKey}"`, {
                fallbackTextureKey,
                sourceUrl: finalUrl,
                reason,
            });
        };

        if (scene.textures.exists(textureKey)) {
            didResolveBinding = true;
            TextureManager.upsertImageBinding(logicalKey, textureKey);
            return;
        }

        const onError = (file: Phaser.Loader.File): void => {
            if (file.key !== textureKey) return;
            scene.load.off('loaderror', onError);
            bindFallback('loaderror');
        };

        scene.load.once(`filecomplete-image-${textureKey}`, () => {
            scene.load.off('loaderror', onError);
            if (didResolveBinding) return;
            if (scene.textures.exists(textureKey)) {
                didResolveBinding = true;
                TextureManager.upsertImageBinding(logicalKey, textureKey);
                return;
            }
            bindFallback('filecomplete-without-texture');
        });
        scene.load.once('complete', () => {
            if (didResolveBinding) return;
            if (scene.textures.exists(textureKey)) return;
            bindFallback('complete-without-texture');
        });
        scene.load.on('loaderror', onError);
        scene.load.image(textureKey, publicUrl(finalUrl));
    }

    private queueThemeTextureBindings(themeName: string): void {
        const scene = this.getCurrentScene();
        if (!scene) {
            Log.warn('[ThemeManager] Chưa có scene để load theme assets');
            return;
        }

        const assets = this.getThemeAssetsByName(themeName);
        if (!assets) return;

        let queuedCount = 0;
        if (typeof assets.background === 'string' && assets.background.trim()) {
            this.loadThemeAssetAndRebind(scene, 'background', assets.background.trim());
            queuedCount += 1;
        }
        const iconMappings: Array<{ key: 'compass' | 'equip' | 'library'; url?: string }> = [
            { key: 'compass', url: assets.icons?.compass },
            { key: 'equip', url: assets.icons?.equip },
            { key: 'library', url: assets.icons?.library },
        ];
        for (const item of iconMappings) {
            if (!item.url || !item.url.trim()) continue;
            this.loadThemeAssetAndRebind(scene, item.key, item.url.trim());
            queuedCount += 1;
        }

        if (queuedCount > 0 && !scene.load.isLoading()) {
            scene.load.start();
        }
    }

    /**
     * Áp dụng theme đã lưu (gọi sau khi load theme xong, ví dụ khi mở game).
     * Đồng bộ với `applyCharacterTheme` / `selectedCharacter` (giống `loadTheme`).
     */
    applySavedTheme(): void {
        this.applyThemeFromDataPreferences();
    }

    /**
     * Áp theme theo local: `applyCharacterTheme === false` → luôn theme tên `"default"`;
     * `true` → nếu level của `selectedCharacter` trong map `characterLevel` dưới {@link CHARACTER_THEME_APPLY_MIN_LEVEL} vẫn `"default"`;
     * ngược lại theme trùng `selectedCharacter`, không có thì fallback `"default"`.
     */
    applyThemeFromDataPreferences(): void {
        if (!this._loaded || this.themeList.length === 0) return;

        const defaultNamed =
            this.themeList.find((t) => t.name === 'default') ?? this.themeList[0];

        const applyCharacterTheme = dataManager.get<boolean>('applyCharacterTheme') === true;
        if (!applyCharacterTheme) {
            this.setThemeByName(defaultNamed.name);
            return;
        }

        const selectedCharacter = dataManager.get<string>('selectedCharacter');
        const level = getCharacterLevelForSelected(selectedCharacter);
        if (level < CHARACTER_THEME_APPLY_MIN_LEVEL) {
            this.setThemeByName(defaultNamed.name);
            return;
        }

        const characterTheme =
            selectedCharacter != null
                ? this.themeList.find((t) => t.name === selectedCharacter)
                : undefined;
        const toApply = characterTheme ?? defaultNamed;
        this.setThemeByName(toApply.name);
    }

    /** Đổi theme theo tên và lưu vào dataManager */
    setThemeByName(name: string): void {
        if (!this._loaded) {
            Log.error('[ThemeManager] Chưa load theme, không thể setThemeByName.');
            return;
        }
        const theme = this.themeList.find((t) => t.name === name);
        if (!theme) {
            Log.error('[ThemeManager] Không tìm thấy theme:', name);
            return;
        }
        this.palette = theme.colors;
        dataManager.set('theme', theme.name);
        this.queueThemeTextureBindings(theme.name);
    }

    getCurrentThemeName(): string | null {
        return dataManager.get<string>('theme');
    }

    getThemeList(): Readonly<{ name: string; colors: ThemePalette }[]> {
        return this.themeList;
    }

    isLoaded(): boolean {
        return this._loaded;
    }

    private ensurePalette(): ThemePalette {
        if (!this.palette) {
            throw new Error('[ThemeManager] Theme chưa load hoặc load thất bại. Gọi loadTheme() và đảm bảo theme.json hợp lệ.');
        }
        return this.palette;
    }

    getPrimary(): string { return this.ensurePalette().primary; }
    getSecondary(): string { return this.ensurePalette().secondary; }
    getAccent(): string { return this.ensurePalette().accent; }
    getNeutral(): string { return this.ensurePalette().neutral; }
    getBackground(): string { return this.ensurePalette().background; }
    getSurface(): string { return this.ensurePalette().surface; }
    getText(): string { return this.ensurePalette().text; }
    getSuccess(): string { return this.ensurePalette().success; }
    getWarning(): string { return this.ensurePalette().warning; }
    getError(): string { return this.ensurePalette().error; }
    getInfo(): string { return this.ensurePalette().info; }

    getPrimaryPhaser(): number { return toPhaserHex(this.ensurePalette().primary); }
    getSecondaryPhaser(): number { return toPhaserHex(this.ensurePalette().secondary); }
    getAccentPhaser(): number { return toPhaserHex(this.ensurePalette().accent); }
    getNeutralPhaser(): number { return toPhaserHex(this.ensurePalette().neutral); }
    getBackgroundPhaser(): number { return toPhaserHex(this.ensurePalette().background); }
    getSurfacePhaser(): number { return toPhaserHex(this.ensurePalette().surface); }
    getTextPhaser(): number { return toPhaserHex(this.ensurePalette().text); }
    getSuccessPhaser(): number { return toPhaserHex(this.ensurePalette().success); }
    getWarningPhaser(): number { return toPhaserHex(this.ensurePalette().warning); }
    getErrorPhaser(): number { return toPhaserHex(this.ensurePalette().error); }
    getInfoPhaser(): number { return toPhaserHex(this.ensurePalette().info); }

    get(key: keyof ThemePalette): string {
        return this.ensurePalette()[key];
    }

    getPhaser(key: keyof ThemePalette): number {
        return toPhaserHex(this.ensurePalette()[key]);
    }

    getPalette(): Readonly<ThemePalette> {
        return { ...this.ensurePalette() };
    }
}

export const themeManager = ThemeManager.getInstance();
