import Character from '../../../modules/typeCard/character.js';
import type { SceneWithGameManager } from '../../../modules/Card.js';

export default class Zhongli extends Character {
    static DEFAULT = {
        id: 'zhongli',
        name: 'Zhongli',
        description:
            'Zhongli – hiền giả tao nhã, thực chất là Nham Thần Liyue. Với trí tuệ hàng ngàn năm và phong thái điềm tĩnh, ông là hiện thân của vững bền, mang gánh nặng lịch sử nặng nề.',
        hp: 10,
        element: 'geo'
    };

    constructor(scene: SceneWithGameManager, x: number, y: number, index: number) {
        super(scene, x, y, index, Zhongli.DEFAULT.name, Zhongli.DEFAULT.id, 'character');
        (this as any).element = Zhongli.DEFAULT.element;
        this.description = Zhongli.DEFAULT.description;
        this.createCard();
        scene.add.existing(this);
    }
}
