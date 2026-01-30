import Card from '../../modules/Card.js';
import type { SceneWithGameManager, CardDefault } from '../../modules/Card.js';
import type { CreateDisplayResult, DisplayPosition } from '../../modules/Card.js';

export type ElementKey = 'pyro' | 'hydro' | 'geo' | 'anemo' | 'electro' | 'cryo' | 'dendro';

/** Dữ liệu mặc định theo element; Card.DEFAULT yêu cầu id/name/description là string nên cast khi gán. */
type CoinStaticDefault = {
    type: string;
    rarity: number;
    id: Record<ElementKey, string>;
    name: Record<ElementKey, string>;
    description: Record<ElementKey, string> & { resonance: Record<ElementKey, string> };
};

export default class Coin extends Card {
    score!: number;
    rarity!: number;
    coinDisplay!: CreateDisplayResult;

    static DEFAULT = ({
        type: 'coin',
        rarity: 1,
        name: {
            pyro: 'Mảnh Vỡ Nguyên Tố Hỏa',
            hydro: 'Mảnh Vỡ Nguyên Tố Thủy',
            geo: 'Mảnh Vỡ Nguyên Tố Nham',
            anemo: 'Mảnh Vỡ Nguyên Tố Phong',
            electro: 'Mảnh Vỡ Nguyên Tố Lôi',
            cryo: 'Mảnh Vỡ Nguyên Tố Băng',
            dendro: 'Mảnh Vỡ Nguyên Tố Thảo'
        } as Record<ElementKey, string>,
        id: {
            pyro: 'pyro-fragment',
            hydro: 'hydro-fragment',
            geo: 'geo-fragment',
            anemo: 'anemo-fragment',
            electro: 'electro-fragment',
            cryo: 'cryo-fragment',
            dendro: 'dendro-fragment'
        } as Record<ElementKey, string>,
        description: {
            pyro: 'Mảnh Vỡ Nguyên Tố Hỏa nhặt có thể đổi Xu và hồi chút năng lượng.',
            hydro: 'Mảnh Vỡ Nguyên Tố Thủy nhặt có thể đổi Xu và hồi chút năng lượng.',
            geo: 'Mảnh Vỡ Nguyên Tố Nham nhặt có thể đổi Xu và hồi chút năng lượng.',
            anemo: 'Mảnh Vỡ Nguyên Tố Phong nhặt có thể đổi Xu và hồi chút năng lượng.',
            electro: 'Mảnh Vỡ Nguyên Tố Lôi nhặt có thể đổi Xu và hồi chút năng lượng.',
            cryo: 'Mảnh Vỡ Nguyên Tố Băng nhặt có thể đổi Xu và hồi chút năng lượng.',
            dendro: 'Mảnh Vỡ Nguyên Tố Thảo nhặt có thể đổi Xu và hồi chút năng lượng.',
            resonance: {
                pyro: 'Nguyên Tố Cộng Hưởng Hỏa nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                hydro: 'Nguyên Tố Cộng Hưởng Thủy nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                geo: 'Nguyên Tố Cộng Hưởng Nham nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                anemo: 'Nguyên Tố Cộng Hưởng Phong nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                electro: 'Nguyên Tố Cộng Hưởng Lôi nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                cryo: 'Nguyên Tố Cộng Hưởng Băng nhặt có thể đổi Xu và hồi nhiều năng lượng.',
                dendro: 'Nguyên Tố Cộng Hưởng Thảo nhặt có thể đổi Xu và hồi nhiều năng lượng.'
            } as Record<ElementKey, string>
        }
    } as unknown) as CardDefault;

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number, element: ElementKey) {
        const Def = Coin.DEFAULT as unknown as CoinStaticDefault;
        if (!Def.id[element]) {
            throw new Error(
                `Element '${element}' không tồn tại trong Coin.DEFAULT.id. Các element hợp lệ: ${Object.keys(Def.id).join(', ')}`
            );
        }
        super(
            scene,
            x,
            y,
            index,
            Def.name[element],
            Def.id[element],
            Def.type
        );
        this.score = this.GetRandom(1, 9);
        this.rarity = Def.rarity;
        this.description = Def.description[element];
        this.createCard();
        scene.add.existing(this);
    }

    addDisplayHUD(): void {
        this.coinDisplay = this.createDisplay(
            { fillColor: 0xff6600, text: this.score.toString() },
            'rightBottom' as DisplayPosition
        );
    }

    setScore(score: number): void {
        this.score = score;
        this.coinDisplay.updateText(this.score);
    }

    CardEffect(): boolean {
        if (this.nameId.endsWith('resonance')) {
            this.scene.gameManager?.addCoin(this.score, 3);
        } else {
            this.scene.gameManager?.addCoin(this.score, 1);
        }
        return false;
    }

    resonance(): void {
        this.score *= 2;
        this.name = this.name.replace('Mảnh Vỡ Nguyên Tố', 'Nguyên Tố Cộng Hưởng');
        this.nameId = this.nameId.replace('fragment', 'resonance');
        const resonanceDesc = (Coin.DEFAULT as unknown as CoinStaticDefault).description.resonance;
        this.description = resonanceDesc[this.nameId.replace('-resonance', '')];
        this.cardImage.setTexture(this.type, this.nameId);
        this.coinDisplay.updateText(this.score);
        this.processCreation();
    }
}
