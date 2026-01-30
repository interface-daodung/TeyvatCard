import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Furina extends Character {
    static DEFAULT = {
        id: 'furina',
        name: 'Furina',
        description:
            'Furina – nữ thần của thủy quyền, đại diện cho sự cân bằng giữa lực lượng và tình cảm. Bên ngoài là vị thần đầy sức mạnh, nhưng bên trong là người phụ nữ đầy tình cảm và nhạy cảm.',
        hp: 12,
        element: 'hydro'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Furina.DEFAULT.name, Furina.DEFAULT.id);
        (this as any).element = Furina.DEFAULT.element;
        this.description = Furina.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
