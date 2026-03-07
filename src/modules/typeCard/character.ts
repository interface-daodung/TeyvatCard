import Card from '../card/Card.js';
import { dataManager } from '../../core/DataManager.js';
import type { CardDefault } from '../card/Card.js';
import type { SceneWithGameManager } from '../card/Card.js';
import Equipment from './equipment.js';
import { soundManager } from '../../core/SoundManager.js';
import type { HudDisplaySpec } from '../card/CardView.js';

const POPUP_CONFIG = {
    heal: { color: '#00ff00' as const, prefix: '+' },
    damage: { color: '#ff0000' as const, prefix: '-' },
    poisoning: { color: '#800080' as const, prefix: '-' },
    error: { color: '#ffffff' as const, prefix: '' }
};

export default class Character extends Card {
    level: number;
    hp: number;
    weapon: Equipment | null;
    configHp?: number;
    poisoning: boolean = false;
    private poisonUnsub?: () => void;
    Recovery: number = 0;
    healAmount: number = 0;
    private recoverUnsub?: () => void;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'character');
        this.level = this.getLevel();
        this.hp = this.getMaxHP();
        this.weapon = null;
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.element != null) (this as any).element = config.element;
        if (config.hp != null) this.configHp = config.hp;
        this.hp = this.getMaxHP();
    }

    override buildViewOptions(): {
        hudDisplays: HudDisplaySpec[];
        useSprite?: boolean;
        spriteKey?: string;
        borderColor?: number;
        hasWeaponBadge?: boolean;
    } {
        const hudDisplays: HudDisplaySpec[] = [
            { key: 'hp', fillColor: 0xff0000, text: String(this.hp), position: 'rightTop' },
            { key: 'weapon', fillColor: 0xff6600, text: String(this.weapon?.durability ?? 0), position: 'leftBottom' }
        ];
        return {
            hudDisplays,
            useSprite: this.level > 2,
            spriteKey: this.nameId + '-sprite',
            borderColor: 0xdcc06f,
            hasWeaponBadge: true
        };
    }

    setPoisoning(): void {
        if (this.poisoning) return;
        this.poisoning = true;
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.PoisoningEffect.bind(this),
            5
        );
        if (unsub && typeof unsub === 'function') {
            this.poisonUnsub = unsub;
            this.unsubscribeList.push(unsub);
        }
    }

    PoisoningEffect(): void {
        if (!this.poisoning) return;
        if (this.hp > 1) {
            this.takeDamage(1, 'poisoning');
            return;
        }
        this.clearPoison();
    }

    clearPoison(): void {
        if (!this.poisoning) return;
        this.poisoning = false;
        if (this.poisonUnsub) {
            this.poisonUnsub();
            const i = this.unsubscribeList.indexOf(this.poisonUnsub);
            if (i !== -1) this.unsubscribeList.splice(i, 1);
            this.poisonUnsub = undefined;
        }
    }

    setRecovery(turns: number, healAmount: number): void {
        if (this.Recovery > 0) return;
        this.Recovery = turns;
        this.healAmount = healAmount;
        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.RecoveryEffect.bind(this),
            6
        );
        if (unsub && typeof unsub === 'function') {
            this.recoverUnsub = unsub;
            this.unsubscribeList.push(unsub);
        }
    }

    clearRecovery(): void {
        if (!this.recoverUnsub) return;
        this.Recovery = 0;
        this.recoverUnsub();
        const i = this.unsubscribeList.indexOf(this.recoverUnsub);
        if (i !== -1) this.unsubscribeList.splice(i, 1);
        this.recoverUnsub = undefined;
    }

    RecoveryEffect(): void {
        if (this.Recovery <= 0) return;
        this.heal(this.healAmount);
        this.Recovery--;
        if (this.Recovery <= 0) this.clearRecovery();
    }

    override takeDamage(damage: number, type: 'poisoning' | 'damage'): number {
        this.hp = Math.max(0, this.hp - damage);
        this.view?.updateText('hp', this.hp);
        this.view?.showPopup(damage, type);
        if (this.hp <= 0) this.scene.gameManager?.gameOver();
        return this.hp;
    }

    heal(healAmount: number): void {
        this.hp = Math.min(this.getMaxHP(), this.hp + healAmount);
        this.view?.updateText('hp', this.hp);
        this.view?.showPopup(healAmount, 'heal');
    }

    getMaxHP(): number {
        const baseHp = this.configHp ?? (this.constructor as typeof Card & { DEFAULT?: { hp?: number } }).DEFAULT?.hp ?? 10;
        return baseHp + this.getLevel() - 1;
    }

    getLevel(): number {
        const levelData = dataManager.get<Record<string, number>>('characterLevel');
        return levelData?.[this.nameId] ?? 1;
    }

    setWeapon(weapon: Equipment): void {
        const currentDurability = this.weapon?.durability ?? 0;
        if (weapon.durability > currentDurability) {
            if (currentDurability > 0) {
                this.scene.gameManager?.addCoin(currentDurability);
            }
            this.weapon = weapon;
            this.view?.updateText('weapon', this.weapon.durability);
            const category = (this.weapon as any).default?.category;
            const badgeKey = category ? 'weapon-' + category + '-badge' : '';
            const frame = (this.weapon as any).default?.id ?? '' + '-badge';
            this.view?.updateWeaponBadge(true, badgeKey || undefined, frame);
            (this.scene as any).sellButton?.updateButton?.();
            soundManager.play('equip-sound');
        } else {
            this.scene.gameManager?.addCoin(weapon.price);
        }
    }

    repair(repairAmount: number): boolean {
        if (!this.weapon) return false;
        this.weapon.durability += repairAmount;
        this.view?.updateText('weapon', this.weapon.durability);
        (this.scene as any).sellButton?.updateButton?.();
        return true;
    }

    reduceDurability(damage: number): void {
        if (!this.weapon) return;
        this.weapon.durability -= damage;
        this.view?.updateText('weapon', this.weapon.durability);
        if (this.weapon.durability <= 0) {
            this.weapon = null;
            this.view?.updateText('weapon', 0);
            this.view?.updateWeaponBadge(false);
            (this.scene as any).sellButton?.hideButton?.();
        } else {
            (this.scene as any).sellButton?.updateButton?.();
        }
    }
}
