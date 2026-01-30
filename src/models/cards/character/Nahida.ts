import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Nahida extends Character {
    static DEFAULT = {
        id: 'nahida',
        name: 'Nahida',
        description:
            'Nahida – Tiểu Vương Kusanali, vị Thảo Thần bé nhỏ của Sumeru. Với trái tim thuần khiết và trí tuệ hiền hòa, nàng mang khát vọng dẫn dắt nhân loại đến sự khai sáng và tự do.',
        hp: 9,
        element: 'dendro'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Nahida.DEFAULT.name, Nahida.DEFAULT.id, 'character');
        (this as any).element = Nahida.DEFAULT.element;
        this.description = Nahida.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
