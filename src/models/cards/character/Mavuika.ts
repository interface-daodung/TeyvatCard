import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Mavuika extends Character {
    static DEFAULT = {
        id: 'mavuika',
        name: 'Mavuika',
        description:
            'Mavuika – Hỏa Thần Natlan, biểu tượng của sức mạnh và ý chí bất khuất. Ngọn lửa trong nàng cháy rực như tinh thần chiến binh, soi sáng con đường tự do và khát vọng vĩnh cửu.',
        hp: 11,
        element: 'pyro'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Mavuika.DEFAULT.name, Mavuika.DEFAULT.id, 'character');
        (this as any).element = Mavuika.DEFAULT.element;
        this.description = Mavuika.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
