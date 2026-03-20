import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { CreateDisplayResult, DisplayPosition, SceneWithGameManager } from '../../../modules/Card.js';
import { soundManager } from '@/src/core/SoundManager.js';
import { animationCurse } from '@/src/animations/Sprites/animationCurse.js';
import { animationStatePoison } from '@/src/animations/Sprites/animationStatePoison.js';

export default class Zhongli extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('zhongli') ?? { id: 'zhongli', name: 'fallback Zhongli', description: '', hp: 10, element: 'geo' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);

        this.SHIELD_MAX = config.hp;
        this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Set cooldown ban đầu

        this.createCard();
        scene.add.existing(this);
    }

    private SHIELD_MAX: number;
    shield: number = 0;
    shieldDisplay: CreateDisplayResult;

    addDisplayHUD(): void {
        super.addDisplayHUD();
        this.shieldDisplay = this.createDisplay(
            { fillColor: 0xffbb00, text: String(this.shield) },
            'leftTop' as DisplayPosition
        );
    }

    takeDamage(damage: number, type: 'poisoning' | 'damage' | 'curse'): number {
        if (type === 'poisoning') {
            this.add(animationStatePoison(this.scene, 0, 0));
            soundManager.play('poison');
            this.hp = Math.max(1, this.hp - damage);
        } else if (type === 'curse') {
            this.add(animationCurse(this.scene, 0, 0));
            this.hp = 1;
        } else {
            // Logic trừ shield trước
            if (this.shield > 0) {
                let damageshield = Math.min(this.shield, damage); // Lấy giá trị nhỏ hơn giữa shield và damage

                this.shield -= damageshield;
                damage -= damageshield;

                this.shieldDisplay.updateText(this.shield.toString());
                this.showPopup(damageshield, { color: '#ffbb00', prefix: '⛨' });
            }

            // Trừ HP nếu còn damage
            if (damage > 0) {
                this.hp = Math.max(0, this.hp - damage);
            }


        }
        if (damage > 0) {
            this.hpDisplay.updateText(this.hp.toString());
            this.showPopup(damage, type);
        }

        if (this.hp <= 0) {
            this.scene.gameManager?.gameOver();
        }

        return this.hp;
    }

    elementalBurst(): void {
        this.elementalBurstCooldown = this.elementalBurstCooldownMax; // Reset cooldown sau khi sử dụng elemental burst
        // Logic của elemental burst
        this.shield = this.SHIELD_MAX;
        this.shieldDisplay.updateText(this.shield.toString());
        // Có thể thêm hiệu ứng hoặc âm thanh khi sử dụng elemental burst
    }

    private readonly elementalBurstCooldownMax = 6; // Số lượt cooldown cho elemental burst   

    elementalRecharge(element: string): void {
        // Logic của elemental recharge
        // Có thể thêm hiệu ứng hoặc âm thanh khi sử dụng elemental recharge
        if (element === this.element) {
            this.elementalBurstCooldown -= 2; // Nếu nhận được nguyên tố Geo, tăng cooldown thêm 2 lượt
            // console.log('Zhongli received Geo elemental recharge, increasing elemental burst cooldown by 2', this.elementalBurstCooldown);
        } else {             // Có thể thêm logic khác nếu nhận được nguyên tố khác
            this.elementalBurstCooldown--;
            // console.log('Zhongli received elemental recharge, increasing elemental burst cooldown by 1',
            //     this.elementalBurstCooldown, element);

        }

        this.elementalBurstCooldown = Math.max(0, this.elementalBurstCooldown);

        if (this.elementalBurstCooldown === 0) {
            this.elementalBurst();
        }

        console.log(`Zhongli received elemental recharge of ${element}`);
    }

}
