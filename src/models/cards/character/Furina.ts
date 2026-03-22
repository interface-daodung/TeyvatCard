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

        // Preload token icons cho Ousia (để setToken() vẽ được ngay khi reload tăng).
        this.preloadOusiaTokens();
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

    Gentilhomme_Usher?: Phaser.GameObjects.Image;
    Surintendante_Chevalmarin?: Phaser.GameObjects.Image;
    Mademoiselle_Crabaletta?: Phaser.GameObjects.Image;
    /**
     * Gentilhomme_Usher texture key: 'Gentilhomme-Usher'
     * Surintendante_Chevalmarin texture key: 'Surintendante-Chevalmarin'
     * Mademoiselle_Crabaletta texture key: 'Mademoiselle-Crabaletta'
     *  */

    /**
     * Hiển thị/ẩn token Ousia theo `Ousia_Reload` (0..3).
     * - Ousia_Reload = 0: ẩn cả 3 ảnh
     * - Ousia_Reload = 1: hiện 1 ảnh đầu
     * - Ousia_Reload = 2: hiện 2 ảnh đầu
     * - Ousia_Reload = 3: hiện cả 3 ảnh
     */
    private setToken(): void {
        const { width, height } = this.scene.scale;

        // base theo "vùng vẽ" bottom-left
        const baseX = width * 0.35;
        const baseY = height * 0.95; // tương đối theo SellWeaponButton.ts (container origin y)

        // offsets để 3 ảnh nằm cạnh nhau
        const x1 = baseX - 100;
        const x2 = baseX;
        const x3 = baseX + 100;
        const tokenY = baseY;

        const count = Phaser.Math.Clamp(Math.floor(this.Ousia_Reload), 0, this.Ousia_Reload_Max);

        // init (không add vào this/Furina container)
        if (!this.Gentilhomme_Usher && this.scene?.textures?.exists('Gentilhomme-Usher')) {
            this.Gentilhomme_Usher = this.scene.add.image(x1, tokenY, 'Gentilhomme-Usher')
                .setOrigin(0.5)
                .setDisplaySize(120, 120)
                .setDepth(10)
                .setVisible(false);
        }

        if (!this.Surintendante_Chevalmarin && this.scene?.textures?.exists('Surintendante-Chevalmarin')) {
            this.Surintendante_Chevalmarin = this.scene.add.image(x2, tokenY, 'Surintendante-Chevalmarin')
                .setOrigin(0.5)
                .setDisplaySize(120, 120)
                .setDepth(10)
                .setVisible(false);
        }

        if (!this.Mademoiselle_Crabaletta && this.scene?.textures?.exists('Mademoiselle-Crabaletta')) {
            this.Mademoiselle_Crabaletta = this.scene.add.image(x3, tokenY, 'Mademoiselle-Crabaletta')
                .setOrigin(0.5)
                .setDisplaySize(120, 120)
                .setDepth(10)
                .setVisible(false);
        }

        // cập nhật visibility (đứng yên theo màn hình)
        this.Gentilhomme_Usher?.setVisible(count >= 1);
        this.Surintendante_Chevalmarin?.setVisible(count >= 2);
        this.Mademoiselle_Crabaletta?.setVisible(count >= 3);
    }

    private preloadOusiaTokens(): void {
        if (!this.scene) return;

        const toLoad: Array<{ key: string; url: string }> = [
            { key: 'Gentilhomme-Usher', url: 'assets/images/skill/GentilhommeUsher.png' },
            { key: 'Surintendante-Chevalmarin', url: 'assets/images/skill/SurintendanteChevalmarin.png' },
            { key: 'Mademoiselle-Crabaletta', url: 'assets/images/skill/MademoiselleCrabaletta.png' },
        ];

        const queue = toLoad.filter(t => !this.scene.textures.exists(t.key));
        if (queue.length === 0) {
            this.setToken();
            return;
        }

        for (const item of queue) {
            this.scene.load.image(item.key, item.url);
        }

        this.scene.load.once('complete', () => {
            this.setToken();
        });
        this.scene.load.start();
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
            const before = this.Ousia_Reload;
            this.Ousia_Reload = Math.min(this.Ousia_Reload_Max, this.Ousia_Reload + 1);
            // "thêm thành công" nghĩa là chưa max 3 => gọi setToken()
            if (this.Ousia_Reload !== before) {
                this.setToken();
            }
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
        this.setToken();
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

    /** Không áp dụng hồi cooldown mặc định của Character (burst cooldown = 0). */
    override elementalRecharge(element: string): void {
        console.log('Furina received elemental recharge of', element);
    }

}
