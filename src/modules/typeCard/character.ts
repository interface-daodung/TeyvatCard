import Phaser from 'phaser';
import Card from '../Card.js';
import { dataManager } from '../../core/DataManager.js';
import type { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import { SpritesheetWrapper } from '../../utils/SpritesheetWrapper.js';
import type { SceneWithGameManager } from '../Card.js';
import Equipment from './equipment.js';
import { soundManager } from '../../core/SoundManager.js';


export default class Character extends Card {
    level: number;
    hp: number;
    weapon: Equipment | null;
    hpDisplay!: CreateDisplayResult;
    weaponDisplay!: CreateDisplayResult;
    weaponBadgeDisplay!: { updateTexture: (texture: string) => void; destroy: () => void };
    /** HP base từ config (JSON/DEFAULT), dùng trong getMaxHP nếu có */
    configHp?: number;

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
            this.addCardNameIfEnabled();

            this.setInteractive(new Phaser.Geom.Rectangle(-80, -137, 160, 274.3), Phaser.Geom.Rectangle.Contains);

            this.on('pointerdown', () => this.onCardPointerDown());
            this.on('pointerup', () => this.onCardPointerUp());
            this.on('pointerover', () => this.onCardHover());
            this.on('pointerout', () => this.onCardOut());
        } else {
            super.createCard();
        }
    }
    // trạng thái bị đầu độc
    poisoning: boolean = false;

    private poisonUnsub?: () => void;
    /**
     * hàm để set trạng thái đầu độc cho nhân vật. Khi được gọi, nhân vật sẽ bị trừ 1 HP sau mỗi lượt đi (completeMove) trong 6 lượt hoặc đến khi HP <= 1 thì hết độc.
     */
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

        // hp <= 1 → hết độc
        this.clearPoison();
    }

    clearPoison(): void {

        if (!this.poisoning) return;

        this.poisoning = false;

        if (this.poisonUnsub) {

            this.poisonUnsub();

            const index = this.unsubscribeList.indexOf(this.poisonUnsub);
            if (index !== -1) {
                this.unsubscribeList.splice(index, 1);
            }

            this.poisonUnsub = undefined;
        }
    }

    Recovery: number = 0; // số lượt còn được hồi hp
    healAmount: number = 0; // số hp được hồi mỗi lượt
    recoverUnsub?: () => void;
    /*
    * hàm để set trạng thái hồi phục cho nhân vật. Khi được gọi, nhân vật sẽ được hồi một lượng HP nhất định sau mỗi lượt đi (completeMove) trong một số lượt xác định.
    * @param turns số lượt còn được hồi HP
    * @param healAmount số HP được hồi mỗi lượt
    */
    setRecovery(turns: number, healAmount: number): void {

        if (this.Recovery > 0) return;

        this.Recovery = turns;
        this.healAmount = healAmount;

        const unsub = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.RecoveryEffect.bind(this),
            6 // ưu tiên 
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

        const index = this.unsubscribeList.indexOf(this.recoverUnsub);
        if (index !== -1) {
            this.unsubscribeList.splice(index, 1);
        }

        this.recoverUnsub = undefined;
    }

    RecoveryEffect(): void {

        if (this.Recovery <= 0) return;

        this.heal(this.healAmount);

        this.Recovery--;

        if (this.Recovery <= 0) {
            this.clearRecovery();
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

    takeDamage(damage: number, type: 'poisoning' | 'damage'): number {
        // super.takeDamage(damage, type); //thêm hiệu ứng dmg mặc định
        this.hp = Math.max(0, this.hp - damage);
        this.hpDisplay.updateText(this.hp.toString());
        this.showPopup(damage, type);
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



    showPopup(amount: number, type: keyof typeof POPUP_CONFIG = 'error'): void {
        const config = POPUP_CONFIG[type];
        const color = config.color;
        const prefix = config.prefix;

        //(Math.random()*2-1)*max
        const popupTextPosition = {
            x: (Math.random() * 2 - 1) * 30,
            y: (Math.random() * 2 - 1) * 30
        };

        const popupText = this.scene.add
            .text(popupTextPosition.x, popupTextPosition.y, `${prefix}${amount}`, {
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
            if(currentDurability>0){
                this.scene.gameManager?.addCoin(currentDurability);
            }
            this.weapon = weapon;
            this.weaponDisplay.updateText(this.weapon.durability);
            this.weaponBadgeDisplay.updateTexture(((this.weapon as any).default?.id ?? '') + '-badge');
            (this.scene as any).sellButton?.updateButton();
            soundManager.play('equip-sound');
        } else {
            this.scene.gameManager?.addCoin(weapon.price);
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


// Đặt bên ngoài class
const POPUP_CONFIG = {
    heal: { color: '#00ff00', prefix: '+' },
    damage: { color: '#ff0000', prefix: '-' },
    poisoning: { color: '#800080', prefix: '-' },
    error: { color: '#ffffff', prefix: '' }
} as const;