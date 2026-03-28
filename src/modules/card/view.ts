import type Phaser from 'phaser';
import { dataManager } from '../../core/DataManager.js';
import { getLibraryCardAtlasKey } from '../../components/LibraryScene/libraryCardAtlas.js';
import type { LibraryCardData } from '../../components/LibraryScene/types.js';

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
    /** Từ Card.config — giống CardInfoDialog / libraryCardAtlas, không phụ thuộc chỉ tra libraryCards */
    type?: string;
    category?: string;
    clan?: string;
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
    // Texture đơn: key trùng nameId (nếu có preload riêng).
    if (input.scene.textures.exists(input.nameId)) {
        return input.scene.add.image(0, 0, input.nameId);
    }

    let atlasKey = '';
    let frameId = input.nameId;

    if (input.type) {
        const k = getLibraryCardAtlasKey({
            type: input.type,
            id: input.nameId,
            name: '',
            description: '',
            category: input.category,
            clan: input.clan
        } as LibraryCardData);
        atlasKey = k.atlasKey;
        frameId = k.frameId;
    } else {
        const entry = findLibraryEntry(input.nameId);
        atlasKey = buildCardAtlasKey(entry);
        frameId = input.nameId;
    }

    if (atlasKey && input.scene.textures.exists(atlasKey)) {
        try {
            const texture = input.scene.textures.get(atlasKey);
            if (texture.getFrameNames().includes(frameId)) {
                return input.scene.add.image(0, 0, atlasKey, frameId);
            }
        } catch {
            // fallback empty
        }
    }

    return input.scene.add.image(0, 0, 'empty');
}
