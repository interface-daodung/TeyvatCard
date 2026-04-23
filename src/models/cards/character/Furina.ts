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
    private tokenDamages: number[] = [];
    private tokenDamageTexts: Array<Phaser.GameObjects.Text | undefined> = [];
    private pendingRetaliateShots = 0;

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
        const maxHp = this.getMaxHP();
        const hpBeforeHeal = this.hp;
        const overflowHeal = Math.max(0, hpBeforeHeal + healAmount - maxHp);
        super.heal(healAmount);
        this.SalonSolitaire(true, overflowHeal); // hp tăng

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

        this.ensureTokenDamageTexts(baseX, tokenY);
        this.updateTokenDamageTextVisibility();
    }

    // isIncrease = true: hp tăng, isIncrease = false: hp giảm
    /**
     * SalonSolitaire method.
     * @param isIncrease TODO
     */
    SalonSolitaire(isIncrease: boolean, overflowHeal: number = 0): void {
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
                this.tokenDamages.push(this.getTokenDamageFromOverflow(overflowHeal));
                this.setToken();
            }
            console.log('Furina Ousia_Reload', this.Ousia_Reload);
            return;
        }

        // HP giảm => gọi Retaliate đúng Ousia_Reload lần (không dùng amount)
        const times = Math.max(0, Math.floor(this.Ousia_Reload));
        if (times > 0) {
            this.pendingRetaliateShots = 0;
            this.updateTokenDamageTextVisibility(true);
        }
        for (let i = 0; i < times; i++) {
            console.log('Furina Retaliate', i);
            const tokenDamage = this.tokenDamages[i] ?? this.Ousia_DMG;
            this.Retaliate(i, tokenDamage);
        }

        // Sau khi dùng hết thì reset; Ousia_Reload chỉ được tăng ở nhánh 'increase'.
        this.Ousia_Reload = 0;
        this.tokenDamages = [];
        this.setToken();
    }

    /** Retaliate method. */
    private Retaliate(shotIndex: number, tokenDamage: number): void {
        const gameManager = this.scene.gameManager;
        if (!gameManager) return;

        const enemies = gameManager.cardManager
            .getAllCards()
            .filter(card => card?.type === 'enemy' && typeof (card as any).takeDamage === 'function') as Enemy[];

        const target = this.pickRetaliateTarget(enemies);
        if (!target) return;
        this.pendingRetaliateShots++;

        const shotOrigin = this.getShotOriginByIndex(shotIndex);

        const projectileTextureKey = this.getProjectileTextureKeyByIndex(shotIndex);
        const projectile = TextureManager.image(this.scene, shotOrigin.x, shotOrigin.y, projectileTextureKey)
            .setOrigin(0.5)
            .setDisplaySize(120, 120)
            .setDepth(999);
        projectile.setPosition(shotOrigin.x, shotOrigin.y);

        const initialTargetCenter = this.getTargetCenter(target);
        const travelDistance = Phaser.Math.Distance.Between(
            shotOrigin.x,
            shotOrigin.y,
            initialTargetCenter.x,
            initialTargetCenter.y
        );
        const duration = Phaser.Math.Clamp(Math.round(travelDistance * 1.2), 260, 760);
        const progressDriver = { t: 0 };
        let currentTarget: Enemy | null = target;

        this.scene.tweens.add({
            targets: progressDriver,
            t: 1,
            duration,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                if (!this.isEnemyTargetValidForRetaliate(currentTarget)) {
                    currentTarget = this.pickRetaliateTarget(enemies, currentTarget ?? undefined);
                    if (!currentTarget) {
                        projectile.destroy();
                        this.finishRetaliateShot();
                        return;
                    }
                }

                const liveTargetCenter = this.getTargetCenter(currentTarget);
                projectile.setPosition(
                    Phaser.Math.Linear(shotOrigin.x, liveTargetCenter.x, progressDriver.t),
                    Phaser.Math.Linear(shotOrigin.y, liveTargetCenter.y, progressDriver.t)
                );
            },
            onComplete: () => {
                let damageTarget = currentTarget;
                if (!this.isEnemyTargetValidForRetaliate(damageTarget)) {
                    damageTarget = this.pickRetaliateTarget(enemies, damageTarget ?? undefined);
                }

                if (!damageTarget) {
                    projectile.destroy();
                    this.finishRetaliateShot();
                    return;
                }

                const liveTargetCenter = this.getTargetCenter(damageTarget);
                projectile.destroy();
                this.playFurinaPetAnimationEffect(liveTargetCenter.x, liveTargetCenter.y);
                try {
                    damageTarget.takeDamage?.(tokenDamage);
                } catch (error) {
                    const fallbackTarget = this.pickRetaliateTarget(enemies, damageTarget);
                    if (!fallbackTarget) return;
                    const fallbackCenter = this.getTargetCenter(fallbackTarget);
                    this.playFurinaPetAnimationEffect(fallbackCenter.x, fallbackCenter.y);
                    fallbackTarget.takeDamage?.(tokenDamage);
                    console.warn('Furina Retaliate switched target after takeDamage error', error);
                } finally {
                    this.finishRetaliateShot();
                }
            }
        });
        console.log('Furina Retaliate target', currentTarget);
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

    private isEnemyTargetValidForRetaliate(target: Enemy | null | undefined): target is Enemy {
        if (!target) return false;
        const anyTarget = target as any;
        if (anyTarget.destroyed || anyTarget.active === false || anyTarget.visible === false) return false;
        if (typeof anyTarget.health === 'number' && anyTarget.health <= 0) return false;
        if (typeof anyTarget.takeDamage !== 'function') return false;
        return true;
    }

    private pickRetaliateTarget(enemies: Enemy[], exclude?: Enemy): Enemy | null {
        const aliveEnemies = enemies.filter(enemy => enemy !== exclude && this.isEnemyTargetValidForRetaliate(enemy));
        if (aliveEnemies.length === 0) return null;
        return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    }

    private getTokenDamageFromOverflow(overflowHeal: number): number {
        if (overflowHeal <= 0) return this.Ousia_DMG;
        return Math.max(1, Math.ceil(overflowHeal * 0.5));
    }

    private ensureTokenDamageTexts(baseX: number, tokenY: number): void {
        const offsets = [-100, 0, 100];
        for (let i = 0; i < offsets.length; i++) {
            if (!this.tokenDamageTexts[i]) {
                this.tokenDamageTexts[i] = this.scene.add.text(0, 0, '', {
                    fontSize: '25px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                })
                    .setOrigin(0, 0.5)
                    .setDepth(999)
                    .setVisible(false);
            }

            const damageText = this.tokenDamageTexts[i];
            damageText
                ?.setPosition(baseX + offsets[i] + 35, tokenY + 20)
                .setText(String(this.tokenDamages[i] ?? this.Ousia_DMG));
        }
    }

    private updateTokenDamageTextVisibility(forceHide: boolean = false): void {
        const tokenVisibleStates = [
            this.Gentilhomme_Usher?.visible === true,
            this.Surintendante_Chevalmarin?.visible === true,
            this.Mademoiselle_Crabaletta?.visible === true
        ];
        const canShowTexts = tokenVisibleStates[0] && !forceHide;

        for (let i = 0; i < this.tokenDamageTexts.length; i++) {
            this.tokenDamageTexts[i]?.setVisible(canShowTexts && tokenVisibleStates[i]);
        }
    }

    private finishRetaliateShot(): void {
        this.pendingRetaliateShots = Math.max(0, this.pendingRetaliateShots - 1);
        if (this.pendingRetaliateShots === 0) {
            this.updateTokenDamageTextVisibility();
        }
    }

    private playFurinaPetAnimationEffect(x: number, y: number): void {
        const effect = SpritesheetWrapper.animationEffect(
            this.scene,
            x,
            y,
            'furina-pet-animations',
            120,
            120,
            { start: 0, end: 8 },
            10
        );
        effect.setDepth(999);
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
