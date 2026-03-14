/**
 * ThemeManager - Quản lý theme màu sắc toàn hệ thống
 *
 * Đọc theme.json (object key-value, key = tên theme). Mặc định dùng theme đầu tiên (theo thứ tự key).
 * Lưu tên theme hiện tại qua dataManager (key 'theme'). Khi mở game đọc dataManager.get('theme') để áp dụng.
 * Không fallback: nếu không đọc được hoặc dữ liệu không hợp lệ thì báo lỗi.
 */

import { dataManager } from './DataManager.js';
import { Log } from '../utils/Log.js';

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

export default class ThemeManager {
    private static instance: ThemeManager;
    private palette: ThemePalette | null = null;
    private themeList: { name: string; colors: ThemePalette }[] = [];
    private _loaded = false;

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
        return dataManager
            .loadJsonFromData<unknown>(scene, dataPath, cacheKey)
            .then((data) => {
                const list = normalizeThemeList(data);
                this.themeList = list;
                const defaultTheme = list[0];
                const savedName = dataManager.get<string>('theme');
                const toApply = savedName != null
                    ? list.find((t) => t.name === savedName) ?? defaultTheme
                    : defaultTheme;
                this.palette = toApply.colors;
                dataManager.set('theme', toApply.name);
                this._loaded = true;
            })
            .catch((err) => {
                Log.error('[ThemeManager] Không đọc được theme. Bắt buộc phải có theme.json hợp lệ.', dataPath, err);
                this._loaded = false;
                this.palette = null;
                throw err;
            });
    }

    /**
     * Áp dụng theme đã lưu (gọi sau khi load theme xong, ví dụ khi mở game).
     * Đọc dataManager.get('theme') và set palette theo tên; nếu chưa load theme thì no-op.
     */
    applySavedTheme(): void {
        if (!this._loaded || this.themeList.length === 0) return;
        const savedName = dataManager.get<string>('theme');
        const theme = savedName != null
            ? this.themeList.find((t) => t.name === savedName)
            : this.themeList[0];
        if (theme) {
            this.palette = theme.colors;
            dataManager.set('theme', theme.name);
        }
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
