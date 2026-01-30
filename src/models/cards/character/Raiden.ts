import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Raiden extends Character {
    static DEFAULT = {
        id: 'raiden',
        name: 'Raiden',
        description:
            'Raiden Shogun – vĩnh hằng thống trị Inazuma, kiếm thần uy nghiêm với quyết tâm bất diệt. Bên ngoài lạnh lùng nhưng ẩn sâu là khát vọng giữ trọn lời hứa và bảo vệ thần dân.',
        hp: 10,
        element: 'electro'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Raiden.DEFAULT.name, Raiden.DEFAULT.id, 'character');
        (this as any).element = Raiden.DEFAULT.element;
        this.description = Raiden.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
