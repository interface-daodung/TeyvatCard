/**
 * ThemeManager - Quản lý theme màu sắc toàn hệ thống
 *
 * 7 màu chủ đảo (chỉ cần đổi 7 màu này sẽ đổi màu toàn bộ hệ thống):
 * - Primary:   #95245b – Nút chính, điểm nhấn
 * - Secondary: #96576a – Viền, thumb, power/cooldown
 * - Accent:    #FFD700 – Stage title, badge, highlight (gold)
 * - Neutral:   #e0e0e0 – Hover, disabled
 * - Background:#000000 – Overlay, grid
 * - Surface:   #1a1a2e – Card, panel
 * - Text:      #ffffff – Chữ chính
 *
 * Load theme từ JSON qua DataManager.loadJsonFromData (public/data), fallback về màu mặc định và log lỗi nếu thất bại.
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
    success: string;  // xanh – heal, các màu xanh
    warning: string;  // vàng
    error: string;    // đỏ – damage
    info: string;     // xanh biển nếu cần
}

export interface ThemeData {
    name?: string;
    colors: ThemePalette;
}

/** Màu mặc định fallback khi chưa load hoặc lỗi */
const DEFAULT_PALETTE: ThemePalette = {
    primary: '#95245b',
    secondary: '#96576a',
    accent: '#FFD700',
    neutral: '#e0e0e0',
    background: '#000000',
    surface: '#1a1a2e',
    text: '#ffffff',
    success: '#2ecc71',
    warning: '#f1c40f',
    error: '#e74c3c',
    info: '#3498db',
};

const PALETTE_KEYS: (keyof ThemePalette)[] = [
    'primary', 'secondary', 'accent', 'neutral', 'background', 'surface', 'text',
    'success', 'warning', 'error', 'info',
];

/**
 * Chuyển #rrggbb hoặc #rrggbbaa thành số hex Phaser (0xrrggbb)
 */
export function toPhaserHex(hexStr: string): number {
    const s = hexStr.replace(/^#/, '');
    const rgb = s.length >= 6 ? s.slice(0, 6) : s.padEnd(6, '0');
    return parseInt(rgb, 16);
}

function parsePalette(obj: unknown): ThemePalette | null {
    if (!obj || typeof obj !== 'object') return null;
    const colors = (obj as Record<string, unknown>).colors;
    if (!colors || typeof colors !== 'object') return null;

    const result: Partial<ThemePalette> = {};
    for (const key of PALETTE_KEYS) {
        const v = (colors as Record<string, unknown>)[key];
        if (typeof v === 'string' && /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v)) {
            result[key] = v;
        } else {
            result[key] = DEFAULT_PALETTE[key];
        }
    }
    return result as ThemePalette;
}

export default class ThemeManager {
    private static instance: ThemeManager;
    private palette: ThemePalette = { ...DEFAULT_PALETTE };
    private _loaded = false;

    private constructor() {}

    static getInstance(): ThemeManager {
        if (!ThemeManager.instance) {
            ThemeManager.instance = new ThemeManager();
        }
        return ThemeManager.instance;
    }

    /**
     * Load theme từ JSON qua DataManager.loadJsonFromData (đọc từ public/data).
     * Fallback về palette mặc định và log lỗi nếu load/parse thất bại.
     * @param scene - Phaser Scene (dùng scene.load và scene.cache)
     * @param dataPath - Đường dẫn trong data (vd: 'theme.json')
     * @param cacheKey - Key lưu trong cache (mặc định 'theme')
     * @returns Promise resolve khi đã áp dụng theme (hoặc fallback)
     */
    loadTheme(scene: Phaser.Scene, dataPath = 'theme.json', cacheKey = 'theme'): Promise<void> {
        return dataManager
            .loadJsonFromData<ThemeData>(scene, dataPath, cacheKey)
            .then((data) => {
                const parsed = parsePalette(data);
                if (parsed) {
                    this.palette = parsed;
                    this._loaded = true;
                } else {
                    Log.error('[ThemeManager] Fallback: dữ liệu theme không hợp lệ (thiếu colors hoặc định dạng sai)', dataPath);
                    this.palette = { ...DEFAULT_PALETTE };
                    this._loaded = false;
                }
            })
            .catch((err) => {
                Log.error('[ThemeManager] Fallback: không load được theme, dùng palette mặc định.', 'dataPath:', dataPath, err);
                this.palette = { ...DEFAULT_PALETTE };
                this._loaded = false;
            });
    }

    isLoaded(): boolean {
        return this._loaded;
    }

    /** Trả về chuỗi hex (#rrggbb) dùng cho CSS, DOM, Phaser text style */
    getPrimary(): string { return this.palette.primary; }
    getSecondary(): string { return this.palette.secondary; }
    getAccent(): string { return this.palette.accent; }
    getNeutral(): string { return this.palette.neutral; }
    getBackground(): string { return this.palette.background; }
    getSurface(): string { return this.palette.surface; }
    getText(): string { return this.palette.text; }
    getSuccess(): string { return this.palette.success; }
    getWarning(): string { return this.palette.warning; }
    getError(): string { return this.palette.error; }
    getInfo(): string { return this.palette.info; }

    /** Trả về số hex (0xrrggbb) dùng cho Phaser Graphics: fillStyle, lineStyle, setTint, v.v. */
    getPrimaryPhaser(): number { return toPhaserHex(this.palette.primary); }
    getSecondaryPhaser(): number { return toPhaserHex(this.palette.secondary); }
    getAccentPhaser(): number { return toPhaserHex(this.palette.accent); }
    getNeutralPhaser(): number { return toPhaserHex(this.palette.neutral); }
    getBackgroundPhaser(): number { return toPhaserHex(this.palette.background); }
    getSurfacePhaser(): number { return toPhaserHex(this.palette.surface); }
    getTextPhaser(): number { return toPhaserHex(this.palette.text); }
    getSuccessPhaser(): number { return toPhaserHex(this.palette.success); }
    getWarningPhaser(): number { return toPhaserHex(this.palette.warning); }
    getErrorPhaser(): number { return toPhaserHex(this.palette.error); }
    getInfoPhaser(): number { return toPhaserHex(this.palette.info); }

    /** Lấy màu theo key (cho vòng lặp hoặc mapping) */
    get(key: keyof ThemePalette): string {
        return this.palette[key];
    }

    getPhaser(key: keyof ThemePalette): number {
        return toPhaserHex(this.palette[key]);
    }

    /** Trả về toàn bộ palette hiện tại */
    getPalette(): Readonly<ThemePalette> {
        return { ...this.palette };
    }
}

export const themeManager = ThemeManager.getInstance();
