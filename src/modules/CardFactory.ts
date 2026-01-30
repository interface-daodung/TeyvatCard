import Phaser from 'phaser';
import Card from './Card.js';
import type { SceneWithGameManager } from './Card.js';
import Coin from '../models/cards/Coin.js';
import dungeonList from '../data/dungeonList.json';

import Eula from '../models/cards/character/Eula.js';
import Furina from '../models/cards/character/Furina.js';
import Mavuika from '../models/cards/character/Mavuika.js';
import Nahida from '../models/cards/character/Nahida.js';
import Raiden from '../models/cards/character/Raiden.js';
import Venti from '../models/cards/character/Venti.js';
import Zhongli from '../models/cards/character/Zhongli.js';

import SwordSteampunk from '../models/cards/weapon/SwordSteampunk.js';
import SwordForest from '../models/cards/weapon/SwordForest.js';
import SwordSkyward from '../models/cards/weapon/SwordSkyward.js';
import SwordSplendor from '../models/cards/weapon/SwordSplendor.js';
import SwordTraveler from '../models/cards/weapon/SwordTraveler.js';
import SwordSacrificial from '../models/cards/weapon/SwordSacrificial.js';

import AnemoSamachurl from '../models/cards/enemy/AnemoSamachurl.js';
import ElectroSamachurl from '../models/cards/enemy/ElectroSamachurl.js';
import DendroSamachurl from '../models/cards/enemy/DendroSamachurl.js';
import GeoSamachurl from '../models/cards/enemy/GeoSamachurl.js';
import HydroSamachurl from '../models/cards/enemy/HydroSamachurl.js';
import HilichurlFighter from '../models/cards/enemy/HilichurlFighter.js';
import HilistrayWater from '../models/cards/enemy/HilistrayWater.js';
import WoodenShieldwall from '../models/cards/enemy/WoodenShieldwall.js';
import Lawachurl from '../models/cards/enemy/Lawachurl.js';
import RockShieldwall from '../models/cards/enemy/RockShieldwall.js';
import Berserker from '../models/cards/enemy/Berserker.js';
import Blazing from '../models/cards/enemy/Blazing.js';
import IceShieldwall from '../models/cards/enemy/IceShieldwall.js';
import Shooter from '../models/cards/enemy/Shooter.js';
import Crackling from '../models/cards/enemy/Crackling.js';
import CryoShooter from '../models/cards/enemy/CryoShooter.js';
import ElectroShooter from '../models/cards/enemy/ElectroShooter.js';

import LifeEssence from '../models/cards/food/LifeEssence.js';
import MystiqueSoup from '../models/cards/food/MystiqueSoup.js';
import Pizza from '../models/cards/food/Pizza.js';
import RoastChicken from '../models/cards/food/RoastChicken.js';
import Macarons from '../models/cards/food/Macarons.js';

import AbyssCall from '../models/cards/trap/AbyssCall.js';
import Quicksand from '../models/cards/trap/Quicksand.js';
import BreatheFire from '../models/cards/trap/BreatheFire.js';

import Chest from '../models/cards/treasure/Chest.js';
import Bribery from '../models/cards/treasure/Bribery.js';
import GoldMine from '../models/cards/treasure/GoldMine.js';

