import Equipment from './equipment.js';
import Enemy from '../typeCard/enemy.js';
import Character, { type DamageElement } from '../typeCard/character.js';

export type EffectTargetCard = {
    type?: string;
    takeDamage?: (damage: number, type?: string, element?: DamageElement) => unknown;
    setPoisoning?: () => void;
};

export type GridCardManager = {
    CardCharacter?: { index?: number };
    getCard: (index: number) => EffectTargetCard | null;
};

export default class CatalystEquipment extends Equipment {
    protected getAffectedTargetIndexes(
        enemy: Enemy
    ): { cardManager: GridCardManager; affectedTargetIndexes: number[] } | null {
        const cardManager = enemy.scene?.gameManager?.cardManager as GridCardManager | undefined;
        if (!cardManager) {
            console.warn('[CatalystEquipment] cardManager is null/undefined.');
            return null;
        }

        const attackerIndex = cardManager.CardCharacter?.index;
        const targetIndex = enemy.index;
        if (attackerIndex == null || targetIndex == null) {
            console.warn('[CatalystEquipment] attackerIndex or targetIndex is null.', {
                attackerIndex,
                targetIndex,
            });
            return null;
        }

        const GRID_SIZE = 3;

        const attackerRow = Math.floor(attackerIndex / GRID_SIZE);
        const attackerCol = attackerIndex % GRID_SIZE;
        const targetRow = Math.floor(targetIndex / GRID_SIZE);
        const targetCol = targetIndex % GRID_SIZE;

        // Hướng "đứng sau" được tính theo vector attacker -> target
        const rowStep = Math.sign(targetRow - attackerRow);
        const colStep = Math.sign(targetCol - attackerCol);
        if (rowStep === 0 && colStep === 0) {
            return { cardManager, affectedTargetIndexes: [targetIndex] };
        }

        const affectedTargetIndexes: number[] = [targetIndex];
        let row = targetRow + rowStep;
        let col = targetCol + colStep;

        while (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            const cardIndex = row * GRID_SIZE + col;
            affectedTargetIndexes.push(cardIndex);
            row += rowStep;
            col += colStep;
        }

        return { cardManager, affectedTargetIndexes };
    }

    override Effect(enemy: Enemy, damage: number, character?: Character): boolean {
        const effectData = this.getAffectedTargetIndexes(enemy);
        if (!effectData) return false;

        // Tính trước toàn bộ index mục tiêu bị ảnh hưởng rồi xử lý damage theo một vòng lặp duy nhất.
        const { cardManager, affectedTargetIndexes } = effectData;
        affectedTargetIndexes.forEach((index) => {
            const card = cardManager.getCard(index);
            if (!card) {
                console.warn('[CatalystEquipment] Target card is null at index.', { index });
                return;
            }
            card.takeDamage?.(damage, 'Catalyst', character?.element as DamageElement);
        });

        return true;
    }
}
