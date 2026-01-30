import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Eula extends Character {
    static DEFAULT = {
        id: 'eula',
        name: 'Eula',
        description:
            'Eula – nữ thần của thủy quyền, đại diện cho sự cân bằng giữa lực lượng và tình cảm. Bên ngoài là vị thần đầy sức mạnh, nhưng bên trong là người phụ nữ đầy tình cảm và nhạy cảm.',
        hp: 10,
        element: 'cryo'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Eula.DEFAULT.name, Eula.DEFAULT.id);
        (this as any).element = Eula.DEFAULT.element;
        this.description = Eula.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
