import Phaser from 'phaser';
import Card from './Card.js';
import { dataManager } from '../../core/DataManager.js';
import { getCardConfig } from '../getCardConfig.js';
import type { SceneWithGameManager } from './Card.js';
import * as CardClasses from '../cardImports.js';

type CardConstructor = new (scene: SceneWithGameManager, x: number, y: number, index: number, ...args: any[]) => Card;

interface CardClassesMap {
    add: (classes: (typeof Card)[]) => void;
    [key: string]: ((classes: (typeof Card)[]) => void) | (new (...args: any[]) => Card) | undefined;
}

interface StageCardPool {
    name: string;
    typeRatios: Record<string, number>;
    availableCards: Record<string, string[]>;
}

interface DungeonItem {
    stageId: string;
    name: string;
    typeRatios: Record<string, number>;
    availableCards: Record<string, string[]>;
}

class CardFactory {
    static instance: CardFactory | null = null;

    characterClasses: Record<string, new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card>;
    coinClasses: Record<string, new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card>;
    cardClasses: CardClassesMap;
    weaponClasses: (typeof Card)[];
    enemyClasses: (typeof Card)[];
    foodClasses: (typeof Card)[];
    trapClasses: (typeof Card)[];
    treasureClasses: (typeof Card)[];
    stageCardPools: Record<string, StageCardPool>;
    currentStage: string;
    element: string;
    _cachedCardWeights: Record<string, number> | null;

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
        // Đăng ký bằng chuỗi cố định (không dùng cls.name) để tránh minify làm sai tên khi build
        const register = (key: string, cls: new (...args: any[]) => Card) => {
            (this.cardClasses as any)[key] = cls;
        };

