import Phaser from 'phaser';
import { getAllCardsFromData } from './libraryData.js';
import { createLibraryCard } from './LibraryCard.js';

const CARDS_PER_ROW = 3;

/**
 * Tạo panel (sizer) chứa lưới thẻ thư viện. Mỗi thẻ có cardData gán trên container.
 */
export function createCardPanel(scene: Phaser.Scene): unknown {
    const rexUI = (scene as any).rexUI;
    const panel = rexUI.add.sizer({
        orientation: 'y',
        space: { item: 30 }
    });

    const cardsToShow = getAllCardsFromData();
    const totalRows = Math.ceil(cardsToShow.length / CARDS_PER_ROW);

    for (let row = 0; row < totalRows; row++) {
        const rowSizer = rexUI.add.sizer({
            orientation: 'x',
            space: { item: 30 }
        });

        const startIndex = row * CARDS_PER_ROW;
        for (let col = 0; col < CARDS_PER_ROW; col++) {
            const cardIndex = startIndex + col;
            if (cardIndex < cardsToShow.length) {
                const cardData = cardsToShow[cardIndex];
                const cardContainer = createLibraryCard(scene, cardIndex + 1, cardData);
                rowSizer.add(cardContainer);
            } else {
                const emptyContainer = createLibraryCard(scene, cardIndex + 1, null);
                emptyContainer.setVisible(false);
                rowSizer.add(emptyContainer);
            }
        }
        panel.add(rowSizer);
    }

    return panel;
}
