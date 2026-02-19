import { dataManager } from '../../core/DataManager.js';
import type { LibraryCardData } from './types.js';

/**
 * Lấy danh sách tất cả thẻ từ libraryCards (đọc từ public/data qua DataManager, set trong LoadingScene).
 * Coin được ưu tiên trước, xử lý đặc biệt cho 7 nguyên tố.
 */
export function getAllCardsFromData(): LibraryCardData[] {
    const allCards: LibraryCardData[] = [];
    const raw = dataManager.getFlag<unknown>('libraryCards');
    const cardsData = (raw ?? {}) as Record<string, LibraryCardData[]>;

    Object.keys(cardsData).forEach((cardType) => {
        const cardsOfType = cardsData[cardType];

        if (cardType === 'coin' && cardsOfType.length > 0) {
            const coinData = cardsOfType[0];
            if (coinData.name && typeof coinData.name === 'object' && !Array.isArray(coinData.name)) {
                const elements = Object.keys(coinData.name as Record<string, string>);
                elements.forEach((element) => {
                    allCards.push({
                        type: coinData.type,
                        rarity: (coinData as Record<string, unknown>).rarity,
                        name: (coinData.name as unknown as Record<string, string>)[element],
                        id: (coinData.id as unknown as Record<string, string>)[element],
                        description: (coinData.description as unknown as Record<string, string>)[element],
                        element,
                        className: (coinData as Record<string, unknown>).className,
                        cardType: cardType
                    });
                });
            } else {
                cardsOfType.forEach((card) => {
                    allCards.push({ ...card, cardType });
                });
            }
        } else {
            cardsOfType.forEach((card) => {
                allCards.push({ ...card, cardType });
            });
        }
    });

    // Coin trước, các loại khác sau
    const coinCards = allCards.filter((c) => c.cardType === 'coin');
    const otherCards = allCards.filter((c) => c.cardType !== 'coin');
    return [...coinCards, ...otherCards];
}
