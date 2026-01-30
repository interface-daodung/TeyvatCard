import Item from '../../modules/Item.js';

export default class Corruption extends Item {
    constructor() {
        super(
            'Corruption',
            'corruption',
            'corruption',
            8,
            3,
            'Gây corruption 80 damage',
            6
        );
    }

    override get power(): number {
        return this._power * (1 + this.level * 0.25);
    }

    override get cooldown(): number {
        return Math.max(1, this._cooldown - this.level * 0.5);
    }
}
