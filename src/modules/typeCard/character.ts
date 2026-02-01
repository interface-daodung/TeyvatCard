import Phaser from 'phaser';
import Card from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Character extends Card {
    level: number;
    hp: number;
    weapon: { default: any; durability: number } | null;
    hpDisplay!: CreateDisplayResult;
    weaponDisplay!: CreateDisplayResult;
    weaponBadgeDisplay!: { updateTexture: (texture: string) => void; destroy: () => void };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'character');
        this.level = this.getLevel();
        this.hp = this.getMaxHP();
        this.weapon = null;
    }

    createCard(): void {
        if (this.level > 2) {
            this.cardImage = SpritesheetWrapper.CharacterAnimation(
                this.scene,
                0,
                0,
                this.nameId + '-sprite',
                160,
                274.3
            ) as Phaser.GameObjects.Sprite;
            this.border = this.scene.add.graphics();
            this.border.fillStyle(0xdcc06f, 1);
            this.border.lineStyle(2, 0xdcc06f, 1);
            this.border.fillRoundedRect(-82, -139, 164, 278.3, 20);
            this.border.strokeRoundedRect(-82, -139, 164, 278.3, 20);

            this.add([this.border, this.cardImage]);
            this.addDisplayHUD();

            this.setInteractive(new Phaser.Geom.Rectangle(-80, -137, 160, 274.3), Phaser.Geom.Rectangle.Contains);

            this.on('pointerdown', () => this.onCardPointerDown());
            this.on('pointerup', () => this.onCardPointerUp());
            this.on('pointerover', () => this.onCardHover());
            this.on('pointerout', () => this.onCardOut());
        } else {
            super.createCard();
        }
    }

    addDisplayHUD(): void {
        this.hpDisplay = this.createDisplay(
            { fillColor: 0xff0000, text: this.hp.toString() },
            'rightTop' as DisplayPosition
        );
        this.weaponDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: String(this.weapon?.durability ?? 0) },
            'leftBottom' as DisplayPosition
        );
        this.weaponBadgeDisplay = this.createBadgeDisplay();
    }

    takeDamage(damage: number, type?: string): number {
        super.takeDamage(damage, type);
        this.hp = Math.max(0, this.hp - damage);
        this.hpDisplay.updateText(this.hp.toString());
        this.showPopup(damage, 'damage');

        if (this.hp <= 0) {
            this.scene.gameManager?.gameOver();
        }
        return this.hp;
    }

    heal(healAmount: number): void {
        this.hp = Math.min(this.getMaxHP(), this.hp + healAmount);
        this.hpDisplay.updateText(this.hp.toString());
        this.showPopup(healAmount, 'heal');
    }

    showPopup(amount: number, type: 'heal' | 'damage' = 'heal'): void {
        const color = type === 'heal' ? '#00ff00' : type === 'damage' ? '#ff0000' : '#ffffff';
        const prefix = type === 'heal' ? '+' : type === 'damage' ? '-' : '';

        const popupText = this.scene.add
            .text(0, 0, `${prefix}${amount}`, {
                fontSize: '32px',
                color: color,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            })
            .setOrigin(0.5)
            .setDepth(2002);

        this.add(popupText);

        this.scene.tweens.add({
            targets: popupText,
            y: -50,
            alpha: 0.1,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => popupText.destroy()
        });
    }

    getMaxHP(): number {
        const Def = (this.constructor as typeof Card & { DEFAULT?: { hp?: number } }).DEFAULT;
        return (Def?.hp ?? 10) + this.getLevel() - 1;
    }

    getLevel(): number {
        const CharacterLevel = localStorage.getItem('characterLevel');
        if (CharacterLevel) {
            const parsed = JSON.parse(CharacterLevel) as Record<string, number>;
            return parsed[this.nameId] ?? 1;
        }
        return 1;
    }

    setWeapon(weapon: { default: any; durability: number }): void {
        const currentDurability = this.weapon?.durability ?? 0;
        if (weapon.durability > currentDurability) {
            this.weapon = weapon;
            this.weaponDisplay.updateText(this.weapon.durability);
            this.weaponBadgeDisplay.updateTexture(((this.weapon as any).default?.id ?? '') + '-badge');
            (this.scene as any).sellButton?.updateButton();
        } else {
            this.scene.gameManager?.addCoin(weapon.durability);
        }
    }

    createBadgeDisplay(texture: string = ''): { updateTexture: (newTexture: string) => void; destroy: () => void } {
        const badgeDisplay = this.scene.add
            .image(0, 0, texture)
            .setOrigin(0.5)
            .setPosition(40, 96)
            .setDisplaySize(10, 10);
        this.add(badgeDisplay);
        if (texture === '') {
            badgeDisplay.setVisible(false);
        }

        return {
            updateTexture: (newTexture: string) => {
                if (this.weapon && (this.weapon as any).default?.category) {
                    badgeDisplay.setTexture(
                        'weapon-' + (this.weapon as any).default.category + '-badge',
                        newTexture
                    );
                } else {
                    badgeDisplay.setTexture(newTexture);
                }
                badgeDisplay.setVisible(newTexture !== '');
            },
            destroy: () => badgeDisplay.destroy()
        };
    }

    repair(repairAmount: number): boolean {
        if (!this.weapon) return false;
        this.weapon.durability += repairAmount;
        this.weaponDisplay.updateText(this.weapon.durability);
        (this.scene as any).sellButton?.updateButton();
        return true;
    }

    reduceDurability(damage: number): void {
        if (!this.weapon) return;
        this.weapon.durability -= damage;
        this.weaponDisplay.updateText(this.weapon.durability);
        if (this.weapon.durability <= 0) {
            this.weapon = null;
            this.weaponDisplay.updateText(0);
            this.weaponBadgeDisplay.updateTexture('');
            (this.scene as any).sellButton?.hideButton();
        } else {
            (this.scene as any).sellButton?.updateButton();
        }
    }
}
