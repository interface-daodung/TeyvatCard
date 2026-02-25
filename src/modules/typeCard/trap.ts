import Card, { CardDefault } from '../Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';

export default class Trap extends Card {
    damage!: number;
    damageDisplay!: CreateDisplayResult;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, name: string, nameId: string) {
        super(scene, x, y, index, name, nameId, 'trap');
    }

    override applyConfig(config: CardDefault): void {
        super.applyConfig(config);
        if (config.damageMin != null && config.damageMax != null) {
            this.damage = this.GetRandom(config.damageMin, config.damageMax);
        }
    }

    addDisplayHUD(): void {
        if (this.damage) {
            this.damageDisplay = this.createDisplay(
                { fillColor: 0xff6600, text: this.damage.toString() },
                'rightBottom' as DisplayPosition
            );
        }
    }
}
