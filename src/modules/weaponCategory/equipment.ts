import Character from "../typeCard/character.js";
import Enemy from "../typeCard/enemy.js";

export default class Equipment {

    default: any;

    private _durability: number;

    constructor(config: any, durability: number) {
        this.default = config;
        this._durability = durability;
    }

    get durability() {
        return this._durability;
    }

    set durability(value: number) {
        this._durability = value;
    }

    get price() {
        return this._durability;
    }

    /*This method should be called when the equipment is used to attack an enemy.
    * @param enemy The enemy being attacked
    * @param damage The amount of damage being dealt to the enemy
    * @returns A boolean indicating whether the effect was successfully applied
    */
    Effect(enemy: Enemy, damage: number, character?: Character): boolean {
        // Implement the effect of the equipment on the enemy here
        enemy.takeDamage(damage, 'slash');

        console.log('Equipment effect' + this.default.id + ' triggered on ' + enemy.name + ' for ' + damage + ' damage.');
        return true;
    }

}
