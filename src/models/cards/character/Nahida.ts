import Character from '../../../modules/typeCard/character.js';
import { getCardConfig } from '../../../modules/getCardConfig.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';
import type Enemy from '../../../modules/typeCard/enemy.js';

export default class Nahida extends Character {
    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        const config = getCardConfig('nahida') ?? { id: 'nahida', name: 'fallback Nahida', description: '', hp: 10, element: 'dendro' };
        super(scene, x, y, index, config.name!, config.id!);

        this.elementalBurstCooldown = this.elementalBurstCooldownMax;

        this.applyConfig(config);
        this.createCard();
        scene.add.existing(this);
    }
    iselementalBurstActive: boolean = false;

    elementalBurst(): void {
        this.elementalBurstCooldown = this.elementalBurstCooldownMax;
        // Logic của elemental burst
        console.warn('Nahida used elemental burst');
        this.iselementalBurstActive = true;
        this.elementalBurstUptime = this.elementalBurstUptimeMax; // Reset uptime khi sử dụng elemental burst
        this.unsubEndelementalBurst = this.scene.gameManager?.emitter.on(
            'completeMove',
            this.EndelementalBurst.bind(this),
            8
        );
        if (this.unsubEndelementalBurst) this.unsubscribeList.push(this.unsubEndelementalBurst);
        // Có thể thêm hiệu ứng hoặc âm thanh khi sử dụng elemental burst
    }
    unsubEndelementalBurst: (() => void) | undefined;
    EndelementalBurst(): void {
        this.elementalBurstUptime--;
        this.scene.gameManager.cardManager.getAllCards().forEach(card => {
            if (card?.type === 'enemy' && (card as Enemy).setPoisoning) {
                (card as Enemy).setPoisoning();

            }
        });
        if (this.elementalBurstUptime > 0) return; // Nếu elemental burst vẫn còn uptime, không kết thúc hiệu ứng

        this.iselementalBurstActive = false;
        if (this.unsubEndelementalBurst) this.unsubEndelementalBurst(); // Hủy đăng ký sự kiện khi kết thúc elemental burst
        // Logic kết thúc hiệu ứng của elemental burst sau một số lượt nhất định
        // Có thể thêm hiệu ứng hoặc âm thanh khi kết thúc elemental burst
    }

    elementalBurstCooldownMax: number = 20; // Ví dụ: elemental burst có cooldown 5 lượt
    elementalBurstUptime: number = 0; // elemental burst tồn tại trong 3 lượt
    elementalBurstUptimeMax: number = 20; // elemental burst có thể tồn tại tối đa 3 lượt

    elementalRecharge(element: string): void {
        // Logic của elemental recharge
        // Có thể thêm hiệu ứng hoặc âm thanh khi sử dụng elemental recharge
        if (element === this.element) {
            this.elementalBurstCooldown -= 2;
        } else {
            this.elementalBurstCooldown--;
        }
        this.elementalBurstCooldown = Math.max(0, this.elementalBurstCooldown);
    }
}
