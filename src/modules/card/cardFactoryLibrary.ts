import type Card from '../Card.js';
import type { SceneWithGameManager } from '../Card.js';
import { getCardConfig } from '../getCardConfig.js';
import type {
    CardClassRegistry,
    CardClassesMap,
    LibraryCards
} from './cardFactoryTypes.js';
import { findRegistryKeyForClass } from './cardFactoryStageWeight.js';

export interface PopulatedLibraryLists {
    weaponClasses: (typeof Card)[];
    enemyClasses: (typeof Card)[];
    foodClasses: (typeof Card)[];
    trapClasses: (typeof Card)[];
    treasureClasses: (typeof Card)[];
    coinClasses: Record<string, new (scene: SceneWithGameManager, x: number, y: number, index: number) => Card>;
}

export function buildCardClassRegistry(cardImports: Record<string, unknown>): CardClassRegistry {
    const entries = Object.entries(cardImports).filter(
        ([, cls]) => typeof cls === 'function'
    ) as [string, typeof Card][];
    return Object.fromEntries(entries) as CardClassRegistry;
}

export function defineCardClassesAdd(cardClasses: CardClassesMap): void {
    cardClasses.add = function (this: CardClassesMap, classes: (typeof Card)[]) {
        classes.forEach((cls: typeof Card & { name?: string }) => {
            const name = (cls as { name?: string }).name;
            if (name) (this as Record<string, unknown>)[name] = cls;
        });
    };
}

export function populateLibraryCardLists(
    cardClasses: CardClassesMap,
    libraryCards: LibraryCards | null | undefined,
    allCardClasses: CardClassRegistry
): PopulatedLibraryLists {
    const register = (key: string, cls: new (...args: any[]) => Card) => {
        (cardClasses as Record<string, unknown>)[key] = cls;
    };

    const resolveByClassName = (className?: string): typeof Card | undefined => {
        if (!className) {
            console.error('[CardFactory] Missing className in libraryCards entry');
            return undefined;
        }
        const cls = allCardClasses[className];
        if (!cls) {
            console.error(`[CardFactory] Class "${className}" not found in cardImports exports`);
            return undefined;
        }
        register(className, cls);
        return cls;
    };

    const getTypeClassesFromLibrary = (library: LibraryCards, typeKey: string): (typeof Card)[] => {
        const entries = library[typeKey];
        if (!Array.isArray(entries)) {
            console.error(`[CardFactory] libraryCards.${typeKey} is missing or not an array`);
            return [];
        }
        const classes: (typeof Card)[] = [];
        entries.forEach((entry) => {
            const cls = resolveByClassName(entry?.className);
            if (cls) classes.push(cls);
        });
        return classes;
    };

    const emptyLists: PopulatedLibraryLists = {
        weaponClasses: [],
        enemyClasses: [],
        foodClasses: [],
        trapClasses: [],
        treasureClasses: [],
        coinClasses: {}
    };

    if (!libraryCards || typeof libraryCards !== 'object') {
        console.error(
            '[CardFactory] libraryCards flag is missing. Ensure LoadingScene sets dataManager.setFlag("libraryCards", data)'
        );
        return emptyLists;
    }

    const library = libraryCards as LibraryCards;

    const weaponClasses = getTypeClassesFromLibrary(library, 'weapon');
    const enemyClasses = getTypeClassesFromLibrary(library, 'enemy');
    const foodClasses = getTypeClassesFromLibrary(library, 'food');
    const trapClasses = getTypeClassesFromLibrary(library, 'trap');
    const treasureClasses = getTypeClassesFromLibrary(library, 'treasure');
    getTypeClassesFromLibrary(library, 'bomb');
    getTypeClassesFromLibrary(library, 'empty');

    const coinClasses: PopulatedLibraryLists['coinClasses'] = {};
    const coinEntries = library.coin;
    if (!Array.isArray(coinEntries)) {
        console.error('[CardFactory] libraryCards.coin is missing or not an array');
    } else {
        coinEntries.forEach((entry) => {
            const cls = resolveByClassName(entry?.className);
            const element = entry?.element;
            if (!element) {
                console.error('[CardFactory] Coin entry missing element');
                return;
            }
            if (cls) {
                coinClasses[element] = cls as unknown as new (
                    scene: SceneWithGameManager,
                    x: number,
                    y: number,
                    index: number
                ) => Card;
            }
        });
    }

    return {
        weaponClasses,
        enemyClasses,
        foodClasses,
        trapClasses,
        treasureClasses,
        coinClasses
    };
}

/**
 * Lọc weaponClasses theo category (vd: 'sword') dùng getCardConfig.
 * Trả về mảng { cls, key } để random và gọi getCardConfig(key).
 */
export function getWeaponClassesByCategory(
    cardClasses: CardClassesMap,
    weaponClasses: (typeof Card)[],
    category: string
): { cls: typeof Card; key: string }[] {
    const result: { cls: typeof Card; key: string }[] = [];
    const map = cardClasses as Record<string, unknown>;
    for (const cls of weaponClasses) {
        const key = findRegistryKeyForClass(map, cls);
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
export function getEnemyKeysByClan(
    cardClasses: CardClassesMap,
    enemyClasses: (typeof Card)[],
    clan: string
): string[] {
    const result: string[] = [];
    const map = cardClasses as Record<string, unknown>;
    for (const cls of enemyClasses) {
        const key = findRegistryKeyForClass(map, cls);
        if (!key) continue;
        const config = getCardConfig(key);
        if (!config) continue;
        if (config.clan === clan) {
            result.push(key);
        }
    }
    return result;
}

export function getAllCardDefaultsFromRegistry(cardClasses: CardClassesMap): any[] {
    const keys = Object.keys(cardClasses).filter(
        (k) => typeof cardClasses[k] === 'function' && k !== 'add'
    );
    const out: any[] = [];
    for (const key of keys) {
        const config = getCardConfig(key);
        if (config) out.push(config);
    }
    return out;
}
