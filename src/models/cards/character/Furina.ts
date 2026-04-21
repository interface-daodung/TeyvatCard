import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';
import { showFrameLayerOnce } from '../../../modules/card/cardDisplay.js';
import { SpritesheetWrapper } from '../../../utils/SpritesheetWrapper.js';
import TextureManager from '../../../core/TextureManager.js';
import { dataManager } from '../../../core/DataManager.js';

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

    /**
     * takeDamage method.
     * @param damage TODO
     * @param type TODO
     * @returns TODO
     */
    override takeDamage(damage: number, type: 'poisoning' | 'damage' | 'curse'): number {
        const result = super.takeDamage(damage, type);
        this.SalonSolitaire(false);
        return result;
    }

    /**
     * heal method.
     * @param healAmount TODO
     */
    override heal(healAmount: number): void {
        super.heal(healAmount);
        this.SalonSolitaire(true); // hp tăng

    }

    Gentilhomme_Usher?: Phaser.GameObjects.Image;
    Surintendante_Chevalmarin?: Phaser.GameObjects.Image;
    Mademoiselle_Crabaletta?: Phaser.GameObjects.Image;
    /**
     * Gentilhomme_Usher texture key: 'GentilhommeUsher'
     * Surintendante_Chevalmarin texture key: 'SurintendanteChevalmarin'
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
        if (!this.Gentilhomme_Usher && TextureManager.has('GentilhommeUsher')) {
            this.Gentilhomme_Usher = TextureManager.image(this.scene, x1, tokenY, 'GentilhommeUsher')
                .setOrigin(0.5)
                .setDisplaySize(120, 120)
                .setDepth(10)
                .setVisible(false);
        }

        if (!this.Surintendante_Chevalmarin && TextureManager.has('SurintendanteChevalmarin')) {
            this.Surintendante_Chevalmarin = TextureManager.image(this.scene, x2, tokenY, 'SurintendanteChevalmarin')
                .setOrigin(0.5)
                .setDisplaySize(120, 120)
                .setDepth(10)
                .setVisible(false);
        }

        if (!this.Mademoiselle_Crabaletta && TextureManager.has('MademoiselleCrabaletta')) {
            this.Mademoiselle_Crabaletta = TextureManager.image(this.scene, x3, tokenY, 'MademoiselleCrabaletta')
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

    // isIncrease = true: hp tăng, isIncrease = false: hp giảm
    /**
     * SalonSolitaire method.
     * @param isIncrease TODO
     */
    SalonSolitaire(isIncrease: boolean): void {
        if (this.Pneuma_or_Ousia) {
            // Pneuma: chỉ phản ứng khi HP giảm => heal Many_heal (default 1).
            if (!isIncrease) {
                showFrameLayerOnce(this.scene, this, {
                    textureKey: 'singer-of-many-waters',
                });
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
            this.Retaliate(i);
        }

        // Sau khi dùng hết thì reset; Ousia_Reload chỉ được tăng ở nhánh 'increase'.
        this.Ousia_Reload = 0;
        this.setToken();
    }

    /** Retaliate method. */
    private Retaliate(shotIndex: number): void {
        const gameManager = this.scene.gameManager;
        if (!gameManager) return;

        const enemies = gameManager.cardManager
            .getAllCards()
            .filter(card => card?.type === 'enemy' && typeof (card as any).takeDamage === 'function');

        if (enemies.length === 0) return;

        // Chọn 1 enemy ngẫu nhiên để gây sát thương.
        const target = enemies[Math.floor(Math.random() * enemies.length)] as Enemy;

        const shotOrigin = this.getShotOriginByIndex(shotIndex);
        const targetCenter = this.getTargetCenter(target);

        const projectileTextureKey = this.getProjectileTextureKeyByIndex(shotIndex);
        const projectile = TextureManager.image(this.scene, shotOrigin.x, shotOrigin.y, projectileTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(52, 52)
            .setDepth(30);

        this.scene.tweens.add({
            targets: projectile,
            x: targetCenter.x,
            y: targetCenter.y,
            duration: 260,
            ease: 'Sine.easeIn',
            onComplete: () => {
                projectile.destroy();
                this.playFurinaPetAnimationEffect(targetCenter.x, targetCenter.y);
                target.takeDamage?.(this.Ousia_DMG);
            }
        });
        console.log('Furina Retaliate target', target);
    }

    private getShotOriginByIndex(shotIndex: number): Phaser.Math.Vector2 {
        const shots: Array<Phaser.GameObjects.Image | undefined> = [
            this.Gentilhomme_Usher,
            this.Surintendante_Chevalmarin,
            this.Mademoiselle_Crabaletta
        ];
        const token = shots[shotIndex];
        if (token?.active && token.visible) {
            return new Phaser.Math.Vector2(token.x, token.y);
        }
        return new Phaser.Math.Vector2(this.x, this.y);
    }

    private getProjectileTextureKeyByIndex(shotIndex: number): string {
        const projectileKeys = [
            'GentilhommeUsher',
            'SurintendanteChevalmarin',
            'MademoiselleCrabaletta'
        ] as const;
        return projectileKeys[shotIndex] ?? projectileKeys[0];
    }

    private getTargetCenter(target: Enemy): Phaser.Math.Vector2 {
        if (typeof (target as any).getBounds === 'function') {
            const bounds = (target as any).getBounds() as Phaser.Geom.Rectangle;
            return new Phaser.Math.Vector2(bounds.centerX, bounds.centerY);
        }
        return new Phaser.Math.Vector2((target as any).x ?? 0, (target as any).y ?? 0);
    }

    private playFurinaPetAnimationEffect(x: number, y: number): void {
        const effect = SpritesheetWrapper.animationEffect(
            this.scene,
            x,
            y,
            'furina-pet-animations',
            90,
            90,
            { start: 0, end: 8 },
            10
        );
        effect.setDepth(31);
    }

    /** elementalBurst method. */
    elementalBurst(): void {
        // Logic của elemental burst
        this.Pneuma_or_Ousia = !this.Pneuma_or_Ousia;

        const characterLevel = dataManager.get<Record<string, number>>('characterLevel');
        const furinaLevel = characterLevel?.furina ?? this.level;
        if (furinaLevel < 10) {
            if (this.cardImage instanceof Phaser.GameObjects.Image) {
                TextureManager.setImageTexture(
                    this.cardImage,
                    this.Pneuma_or_Ousia ? 'furina-pneuma' : 'furina'
                );
            }
 
        }

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
