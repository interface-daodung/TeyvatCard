import Phaser from 'phaser';
import { localizationManager } from '../../core/LocalizationManager.js';
import { dataManager } from '../../core/DataManager.js';
import type GameManager from '../../core/GameManager.js';
import { Log } from '../../utils/Log.js';
import CardView from './CardView.js';
import type { CardViewOptions } from './CardView.js';
import type { LibraryCardData } from '../../components/LibraryScene/types.js';

export interface SceneWithGameManager extends Phaser.Scene {
    gameManager?: GameManager;
}

export interface CardDefault {
    category?: string;
    clan?: string;
    id?: string;
    name?: string;
    description?: string;
    rarity?: number;
    element?: string;
    hp?: number;
    type?: string;
    /** Mô tả khi coin ở trạng thái cộng hưởng (dùng cho Coin) */
    resonanceDescription?: string;
    /** Các chỉ số cho Enemy */
    healthMin?: number;
    healthMax?: number;
    scoreMin?: number;
    scoreMax?: number;
    /** Các chỉ số cho Bomb và Trap */
    countdown?: number;
    damageMin?: number;
    damageMax?: number;
    /** Các chỉ số cho Treasure và Weapon */
    durabilityMin?: number;
    durabilityMax?: number;
    /** Các chỉ số cho Food */
    foodMin?: number;
    foodMax?: number;
    /** Treasure: danh sách className của thẻ có thể rơi ra khi mở rương */
    contents?: string[];
}

export interface CreateDisplayOptions {
    fillColor?: number;
    text?: string;
}

export type DisplayPosition = 'leftTop' | 'rightTop' | 'rightBottom' | 'leftBottom';

/** Legacy type for subclasses that still reference createDisplay result; view uses CardView.updateText. */
export interface CreateDisplayResult {
    updateText: (newText: string | number) => void;
    updateColor?: (newColor: number) => void;
    destroy: () => void;
}

export interface ViewCallbacks {
    onCardClick: (index: number) => void;
    isInputLocked?: () => boolean;
    getCardDataForDialog?: () => LibraryCardData;
}

/**
 * Card - Model chỉ chứa dữ liệu và logic game.
 * Không kế thừa Phaser, không gọi tween/display. View tách riêng trong CardView.
 */
export default class Card {
    declare scene: SceneWithGameManager;
    index: number;
    name: string;
    nameId: string;
    type: string;
    unsubscribeList: Array<() => void>;
    description?: string;
    /** Config đã áp dụng (từ JSON). */
    protected config?: CardDefault;
    /** View hiển thị (tạo khi addCard / ensureView). */
    view: CardView | null = null;
    /** Hàm cộng hưởng (tùy chọn, dùng cho Coin hoặc thẻ đặc biệt). */
    // resonance?: () => void;

    static DEFAULT: CardDefault = {};

    constructor(
        scene: SceneWithGameManager,
        _x: number,
        _y: number,
        index: number,
        name: string,
        nameId: string,
        type: string
    ) {
        this.scene = scene;
        this.index = index;
        this.name = name;
        this.nameId = nameId;
        this.type = type;
        this.unsubscribeList = [];
    }

    /**
     * Gán các chỉ số từ config (JSON hoặc DEFAULT) xuống instance.
     */
    applyConfig(config: CardDefault): void {
        this.config = { ...this.config, ...config };
        if (config.name != null) this.name = config.name;
        if (config.id != null) this.nameId = config.id;
        if (config.description != null) this.description = config.description;
        if (config.rarity != null) (this as any).rarity = config.rarity;
    }

    /**
     * Tạo CardView cho thẻ này. Gọi khi thêm thẻ vào grid (CardManager.addCard).
     * Subclass override buildViewOptions() để thêm hudDisplays, useSprite, v.v.
     */
    createView(
        scene: Phaser.Scene,
        x: number,
        y: number,
        callbacks: ViewCallbacks
    ): CardView {
        const opts: CardViewOptions = {
            scene,
            x,
            y,
            index: this.index,
            type: this.type,
            nameId: this.nameId,
            name: this.name,
            description: this.description,
            config: this.config,
            onCardClick: callbacks.onCardClick,
            isInputLocked: callbacks.isInputLocked,
            getCardDataForDialog: callbacks.getCardDataForDialog ?? (() => this.getCardDataForDialog()),
            ...this.buildViewOptions()
        };
        this.view = new CardView(opts);
        return this.view;
    }

    /**
     * Override trong subclass để thêm hudDisplays, useSprite, spriteKey, hasWeaponBadge, borderColor.
     */
    protected buildViewOptions(): Partial<CardViewOptions> {
        return {};
    }

    /** Dữ liệu cho dialog thông tin thẻ (long-press). */
    getCardDataForDialog(): LibraryCardData {
        const def = this.config ?? (this.constructor as typeof Card & { DEFAULT?: CardDefault }).DEFAULT ?? {};
        return {
            type: this.type,
            id: this.nameId,
            name: this.name,
            description: this.type === 'character' ? this.getDescription() : (this.description ?? 'adventureCard._no_key.description'),
            category: def.category,
            clan: def.clan
        };
    }

    getDescription(): string {
        if (this.type === 'character') {
            return this.description ?? 'Không có mô tả cho thẻ này.';
        }
        const key = this.description ?? 'adventureCard._no_key.description';
        return localizationManager.t(key) || key;
    }

    GetRandom(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    CardEffect(): boolean {
        Log.info(`Card ${this.name} (${this.nameId}) đang chạy hiệu ứng...`);
        return false;
    }

    takeDamage(damage: number, type?: string): void {
        Log.info(`Card ${this.name} (${this.nameId}) bị tấn công ${damage} damage`);
    }

    /**
     * Logic chết: không gọi ProgressDestroy hay tạo thẻ mới; GameManager sẽ apply state + animation.
     */
    die(): void {
        // No-op in base; subclasses may set state. Replacement and view destroy/creation done by GameManager.
    }

    destroyed: boolean = false;
}
