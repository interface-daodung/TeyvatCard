import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Venti extends Character {
    static DEFAULT = {
        id: 'venti',
        name: 'Venti',
        description:
            'Venti – nhà thơ du ca tự do, chính là Phong Thần Mondstadt. Dáng vẻ nghịch ngợm và phóng khoáng, nhưng bên trong là vị thần nhân từ luôn dùng âm nhạc để xoa dịu lòng người.',
        hp: 8,
        element: 'anemo'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Venti.DEFAULT.name, Venti.DEFAULT.id, 'character');
        (this as any).element = Venti.DEFAULT.element;
        this.description = Venti.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
