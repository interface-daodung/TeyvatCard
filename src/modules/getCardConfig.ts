/**
 * Lấy config thẻ từ JSON (cardCharacterList hoặc libraryCards).
 * Dùng cho applyConfig và CardFactory (rarity, element, getAllCardDefault).
 */

import { dataManager } from '../core/DataManager.js';
import { localizationManager } from '../core/LocalizationManager.js';
import type { CardDefault } from './Card.js';

interface CharacterEntry {
    id: string;
    name: string;
    description: string;
    hp: number;
    element: string;
}

interface LibraryEntry {
    id?: string;
    name?: string;
    type?: string;
    description?: string;
    className?: string;
    category?: string;
    clan?: string;
    element?: string;
    rarity?: number;
    resonanceDescription?: string;
    healthMin?: number;
    healthMax?: number;
    scoreMin?: number;
    scoreMax?: number;
    countdown?: number;
    damageMin?: number;
    damageMax?: number;
    durabilityMin?: number;
    durabilityMax?: number;
    foodMin?: number;
    foodMax?: number;
    contents?: string[];
}

type LibraryCards = Record<string, LibraryEntry[]>;

const LIBRARY_TYPES = ['weapon', 'enemy', 'food', 'trap', 'treasure', 'bomb', 'coin', 'empty'] as const;

function mapCharacterToCardDefault(entry: CharacterEntry): CardDefault {
    const description = entry.description && entry.description.startsWith('character.')
        ? localizationManager.t(entry.description) || entry.description
        : entry.description;
    return {
        id: entry.id,
        type: 'character',
        name: entry.name,
        description,
        hp: entry.hp,
        element: entry.element
    };
}

function mapLibraryEntryToCardDefault(entry: LibraryEntry): CardDefault {
    const id = entry.id ?? 'unknown';
    const type = entry.type;
    return {
        id,
        type,
        name: `adventureCard.${id}.name`,
        description: `adventureCard.${id}.description`,
        rarity: entry.rarity,
        element: (type === 'enemy' || type === 'character' || type === 'coin') ? entry.element : undefined,
        category: entry.category,
        clan: type === 'enemy' ? entry.clan : undefined,
        resonanceDescription: `adventureCard.${id}.resonanceDescription`,
        // Enemy fields
        healthMin: type === 'enemy' ? entry.healthMin : undefined,
        healthMax: type === 'enemy' ? entry.healthMax : undefined,
        scoreMin: type === 'enemy' ? entry.scoreMin : undefined,
        scoreMax: type === 'enemy' ? entry.scoreMax : undefined,
        // Bomb and Trap fields
        countdown: type === 'bomb' ? entry.countdown : undefined,
        damageMin: (type === 'bomb' || type === 'trap') ? entry.damageMin : undefined,
        damageMax: (type === 'bomb' || type === 'trap') ? entry.damageMax : undefined,
        // Treasure and Weapon fields
        durabilityMin: (type === 'treasure' || type === 'weapon') ? entry.durabilityMin : undefined,
        durabilityMax: (type === 'treasure' || type === 'weapon') ? entry.durabilityMax : undefined,
        // Food fields
        foodMin: type === 'food' ? entry.foodMin : undefined,
        foodMax: type === 'food' ? entry.foodMax : undefined,
        // Treasure: list of card keys (classNames) that can drop when opened
        contents: type === 'treasure' && Array.isArray(entry.contents) ? entry.contents : undefined,
    };
}

/**
 * Lấy config thẻ theo identifier (id hoặc className).
 * Character: tìm trong cardCharacterList theo id (e.g. 'eula').
 * Các loại khác: tìm trong libraryCards theo className (e.g. 'DendroFragment') hoặc id.
 */
export function getCardConfig(identifier: string): CardDefault | null {
    if (!identifier) return null;

    const list = dataManager.getFlag<CharacterEntry[]>('cardCharacterList');
    if (Array.isArray(list)) {
        const lower = identifier.toLowerCase();
        const found = list.find((e: CharacterEntry) => e.id === identifier || e.id === lower);
        if (found) return mapCharacterToCardDefault(found);
    }

    const library = dataManager.getFlag<LibraryCards>('libraryCards');
    if (library && typeof library === 'object') {
        for (const type of LIBRARY_TYPES) {
            const arr = library[type];
            if (!Array.isArray(arr)) continue;
            const found = arr.find(
                (e: LibraryEntry) =>
                    e.className === identifier || e.id === identifier || e.id === identifier.toLowerCase()
            );
            if (found) return mapLibraryEntryToCardDefault({ ...found, type: found.type || type });
        }
    }

    return null;
}
