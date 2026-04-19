import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Zhongli extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('zhongli') ?? { id: 'zhongli', name: 'fallback Zhongli', description: '', hp: 10, element: 'geo' };
        super(scene, x, y, index, config.name!, config.id!);
        this.applyConfig(config);

        this.SHIELD_MAX = config.hp;
        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.createCard();
        scene.add.existing(this);
    }

    private SHIELD_MAX: number;
    protected readonly elementalBurstCooldownMax = 6;
    private readonly EXPIRE_SHIELD = 12;

    override elementalBurst(): void {
        this.elementalBurstCooldown = this.elementalBurstCooldownMax;
        this.addShield(this.SHIELD_MAX, this.EXPIRE_SHIELD, 'zhongli-burst');
    }

    override elementalRecharge(element: string): void {
        super.elementalRecharge(element);
        if (this.elementalBurstCooldown === 0) {
            this.elementalBurst();
        }
    }
}
