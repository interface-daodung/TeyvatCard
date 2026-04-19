import Character, { type DamageElement, type DamageType } from '../../../modules/typeCard/character.js';
import Equipment from '../../../modules/weaponCategory/equipment.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import { soundManager } from '../../../core/SoundManager.js';
import Weapon from '../../../modules/typeCard/weapon.js';
import { animationRefinement } from '@/src/animations/Sprites/animationRefinement.js';

const MAX_EQUIPMENT_SLOTS = 3;

export default class Mavuika extends Character {
    /** Tối đa 3 vũ khí dự phòng; khi đầy, giá trị được quy sang coin qua `addExpandedEquipmentSlot`. */
    listEquipmentSlot: Equipment[] = [];

    /** 3 token HUD trên GameScene (texture badge vũ khí giống `createBadgeDisplay` trong character.ts). */
    private slotTokenImages: (Phaser.GameObjects.Image | undefined)[] = [undefined, undefined, undefined];

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('mavuika') ?? { id: 'mavuika', name: 'fallback Mavuika', description: '', hp: 10, element: 'pyro' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
        this.setToken();
    }

    private elementalBurstCooldownMax = 30;
    elementalBurst(): void {

        let weaponCount = 0;
        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'weapon') weaponCount++;
        });
        if (weaponCount === 0) return;

        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'weapon') {
                card.add(animationRefinement(this.scene, 0, 0).setDepth(10));
                (card as Weapon).durability *= 2;
                (card as Weapon).durabilityDisplay.updateText((card as Weapon).durability);
            }
        });

        this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Reset cooldown sau khi sử dụng elemental burst

    }
    /** Khi 3 slot đã đầy, quy đổi thành coin (tương đương `addCoin` ở Character gốc). */
    addExpandedEquipmentSlot(amount: number): void {
        this.scene.gameManager?.addCoin(amount);
    }

    private tryAddWeaponToSlot(weapon: Equipment): void {
        if (this.listEquipmentSlot.length < MAX_EQUIPMENT_SLOTS) {
            this.listEquipmentSlot.push(weapon);
        } else {
            this.addExpandedEquipmentSlot(weapon.price);
        }
        this.setToken();
    }

    /**
     * Hiển thị tối đa 3 token ở góc dưới màn hình (cùng vùng layout Furina).
     * Mỗi slot dùng atlas `weapon-${category}-badge` + frame `${id}-badge` như `character.ts` createBadgeDisplay.
     */
    setToken(): void {
        const { width } = this.scene.scale;
        const baseX = width * 0.35;
        const baseY = this.scene.scale.height * 0.95;
        const xs = [baseX - 100, baseX, baseX + 100];
        const tokenY = baseY;

        for (let i = 0; i < MAX_EQUIPMENT_SLOTS; i++) {
            const eq = this.listEquipmentSlot[i];
            const img = this.slotTokenImages[i];
            if (!eq) {
                img?.setVisible(false);
                continue;
            }

            const category = (eq as any).default?.category as string | undefined;
            const id = String((eq as any).default?.id ?? '');
            const frame = id + '-badge';
            if (!category) {
                img?.setVisible(false);
                continue;
            }

            const atlasKey = 'weapon-' + category + '-badge';
            const singleBadgeKey = frame;
            const hasSingleBadgeTexture = this.scene.textures.exists(singleBadgeKey);
            if (!hasSingleBadgeTexture && !this.scene.textures.exists(atlasKey)) {
                img?.setVisible(false);
                continue;
            }

            if (!img) {
                this.slotTokenImages[i] = this.scene.add
                    .image(xs[i], tokenY, hasSingleBadgeTexture ? singleBadgeKey : atlasKey, hasSingleBadgeTexture ? undefined : frame)
                    .setOrigin(0.5)
                    .setDisplaySize(120, 120)
                    .setDepth(10)
                    .setVisible(true);
            } else {
                if (hasSingleBadgeTexture) {
                    img.setTexture(singleBadgeKey);
                } else {
                    img.setTexture(atlasKey, frame);
                }
                img.setPosition(xs[i], tokenY);
                img.setVisible(true);
            }
        }
    }

    override setWeapon(weapon: Equipment): void {
        const currentDurability = this.weapon?.durability ?? 0;
        if (weapon.durability > currentDurability) {
            if (currentDurability > 0 && this.weapon) {
                this.tryAddWeaponToSlot(this.weapon);
            }
            this.weapon = weapon;
            this.weaponDisplay.updateText(this.weapon.durability);
            this.weaponBadgeDisplay.updateTexture(((this.weapon as any).default?.id ?? '') + '-badge');
            (this.scene as any).sellButton?.updateButton();
            soundManager.play('equip-sound');
        } else {
            this.tryAddWeaponToSlot(weapon);
        }
    }

    override reduceDurability(damage: number): void {
        super.reduceDurability(damage);
        if (!this.weapon && this.listEquipmentSlot.length > 0) {
            const next = this.listEquipmentSlot.shift()!;
            this.setWeapon(next);
            this.setToken();
        }
    }

    override takeDamage(
        damage: number,
        type: DamageType,
        element: DamageElement | null = null
    ): number {
        if (element === 'pyro') {
            damage = 0;
        }
        return super.takeDamage(damage, type, element);
    }
}
