import type Card from '../Card.js';
import type { CardDefault } from '../Card.js';
import { dataManager } from '../../core/DataManager.js';
import { getCardConfig } from '../getCardConfig.js';
import type { DungeonItem, StageCardPool } from './cardFactoryTypes.js';

/** State runtime cho pool màn / stage hiện tại / cache trọng số (không nằm trong CardFactory). */
export const cardStageRuntime = {
    stageCardPools: {} as Record<string, StageCardPool>,
    currentStage: 'dungeon_abyss_chamber',
    _cachedCardWeights: null as Record<string, number> | null
};

export function ensureStagePoolsLoaded(): void {
    if (Object.keys(cardStageRuntime.stageCardPools).length > 0) return;
    const dungeonList = dataManager.getFlag<DungeonItem[]>('dungeonList') ?? [];
    Object.assign(cardStageRuntime.stageCardPools, loadStagePoolsFromDungeonList(dungeonList));
}

export function invalidateCardWeightsCache(): void {
    cardStageRuntime._cachedCardWeights = null;
}

export function getCachedCardWeightsForCurrentStage(): Record<string, number> {
    if (cardStageRuntime._cachedCardWeights) {
        return cardStageRuntime._cachedCardWeights;
    }
    ensureStagePoolsLoaded();
    const currentStage = cardStageRuntime.stageCardPools[cardStageRuntime.currentStage];
    const cardWeights = computeCardWeightsForStage(currentStage, getCardConfig);
    cardStageRuntime._cachedCardWeights = cardWeights;
    return cardWeights;
}

export function getDynamicCardWeightsForCurrentStage(validCardKeys: string[]): Record<string, number> {
    ensureStagePoolsLoaded();
    const currentStage = cardStageRuntime.stageCardPools[cardStageRuntime.currentStage];
    return computeDynamicCardWeightsForStage(currentStage, validCardKeys, getCardConfig);
}

export function addCardToStage(stageKey: string, typeName: string, cardName: string): void {
    ensureStagePoolsLoaded();
    if (!cardStageRuntime.stageCardPools[stageKey]) {
        throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
    }
    if (!cardStageRuntime.stageCardPools[stageKey].availableCards[typeName]) {
        throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
    }
    if (!cardStageRuntime.stageCardPools[stageKey].availableCards[typeName].includes(cardName)) {
        cardStageRuntime.stageCardPools[stageKey].availableCards[typeName].push(cardName);
        invalidateCardWeightsCache();
    }
}

export function removeCardFromStage(stageKey: string, typeName: string, cardName: string): void {
    ensureStagePoolsLoaded();
    if (!cardStageRuntime.stageCardPools[stageKey]) {
        throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
    }
    if (!cardStageRuntime.stageCardPools[stageKey].availableCards[typeName]) {
        throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
    }
    const arr = cardStageRuntime.stageCardPools[stageKey].availableCards[typeName];
    const index = arr.indexOf(cardName);
    if (index > -1) {
        arr.splice(index, 1);
        invalidateCardWeightsCache();
    }
}

export function updateStageTypeRatio(stageKey: string, typeName: string, newRatio: number): void {
    ensureStagePoolsLoaded();
    if (!cardStageRuntime.stageCardPools[stageKey]) {
        throw new Error(`Màn chơi '${stageKey}' không tồn tại`);
    }
    if (cardStageRuntime.stageCardPools[stageKey].typeRatios[typeName] === undefined) {
        throw new Error(`Type '${typeName}' không tồn tại trong màn chơi '${stageKey}'`);
    }
    cardStageRuntime.stageCardPools[stageKey].typeRatios[typeName] = newRatio;
    invalidateCardWeightsCache();
}

export function getStageInfo(): Record<string, StageCardPool> {
    ensureStagePoolsLoaded();
    return cardStageRuntime.stageCardPools;
}

