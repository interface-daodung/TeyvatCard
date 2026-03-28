import type Phaser from 'phaser';
import { dataManager } from '../../core/DataManager.js';

interface LibraryEntry {
    id?: string;
    className?: string;
    type?: string;
    category?: string;
    clan?: string;
}

type LibraryCards = Record<string, LibraryEntry[]>;

export interface CardImageInput {
    scene: Phaser.Scene;
    nameId: string;
}

export function buildCardAtlasKey(entry?: LibraryEntry): string {
    const type = entry?.type;
    if (!type) return '';

    let atlasKey = type;
    if (type === 'weapon' && entry?.category) {
        atlasKey += `-${entry.category}`;
    } else if (type === 'enemy' && entry?.clan) {
        atlasKey += `-${entry.clan}`;
    }
    return atlasKey;
}

function findLibraryEntry(nameId: string): LibraryEntry | undefined {
    const library = dataManager.getFlag<LibraryCards>('libraryCards');
    if (!library || typeof library !== 'object') return undefined;

    for (const [typeKey, entries] of Object.entries(library)) {
        if (!Array.isArray(entries)) continue;
        const found = entries.find((entry) =>
            entry?.id === nameId ||
            entry?.id === nameId.toLowerCase() ||
            entry?.className === nameId
        );
        if (found) {
            return { ...found, type: found.type || typeKey };
        }
    }
    return undefined;
}

export function createCardImage(input: CardImageInput): Phaser.GameObjects.Image {
    // Ưu tiên texture đơn: key trực tiếp là nameId.
   // ' vì sao 'empty' load rồi mà ko chạy dc 
    if (input.scene.textures.exists(input.nameId)) {
        return input.scene.add.image(0, 0, input.nameId);
    }

    const entry = findLibraryEntry(input.nameId);
    const atlasKey = buildCardAtlasKey(entry);
    if (atlasKey && input.scene.textures.exists(atlasKey)) {
        return input.scene.add.image(0, 0, atlasKey, input.nameId);
    }

    // Fallback cuối cùng để tránh vỡ luồng render; Phaser sẽ báo missing texture nếu không có key.
    return input.scene.add.image(0, 0, input.nameId);
}
