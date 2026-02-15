import type { CardCharacter } from './types.js';

/**
 * Trả về index của card được chọn (selectedCharacterId) trong mảng cards, hoặc 0 nếu không tìm thấy.
 */
export function initializeCurrentCardIndex(
    cards: CardCharacter[],
    selectedCharacterId: string | null
): number {
    if (selectedCharacterId == null) return 0;
    const selectedIndex = cards.findIndex(card => card.id === selectedCharacterId);
    return selectedIndex !== -1 ? selectedIndex : 0;
}