        this.coinClasses = {
            pyro: CardClasses.PyroFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            hydro: CardClasses.HydroFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            geo: CardClasses.GeoFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            anemo: CardClasses.AnemoFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            electro: CardClasses.ElectroFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            cryo: CardClasses.CryoFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            dendro: CardClasses.DendroFragment as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card
        };
        [
            ['PyroFragment', CardClasses.PyroFragment], ['HydroFragment', CardClasses.HydroFragment], ['GeoFragment', CardClasses.GeoFragment],
            ['AnemoFragment', CardClasses.AnemoFragment], ['ElectroFragment', CardClasses.ElectroFragment], ['CryoFragment', CardClasses.CryoFragment],
            ['DendroFragment', CardClasses.DendroFragment]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.weaponClasses = [
            CardClasses.SwordSteampunk, CardClasses.SwordForest, CardClasses.SwordSkyward, CardClasses.SwordSplendor, CardClasses.SwordTraveler, CardClasses.SwordSacrificial
        ];
        register('SwordSteampunk', CardClasses.SwordSteampunk as any);
        register('SwordForest', CardClasses.SwordForest as any);
        register('SwordSkyward', CardClasses.SwordSkyward as any);
        register('SwordSplendor', CardClasses.SwordSplendor as any);
        register('SwordTraveler', CardClasses.SwordTraveler as any);
        register('SwordSacrificial', CardClasses.SwordSacrificial as any);

        this.enemyClasses = [
            CardClasses.AnemoSamachurl, CardClasses.ElectroSamachurl, CardClasses.DendroSamachurl, CardClasses.GeoSamachurl, CardClasses.HydroSamachurl,
            CardClasses.HilichurlFighter, CardClasses.HilistrayWater, CardClasses.WoodenShieldwall, CardClasses.Lawachurl, CardClasses.RockShieldwall,
            CardClasses.Berserker, CardClasses.Blazing, CardClasses.IceShieldwall, CardClasses.Shooter, CardClasses.Crackling, CardClasses.CryoShooter, CardClasses.ElectroShooter
        ];
        [
            ['AnemoSamachurl', CardClasses.AnemoSamachurl], ['ElectroSamachurl', CardClasses.ElectroSamachurl],
            ['DendroSamachurl', CardClasses.DendroSamachurl], ['GeoSamachurl', CardClasses.GeoSamachurl],
            ['HydroSamachurl', CardClasses.HydroSamachurl], ['HilichurlFighter', CardClasses.HilichurlFighter],
            ['HilistrayWater', CardClasses.HilistrayWater], ['WoodenShieldwall', CardClasses.WoodenShieldwall],
            ['Lawachurl', CardClasses.Lawachurl], ['RockShieldwall', CardClasses.RockShieldwall], ['Berserker', CardClasses.Berserker],
            ['Blazing', CardClasses.Blazing], ['IceShieldwall', CardClasses.IceShieldwall], ['Shooter', CardClasses.Shooter],
            ['Crackling', CardClasses.Crackling], ['CryoShooter', CardClasses.CryoShooter], ['ElectroShooter', CardClasses.ElectroShooter]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.foodClasses = [CardClasses.LifeEssence, CardClasses.MystiqueSoup, CardClasses.Pizza, CardClasses.RoastChicken, CardClasses.Macarons];
        [['LifeEssence', CardClasses.LifeEssence], ['MystiqueSoup', CardClasses.MystiqueSoup], ['Pizza', CardClasses.Pizza],
            ['RoastChicken', CardClasses.RoastChicken], ['Macarons', CardClasses.Macarons]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.trapClasses = [CardClasses.AbyssCall, CardClasses.BreatheFire, CardClasses.Quicksand];
        [['AbyssCall', CardClasses.AbyssCall], ['BreatheFire', CardClasses.BreatheFire], ['Quicksand', CardClasses.Quicksand]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.treasureClasses = [CardClasses.Chest, CardClasses.Bribery, CardClasses.GoldMine];
        [['Chest', CardClasses.Chest], ['Bribery', CardClasses.Bribery], ['GoldMine', CardClasses.GoldMine]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        register('Explosive', CardClasses.Explosive as any);
        register('Empty', CardClasses.Empty as any);

        this.cardClasses.add = function (this: CardClassesMap, classes: (typeof Card)[]) {
            classes.forEach((cls: typeof Card & { name?: string }) => {
                const name = (cls as any).name;
                if (name) (this as any)[name] = cls;
            });
        };

        this.stageCardPools = {};
        this.currentStage = 'dungeon_abyss_chamber';
        this.element = 'cryo';
        this._cachedCardWeights = null;

        CardFactory.instance = this;
    }

    /** Load dungeonList từ dataManager (sau khi LoadingScene đã set flag). Gọi lazy để nhận JSON mới. */
    private _ensureStagePoolsLoaded(): void {
        if (Object.keys(this.stageCardPools).length > 0) return;
        const dungeonList = dataManager.getFlag<DungeonItem[]>('dungeonList') ?? [];
        dungeonList.forEach((dungeon: DungeonItem) => {
            if (dungeon?.stageId && dungeon?.typeRatios && dungeon?.availableCards) {
                this.stageCardPools[dungeon.stageId] = {
                    name: dungeon.name,
                    typeRatios: dungeon.typeRatios,
                    availableCards: dungeon.availableCards
                };
            }
        });
    }

    static getInstance(): CardFactory {
        if (!CardFactory.instance) {
            CardFactory.instance = new CardFactory();
        }
        return CardFactory.instance;
    }

    /**
     * Lọc weaponClasses theo category (vd: 'sword') dùng getCardConfig.
     * Trả về mảng { cls, key } để random và gọi getCardConfig(key).
     */
    getWeaponClassesByCategory(category: string): { cls: typeof Card; key: string }[] {
        const result: { cls: typeof Card; key: string }[] = [];
        const map = this.cardClasses as Record<string, new (...args: any[]) => Card>;
        for (const cls of this.weaponClasses) {
            const key = Object.keys(map).find((k) => k !== 'add' && map[k] === cls);
            if (!key) continue;
            const config = getCardConfig(key);
            if (!config) continue;
            if (config.category === category) {
                result.push({ cls, key });
            }
        }
        return result;
    }

    /**
     * Lọc enemyClasses theo clan dùng getCardConfig (vd: 'hilichurl').
     * Trả về mảng key để random và gọi createCardByKey(scene, index, key).
     */
    getEnemyKeysByClan(clan: string): string[] {
        const result: string[] = [];
        const map = this.cardClasses as Record<string, new (...args: any[]) => Card>;
        for (const cls of this.enemyClasses) {
            const key = Object.keys(map).find((k) => k !== 'add' && map[k] === cls);
            if (!key) continue;
            const config = getCardConfig(key);
            if (!config) continue;
            if (config.clan === clan) {
                result.push(key);
            }
        }
        return result;
    }

    _calculateCardWeights(): Record<string, number> {
        if (this._cachedCardWeights) {
            return this._cachedCardWeights;
        }
        this._ensureStagePoolsLoaded();

        const cardWeights: Record<string, number> = {};
        const currentStage = this.stageCardPools[this.currentStage];
        if (!currentStage?.typeRatios || !currentStage?.availableCards) {
            return cardWeights;
        }
        const typeRatios = currentStage.typeRatios;
        const availableCards = currentStage.availableCards;
        const typeTotalWeights: Record<string, number> = {};

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName]) {
                let typeTotalWeight = 0;
                for (const cardName of availableCards[typeName]) {
                    const config = getCardConfig(cardName);
                    const rarity = config?.rarity;
                    if (rarity != null) typeTotalWeight += rarity * 10;
                }
                typeTotalWeights[typeName] = typeTotalWeight;
            }
        }

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName] && typeTotalWeights[typeName]) {
                for (const cardName of availableCards[typeName]) {
                    const config = getCardConfig(cardName);
                    if (config?.rarity != null) {
                        const baseWeight = config.rarity * 10;
                        const actualWeight = (baseWeight / typeTotalWeights[typeName]) * typeRatio;
                        cardWeights[cardName] = actualWeight;
                    }
                }
            }
        }

        this._cachedCardWeights = cardWeights;
        return cardWeights;
    }
    
    createRandomCard(scene: SceneWithGameManager, index: number): Card | null {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const cardWeights = this._calculateCardWeights();
        const totalWeight = Object.values(cardWeights).reduce((sum, w) => sum + w, 0);

        if (totalWeight === 0) {
            return null;
        }

        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;

        for (const [cardType, weight] of Object.entries(cardWeights)) {
            cumulativeWeight += weight;
            if (random <= cumulativeWeight) {
                const CardClass = this.cardClasses[cardType] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card | undefined;
                if (CardClass) return new CardClass(scene, x, y, index);
            }
        }

        const lastCardType = Object.keys(cardWeights).pop();
        const LastClass = lastCardType ? (this.cardClasses[lastCardType] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card) : undefined;
        return LastClass ? new LastClass(scene, x, y, index) : null;
    }

    /** Tạo coin khi enemy chết: dùng element hiện tại để chọn class (pyro, hydro, ...). */
    createCoin(scene: SceneWithGameManager, index: number, score?: number | null): Card {
        const coords = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const x = coords?.x ?? 0;
        const y = coords?.y ?? 0;
        const CoinClass = this.coinClasses[this.element] ?? this.coinClasses['cryo'];
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
        const CardClass = this.cardClasses[cardKey] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card | undefined;
        if (typeof CardClass !== 'function') return null;
        return new CardClass(scene, x, y, index);
    }

    _calculateDynamicCardWeights(validCardKeys: string[]): Record<string, number> {
        this._ensureStagePoolsLoaded();
        const currentStage = this.stageCardPools[this.currentStage];
        if (!currentStage?.typeRatios || !currentStage?.availableCards) {
            return {};
        }
        const typeRatios = currentStage.typeRatios;
        const availableCards = currentStage.availableCards;
        const cardWeights: Record<string, number> = {};
        const typeTotalWeights: Record<string, number> = {};

        for (const [typeName] of Object.entries(typeRatios)) {
            if (availableCards[typeName]) {
                let typeTotalWeight = 0;
                for (const cardName of availableCards[typeName]) {
                    if (validCardKeys.includes(cardName)) {
                        const config = getCardConfig(cardName);
                        if (config?.rarity != null) typeTotalWeight += config.rarity * 10;
                    }
                }
                if (typeTotalWeight > 0) typeTotalWeights[typeName] = typeTotalWeight;
            }
        }

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName] && typeTotalWeights[typeName]) {
                for (const cardName of availableCards[typeName]) {
                    if (validCardKeys.includes(cardName)) {
                        const config = getCardConfig(cardName);
                        if (config?.rarity != null) {
                            const baseWeight = config.rarity * 10;
                            cardWeights[cardName] = (baseWeight / typeTotalWeights[typeName]) * typeRatio;
                        }
                    }
                }
            }
        }

        return cardWeights;
    }

    createCard(scene: SceneWithGameManager, index: number, validCardKeys: string[]): Card | null {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const cardWeights = this._calculateDynamicCardWeights(validCardKeys);
        const totalWeight = Object.values(cardWeights).reduce((sum, w) => sum + w, 0);

        if (totalWeight === 0) return null;

        const random = Math.random() * totalWeight;
        let cumulativeWeight = 0;

        for (const [cardKey, weight] of Object.entries(cardWeights)) {
            cumulativeWeight += weight;
            if (random <= cumulativeWeight) {
                const CardClass = this.cardClasses[cardKey] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card;
                if (CardClass) return new CardClass(scene, x, y, index);
            }
        }

        const lastCardKey = Object.keys(cardWeights).pop()!;
        const LastClass = this.cardClasses[lastCardKey] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card;
        return LastClass ? new LastClass(scene, x, y, index) : null;
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

    getAllCardDefault(): any[] {
        const keys = Object.keys(this.cardClasses).filter(k => typeof this.cardClasses[k] === 'function' && k !== 'add');
        const out: any[] = [];
        for (const key of keys) {
            const config = getCardConfig(key);
            if (config) out.push(config);
        }
        return out;
    }

    addCardToStage(stageKey: string, typeName: string, cardName: string): void {
        this._ensureStagePoolsLoaded();
        if (!this.stageCardPools[stageKey]) {
            throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
        }
        if (!this.stageCardPools[stageKey].availableCards[typeName]) {
            throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
        }
        if (!this.stageCardPools[stageKey].availableCards[typeName].includes(cardName)) {
            this.stageCardPools[stageKey].availableCards[typeName].push(cardName);
            this._cachedCardWeights = null;
        }
    }

    removeCardFromStage(stageKey: string, typeName: string, cardName: string): void {
        this._ensureStagePoolsLoaded();
        if (!this.stageCardPools[stageKey]) {
            throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
        }
        if (!this.stageCardPools[stageKey].availableCards[typeName]) {
            throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
        }
        const arr = this.stageCardPools[stageKey].availableCards[typeName];
        const index = arr.indexOf(cardName);
        if (index > -1) {
            arr.splice(index, 1);
            this._cachedCardWeights = null;
        }
    }

    updateStageTypeRatio(stageKey: string, typeName: string, newRatio: number): void {
        this._ensureStagePoolsLoaded();
        if (!this.stageCardPools[stageKey]) {
            throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
        }
        if (this.stageCardPools[stageKey].typeRatios[typeName] === undefined) {
            throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
        }
        this.stageCardPools[stageKey].typeRatios[typeName] = newRatio;
        this._cachedCardWeights = null;
    }

    getStageInfo(): Record<string, StageCardPool> {
        this._ensureStagePoolsLoaded();
        return this.stageCardPools;
    }

    getCurrentStageTotalWeight(): number {
        this._ensureStagePoolsLoaded();
        const currentStage = this.stageCardPools[this.currentStage];
        if (!currentStage?.typeRatios) return 0;
        return Object.values(currentStage.typeRatios).reduce((total, ratio) => total + ratio, 0);
    }

    getCurrentStageCardWeights(): {
        stage: string;
        typeRatios: Record<string, number>;
        cardWeights: Record<string, number>;
        totalWeight: number;
    } {
        this._ensureStagePoolsLoaded();
        const cardWeights = this._calculateCardWeights();
        const currentStage = this.stageCardPools[this.currentStage];
        if (!currentStage) {
            return { stage: '', typeRatios: {}, cardWeights, totalWeight: 0 };
        }
        return {
            stage: currentStage.name,
            typeRatios: currentStage.typeRatios,
            cardWeights,
            totalWeight: this.getCurrentStageTotalWeight()
        };
    }

    setCurrentStage(stageKey: string): void {
        this._ensureStagePoolsLoaded();
        if (this.stageCardPools[stageKey]) {
            this.currentStage = stageKey;
            this._cachedCardWeights = null;
        }
    }
}

const cardFactory = CardFactory.getInstance();
export default cardFactory;
