import Card from './Card.js';
import { dataManager } from '../core/DataManager.js';
import { getCardConfig } from './getCardConfig.js';
import type { SceneWithGameManager } from './Card.js';
import * as CardClasses from './cardImports.js';
import type { CardClassesMap, LibraryCards } from './card/cardFactoryTypes.js';
import {
    buildCardClassRegistry,
    defineCardClassesAdd,
    populateLibraryCardLists
} from './card/cardFactoryLibrary.js';
import {
    getCachedCardWeightsForCurrentStage,
    getDynamicCardWeightsForCurrentStage,
    resolveWeightedCardKey
} from './card/cardFactoryStageWeight.js';

export class CardFactory {
    static instance: CardFactory | null = null;

    characterClasses: Record<string, new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card>;
    coinClasses: Record<string, new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card>;
    cardClasses: CardClassesMap;
    weaponClasses: (typeof Card)[];
    enemyClasses: (typeof Card)[];
    foodClasses: (typeof Card)[];
    trapClasses: (typeof Card)[];
    treasureClasses: (typeof Card)[];
    element: string;

    constructor() {
        if (CardFactory.instance) {
            return CardFactory.instance;
        }

        this.characterClasses = {
            eula: CardClasses.Eula as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            furina: CardClasses.Furina as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            mavuika: CardClasses.Mavuika as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            nahida: CardClasses.Nahida as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            raiden: CardClasses.Raiden as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            venti: CardClasses.Venti as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            zhongli: CardClasses.Zhongli as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card
        };

        this.cardClasses = {} as CardClassesMap;
        const allCardClasses = buildCardClassRegistry(CardClasses as Record<string, unknown>);
        const libraryCards = dataManager.getFlag<LibraryCards>('libraryCards');
        const lists = populateLibraryCardLists(this.cardClasses, libraryCards, allCardClasses);
        this.coinClasses = lists.coinClasses;
        this.weaponClasses = lists.weaponClasses;
        this.enemyClasses = lists.enemyClasses;
        this.foodClasses = lists.foodClasses;
        this.trapClasses = lists.trapClasses;
        this.treasureClasses = lists.treasureClasses;

        defineCardClassesAdd(this.cardClasses);

        this.element = 'cryo';

        CardFactory.instance = this;
    }

    static getInstance(): CardFactory {
        if (!CardFactory.instance) {
            CardFactory.instance = new CardFactory();
        }
        return CardFactory.instance;
    }

    createRandomCard(scene: SceneWithGameManager, index: number): Card | null {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const cardWeights = getCachedCardWeightsForCurrentStage();
        const pickedKey = resolveWeightedCardKey(cardWeights, (k) => {
            if (k === 'add') return false;
            const C = (this.cardClasses as Record<string, unknown>)[k];
            return typeof C === 'function';
        });
        if (!pickedKey) return null;
        const CardClass = this.cardClasses[pickedKey] as new (
            scene: SceneWithGameManager,
            x: number,
            y: number,
            index: number
        ) => Card;
        return new CardClass(scene, x, y, index);
    }

    /** Tạo coin khi enemy chết: dùng element hiện tại để chọn class (pyro, hydro, ...). */
    createCoin(scene: SceneWithGameManager, index: number, score?: number | null): Card | null {
        const coords = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const x = coords?.x ?? 0;
        const y = coords?.y ?? 0;
        const CoinClass = this.coinClasses[this.element];
        if (!CoinClass) {
            console.error(`[CardFactory] Coin class for element "${this.element}" is not registered. Coin will not spawn.`);
            return null;
        }
        const coin = new CoinClass(scene, x, y, index) as Card & { setScore?: (s: number) => void };
        if (score != null && coin.setScore) coin.setScore(score);
        return coin;
    }

    createEmpty(scene: SceneWithGameManager, index: number): Card {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        return new (CardClasses.Empty as any)(scene, x, y, index);
    }

    /**
     * Tạo thẻ cụ thể theo key đã đăng ký trong CardFactory (key trùng với key trong DB / cardClasses).
     * @param scene - Scene có gameManager và cardManager để lấy tọa độ ô lưới.
     * @param index - Chỉ số ô trên lưới (dùng để tính x, y).
     * @param cardKey - Chuỗi key cố định (ví dụ 'AnemoSamachurl', 'SwordSteampunk') trỏ tới class thẻ tương ứng trong cardClasses.
     * @returns Thẻ đã tạo, hoặc null nếu key không tồn tại hoặc là 'add'.
     */
    createCardByKey(scene: SceneWithGameManager, index: number, cardKey: string): Card | null {
        if (cardKey === 'add') return null;
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const CardClass = this.cardClasses[cardKey] as new (
            scene: SceneWithGameManager,
            x: number,
            y: number,
            index: number
        ) => Card | undefined;
        if (typeof CardClass !== 'function') return null;
        return new CardClass(scene, x, y, index);
    }

    createCard(scene: SceneWithGameManager, index: number, validCardKeys: string[]): Card | null {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const cardWeights = getDynamicCardWeightsForCurrentStage(validCardKeys);
        const pickedKey = resolveWeightedCardKey(cardWeights, (k) => {
            if (k === 'add') return false;
            const C = (this.cardClasses as Record<string, unknown>)[k];
            return typeof C === 'function';
        });
        if (!pickedKey) return null;
        const CardClass = this.cardClasses[pickedKey] as new (
            scene: SceneWithGameManager,
            x: number,
            y: number,
            index: number
        ) => Card;
        return new CardClass(scene, x, y, index);
    }

    createCharacter(scene: SceneWithGameManager, x: number, y: number, index: number): Card {
        const nameId = dataManager.get<string>('selectedCharacter');

        if (!nameId) {
            const cfg = getCardConfig('eula');
            this.element = cfg?.element ?? 'cryo';
            return new CardClasses.Eula(scene, x, y, index) as Card;
        }

        const characterClass = this.characterClasses[nameId];
        if (characterClass) {
            const cfg = getCardConfig(nameId);
            this.element = cfg?.element ?? 'cryo';
            return new characterClass(scene, x, y, index);
        }

        const cfg = getCardConfig('eula');
        this.element = cfg?.element ?? 'cryo';
        return new CardClasses.Eula(scene, x, y, index) as Card;
    }
}

export default CardFactory;
