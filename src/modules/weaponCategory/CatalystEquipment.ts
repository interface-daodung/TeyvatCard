import Equipment from './equipment.js';
import Enemy from '../typeCard/enemy.js';
import { animationBreatheFire } from '@/src/animations/Sprites/animationBreatheFire.js';
import Card from '../Card.js';

export type EffectTargetCard = {
    type?: string;
    takeDamage?: (damage: number, type?: string) => unknown;
    setPoisoning?: () => void;
};

export type GridCardManager = {
    CardCharacter?: { index?: number };
    getCard: (index: number) => EffectTargetCard | null;
};

export default class CatalystEquipment extends Equipment {
    protected getCardsBehindTarget(
        cardManager: GridCardManager,
        attackerIndex: number,
        targetIndex: number
    ): EffectTargetCard[] {
        const GRID_SIZE = 3;

        const attackerRow = Math.floor(attackerIndex / GRID_SIZE);
        const attackerCol = attackerIndex % GRID_SIZE;
        const targetRow = Math.floor(targetIndex / GRID_SIZE);
        const targetCol = targetIndex % GRID_SIZE;

        // Hướng "đứng sau" được tính theo vector attacker -> target
        const rowStep = Math.sign(targetRow - attackerRow);
        const colStep = Math.sign(targetCol - attackerCol);
        if (rowStep === 0 && colStep === 0) return [];

        const affectedCards: EffectTargetCard[] = [];
        let row = targetRow + rowStep;
        let col = targetCol + colStep;

        while (row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE) {
            const cardIndex = row * GRID_SIZE + col;
            const cardBehind = cardManager.getCard(cardIndex);
            if (cardBehind) {
                affectedCards.push(cardBehind);
            }
            row += rowStep;
            col += colStep;
        }

        return affectedCards;
    }

    override Effect(enemy: Enemy, damage: number): boolean {
        const cardManager = enemy.scene?.gameManager?.cardManager as GridCardManager | undefined;
        if (!cardManager) return false;
        enemy.add(animationBreatheFire(enemy.scene, 0,0)); 
        enemy.takeDamage(damage, 'damage');
        const attackerIndex = cardManager.CardCharacter?.index;
        const targetIndex = enemy.index;
        if (attackerIndex == null || targetIndex == null) return false;

        const cardsBehindTarget = this.getCardsBehindTarget(cardManager, attackerIndex, targetIndex);
        cardsBehindTarget.forEach((card) => {
            (card as Card).add(animationBreatheFire(enemy.scene, 0,0)); 
            (card as Card).takeDamage?.(damage, 'damage');
        });

        return true;
    }
}