export function getCurrentStageTotalWeight(): number {
    ensureStagePoolsLoaded();
    const currentStage = cardStageRuntime.stageCardPools[cardStageRuntime.currentStage];
    if (!currentStage?.typeRatios) return 0;
    return Object.values(currentStage.typeRatios).reduce((total, ratio) => total + ratio, 0);
}

export function getCurrentStageCardWeights(): {
    stage: string;
    typeRatios: Record<string, number>;
    cardWeights: Record<string, number>;
    totalWeight: number;
} {
    ensureStagePoolsLoaded();
    const cardWeights = getCachedCardWeightsForCurrentStage();
    const currentStage = cardStageRuntime.stageCardPools[cardStageRuntime.currentStage];
    if (!currentStage) {
        return { stage: '', typeRatios: {}, cardWeights, totalWeight: 0 };
    }
    return {
        stage: currentStage.name,
        typeRatios: currentStage.typeRatios,
        cardWeights,
        totalWeight: getCurrentStageTotalWeight()
    };
}

export function setCurrentStage(stageKey: string): void {
    ensureStagePoolsLoaded();
    if (cardStageRuntime.stageCardPools[stageKey]) {
        cardStageRuntime.currentStage = stageKey;
        invalidateCardWeightsCache();
    }
}

export function loadStagePoolsFromDungeonList(
    dungeonList: DungeonItem[]
): Record<string, StageCardPool> {
    const stageCardPools: Record<string, StageCardPool> = {};
    dungeonList.forEach((dungeon: DungeonItem) => {
        if (dungeon?.stageId && dungeon?.typeRatios && dungeon?.availableCards) {
            stageCardPools[dungeon.stageId] = {
                name: dungeon.name,
                typeRatios: dungeon.typeRatios,
                availableCards: dungeon.availableCards
            };
        }
    });
    return stageCardPools;
}

export function computeCardWeightsForStage(
    currentStage: StageCardPool | undefined,
    getCardConfig: (key: string) => CardDefault | undefined | null
): Record<string, number> {
    const cardWeights: Record<string, number> = {};
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

    return cardWeights;
}

export function computeDynamicCardWeightsForStage(
    currentStage: StageCardPool | undefined,
    validCardKeys: string[],
    getCardConfig: (key: string) => CardDefault | undefined | null
): Record<string, number> {
    if (!currentStage?.typeRatios || !currentStage?.availableCards) {
        return {};
    }
    const typeRatios = currentStage.typeRatios;
    const availableCards = currentStage.availableCards;
    const cardWeights: Record<string, number> = {};
    const typeTotalWeights: Record<string, number> = {};
    const validSet = new Set(validCardKeys);

    for (const [typeName] of Object.entries(typeRatios)) {
        if (availableCards[typeName]) {
            let typeTotalWeight = 0;
            for (const cardName of availableCards[typeName]) {
                if (validSet.has(cardName)) {
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
                if (validSet.has(cardName)) {
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

/**
 * Chọn key theo trọng số giống CardFactory: sau khi vượt ngưỡng random, thử các key còn lại
 * theo thứ tự `Object.entries` nếu key trước không có class; fallback là key cuối cùng.
 */
export function resolveWeightedCardKey(
    cardWeights: Record<string, number>,
    hasClassForKey: (key: string) => boolean
): string | null {
    const totalWeight = Object.values(cardWeights).reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) {
        return null;
    }
    const random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let pastThreshold = false;
    for (const [cardType, weight] of Object.entries(cardWeights)) {
        cumulativeWeight += weight;
        if (random <= cumulativeWeight) {
            pastThreshold = true;
        }
        if (pastThreshold && hasClassForKey(cardType)) {
            return cardType;
        }
    }
    const keys = Object.keys(cardWeights);
    const lastKey = keys.pop();
    if (lastKey && hasClassForKey(lastKey)) {
        return lastKey;
    }
    return null;
}

export function findRegistryKeyForClass(
    map: Record<string, unknown>,
    cls: typeof Card
): string | undefined {
    return Object.keys(map).find((k) => k !== 'add' && map[k] === cls);
}
