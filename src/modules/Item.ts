import type GameManager from '../core/GameManager.js';
import { dataManager } from '../core/DataManager.js';
import { ItemAnimation } from '../animations/ItemAnimation.js';

/** Một cấp trong levelStats từ items.json */
export interface ItemLevelStat {
    power: number;
    cooldown: number;
    price: number;
}

/** Một item trong mảng items.json */
export interface ItemConfigFromJson {
    nameId: string;
    basePower: number;
    baseCooldown: number;
    maxLevel: number;
    levelStats: ItemLevelStat[];
}

/**
 * Class Item - Class cơ bản cho tất cả các item trong game
 * Chỉ dùng làm class mẫu, không dùng trực tiếp
 * name và description lưu key i18n (item.{nameId}.name, item.{nameId}.description) để I18nText dùng
 */
export default class Item {
    /** Key i18n cho tên (vd: item.black-hole.name) */
    name: string;
    nameId: string;
    image: string;
    /** Key i18n cho mô tả (vd: item.black-hole.description) */
    description: string;
    _power: number;
    _cooldown: number;
    level: number;
    maxLevel: number;
    /** Từ items.json, stats theo level (level 1 = levelStats[0], ...) */
    levelStats: ItemLevelStat[] | undefined;
    gameManager?: GameManager;

    constructor(nameId: string, image?: string) {
        this.nameId = nameId;
        this.name = `item.${nameId}.name`;
        this.description = `item.${nameId}.description`;
        this.image = image ?? nameId;
        this._power = 0;
        this._cooldown = 0;
        this.level = 0;
        this.maxLevel = 5;
        this.levelStats = undefined;
    }

    /**
     * Đọc config từ dataManager (items.json đã load trong LoadingScene) và áp dụng basePower, baseCooldown, maxLevel, levelStats.
     * Gọi trong constructor của lớp con sau super(nameId).
     */
    applyConfig(): void {
        const items = dataManager.getFlag<ItemConfigFromJson[]>('items');
        if (!Array.isArray(items)) return;
        const config = items.find((it) => it.nameId === this.nameId);
        if (!config) return;
        this._power = config.basePower;
        this._cooldown = config.baseCooldown;
        this.maxLevel = config.maxLevel;
        this.levelStats = config.levelStats;
    }

    effect(gameManager: GameManager): boolean {
        this.gameManager = gameManager;
        ItemAnimation.runAsync(gameManager.animationManager, this.image); 
        // this.gameManager.animationManager.startItemAnimation(this.image, () => {
        //     console.log(`Sử dụng item: ${this.nameId}`);
        // });
        return false;
    }

    /** Power lấy từ levelStats (config JSON), level 0 dùng _power (basePower). */
    get power(): number {
        if (this.level > 0 && this.levelStats && this.levelStats[this.level - 1] != null) {
            return this.levelStats[this.level - 1].power;
        }
        return this._power;
    }

    /** Cooldown lấy từ levelStats (config JSON), level 0 dùng _cooldown (baseCooldown). */
    get cooldown(): number {
        if (this.level > 0 && this.levelStats && this.levelStats[this.level - 1] != null) {
            return this.levelStats[this.level - 1].cooldown;
        }
        return this._cooldown;
    }

    isUpgrade(): boolean {
        return this.level < this.maxLevel;
    }

    upgrade(): boolean {
        if (this.isUpgrade()) {
            this.level++;
            return true;
        }
        return false;
    }

    getPrice(): number {
        if (this.levelStats && this.levelStats[this.level] != null) {
            return this.levelStats[this.level].price;
        }
        if (this.level === 0) return 1000;
        return this.level * 100;
    }

    getInfo(): {
        name: string;
        nameId: string;
        image: string;
        power: number;
        cooldown: number;
        description: string;
        level: number;
        maxLevel: number;
    } {
        return {
            name: this.name,
            nameId: this.nameId,
            image: this.image,
            power: this.power,
            cooldown: this.cooldown,
            description: this.description,
            level: this.level,
            maxLevel: this.maxLevel
        };
    }
}
