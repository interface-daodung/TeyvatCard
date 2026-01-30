import type GameManager from '../core/GameManager.js';

/**
 * Class Item - Class cơ bản cho tất cả các item trong game
 * Chỉ dùng làm class mẫu, không dùng trực tiếp
 */
export default class Item {
    name: string;
    nameId: string;
    image: string;
    _power: number;
    _cooldown: number;
    description: string;
    level: number;
    maxLevel: number;
    gameManager?: GameManager;

    constructor(
        name: string,
        nameId: string,
        image: string,
        power: number,
        cooldown: number,
        description: string,
        maxLevel: number = 5
    ) {
        this.name = name;
        this.nameId = nameId;
        this.image = image;
        this._power = power;
        this._cooldown = cooldown;
        this.description = description;
        this.level = 0;
        this.maxLevel = maxLevel;
    }

    effect(gameManager: GameManager): boolean {
        this.gameManager = gameManager;
        this.gameManager.animationManager.startItemAnimation(this.image, () => {
            console.log(`Sử dụng item: ${this.nameId}`);
        });
        return false;
    }

    get power(): number {
        return this._power * (1 + this.level * 0.2);
    }

    get cooldown(): number {
        return Math.max(0, this._cooldown - this.level * 0.5);
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
