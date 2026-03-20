import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';
 
export default class Furina extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('furina') ?? { id: 'furina', name: 'fallback Furina', description: '', hp: 10, element: 'hydro' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();

        scene.add.existing(this);
    }

    Pneuma_or_Ousia: boolean = false;

    // Pneuma: khi hp giảm sẽ heal thêm `Many_heal` (mặc định 1).
    Many_heal: number = 1;

    // Ousia (Ousia): khi hp tăng/giảm sẽ tăng reload hoặc gây phản đòn.
    Ousia_Reload = 0;
    Ousia_Reload_Max = 3;
    Ousia_DMG: number = 1;

    override takeDamage(damage: number, type: 'poisoning' | 'damage' | 'curse'): number {
        const result = super.takeDamage(damage, type);
        this.SalonSolitaire(false);
        return result;
    }

    override heal(healAmount: number): void {
        super.heal(healAmount);
        this.SalonSolitaire(true); // hp tăng

    }

    // isIncrease = true: hp tăng, isIncrease = false: hp giảm
    SalonSolitaire(isIncrease: boolean): void {
        if (this.Pneuma_or_Ousia) {
            // Pneuma: chỉ phản ứng khi HP giảm => heal Many_heal (default 1).
            if (!isIncrease) {
                this.heal(this.Many_heal);
            }
            return;
        }

        // Ousia
        if (isIncrease) {
            // HP tăng => Ousia_Reload = min(3, Ousia_Reload + 1)
            this.Ousia_Reload = Math.min(this.Ousia_Reload_Max, this.Ousia_Reload + 1);
            console.log('Furina Ousia_Reload', this.Ousia_Reload);
            return;
        }

        // HP giảm => gọi Retaliate đúng Ousia_Reload lần (không dùng amount)
        const times = Math.max(0, Math.floor(this.Ousia_Reload));
        for (let i = 0; i < times; i++) {
            console.log('Furina Retaliate', i);
            this.Retaliate();
        }

        // Sau khi dùng hết thì reset; Ousia_Reload chỉ được tăng ở nhánh 'increase'.
        this.Ousia_Reload = 0;
    }

    private Retaliate(): void {
        const gameManager = this.scene.gameManager;
        if (!gameManager) return;

        const enemies = gameManager.cardManager
            .getAllCards()
            .filter(card => card?.type === 'enemy' && typeof (card as any).takeDamage === 'function');

        if (enemies.length === 0) return;

        // Chọn 1 enemy ngẫu nhiên để gây sát thương.
        const target = enemies[Math.floor(Math.random() * enemies.length)] as Enemy;
        target.takeDamage?.(this.Ousia_DMG);
        console.log('Furina Retaliate target', target);
    }

    elementalBurst(): void {
        // Logic của elemental burst
        this.Pneuma_or_Ousia = !this.Pneuma_or_Ousia;

        // Update skill icon based on current form (Pneuma/Ousia).
        // The skill button is owned by GameScene; Card instances access it via the Phaser scene reference.
        const sceneAny = this.scene as any;
        const skillButton = sceneAny?.skillButton;
        skillButton?.setTextureKey?.(
            this.Pneuma_or_Ousia ? 'furina-icon-skill-2' : 'furina-icon-skill'
        );

    }

    private readonly elementalBurstCooldownMax = 0; // Số lượt cooldown cho elemental burst   

    elementalRecharge(element: string): void {
        console.log('Furina received elemental recharge of', element);
        return;
    }

}