import Explosive from '../models/cards/bomb/Explosive.js';
import Empty from '../models/cards/Empty.js';

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
            eula: Eula as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            furina: Furina as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            mavuika: Mavuika as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            nahida: Nahida as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            raiden: Raiden as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            venti: Venti as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card,
            zhongli: Zhongli as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card
        };

        this.cardClasses = {} as CardClassesMap;
        // Đăng ký bằng chuỗi cố định (không dùng cls.name) để tránh minify làm sai tên khi build
        const register = (key: string, cls: new (...args: any[]) => Card) => {
            (this.cardClasses as any)[key] = cls;
        };

        register('Coin', Coin as any);
        this.weaponClasses = [
            SwordSteampunk, SwordForest, SwordSkyward, SwordSplendor, SwordTraveler, SwordSacrificial
        ];
        register('SwordSteampunk', SwordSteampunk as any);
        register('SwordForest', SwordForest as any);
        register('SwordSkyward', SwordSkyward as any);
        register('SwordSplendor', SwordSplendor as any);
        register('SwordTraveler', SwordTraveler as any);
        register('SwordSacrificial', SwordSacrificial as any);

        this.enemyClasses = [
            AnemoSamachurl, ElectroSamachurl, DendroSamachurl, GeoSamachurl, HydroSamachurl,
            HilichurlFighter, HilistrayWater, WoodenShieldwall, Lawachurl, RockShieldwall,
            Berserker, Blazing, IceShieldwall, Shooter, Crackling, CryoShooter, ElectroShooter
        ];
        [
            ['AnemoSamachurl', AnemoSamachurl], ['ElectroSamachurl', ElectroSamachurl],
            ['DendroSamachurl', DendroSamachurl], ['GeoSamachurl', GeoSamachurl],
            ['HydroSamachurl', HydroSamachurl], ['HilichurlFighter', HilichurlFighter],
            ['HilistrayWater', HilistrayWater], ['WoodenShieldwall', WoodenShieldwall],
            ['Lawachurl', Lawachurl], ['RockShieldwall', RockShieldwall], ['Berserker', Berserker],
            ['Blazing', Blazing], ['IceShieldwall', IceShieldwall], ['Shooter', Shooter],
            ['Crackling', Crackling], ['CryoShooter', CryoShooter], ['ElectroShooter', ElectroShooter]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.foodClasses = [LifeEssence, MystiqueSoup, Pizza, RoastChicken, Macarons];
        [['LifeEssence', LifeEssence], ['MystiqueSoup', MystiqueSoup], ['Pizza', Pizza],
            ['RoastChicken', RoastChicken], ['Macarons', Macarons]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.trapClasses = [AbyssCall, BreatheFire, Quicksand];
        [['AbyssCall', AbyssCall], ['BreatheFire', BreatheFire], ['Quicksand', Quicksand]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        this.treasureClasses = [Chest, Bribery, GoldMine];
        [['Chest', Chest], ['Bribery', Bribery], ['GoldMine', GoldMine]
        ].forEach(([key, cls]) => register(key as string, cls as any));

        register('Explosive', Explosive as any);
        register('Empty', Empty as any);

        this.cardClasses.add = function (this: CardClassesMap, classes: (typeof Card)[]) {
            classes.forEach((cls: typeof Card & { name?: string }) => {
                const name = (cls as any).name;
                if (name) (this as any)[name] = cls;
            });
        };

        this.stageCardPools = {};
        (dungeonList as DungeonItem[]).forEach((dungeon: DungeonItem) => {
            this.stageCardPools[dungeon.stageId] = {
                name: dungeon.name,
                typeRatios: dungeon.typeRatios,
                availableCards: dungeon.availableCards
            };
        });

        this.currentStage = 'dungeon_abyss_chamber';
        this.element = 'cryo';
        this._cachedCardWeights = null;

        CardFactory.instance = this;
    }

    static getInstance(): CardFactory {
        if (!CardFactory.instance) {
            CardFactory.instance = new CardFactory();
        }
        return CardFactory.instance;
    }

    _calculateCardWeights(): Record<string, number> {
        if (this._cachedCardWeights) {
            return this._cachedCardWeights;
        }

        const cardWeights: Record<string, number> = {};
        const currentStage = this.stageCardPools[this.currentStage];
        const typeRatios = currentStage.typeRatios;
        const availableCards = currentStage.availableCards;
        const typeTotalWeights: Record<string, number> = {};

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName]) {
                let typeTotalWeight = 0;
                for (const cardName of availableCards[typeName]) {
                    const CardClass = this.cardClasses[cardName] as typeof Card & { DEFAULT?: { rarity?: number } };
                    if (CardClass) {
                        if (!CardClass.DEFAULT?.rarity) {
                            continue;
                        }
                        const rarity = CardClass.DEFAULT.rarity;
                        typeTotalWeight += rarity * 10;
                    }
                }
                typeTotalWeights[typeName] = typeTotalWeight;
            }
        }

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName] && typeTotalWeights[typeName]) {
                for (const cardName of availableCards[typeName]) {
                    const CardClass = this.cardClasses[cardName] as typeof Card & { DEFAULT?: { rarity?: number } };
                    if (CardClass?.DEFAULT?.rarity) {
                        const rarity = CardClass.DEFAULT.rarity;
                        const baseWeight = rarity * 10;
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
                if (cardType === 'Coin') {
                    return this.createCoin(scene, index);
                }
                const CardClass = this.cardClasses[cardType] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card | undefined;
                if (CardClass) return new CardClass(scene, x, y, index);
            }
        }

        const lastCardType = Object.keys(cardWeights).pop();
        if (lastCardType === 'Coin') {
            return this.createCoin(scene, index);
        }
        const LastClass = lastCardType ? (this.cardClasses[lastCardType] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card) : undefined;
        return LastClass ? new LastClass(scene, x, y, index) : null;
    }

    createCoin(scene: SceneWithGameManager, index: number, score?: number | null): Card {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        const coin = new (Coin as any)(scene, x, y, index, this.element);
        if (score != null) {
            (coin as any).setScore(score);
        }
        return coin as Card;
    }

    createEmpty(scene: SceneWithGameManager, index: number): Card {
        const { x, y } = scene.gameManager!.cardManager.getGridPositionCoordinates(index);
        return new (Empty as any)(scene, x, y, index);
    }

    _calculateDynamicCardWeights(validCardKeys: string[]): Record<string, number> {
        const currentStage = this.stageCardPools[this.currentStage];
        const typeRatios = currentStage.typeRatios;
        const availableCards = currentStage.availableCards;
        const cardWeights: Record<string, number> = {};
        const typeTotalWeights: Record<string, number> = {};

        for (const [typeName] of Object.entries(typeRatios)) {
            if (availableCards[typeName]) {
                let typeTotalWeight = 0;
                for (const cardName of availableCards[typeName]) {
                    if (validCardKeys.includes(cardName)) {
                        const CardClass = this.cardClasses[cardName] as typeof Card & { DEFAULT?: { rarity?: number } };
                        if (CardClass?.DEFAULT?.rarity) {
                            typeTotalWeight += CardClass.DEFAULT.rarity * 10;
                        }
                    }
                }
                if (typeTotalWeight > 0) typeTotalWeights[typeName] = typeTotalWeight;
            }
        }

        for (const [typeName, typeRatio] of Object.entries(typeRatios)) {
            if (availableCards[typeName] && typeTotalWeights[typeName]) {
                for (const cardName of availableCards[typeName]) {
                    if (validCardKeys.includes(cardName)) {
                        const CardClass = this.cardClasses[cardName] as typeof Card & { DEFAULT?: { rarity?: number } };
                        if (CardClass?.DEFAULT?.rarity) {
                            const baseWeight = CardClass.DEFAULT.rarity * 10;
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
                if (cardKey === 'Coin') return this.createCoin(scene, index);
                const CardClass = this.cardClasses[cardKey] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card;
                if (CardClass) return new CardClass(scene, x, y, index);
            }
        }

        const lastCardKey = Object.keys(cardWeights).pop()!;
        if (lastCardKey === 'Coin') return this.createCoin(scene, index);
        const LastClass = this.cardClasses[lastCardKey] as new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card;
        return LastClass ? new LastClass(scene, x, y, index) : null;
    }

    createCharacter(scene: SceneWithGameManager, x: number, y: number, index: number): Card {
        const nameId = localStorage.getItem('selectedCharacter');

        if (!nameId) {
            this.element = (Eula as any).DEFAULT.element;
            return new Eula(scene, x, y, index) as Card;
        }

        const characterClass = this.characterClasses[nameId];
        if (characterClass) {
            this.element = (characterClass as any).DEFAULT?.element ?? 'cryo';
            return new characterClass(scene, x, y, index);
        }

        this.element = (Eula as any).DEFAULT.element;
        return new Eula(scene, x, y, index) as Card;
    }

    getAllCardDefault(): any[] {
        return Object.values(this.cardClasses)
            .filter((v): v is typeof Card => typeof v === 'function' && 'DEFAULT' in v)
            .map((cls: any) => cls.DEFAULT);
    }

    addCardToStage(stageKey: string, typeName: string, cardName: string): void {
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
        return this.stageCardPools;
    }

    getCurrentStageTotalWeight(): number {
        const currentStage = this.stageCardPools[this.currentStage];
        return Object.values(currentStage.typeRatios).reduce((total, ratio) => total + ratio, 0);
    }

    getCurrentStageCardWeights(): {
        stage: string;
        typeRatios: Record<string, number>;
        cardWeights: Record<string, number>;
        totalWeight: number;
    } {
        const cardWeights = this._calculateCardWeights();
        const currentStage = this.stageCardPools[this.currentStage];
        return {
            stage: currentStage.name,
            typeRatios: currentStage.typeRatios,
            cardWeights,
            totalWeight: this.getCurrentStageTotalWeight()
        };
    }

    setCurrentStage(stageKey: string): void {
        if (this.stageCardPools[stageKey]) {
            this.currentStage = stageKey;
            this._cachedCardWeights = null;
        }
    }
}

const cardFactory = CardFactory.getInstance();
export default cardFactory;
